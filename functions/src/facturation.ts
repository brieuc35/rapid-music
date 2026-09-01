/* -------------------------------------------------------------------------- */
/*  Ce qu'un achat Play veut dire                                              */
/*                                                                            */
/*  Traduit la réponse de Google en document `abonnements/{uid}`. Séparé de     */
/*  l'appel réseau, et sans dépendance : c'est la décision qui sépare ceux qui  */
/*  ont payé des autres, et une erreur ici se paie des deux côtés — un accès    */
/*  offert, ou un abonné payant enfermé dehors.                                */
/*                                                                            */
/*  Rien ici ne parle à Google ni à Firestore. C'est ce qui permet de vérifier  */
/*  chaque cas, y compris ceux qu'on ne saurait pas provoquer à la demande :    */
/*  un paiement en échec, un abonnement mis en pause, un remboursement.        */
/* -------------------------------------------------------------------------- */

import { createHash } from 'node:crypto'
import type { Abonnement } from './courriels.js'

/**
 * Les deux produits d'abonnement, tels qu'ils sont créés dans la Play Console.
 *
 * **Deux produits, et non deux formules d'un même produit.** Ce n'est pas un
 * choix de présentation, c'est une contrainte : le pont de facturation des TWA
 * prend toujours la première offre du produit demandé
 * (`offerDetails.get(0)` dans `PlayBillingWrapper`). Réunies sous un seul
 * produit, les deux formules seraient indiscernables depuis le navigateur —
 * l'artiste croirait choisir l'annuel et paierait ce que Google aurait mis en
 * tête de liste.
 *
 * Les identifiants doivent correspondre au mot près à ceux de la Console. Une
 * faute de frappe ne se verrait pas à la vérification : elle ferait échouer
 * l'achat lui-même.
 */
export const PRODUIT_MENSUEL = 'pro_mensuel'
export const PRODUIT_ANNUEL = 'pro_annuel'

const PRODUITS = new Set<string>([PRODUIT_MENSUEL, PRODUIT_ANNUEL])

/** Vrai si cet identifiant est l'un de nos deux abonnements. */
export function estNotreProduit(id: string | undefined): boolean {
  return id !== undefined && PRODUITS.has(id)
}

/**
 * Lequel des deux abonnements cet achat concerne, ou `null`.
 *
 * Sert à l'accusé de réception, qui réclame l'identifiant du produit.
 */
export function produitDeLAchat(achat: AchatPlay): string | null {
  return (achat.lineItems ?? []).map((l) => l.productId).find(estNotreProduit) ?? null
}

/** Réponse de l'API `purchases.subscriptionsv2`, réduite à ce qu'on en lit. */
export interface AchatPlay {
  subscriptionState?: string
  acknowledgementState?: string
  startTime?: string
  lineItems?: Array<{ productId?: string; expiryTime?: string }>
}

/**
 * Les états qui ouvrent l'accès payant.
 *
 * Trois, et pas seulement « actif » :
 *
 *   ACTIVE          — le cas ordinaire ;
 *   CANCELED        — la reconduction est coupée, mais la période en cours est
 *                     payée. Fermer l'accès ici reviendrait à voler les jours
 *                     restants à quelqu'un qui a réglé son mois ;
 *   IN_GRACE_PERIOD — le prélèvement a échoué et Google réessaie. L'accès est
 *                     maintenu pendant ce délai, faute de quoi une carte
 *                     expirée couperait l'application du jour au lendemain.
 *
 * Les autres ferment : ON_HOLD (le délai de grâce est écoulé), PAUSED (mise en
 * pause demandée), EXPIRED, PENDING (achat pas encore réglé — un virement en
 * attente, par exemple, qui ne doit rien ouvrir avant d'être encaissé).
 */
const ETATS_OUVRANTS = new Set([
  'SUBSCRIPTION_STATE_ACTIVE',
  'SUBSCRIPTION_STATE_CANCELED',
  'SUBSCRIPTION_STATE_IN_GRACE_PERIOD',
])

/** Vrai si cet état donne droit aux fonctions payantes. */
export function ouvreLAcces(etat: string | undefined): boolean {
  return etat !== undefined && ETATS_OUVRANTS.has(etat)
}

