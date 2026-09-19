/* -------------------------------------------------------------------------- */
/*  Ce qu'un abonnement App Store veut dire                                    */
/*                                                                            */
/*  Le pendant de facturation.ts, côté Apple. Même règle : rien ici ne parle à */
/*  Apple ni à Firestore, pour que chaque cas se vérifie par un test — y       */
/*  compris ceux qu'on ne saurait pas provoquer à la demande, comme un         */
/*  remboursement ou un abonnement suspendu pour défaut de paiement.           */
/*                                                                            */
/*  La forme des données change, pas la décision : on traduit l'état d'un      */
/*  abonnement en document `abonnements/{uid}`, ou en `null` s'il n'ouvre      */
/*  rien.                                                                      */
/* -------------------------------------------------------------------------- */

import type { Abonnement } from './courriels.js'
import { estNotreProduit } from './facturation.js'

/**
 * Ce que le reçu signé contient, réduit à ce qu'on en lit.
 *
 * C'est la charge utile du JWS rendu par StoreKit 2. Les dates d'Apple sont en
 * millisecondes depuis 1970, pas en texte ISO comme chez Google.
 */
export interface TransactionApple {
  transactionId?: string
  originalTransactionId?: string
  productId?: string
  bundleId?: string
  purchaseDate?: number
  originalPurchaseDate?: number
  expiresDate?: number
  revocationDate?: number
  environment?: string
}

/**
 * L'état d'abonnement rendu par l'API serveur d'Apple, réduit de même.
 *
 * `status` est un nombre, documenté ainsi :
 *   1 actif · 2 expiré · 3 en échec de paiement (période de reprise) ·
 *   4 en période de grâce · 5 révoqué
 */
export interface StatutApple {
  status?: number
  transaction?: TransactionApple
}

/**
 * Les états qui ouvrent l'accès payant.
 *
 * Trois, comme chez Google, et pour les mêmes raisons :
 *
 *   1 — actif, le cas ordinaire. Il couvre aussi l'abonnement résilié dont la
 *       période en cours reste payée : Apple le laisse actif jusqu'à
 *       l'échéance, et fermer avant reviendrait à voler les jours réglés ;
 *   3 — le prélèvement a échoué et Apple réessaie ;
 *   4 — période de grâce accordée par Apple après un échec.
 *
 * Les autres ferment : 2 (expiré) et 5 (révoqué — remboursement, litige).
 *
 * Un état inconnu ferme lui aussi. Le doute profite à la fermeture : un
 * nouveau code d'Apple ouvrirait sinon l'accès à tout le monde au moindre
 * changement de leur côté.
 */
const ETATS_OUVRANTS = new Set([1, 3, 4])

/** Vrai si cet état donne droit aux fonctions payantes. */
export function ouvreLAccesApple(statut: number | undefined): boolean {
  return statut !== undefined && ETATS_OUVRANTS.has(statut)
}

/** Date ISO courte (AAAA-MM-JJ) d'un horodatage Apple en millisecondes. */
function jour(ms: number | undefined): string | undefined {
  if (typeof ms !== 'number' || !Number.isFinite(ms)) return undefined
  const d = new Date(ms)
  if (Number.isNaN(d.getTime())) return undefined
  return d.toISOString().slice(0, 10)
}

/**
 * Le reçu désigne-t-il bien notre application et l'un de nos abonnements ?
 *
 * Le paquet est vérifié autant que le produit. Un reçu signé par Apple l'est
 * pour *une* application : sans ce contrôle, le reçu d'une autre application de
 * l'App Store — acheté pour quelques euros, ou obtenu autrement — porterait une
 * signature valable et ouvrirait l'abonnement ici.
 */
export function reçuAttendu(t: TransactionApple | undefined, paquet: string): boolean {
  return t !== undefined && t.bundleId === paquet && estNotreProduit(t.productId)
}

/**
 * L'identifiant qui désigne l'abonnement dans la durée.
 *
 * `originalTransactionId` et non `transactionId` : le second change à chaque
 * renouvellement mensuel, le premier ne change jamais. C'est lui qu'on
 * revendique — avec `transactionId`, la revendication serait à refaire tous les
 * mois et ne protégerait plus rien.
 */
export function identifiantAbonnement(t: TransactionApple | undefined): string | null {
  return t?.originalTransactionId ?? t?.transactionId ?? null
}

/**
 * Traduit un état d'abonnement Apple en document, ou `null` s'il n'ouvre rien.
 *
 * `null` n'est pas une erreur : c'est la réponse normale pour un abonnement
 * expiré ou remboursé. L'appelant efface alors le document, ce qui referme
 * l'accès.
 *
 * Une date de révocation ferme à elle seule, quel que soit l'état annoncé.
 * C'est une ceinture en plus des bretelles : un remboursement met normalement
 * l'état à 5, mais le champ est le fait — l'état est son interprétation.
 *
 * L'échéance est ramenée au jour, comme chez Google, parce que c'est ce que
 * compare `subscriptionActive` dans le navigateur. L'arrondi joue en faveur de
 * l'abonné : une échéance à midi vaut jusqu'au soir. Une journée offerte est
 * préférable à une journée volée à quelqu'un qui a payé.
 */
export function abonnementDepuisApple(etat: StatutApple): Abonnement | null {
  const t = etat.transaction
  if (t?.revocationDate !== undefined) return null
  if (!ouvreLAccesApple(etat.status)) return null

  /*  La date d'achat d'origine plutôt que celle du renouvellement : c'est
   *  « abonné depuis », et elle s'affiche telle quelle sur la page
   *  d'abonnement. Au bout d'un an, la seconde dirait « depuis le mois
   *  dernier » à quelqu'un qui paie depuis douze mois. */
  const depuis = jour(t?.originalPurchaseDate) ?? jour(t?.purchaseDate)
  if (!depuis) return null

  const jusqua = jour(t?.expiresDate)
  return jusqua ? { plan: 'pro', depuis, jusqua } : { plan: 'pro', depuis }
}
