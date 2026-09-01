/* -------------------------------------------------------------------------- */
/*  L'achat de l'abonnement dans l'application Android                         */
/*                                                                            */
/*  Trois choses seulement se passent ici : savoir si l'achat est possible,    */
/*  déclencher le paiement, et retrouver un achat déjà fait. Rien de ce qui    */
/*  est décidé ici ne fait foi — c'est la fonction serveur `verifierAchat` qui */
/*  ouvre l'accès, après avoir demandé à Google. Le navigateur ne peut pas     */
/*  écrire dans `abonnements/{uid}`, les règles de sécurité le lui interdisent. */
/*                                                                            */
/*  Tout est indisponible hors de l'application Android : ni Chrome sur        */
/*  ordinateur, ni Safari, ni même Chrome sur Android hors de l'application    */
/*  installée depuis le Play Store ne proposent la facturation. C'est la       */
/*  conséquence assumée d'un abonnement vendu uniquement dans l'application.   */
/* -------------------------------------------------------------------------- */

import { httpsCallable } from 'firebase/functions'
import { functions } from '@/firebase'

/** Le moyen de paiement, tel que le Play Store le déclare au navigateur. */
const CANAL = 'https://play.google.com/billing'

/**
 * Les deux abonnements, tels qu'ils sont créés dans la Play Console.
 *
 * Doivent correspondre au mot près à ceux de functions/src/facturation.ts. Les
 * deux fichiers servent à des choses différentes — ici on demande l'achat,
 * là-bas on vérifie ce qui a été acheté — mais un désaccord ferait acheter un
 * produit que la vérification refuserait.
 *
 * Deux produits distincts et non deux formules d'un même produit : le pont de
 * facturation prend toujours la première offre, et réunies sous un seul produit
 * les deux formules seraient indiscernables d'ici.
 */
export const PRODUIT_MENSUEL = 'pro_mensuel'
export const PRODUIT_ANNUEL = 'pro_annuel'

/*  Le service de biens numériques n'existe que dans l'application installée
 *  depuis le Play Store. Son absence n'est pas une panne : c'est le cas de tous
 *  les navigateurs ordinaires. */
interface DetailProduit {
  itemId: string
  price: { currency: string; value: string }
}

interface ServiceBiens {
  listPurchases(): Promise<Array<{ itemId: string; purchaseToken: string }>>
  getDetails(ids: string[]): Promise<DetailProduit[]>
}

type FenetreAvecFacturation = Window & {
  getDigitalGoodsService?: (canal: string) => Promise<ServiceBiens>
}

/** Un prix relevé auprès du Play Store, gardé brut pour rester divisible. */
export interface Tarif {
  montant: number
  devise: string
}

/** Erreur d'achat portant un message affichable tel quel. */
export class ErreurAchat extends Error {}

/**
 * L'achat est-il proposable ici ?
 *
 * Deux conditions, et les deux comptent : le navigateur doit connaître les deux
 * API, et le Play Store doit répondre. La première se teste sans rien demander ;
 * la seconde demande d'appeler le service, ce que fait `serviceFacturation`.
 */
export function facturationPossible(): boolean {
  return (
    typeof window !== 'undefined' &&
    'getDigitalGoodsService' in window &&
    typeof PaymentRequest !== 'undefined'
  )
}

/** Le service du Play Store, ou `null` si l'on n'est pas dans l'application. */
async function serviceFacturation(): Promise<ServiceBiens | null> {
  if (!facturationPossible()) return null
  try {
    const f = window as FenetreAvecFacturation
    return (await f.getDigitalGoodsService!(CANAL)) ?? null
  } catch {
    /*  Le Play Store peut refuser — application installée hors du Store, compte
     *  Google absent du téléphone. Ce n'est pas rattrapable ici. */
    return null
  }
}

/**
 * Déclenche le paiement et rend le jeton d'achat.
 *
 * Le montant passé à `PaymentRequest` est un figurant : c'est le prix réglé
 * dans la Play Console qui s'affiche et qui est débité. En mettre un vrai ici
 * laisserait croire qu'il fait autorité, et le jour où le prix changerait dans
 * la Console, ce code mentirait sans que rien n'échoue.
 */
