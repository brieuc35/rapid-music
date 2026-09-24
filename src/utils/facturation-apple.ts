/* -------------------------------------------------------------------------- */
/*  L'achat de l'abonnement dans l'application iPhone                          */
/*                                                                            */
/*  Le pendant de facturation-play.ts, côté Apple, avec la même promesse :     */
/*  rien de ce qui est décidé ici ne fait foi. Ces fonctions rendent un reçu   */
/*  signé par Apple, que la fonction serveur `verifierAchat` fait valider      */
/*  avant d'ouvrir l'accès.                                                    */
/*                                                                            */
/*  Le travail réel est fait par le greffon Swift, dans                        */
/*  ios/App/CapApp-SPM/Sources/CapApp-SPM/AchatPro.swift. Ici on ne fait que   */
/*  l'appeler et traduire ses réponses.                                        */
/*                                                                            */
/*  Rien n'est importé de `@capacitor/core`, comme dans enveloppe-native.ts :  */
/*  le pont natif pose lui-même `window.Capacitor`, et l'interroger coûte zéro */
/*  octet aux visiteurs du site, qui sont l'immense majorité.                  */
/* -------------------------------------------------------------------------- */

import { surIOS } from './enveloppe-native'
import { ErreurAchat, type Tarif } from './facturation-play'

/**
 * Les deux abonnements, tels qu'ils sont créés dans App Store Connect.
 *
 * Les mêmes identifiants que côté Google, et que dans AchatPro.swift. Le
 * serveur compare le produit acheté à une seule liste quel que soit le
 * magasin ; deux jeux d'identifiants auraient demandé deux listes, et un jour
 * l'une des deux aurait été oubliée.
 */
export { PRODUIT_MENSUEL, PRODUIT_ANNUEL } from './facturation-play'

/** Ce que le greffon Swift renvoie pour un tarif. */
interface TarifNatif {
  id: string
  montant: number
  devise: string
  texte: string
}

interface GreffonAchat {
  tarifs(): Promise<{ tarifs?: TarifNatif[] }>
  acheter(options: { produit: string }): Promise<{
    jeton?: string
    annule?: boolean
    enAttente?: boolean
  }>
  abonnementEnCours(): Promise<{ jeton?: string }>
}

type FenetreAvecGreffons = Window & {
  Capacitor?: { Plugins?: { AchatPro?: GreffonAchat } }
}

/**
 * Le greffon natif, ou `null` hors de l'application iPhone.
 *
 * Son absence n'est pas une panne : c'est le cas du site, de l'application
 * Android, et d'une version d'iOS où le greffon n'aurait pas été embarqué.
 */
function greffon(): GreffonAchat | null {
  if (!surIOS()) return null
  return (window as FenetreAvecGreffons).Capacitor?.Plugins?.AchatPro ?? null
}

/** L'achat est-il proposable ici ? */
export function facturationApplePossible(): boolean {
  return greffon() !== null
}

/**
 * Pourquoi l'achat n'est-il pas proposé, dans l'enveloppe iPhone ?
 *
 * Une ligne technique, affichée uniquement là où l'achat devrait marcher et ne
 * marche pas. Elle ne s'adresse pas à l'artiste : elle s'adresse à qui répare,
 * et elle existe parce qu'un iPhone ne se laisse pas inspecter à distance. Sans
 * Mac, il n'y a ni console ni journal — cette ligne est la seule fenêtre.
 *
 * Trois choses s'y lisent, et chacune désigne un coupable différent :
 *
 *   pont absent          `window.Capacitor` n'a pas été posé — le paquet n'est
 *                        pas celui de Capacitor, ou le pont a échoué ;
 *   plateforme ≠ ios     l'enveloppe tourne, mais ne se déclare pas iOS ;
 *   AchatPro manquant    le greffon natif n'est pas enregistré, et la liste des
 *                        greffons présents dit s'il en manque un seul ou tous.
 *
 * À retirer le jour où l'achat sera confirmé sur un appareil. D'ici là, elle
 * vaut mieux qu'un aller-retour par fabrication.
 */
export function diagnosticAchat(): string {
  const pont = (window as FenetreAvecGreffons).Capacitor
  if (!pont) return 'pont natif absent'

  const plateforme = (pont as { getPlatform?: () => string }).getPlatform?.() ?? '?'
  const natif = (pont as { isNativePlatform?: () => boolean }).isNativePlatform?.() ?? false
  const noms = Object.keys((pont.Plugins ?? {}) as Record<string, unknown>)

  return [
    `natif ${natif ? 'oui' : 'non'}`,
    `plateforme ${plateforme}`,
    `greffons ${noms.length ? noms.join(', ') : '(aucun)'}`,
  ].join(' · ')
}

/**
 * Déclenche le paiement et rend le reçu signé par Apple.
 *
 * Une annulation lève une erreur portant `annule`, que l'appelant distingue
 * pour ne pas afficher de message d'échec : refermer la fenêtre de paiement
 * n'est pas un incident, et le dire comme tel serait désagréable.
 */
export class AchatAnnule extends ErreurAchat {}

export async function acheterProApple(produit: string): Promise<string> {
  const natif = greffon()
  if (!natif) {
    throw new ErreurAchat("L'abonnement s'achète depuis l'application iPhone.")
  }

  const reponse = await natif.acheter({ produit })

  if (reponse.annule) throw new AchatAnnule("L'achat a été annulé.")

  /*  « Demander à acheter » : un parent doit approuver, rien n'est débité et
   *  rien ne s'ouvre. Le dire franchement vaut mieux qu'un échec muet — sans
   *  ce message, la personne réessaierait en boucle. La transaction arrivera
   *  plus tard, et l'abonnement s'ouvrira au lancement suivant. */
  if (reponse.enAttente) {
    throw new ErreurAchat(
      "L'achat attend une autorisation. L'abonnement s'ouvrira dès qu'elle sera donnée.",
    )
  }

  if (!reponse.jeton) throw new ErreurAchat("L'achat n'a pas abouti.")
  return reponse.jeton
}

/**
 * Retrouve le reçu d'un abonnement déjà pris, s'il y en a un.
 *
 * C'est ce qui prolonge l'abonnement au renouvellement, ce qui le referme
 * après un remboursement, et ce qui le rend à quelqu'un qui change d'iPhone —
 * la « restauration des achats » qu'Apple exige, et dont l'absence vaut un
 * refus à l'examen.
 */
export async function jetonAppleDejaAchete(): Promise<string | null> {
  const natif = greffon()
  if (!natif) return null
  try {
    return (await natif.abonnementEnCours()).jeton ?? null
  } catch {
    return null
  }
}

/**
 * Les prix réels, tels que l'App Store les affiche.
 *
 * Rend une table vide si l'App Store ne répond pas : les montants écrits dans
 * le code prennent alors le relais. Mieux vaut un prix peut-être périmé qu'une
 * page d'abonnement sans prix.
 */
export async function lireTarifsApple(): Promise<Map<string, Tarif>> {
  const tarifs = new Map<string, Tarif>()
  const natif = greffon()
  if (!natif) return tarifs

  try {
    for (const t of (await natif.tarifs()).tarifs ?? []) {
      if (!t?.id || !t.devise || !Number.isFinite(t.montant)) continue
      tarifs.set(t.id, { montant: t.montant, devise: t.devise })
    }
  } catch {
    /*  Voir plus haut : l'absence de tarif n'est pas une panne bloquante. */
  }
  return tarifs
}
