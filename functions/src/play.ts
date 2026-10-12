/* -------------------------------------------------------------------------- */
/*  Parler à Google Play                                                       */
/*                                                                            */
/*  Trois appels, et rien d'autre : lire un achat, en accuser réception, le     */
/*  résilier. Ce qu'on fait de la réponse est décidé dans facturation.ts, qui   */
/*  ne touche pas au réseau et se vérifie donc par des tests.                  */
/*                                                                            */
/*  L'identité est celle du compte de service de la fonction. Pour que Google   */
/*  lui réponde, ce compte doit être invité dans la Play Console — la marche à  */
/*  suivre est dans docs/facturation.md. Sans cette invitation, l'API répond    */
/*  401 quels que soient les droits accordés côté Google Cloud.                 */
/* -------------------------------------------------------------------------- */

import { GoogleAuth } from 'google-auth-library'
import type { AchatPlay } from './facturation.js'

/** Le paquet Android, tel qu'il est déclaré dans android/twa-manifest.json. */
export const PAQUET = 'fr.rapidmusic.app'

const BASE = 'https://androidpublisher.googleapis.com/androidpublisher/v3'

/*  Une seule instance pour toutes les invocations : elle garde le jeton d'accès
 *  en cache jusqu'à son expiration. En recréer une à chaque appel referait un
 *  aller-retour d'authentification à chaque achat vérifié. */
const auth = new GoogleAuth({
  scopes: ['https://www.googleapis.com/auth/androidpublisher'],
})

/** Erreur venue de Google, avec le code HTTP pour distinguer les cas. */
export class ErreurPlay extends Error {
  constructor(
    message: string,
    readonly statut: number,
  ) {
    super(message)
  }
}

async function appeler(chemin: string, methode: 'GET' | 'POST'): Promise<unknown> {
  const client = await auth.getClient()
  const { token } = await client.getAccessToken()
  const reponse = await fetch(`${BASE}${chemin}`, {
    method: methode,
    headers: { Authorization: `Bearer ${token}` },
  })

  if (!reponse.ok) {
    /*  Le corps de la réponse dit ce qui manque — un compte non invité, un
     *  produit inconnu, un jeton déjà consommé. Le perdre transformerait
     *  chacune de ces pannes en un « ça ne marche pas » identique. */
    const detail = await reponse.text().catch(() => '')
    throw new ErreurPlay(
      `Google Play a répondu ${reponse.status} sur ${chemin} : ${detail.slice(0, 500)}`,
      reponse.status,
    )
  }

  //  L'accusé de réception répond 200 avec un corps vide.
  const texte = await reponse.text()
  return texte ? JSON.parse(texte) : {}
}

/** Demande à Google l'état réel d'un abonnement, à partir de son jeton d'achat. */
export async function lireAchat(jeton: string): Promise<AchatPlay> {
  const chemin = `/applications/${PAQUET}/purchases/subscriptionsv2/tokens/${encodeURIComponent(jeton)}`
  return (await appeler(chemin, 'GET')) as AchatPlay
}

/**
 * Confirme à Google que l'achat a bien été pris en compte.
 *
 * À ne pas oublier : **un achat non confirmé sous trois jours est remboursé
 * automatiquement**, et l'abonnement annulé avec lui. La panne ne se voit pas
 * au moment de l'achat, elle se voit trois jours plus tard, sur tous les
 * abonnés à la fois.
 */
export async function accuserReception(jeton: string, produit: string): Promise<void> {
  /*  Cet appel-là passe encore par l'ancienne route, qui réclame l'identifiant
   *  du produit : la version 2 de l'API n'en propose pas d'équivalent. C'est
   *  pourquoi l'appelant doit d'abord savoir lequel des deux abonnements a été
   *  acheté. */
  const chemin =
    `/applications/${PAQUET}/purchases/subscriptions/${produit}` +
    `/tokens/${encodeURIComponent(jeton)}:acknowledge`
  await appeler(chemin, 'POST')
}

/**
 * Résilie l'abonnement : la reconduction s'arrête.
 *
 * Google est le seul des deux magasins à l'autoriser — Apple ne propose aucun
 * appel équivalent, et c'est délibéré : chez lui, seul le titulaire du compte
 * peut mettre fin à ce qu'il paie. D'où une application qui résilie pour de bon
 * sur Android et qui, sur iPhone, ne peut qu'envoyer vers les réglages.
 *
 * Ce que l'appel fait, et ne fait pas : il coupe la reconduction, il ne
 * rembourse rien et ne ferme pas l'accès. La période déjà réglée court
 * jusqu'à son terme — `SUBSCRIPTION_STATE_CANCELED` ouvre encore l'accès, voir
 * `ouvreLAcces`. C'est le comportement juste : les jours payés sont dus.
 *
 * Comme l'accusé de réception, cet appel passe par l'ancienne route, qui réclame
 * l'identifiant du produit ; la version 2 de l'API n'offre que `revoke`, qui
 * coupe l'accès sur le champ et peut rembourser — bien plus brutal que ce qu'on
 * veut ici.
 */
export async function resilier(jeton: string, produit: string): Promise<void> {
  const chemin =
    `/applications/${PAQUET}/purchases/subscriptions/${produit}` +
    `/tokens/${encodeURIComponent(jeton)}:cancel`
  await appeler(chemin, 'POST')
}
