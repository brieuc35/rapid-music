/* -------------------------------------------------------------------------- */
/*  Les courriels automatiques de RapidMusic                                   */
/*                                                                            */
/*  Deux déclencheurs, et rien d'autre :                                       */
/*                                                                            */
/*    création d'un compte      → bienvenue, avec le lien de confirmation      */
/*    abonnements/{uid} → pro   → confirmation de l'abonnement Pro             */
/*                                                                            */
/*  L'envoi lui-même n'est pas fait ici : ces fonctions déposent un document    */
/*  dans la collection `mail`, que l'extension « Trigger Email from Firestore » */
/*  surveille. Deux raisons de passer par elle plutôt que d'ouvrir une          */
/*  connexion SMTP ici :                                                       */
/*                                                                            */
/*    — l'identifiant d'envoi reste dans la configuration de l'extension, et    */
/*      n'apparaît donc jamais dans ce dépôt ;                                 */
/*    — les échecs et les réessais sont écrits dans le document lui-même, ce    */
/*      qui rend un envoi manqué visible au lieu d'être perdu dans un journal.  */
/*                                                                            */
/*  La collection `mail` est fermée au navigateur (voir firestore.rules). Ce    */
/*  n'est pas un détail : elle donne le droit d'envoyer un message au nom de    */
/*  RapidMusic, à n'importe quelle adresse.                                     */
/*                                                                            */
/*  Pourquoi l'API « v1 » : le déclencheur sur la création d'un compte n'existe */
/*  qu'en v1 — la v2 ne propose que des fonctions bloquantes, qui réclament     */
/*  Identity Platform. Autant garder une seule façon d'écrire les deux.        */
/* -------------------------------------------------------------------------- */

import * as functions from 'firebase-functions/v1'
import { initializeApp } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore } from 'firebase-admin/firestore'
import { mailBienvenue, mailPro, passeAPro, type Abonnement, type Courriel } from './courriels.js'

initializeApp()

/** Région européenne : les données des artistes n'ont pas à traverser l'Atlantique. */
const REGION = 'europe-west1'

/** Collection surveillée par l'extension d'envoi. */
const FILE_ENVOI = 'mail'

/**
 * Dépose un message dans la file d'envoi.
 *
 * `to` est passé tel quel : c'est l'adresse du compte, telle que Firebase
 * l'a enregistrée.
 */
async function envoyer(to: string, courriel: Courriel): Promise<void> {
  await getFirestore()
    .collection(FILE_ENVOI)
    .add({ to, message: courriel, creeLe: new Date().toISOString() })
}

/* -------------------------------------------------------------------------- */
/*  1. Ouverture d'un compte                                                   */
/* -------------------------------------------------------------------------- */

/**
 * Accueille l'artiste et lui donne le lien de confirmation de son adresse.
 *
 * Le lien est fabriqué ici, avec les droits d'administration, plutôt que
 * demandé par le navigateur : c'est ce qui permet de n'envoyer qu'un seul
 * message au lieu de deux à la même seconde.
 *
 * La fonction n'échoue jamais bruyamment sur un compte sans adresse — une
 * connexion par un autre moyen n'en fournit pas forcément — et une erreur
 * d'envoi n'a personne à prévenir : le bandeau de l'application permet de
 * redemander le lien.
 */
export const bienvenue = functions
  .region(REGION)
  .auth.user()
  .onCreate(async (user) => {
    if (!user.email) {
      functions.logger.info('Compte sans adresse, aucun message envoyé', { uid: user.uid })
      return
    }
    try {
      const lien = await getAuth().generateEmailVerificationLink(user.email, {
        url: 'https://rapidmusic.fr/',
        handleCodeInApp: false,
      })
      await envoyer(user.email, mailBienvenue(lien))
      functions.logger.info('Message de bienvenue déposé', { uid: user.uid })
    } catch (e) {
      /*  Journalisé et non relancé : un réessai automatique renverrait le
       *  message d'accueil en double, ce qui est pire que de ne pas l'avoir. */
      functions.logger.error('Message de bienvenue impossible', { uid: user.uid, erreur: String(e) })
    }
  })

/* -------------------------------------------------------------------------- */
/*  2. Passage à l'abonnement Pro                                              */
/* -------------------------------------------------------------------------- */

/**
 * Confirme l'abonnement Pro, au moment où il devient actif.
 *
 * Le déclencheur est l'écriture dans `abonnements/{uid}` — la seule information
 * de l'application qu'un navigateur ne peut pas se donner à lui-même. C'est donc
 * le seul endroit où « cet artiste a payé » est digne de confiance, et il le
 * restera quel que soit le prestataire qui l'écrira : Stripe sur le site, Google
 * Play sur Android.
 *
 * Rien n'est réécrit dans le document : marquer l'envoi y déclencherait cette
 * même fonction, et il faudrait alors se prémunir de sa propre écriture. La
 * comparaison avant/après suffit.
 */
export const abonnementPro = functions
  .region(REGION)
  .firestore.document('abonnements/{uid}')
  .onWrite(async (change, context) => {
    const avant = (change.before.exists ? change.before.data() : null) as Abonnement | null
    const apres = (change.after.exists ? change.after.data() : null) as Abonnement | null
    if (!passeAPro(avant, apres)) return

    const { uid } = context.params
    try {
      const user = await getAuth().getUser(uid)
      if (!user.email) {
        functions.logger.info('Abonné sans adresse, aucun message envoyé', { uid })
        return
      }
      await envoyer(user.email, mailPro(apres?.depuis))
      functions.logger.info('Confirmation Pro déposée', { uid })
    } catch (e) {
      functions.logger.error('Confirmation Pro impossible', { uid, erreur: String(e) })
    }
  })
