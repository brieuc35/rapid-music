/* -------------------------------------------------------------------------- */
/*  Synchronisation des données avec Firestore                                */
/*                                                                            */
/*  Un document par artiste : artistes/{uid} = { rev, data, updatedAt }.       */
/*  Les données de l'application tiennent dans un seul objet, ce qui suffit    */
/*  largement ici : le jeu complet pèse quelques dizaines de kilo-octets,      */
/*  très loin de la limite de 1 Mio par document.                             */
/*                                                                            */
/*  Deux protections importantes :                                            */
/*                                                                            */
/*  1. Un compteur de révision. Sans lui, deux appareils laissés ouverts       */
/*     s'écraseraient l'un l'autre en silence : le dernier enregistrement      */
/*     gagnerait, et les modifications de l'autre disparaîtraient sans que     */
/*     personne ne s'en aperçoive. La transaction refuse d'écrire par-dessus   */
/*     une révision plus récente et recharge à la place.                       */
/*                                                                            */
/*  2. Une copie locale immédiate. L'envoi vers Firestore est différé d'une    */
/*     seconde pour ne pas déclencher une écriture à chaque frappe ; fermer    */
/*     l'onglet dans cet intervalle, ou travailler hors connexion, ne doit     */
/*     pas coûter les dernières saisies.                                       */
/* -------------------------------------------------------------------------- */

import { ref } from 'vue'
import { deleteDoc, doc, getDoc, runTransaction, serverTimestamp } from 'firebase/firestore/lite'
import { db } from '@/firebase'
import type { AppData } from './types'

export type SyncState = 'idle' | 'saving' | 'saved' | 'offline' | 'error'

export const syncState = ref<SyncState>('idle')

/*  Précision affichée quand l'enregistrement échoue pour autre chose qu'une
 *  coupure réseau. Sans elle, un refus de permission — des règles de sécurité
 *  absentes ou mal publiées — se présenterait comme une simple perte de
 *  connexion, et on chercherait le problème du mauvais côté. */
export const syncMessage = ref('')

/**
 * Un refus de droits n'est pas une panne de réseau : le distinguer évite
 * d'annoncer « hors connexion » à quelqu'un qui est parfaitement connecté.
 */
function classify(e: unknown): SyncState {
  const code = (e as { code?: string })?.code ?? ''
  if (code === 'permission-denied' || code === 'unauthenticated') {
    syncMessage.value =
      "Enregistrement refusé par le serveur. Les règles de sécurité Firestore ne sont pas publiées."
    return 'error'
  }
  if (code === 'not-found') {
    syncMessage.value = "La base de données Firestore n'a pas été trouvée sur ce projet."
    return 'error'
  }
  syncMessage.value = ''
  return 'offline'
}

/*  Signalé à l'interface quand des modifications distantes ont été reprises :
 *  l'artiste doit savoir que ce qu'il voit vient d'ailleurs. */
export const reloadedFromRemote = ref(false)

const SAVE_DELAY = 1000

function mirrorKey(uid: string): string {
  return `rapidmusic:miroir:${uid}`
}

/*  Firestore refuse les valeurs `undefined` : l'aller-retour JSON les retire,
 *  et détache au passage l'objet réactif de Vue. */
function plain(data: AppData): AppData {
  return JSON.parse(JSON.stringify(data)) as AppData
}

export function readMirror(uid: string): Partial<AppData> | null {
  try {
    const raw = localStorage.getItem(mirrorKey(uid))
    return raw ? (JSON.parse(raw) as Partial<AppData>) : null
  } catch {
    return null
  }
}

export function writeMirror(uid: string, data: AppData): void {
  try {
    localStorage.setItem(mirrorKey(uid), JSON.stringify(data))
  } catch {
    /* stockage plein ou indisponible : la copie distante reste la référence */
  }
}

export function clearMirror(uid: string): void {
  try {
    localStorage.removeItem(mirrorKey(uid))
  } catch {
    /* rien à faire */
  }
}

