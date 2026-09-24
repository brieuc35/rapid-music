/* -------------------------------------------------------------------------- */
/*  L'abonnement, quel que soit le magasin                                     */
/*                                                                            */
/*  Deux magasins vendent le même abonnement — Google Play dans l'application  */
/*  Android, l'App Store dans l'application iPhone — et le reste de            */
/*  l'application n'a aucune raison de savoir lequel. D'où ce guichet unique : */
/*  les écrans demandent « achète », « quels tarifs », « ai-je déjà payé », et */
/*  c'est ici qu'on sait à qui poser la question.                              */
/*                                                                            */
/*  Un seul endroit décide, et il décide une fois : sans lui, chaque écran     */
/*  aurait sa propre cascade de `si iPhone`, et le jour où un troisième cas    */
/*  arriverait — le site, un magasin de plus — il faudrait les retrouver tous. */
/*                                                                            */
/*  Le magasin voyage jusqu'au serveur avec le jeton : les deux reçus ne se    */
/*  vérifient pas au même endroit, et rien dans leur forme ne permet de les    */
/*  distinguer à coup sûr.                                                     */
/* -------------------------------------------------------------------------- */

import { httpsCallable } from 'firebase/functions'
import { functions } from '@/firebase'
import {
  acheterProApple,
  facturationApplePossible,
  jetonAppleDejaAchete,
  lireTarifsApple,
} from './facturation-apple'
import {
  acheterPro as acheterProPlay,
  facturationPossible as facturationPlayPossible,
  jetonDejaAchete as jetonPlayDejaAchete,
  lireTarifs as lireTarifsPlay,
} from './facturation-play'

export { AchatAnnule, diagnosticAchat } from './facturation-apple'
export {
  ecrireTarif,
  ErreurAchat,
  PRODUIT_ANNUEL,
  PRODUIT_MENSUEL,
  type Tarif,
} from './facturation-play'

/**
 * Le magasin qui encaisse ici, ou `null` si l'on n'achète pas depuis cette page.
 *
 * `null` est le cas ordinaire : c'est celui du site, ouvert dans n'importe quel
 * navigateur. L'abonnement ne s'y vend pas, et la page d'abonnement se contente
 * alors de présenter l'offre.
 *
 * Calculé à la demande et non figé : les deux tests sont immédiats, et une
 * constante de module s'évaluerait avant que le pont natif ait posé
 * `window.Capacitor`.
 */
export function magasin(): 'apple' | 'play' | null {
  if (facturationApplePossible()) return 'apple'
  if (facturationPlayPossible()) return 'play'
  return null
}

/** L'achat est-il proposable ici ? */
export function facturationPossible(): boolean {
  return magasin() !== null
}

/**
 * Déclenche le paiement et rend le reçu à faire vérifier.
 *
 * Le magasin accompagne le jeton : `verifierAupresDuServeur` en a besoin, et le
 * lui faire redemander laisserait la porte ouverte à ce que le magasin ait
 * changé entre les deux — cas absurde, mais qui se réglerait en silence par un
 * abonnement refusé à quelqu'un qui vient de payer.
 */
export async function acheterPro(
  produit: string,
): Promise<{ jeton: string; magasin: 'apple' | 'play' }> {
  const ou = magasin()
  if (ou === 'apple') return { jeton: await acheterProApple(produit), magasin: 'apple' }
  if (ou === 'play') return { jeton: await acheterProPlay(produit), magasin: 'play' }
  throw new Error("L'abonnement s'achète depuis l'application.")
}

/** Le reçu d'un abonnement déjà pris sur ce magasin, s'il y en a un. */
export async function jetonDejaAchete(): Promise<{
  jeton: string
  magasin: 'apple' | 'play'
} | null> {
  const ou = magasin()
  if (ou === 'apple') {
    const jeton = await jetonAppleDejaAchete()
    return jeton ? { jeton, magasin: 'apple' } : null
  }
  if (ou === 'play') {
    const jeton = await jetonPlayDejaAchete()
    return jeton ? { jeton, magasin: 'play' } : null
  }
  return null
}

/** Les prix affichés par le magasin, dans la monnaie de la personne. */
export async function lireTarifs(): Promise<Map<string, import('./facturation-play').Tarif>> {
  const ou = magasin()
  if (ou === 'apple') return lireTarifsApple()
  if (ou === 'play') return lireTarifsPlay()
  return new Map()
}

/**
 * Fait vérifier un reçu par le serveur, qui ouvre ou referme l'accès.
 *
 * C'est le seul appel qui compte : tout ce qui précède peut être contourné par
 * qui sait ouvrir une console, celui-ci parle à Apple ou à Google avec des
 * droits que le navigateur n'a pas.
 */
export async function verifierAupresDuServeur(
  jeton: string,
  ou: 'apple' | 'play',
): Promise<boolean> {
  const appel = httpsCallable<{ jeton: string; magasin: string }, { pro: boolean }>(
    functions,
    'verifierAchat',
  )
  const { data } = await appel({ jeton, magasin: ou })
  return data.pro === true
}
