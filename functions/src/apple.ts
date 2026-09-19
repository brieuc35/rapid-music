/* -------------------------------------------------------------------------- */
/*  Parler à l'App Store                                                       */
/*                                                                            */
/*  Le pendant de play.ts, côté Apple. Un seul appel : demander l'état d'un    */
/*  abonnement. Ce qu'on en fait est décidé dans facturation-apple.ts, qui ne  */
/*  touche pas au réseau et se vérifie donc par des tests.                    */
/*                                                                            */
/*  Pas d'accusé de réception à envoyer ici, contrairement à Google : Apple ne */
/*  rembourse pas un achat qu'on aurait oublié de confirmer. C'est             */
/*  l'application qui termine ses transactions, dans AchatPro.swift.           */
/*                                                                            */
/*  L'identité est une clef d'API créée dans App Store Connect, et non le      */
/*  compte de service de la fonction : Apple ne connaît pas Google Cloud. Les  */
/*  trois secrets sont décrits dans docs/facturation.md.                       */
/* -------------------------------------------------------------------------- */

import {
  APIException,
  AppStoreServerAPIClient,
  Environment,
} from '@apple/app-store-server-library'
import type { StatutApple, TransactionApple } from './facturation-apple.js'

/** Le paquet iOS, tel qu'il est déclaré dans capacitor.config.ts. */
export const PAQUET = 'fr.rapidmusic.app'

/*  Les trois secrets, déclarés comme ceux du courrier : le nom ici, la valeur
 *  dans le gestionnaire de secrets de Firebase, jamais dans le dépôt.
 *
 *  APPLE_CLE est le contenu du fichier .p8 téléchargé une seule fois depuis
 *  App Store Connect — Apple ne le redonne jamais. C'est une clef privée : elle
 *  signe les requêtes au nom de l'éditeur, et qui l'a peut lire l'état des
 *  abonnements de tous les clients. */
export const APPLE_CLE = 'APPLE_CLE'
export const APPLE_ID_CLE = 'APPLE_ID_CLE'
export const APPLE_ID_EDITEUR = 'APPLE_ID_EDITEUR'

/** Erreur venue d'Apple, avec le code HTTP pour distinguer les cas. */
export class ErreurApple extends Error {
  constructor(
    message: string,
    readonly statut: number,
  ) {
    super(message)
  }
}

/*  Un client par environnement, gardé d'une invocation à l'autre : il met en
 *  cache le jeton signé qui authentifie les appels, valable une heure. En
 *  recréer un à chaque achat referait cette signature à chaque fois. */
const clients = new Map<Environment, AppStoreServerAPIClient>()

function client(environnement: Environment): AppStoreServerAPIClient {
  const deja = clients.get(environnement)
  if (deja) return deja

  const cle = process.env[APPLE_CLE] ?? ''
  const idCle = process.env[APPLE_ID_CLE] ?? ''
  const idEditeur = process.env[APPLE_ID_EDITEUR] ?? ''
  if (!cle || !idCle || !idEditeur) {
    throw new ErreurApple(
      `Secrets Apple absents ou incomplets (${APPLE_CLE}, ${APPLE_ID_CLE}, ` +
        `${APPLE_ID_EDITEUR}). Voir docs/facturation.md.`,
      0,
    )
  }

  const neuf = new AppStoreServerAPIClient(cle, idCle, idEditeur, PAQUET, environnement)
  clients.set(environnement, neuf)
  return neuf
}

/* -------------------------------------------------------------------------- */