/**
 * Efface le document d'un artiste. Appelé à la suppression du compte, et
 * uniquement là : c'est le geste par lequel une carrière entière disparaît.
 */
export async function deleteRemote(uid: string): Promise<void> {
  await deleteDoc(doc(db, 'artistes', uid))
}

/* -------------------------------------------------------------------------- */

export class Syncer {
  private rev = 0
  private timer: ReturnType<typeof setTimeout> | null = null
  private pending: AppData | null = null
  private inFlight = false

  constructor(
    private uid: string,
    /*  Appelé quand une révision plus récente existe côté serveur : les
     *  données distantes remplacent celles de l'écran. */
    private onRemote: (data: Partial<AppData>) => void,
  ) {}

  private get ref() {
    return doc(db, 'artistes', this.uid)
  }

  /**
   * Première lecture. Renvoie les données à afficher.
   * `fallback` sert au tout premier accès d'un compte : ce sont les données
   * déjà présentes sur l'appareil, qu'on téléverse plutôt que de les perdre.
   */
  async start(fallback: AppData): Promise<Partial<AppData>> {
    try {
      const snap = await getDoc(this.ref)
      if (snap.exists()) {
        const d = snap.data() as { rev?: number; data?: Partial<AppData> }
        this.rev = d.rev ?? 0
        syncState.value = 'saved'
        return d.data ?? {}
      }

      // Compte neuf : on installe ce que l'appareil contenait déjà.
      const initial = plain(fallback)
      await runTransaction(db, async (tx) => {
        tx.set(this.ref, { rev: 1, data: initial, updatedAt: serverTimestamp() })
      })
      this.rev = 1
      syncState.value = 'saved'
      writeMirror(this.uid, initial)
      return initial
    } catch (e) {
      // Coupure réseau ou droits refusés : la copie locale prend le relais, et
      // l'état renseigne sur la cause réelle.
      syncState.value = classify(e)
      return readMirror(this.uid) ?? {}
    }
  }

  /** Enregistrement différé, appelé à chaque modification. */
  schedule(data: AppData): void {
    const snapshot = plain(data)
    writeMirror(this.uid, snapshot)
    this.pending = snapshot
    syncState.value = 'saving'
    if (this.timer) clearTimeout(this.timer)
    this.timer = setTimeout(() => void this.flush(), SAVE_DELAY)
  }

  /** Envoi immédiat, pour la fermeture de l'onglet ou la déconnexion. */
  async flush(): Promise<void> {
    if (this.timer) {
      clearTimeout(this.timer)
      this.timer = null
    }
    if (!this.pending || this.inFlight) return

    const data = this.pending
    this.pending = null
    this.inFlight = true

    try {
      let remote: Partial<AppData> | null = null

      await runTransaction(db, async (tx) => {
        const snap = await tx.get(this.ref)
        const current = snap.exists() ? (snap.data() as { rev?: number; data?: Partial<AppData> }) : null

        // Quelqu'un d'autre — un autre appareil, un autre onglet — a écrit
        // depuis notre dernière lecture : on ne recouvre pas son travail.
        if (current && (current.rev ?? 0) > this.rev) {
          remote = current.data ?? {}
          this.rev = current.rev ?? 0
          return
        }

        const next = (current?.rev ?? 0) + 1
        tx.set(this.ref, { rev: next, data, updatedAt: serverTimestamp() })
        this.rev = next
      })

      if (remote) {
        this.onRemote(remote)
        reloadedFromRemote.value = true
      }
      syncMessage.value = ''
      syncState.value = 'saved'
    } catch (e) {
      // La copie locale contient déjà les données : on retentera à la prochaine
      // modification ou au retour de la connexion.
      this.pending = data
      syncState.value = classify(e)
    } finally {
      this.inFlight = false
    }
  }

  stop(): void {
    if (this.timer) {
      clearTimeout(this.timer)
      this.timer = null
    }
    this.pending = null
  }
}