/* -------------------------------------------------------------------------- */
/*  À qui appartient un achat                                                  */
/*                                                                            */
/*  Google sait rattacher un achat à un identifiant de compte — mais seulement */
/*  si l'application le lui donne à l'achat, et le pont de facturation des TWA */
/*  ne transmet pas ce champ : il n'accepte que `sku`, `oldSku`,               */
/*  `purchaseToken` et le mode de remplacement. La réponse de Google ne dira   */
/*  donc jamais à quel artiste l'achat appartient.                             */
/*                                                                            */
/*  Sans rien de plus, un même jeton d'achat ouvrirait autant de comptes qu'on */
/*  voudrait : il suffirait de le faire circuler pour partager un abonnement.  */
/*                                                                            */
/*  D'où la revendication : le premier compte qui présente un jeton se         */
/*  l'approprie, et lui seul pourra s'en servir ensuite. Le propriétaire       */
/*  légitime revendique le sien à la seconde de l'achat ; personne n'a le      */
/*  temps de le devancer.                                                     */
/* -------------------------------------------------------------------------- */

/**
 * La collection des revendications.
 *
 * Fermée au navigateur comme le reste (voir firestore.rules) : elle ne
 * contient que des empreintes et des identifiants de compte, mais la lire
 * reviendrait à savoir qui est abonné.
 */
export const JETONS = 'jetons'

/**
 * Le nom du document qui garde la revendication d'un jeton.
 *
 * Une empreinte, pas le jeton lui-même. Deux raisons : un jeton d'achat peut
 * dépasser ce qu'un nom de document accepte et contenir des caractères qui y
 * sont interdits ; et il n'y a aucune raison de conserver en clair un secret
 * qui donne accès à un abonnement, alors qu'une empreinte suffit à reconnaître
 * celui qu'on revoit.
 */
export function clefDuJeton(jeton: string): string {
  return createHash('sha256').update(jeton).digest('hex')
}

/**
 * Ce compte a-t-il le droit de se servir de ce jeton ?
 *
 * Oui si personne ne l'a revendiqué, oui si c'est lui qui l'a revendiqué — et
 * dans ce second cas c'est le fonctionnement normal, puisque l'application
 * revérifie son abonnement à chaque lancement. Non dans tous les autres cas.
 */
export function jetonUtilisable(proprietaire: string | undefined, demandeur: string): boolean {
  return proprietaire === undefined || proprietaire === demandeur
}

/**
 * Faut-il accuser réception de cet achat auprès de Google ?
 *
 * Ce n'est pas une formalité : **un achat non confirmé sous trois jours est
 * remboursé automatiquement** et l'abonnement annulé. L'oublier ne casserait
 * rien de visible pendant l'essai, puis rembourserait tous les premiers
 * abonnés — une panne qui ne se déclare que trois jours plus tard.
 */
export function doitAccuserReception(achat: AchatPlay): boolean {
  return achat.acknowledgementState === 'ACKNOWLEDGEMENT_STATE_PENDING'
}

/** Date ISO courte (AAAA-MM-JJ) d'un horodatage Google, ou `undefined`. */
function jour(horodatage: string | undefined): string | undefined {
  if (!horodatage) return undefined
  const d = new Date(horodatage)
  if (Number.isNaN(d.getTime())) return undefined
  return d.toISOString().slice(0, 10)
}

/**
 * L'échéance de l'abonnement : la plus lointaine des lignes du produit attendu.
 *
 * Un abonnement n'a qu'une ligne aujourd'hui, mais l'API en renvoie un tableau
 * et en admettra plusieurs le jour où une offre en regroupera deux. Prendre la
 * première serait un pari ; prendre la plus lointaine reste juste dans les deux
 * cas.
 */
function echeance(achat: AchatPlay): string | undefined {
  const dates = (achat.lineItems ?? [])
    /*  Une ligne sans identifiant est retenue : le champ est facultatif chez
     *  Google, et l'écarter fermerait l'accès à quelqu'un qui paie au motif que
     *  sa réponse est incomplète. */
    .filter((l) => l.productId === undefined || estNotreProduit(l.productId))
    .map((l) => jour(l.expiryTime))
    .filter((d): d is string => d !== undefined)
  return dates.length ? dates.sort().at(-1) : undefined
}

/**
 * Traduit un achat Play en document d'abonnement, ou `null` s'il n'ouvre rien.
 *
 * `null` n'est pas une erreur : c'est la réponse normale pour un abonnement
 * expiré, en pause ou suspendu. L'appelant efface alors le document, ce qui
 * referme l'accès.
 *
 * L'échéance est ramenée au jour, parce que c'est ce que compare
 * `subscriptionActive` dans le navigateur. L'arrondi joue en faveur de
 * l'abonné : une échéance à midi vaut jusqu'au soir. Une journée offerte est
 * préférable à une journée volée à quelqu'un qui a payé.
 */
export function abonnementDepuisAchat(achat: AchatPlay): Abonnement | null {
  if (!ouvreLAcces(achat.subscriptionState)) return null

  const depuis = jour(achat.startTime)
  if (!depuis) return null

  const jusqua = echeance(achat)
  return jusqua ? { plan: 'pro', depuis, jusqua } : { plan: 'pro', depuis }
}