export async function acheterPro(produit: string): Promise<string> {
  if (!facturationPossible()) {
    throw new ErreurAchat(
      "L'abonnement s'achète depuis l'application Android, installée depuis le Play Store.",
    )
  }

  const demande = new PaymentRequest(
    [{ supportedMethods: CANAL, data: { sku: produit } }],
    { total: { label: 'Abonnement Pro', amount: { currency: 'EUR', value: '0' } } },
  )

  const reponse = await demande.show()
  const jeton = (reponse.details as { purchaseToken?: string })?.purchaseToken

  if (!jeton) {
    /*  On signale l'échec au Play Store avant de sortir : sans `complete`, la
     *  fenêtre de paiement resterait ouverte sur le téléphone. */
    await reponse.complete('fail')
    throw new ErreurAchat("L'achat n'a pas abouti.")
  }

  await reponse.complete('success')
  return jeton
}

/**
 * Retrouve le jeton d'un abonnement déjà acheté, s'il y en a un.
 *
 * Sert à deux choses. À chaque lancement, il permet de revérifier l'abonnement
 * auprès de Google : c'est ce qui le prolonge au renouvellement, et ce qui le
 * referme après un remboursement. Et il rend son abonnement à quelqu'un qui
 * change de téléphone ou réinstalle l'application, sans qu'il ait à repayer.
 */
export async function jetonDejaAchete(): Promise<string | null> {
  const service = await serviceFacturation()
  if (!service) return null
  try {
    const achats = await service.listPurchases()
    const notre = new Set([PRODUIT_MENSUEL, PRODUIT_ANNUEL])
    return achats.find((a) => notre.has(a.itemId))?.purchaseToken ?? null
  } catch {
    return null
  }
}

/**
 * Les prix réels, tels que la Play Console les affiche, dans la devise du
 * téléphone.
 *
 * Les demander plutôt que de les écrire dans le code évite la panne silencieuse
 * la plus probable de tout l'abonnement : un prix changé dans la Console et
 * oublié ici, l'application annonçant un montant et Google en débitant un
 * autre. Personne ne s'en apercevrait avant un client mécontent.
 *
 * Effet de bord bienvenu : un artiste belge, suisse ou canadien voit sa propre
 * monnaie, sans que rien n'ait à être prévu pour lui.
 *
 * Rend une table vide hors de l'application — le site retombe alors sur les
 * montants annoncés dans le code, qui n'y servent qu'à présenter l'offre
 * puisqu'on n'y achète pas.
 */
export async function lireTarifs(): Promise<Map<string, Tarif>> {
  const tarifs = new Map<string, Tarif>()
  const service = await serviceFacturation()
  if (!service) return tarifs

  try {
    const details = await service.getDetails([PRODUIT_MENSUEL, PRODUIT_ANNUEL])
    for (const d of details) {
      const montant = Number(d.price?.value)
      if (!d.price?.currency || !Number.isFinite(montant)) continue
      tarifs.set(d.itemId, { montant, devise: d.price.currency })
    }
  } catch {
    /*  Le Play Store peut ne pas répondre. Les montants du code prendront le
     *  relais : mieux vaut un prix peut-être périmé qu'une page sans prix. */
  }
  return tarifs
}

/**
 * Écrit un montant dans sa devise.
 *
 * Le montant est gardé brut plutôt que le texte tout fait de Google, parce
 * qu'il faut pouvoir le diviser : l'abonnement annuel s'annonce aussi ramené au
 * mois, et une chaîne « 99,00 € » ne se divise pas.
 */
export function ecrireTarif(t: Tarif): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: t.devise,
    /*  Deux décimales au plus : un abonnement se paie en centimes, jamais en
     *  millièmes, et le douzième d'un prix annuel en produirait. */
    maximumFractionDigits: 2,
  }).format(t.montant)
}

/**
 * Fait vérifier un jeton par le serveur, qui ouvre ou referme l'accès.
 *
 * C'est le seul appel qui compte : tout ce qui précède peut être contourné par
 * qui sait ouvrir une console, celui-ci parle à Google avec des droits que le
 * navigateur n'a pas.
 */
export async function verifierAupresDuServeur(jeton: string): Promise<boolean> {
  const appel = httpsCallable<{ jeton: string }, { pro: boolean }>(functions, 'verifierAchat')
  const { data } = await appel({ jeton })
  return data.pro === true
}