/**
 * Lit la charge utile d'un reçu signé, **sans vérifier sa signature**.
 *
 * Ce que cette fonction rend n'est donc pas une preuve : c'est une affirmation
 * du téléphone, et un téléphone peut mentir. Elle ne sert qu'à en extraire
 * l'identifiant d'abonnement, qu'on va aussitôt soumettre à Apple — c'est la
 * réponse d'Apple qui fait foi, et elle seule.
 *
 * **L'ordre des opérations est ce qui tient tout l'édifice.** On interroge
 * Apple d'abord, on revendique ensuite. Un identifiant inventé n'existe pas
 * chez Apple : l'appel échoue, et rien n'est revendiqué. Sans cet ordre, on
 * pourrait revendiquer d'avance des identifiants qui n'existent pas encore, et
 * enfermer dehors les vrais acheteurs à mesure qu'ils arrivent — une panne qui
 * ne se verrait que dans les réclamations.
 *
 * Une vérification cryptographique locale (`SignedDataVerifier` de la
 * bibliothèque d'Apple) ajouterait une couche : elle prouverait que le reçu a
 * bien été émis par Apple pour cette application. Elle demande d'embarquer les
 * certificats racine d'Apple dans le dépôt. À ajouter le jour où ces
 * certificats seront sous la main ; ce n'est pas ce qui protège l'accès
 * aujourd'hui, l'appel authentifié à Apple s'en charge.
 */
export function identifiantDuRecu(jws: string): string | null {
  const parts = jws.split('.')
  if (parts.length !== 3) return null
  try {
    const charge = JSON.parse(
      Buffer.from(parts[1], 'base64url').toString('utf8'),
    ) as TransactionApple
    return charge.originalTransactionId ?? charge.transactionId ?? null
  } catch {
    return null
  }
}

/** Décode la charge utile d'un reçu signé rendu par Apple lui-même. */
function charge(jws: string | undefined): TransactionApple | undefined {
  if (!jws) return undefined
  const parts = jws.split('.')
  if (parts.length !== 3) return undefined
  try {
    return JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8')) as TransactionApple
  } catch {
    return undefined
  }
}

async function interroger(id: string, environnement: Environment): Promise<StatutApple> {
  const reponse = await client(environnement).getAllSubscriptionStatuses(id)

  /*  Apple range les abonnements par groupe, et chaque groupe porte la
   *  dernière transaction de chacun de ses produits. On cherche celle qui
   *  correspond à l'identifiant demandé : un compte peut avoir eu plusieurs
   *  abonnements chez nous, et prendre le premier venu rendrait l'état d'un
   *  ancien produit expiré au lieu de celui qu'on vérifie. */
  for (const groupe of reponse.data ?? []) {
    for (const derniere of groupe.lastTransactions ?? []) {
      if (derniere.originalTransactionId !== id) continue
      return { status: derniere.status, transaction: charge(derniere.signedTransactionInfo) }
    }
  }
  return {}
}

/**
 * Demande à Apple l'état réel d'un abonnement, à partir de son identifiant.
 *
 * Production d'abord, bac à sable ensuite. Les deux mondes sont étanches et un
 * identifiant ne vit que dans l'un des deux ; rien dans le reçu ne dit
 * lequel de façon fiable, et Apple recommande cet enchaînement.
 *
 * Il n'est pas seulement là pour les essais : **les examinateurs d'Apple
 * achètent en bac à sable**. Sans ce second essai, l'abonnement échouerait
 * pendant l'examen de l'application, et le refus tomberait sans qu'on
 * comprenne pourquoi — en production tout marcherait.
 */
export async function lireAbonnement(id: string): Promise<StatutApple> {
  try {
    return await interroger(id, Environment.PRODUCTION)
  } catch (e) {
    const introuvable =
      e instanceof APIException && (e.httpStatusCode === 404 || e.httpStatusCode === 400)
    if (!introuvable) {
      const statut = e instanceof APIException ? e.httpStatusCode : 0
      throw new ErreurApple(`Apple a répondu ${statut} : ${String(e)}`, statut)
    }
  }

  try {
    return await interroger(id, Environment.SANDBOX)
  } catch (e) {
    const statut = e instanceof APIException ? e.httpStatusCode : 0
    throw new ErreurApple(`Apple a répondu ${statut} : ${String(e)}`, statut)
  }
}
