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
  etatAbonnementApple,
  facturationApplePossible,
  jetonAppleDejaAchete,
  lireTarifsApple,
  ouvrirGestionApple,
} from './facturation-apple'
import {
  acheterPro as acheterProPlay,
  etatAbonnementPlay,
  facturationPossible as facturationPlayPossible,
  jetonDejaAchete as jetonPlayDejaAchete,
  lireTarifs as lireTarifsPlay,
} from './facturation-play'

export { AchatAnnule } from './facturation-apple'
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
 * Où l'on résilie, et c'est ailleurs qu'ici.
 *
 * Ni Apple ni Google n'autorisent une application à résilier l'abonnement
 * qu'ils encaissent : ils gardent la main, et c'est tant mieux — personne ne
 * veut qu'une application puisse décider seule de l'argent qu'elle prélève. La
 * seule chose à faire est donc d'ouvrir la page du magasin, d'un geste.
 *
 * `null` sur le site : on y ignore chez quel magasin l'abonnement a été pris,
 * et deviner enverrait un abonné Apple sur une page Google où il ne trouverait
 * rien. L'écran dit alors où chercher, en toutes lettres.
 */
/**
 * Ouvre là où l'on résilie, par le chemin le plus court disponible.
 *
 * Sur iPhone, la fiche native d'Apple, présentée par-dessus l'application. Elle
 * vaut mieux que l'adresse ouverte dans le navigateur pour une raison qui ne se
 * devine pas : **la page web ne montre que les abonnements réels**. Un
 * abonnement de bac à sable, ou pris dans une version TestFlight, n'y figure
 * pas — et ne s'y résilie donc pas. D'après Apple, cette fiche est le seul
 * moyen d'annuler un abonnement acheté en TestFlight.
 *
 * Ailleurs, et en secours si la fiche refuse de s'ouvrir, l'adresse du magasin
 * dans le navigateur.
 *
 * Rend `false` quand il n'y a nulle part où aller : c'est le cas du site, où
 * l'on ignore chez quel magasin l'abonnement a été pris. L'écran dit alors où
 * chercher, en toutes lettres.
 */
export async function ouvrirGestionAbonnement(): Promise<boolean> {
  if (magasin() === 'apple' && (await ouvrirGestionApple())) return true

  const lien = lienGestionAbonnement()
  if (!lien) return false
  window.open(lien.url, '_blank', 'noopener')
  return true
}

export function lienGestionAbonnement(): { url: string; magasin: 'apple' | 'play' } | null {
  const ou = magasin()
  if (ou === 'apple') {
    return { url: 'https://apps.apple.com/account/subscriptions', magasin: 'apple' }
  }
  if (ou === 'play') {
    /*  Le paquet en paramètre : sans lui, Google ouvre la liste de tous les
     *  abonnements du compte, où il faut retrouver le bon. */
    return {
      url: 'https://play.google.com/store/account/subscriptions?package=fr.rapidmusic.app',
      magasin: 'play',
    }
  }
  return null
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

/**
 * Ce que le magasin répond, en distinguant trois cas et non deux.
 *
 * `jetonDejaAchete` répond par oui ou par rien, ce qui suffit pour faire
 * vérifier un achat. Ici il faut la nuance : `aucun` est une affirmation du
 * magasin — il n'y a plus d'abonnement en cours —, `inconnu` veut dire qu'on
 * n'en sait rien, parce qu'on n'est pas dans une application ou parce que le
 * magasin n'a pas répondu.
 *
 * La différence décide d'un accès. Refermer sur `inconnu` couperait l'abonnement
 * de quelqu'un pour une panne de réseau ; ne jamais refermer laisserait Pro
 * ouvert à qui s'est fait rembourser.
 */
export async function etatChezLeMagasin(): Promise<
  { jeton: string; magasin: 'apple' | 'play' } | 'aucun' | 'inconnu'
> {
  const ou = magasin()
  if (ou === null) return 'inconnu'

  const etat = ou === 'apple' ? await etatAbonnementApple() : await etatAbonnementPlay()
  if (etat === 'aucun' || etat === 'inconnu') return etat
  return { jeton: etat.jeton, magasin: ou }
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
 * Arrête la reconduction de l'abonnement, là où le magasin l'autorise.
 *
 * Rend ce qui s'est réellement passé, et non un simple `true` : il y a trois
 * issues et les confondre reviendrait à annoncer une résiliation qui n'a pas eu
 * lieu, sur un sujet où un malentendu se paie tous les mois.
 *
 *   `resilie`           — c'est fait, le prélèvement s'arrête ;
 *   `a-faire-soi-meme`  — il reste à le faire dans le magasin. C'est le cas
 *                         d'Apple, toujours : aucun appel ne permet de résilier
 *                         un abonnement App Store, seul son titulaire peut le
 *                         faire depuis les réglages de son identifiant ;
 *   `rien`              — il n'y a pas d'abonnement à résilier ici.
 *
 * Aucune erreur ne sort d'ici. Cette fonction est appelée avant la suppression
 * d'un compte, et une résiliation en échec ne doit pas empêcher quelqu'un de
 * supprimer le sien : il resterait prisonnier d'un compte qu'il veut quitter.
 * L'échec se dit en `a-faire-soi-meme`, qui est la vérité.
 */
export async function resilierAbonnement(): Promise<'resilie' | 'a-faire-soi-meme' | 'rien'> {
  let achete: { jeton: string; magasin: 'apple' | 'play' } | null = null
  try {
    achete = await jetonDejaAchete()
  } catch {
    /*  Le magasin ne répond pas : on ne sait pas s'il y a un abonnement. Le
     *  dire à faire soi-même est le seul choix qui ne trompe personne. */
    return 'a-faire-soi-meme'
  }
  if (!achete) return 'rien'
  if (achete.magasin === 'apple') return 'a-faire-soi-meme'

  try {
    const appel = httpsCallable<{ jeton: string; magasin: string }, { resilie: boolean }>(
      functions,
      'resilierAbonnement',
    )
    const { data } = await appel({ jeton: achete.jeton, magasin: achete.magasin })
    return data.resilie === true ? 'resilie' : 'a-faire-soi-meme'
  } catch {
    return 'a-faire-soi-meme'
  }
}

/**
 * Fait vérifier un reçu par le serveur, qui ouvre ou referme l'accès.
 *
 * C'est le seul appel qui compte : tout ce qui précède peut être contourné par
 * qui sait ouvrir une console, celui-ci parle à Apple ou à Google avec des
 * droits que le navigateur n'a pas.
 */
/**
 * Demande au serveur de refermer l'accès payant de ce compte.
 *
 * Appelée quand le magasin affirme n'avoir aucun abonnement en cours alors que
 * le compte est encore marqué Pro — un abonnement expiré, remboursé, ou acheté
 * par un autre compte Apple que celui du téléphone. Sans cet appel, l'accès
 * survivrait à ce qui le justifiait : l'application ne revérifie qu'avec un
 * jeton, et un abonnement disparu n'en fournit plus aucun.
 */
export async function fermerAupresDuServeur(): Promise<void> {
  const appel = httpsCallable<Record<string, never>, { pro: boolean }>(
    functions,
    'fermerAbonnement',
  )
  await appel({})
}

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
