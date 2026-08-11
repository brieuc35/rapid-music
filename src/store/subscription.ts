/* -------------------------------------------------------------------------- */
/*  L'abonnement payant                                                       */
/*                                                                            */
/*  Un document par artiste : abonnements/{uid}. Il ne ressemble pas au reste  */
/*  et c'est volontaire — les règles de sécurité le rendent lisible par son    */
/*  propriétaire et écrivable par personne (voir firestore.rules).             */
/*                                                                            */
/*  Pourquoi une collection à part plutôt qu'un champ dans les données de      */
/*  l'artiste : parce que ces données-là, il a le droit de les modifier. C'est */
/*  toute la difficulté d'une application sans serveur — le navigateur écrit   */
/*  directement dans la base, et rien de ce qu'il écrit ne peut faire foi.     */
/*  Un statut payant rangé là serait auto-attribuable ; rangé ici, il ne peut  */
/*  venir que d'ailleurs : la console Firebase aujourd'hui, un encaissement    */
/*  vérifié côté serveur demain.                                              */
/*                                                                            */
/*  Rien n'écrit dans ce fichier. C'est le but.                               */
/* -------------------------------------------------------------------------- */

import { computed, ref } from 'vue'
import { doc, getDoc } from 'firebase/firestore/lite'
import { db } from '@/firebase'

export interface Abonnement {
  /** Seule valeur qui ouvre les fonctions payantes. */
  plan: 'free' | 'pro'
  /** Date ISO du début, pour l'afficher. */
  depuis: string
  /**
   * Date ISO de fin de la période payée, si elle est connue.
   *
   * Facultative, mais honorée dès qu'elle est là : un abonnement résilié dont
   * l'avis de résiliation se serait perdu en route resterait actif pour
   * toujours. Une date dépassée vaut donc non-abonné, sans rien attendre de
   * personne.
   */
  jusqua?: string
}

/** Abonnement lu sur le serveur. Nul tant qu'il n'a pas été lu, ou s'il n'y en a pas. */
const abonnement = ref<Abonnement | null>(null)

/** Vrai le temps de la lecture, pour ne pas verrouiller un écran par erreur. */
export const abonnementLu = ref(false)

/**
 * Un abonnement ouvre-t-il les fonctions payantes ?
 *
 * Toute autre valeur que « pro » vaut non-abonné : un document mal formé ne doit
 * pas ouvrir l'accès, et le doute profite à la fermeture.
 *
 * Exportée pour être vérifiable sans réseau : c'est la décision qui, demain,
 * séparera ceux qui ont payé des autres. Une erreur ici se traduirait soit par
 * un accès offert, soit par un abonné payant enfermé dehors.
 */
export function subscriptionActive(a: Abonnement | null, aujourdhui?: string): boolean {
  if (!a || a.plan !== 'pro') return false
  const jour = aujourdhui ?? new Date().toISOString().slice(0, 10)
  if (a.jusqua && a.jusqua < jour) return false
  return true
}

/** Abonnement payant en cours de validité. */
export const abonnementPro = computed(() => subscriptionActive(abonnement.value))

/** Détail à afficher, ou nul s'il n'y a pas d'abonnement payant. */
export const abonnementDetail = computed(() => (abonnementPro.value ? abonnement.value : null))

/**
 * Lit l'abonnement du compte. Ne lève jamais : l'absence de document est le cas
 * normal — personne n'est abonné aujourd'hui — et un refus de droits ne doit pas
 * empêcher d'entrer dans l'application. Dans le doute, non-abonné.
 */
export async function readSubscription(uid: string): Promise<void> {
  try {
    const snap = await getDoc(doc(db, 'abonnements', uid))
    abonnement.value = snap.exists() ? (snap.data() as Abonnement) : null
  } catch {
    abonnement.value = null
  } finally {
    abonnementLu.value = true
  }
}

/**
 * Oublie l'abonnement lu. Appelé à la déconnexion : sans cela, le statut du
 * compte précédent resterait en mémoire jusqu'au rechargement de la page.
 */
export function clearSubscription(): void {
  abonnement.value = null
  abonnementLu.value = false
}
