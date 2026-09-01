/* -------------------------------------------------------------------------- */
/*  Parler à Google Play                                                       */
/*                                                                            */
/*  Deux appels, et rien d'autre : lire un achat, en accuser réception. Ce qu'on */
/*  fait de la réponse est décidé dans facturation.ts, qui ne touche pas au      */
/*  réseau et se vérifie donc par des tests.                                    */
/*                                                                            */
/*  L'identité est celle du compte de service de la fonction. Pour que Google   */
/*  lui réponde, ce compte doit être invité dans la Play Console — la marche à  */
/*  suivre est dans docs/facturation.md. Sans cette invitation, l'API répond    */
/*  401 quels que soient les droits accordés côté Google Cloud.                 */
/* -------------------------------------------------------------------------- */

import { GoogleAuth } from 'google-auth-library'
import { PRODUIT, type AchatPlay } from './facturation.js'

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
export async function accuserReception(jeton: string): Promise<void> {
  /*  Cet appel-là passe encore par l'ancienne route, qui réclame l'identifiant
   *  du produit : la version 2 de l'API n'en propose pas d'équivalent. */
  const chemin =
    `/applications/${PAQUET}/purchases/subscriptions/${PRODUIT}` +
    `/tokens/${encodeURIComponent(jeton)}:acknowledge`
  await appeler(chemin, 'POST')
}
