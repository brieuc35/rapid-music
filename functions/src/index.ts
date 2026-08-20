/* -------------------------------------------------------------------------- */
/*  Les courriels automatiques de RapidMusic                                   */
/*                                                                            */
/*  Deux déclencheurs, et rien d'autre :                                       */
/*                                                                            */
/*    création d'un compte      → bienvenue, avec le lien de confirmation      */
/*    abonnements/{uid} → pro   → confirmation de l'abonnement Pro             */
/*                                                                            */
/*  L'envoi lui-même est dans envoi.ts, et le contenu dans courriels.ts. Ce     */
/*  fichier ne fait que relier les deux à ce qui les déclenche.                */
/*                                                                            */
/*  Pourquoi l'API « v1 » : le déclencheur sur la création d'un compte n'existe */
/*  qu'en v1 — la v2 ne propose que des fonctions bloquantes, qui réclament     */
/*  Identity Platform. Autant garder une seule façon d'écrire les deux.        */
/* -------------------------------------------------------------------------- */

import * as functions from 'firebase-functions/v1'
import { initializeApp } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { mailBienvenue, mailPro, passeAPro, type Abonnement } from './courriels.js'
import { envoyer, SMTP_CLE, SMTP_HOTE, SMTP_IDENTIFIANT } from './envoi.js'

initializeApp()

/** Région européenne : les données des artistes n'ont pas à traverser l'Atlantique. */
const REGION = 'europe-west1'

/*  Les trois secrets d'envoi, réclamés par les deux fonctions. Déclarés ici,
 *  ils sont lus dans Secret Manager au démarrage et exposés à la fonction —
 *  jamais écrits dans le dépôt ni dans le déploiement. */
const SECRETS = [SMTP_HOTE, SMTP_IDENTIFIANT, SMTP_CLE]

/*  L'identité sous laquelle les fonctions s'exécutent.
 *
 *  Désignée explicitement, et non laissée par défaut, pour deux raisons.
 *
 *  La première est pratique : le compte par défaut de Firebase est celui
 *  d'App Engine, que les projets récents ne créent plus. Le déploiement
 *  échouait sur son absence, et le formulaire censé le créer réclame... ce même
 *  compte.
 *
 *  La seconde vaut mieux que la première : ce compte par défaut porte le rôle
 *  d'éditeur du projet, soit bien plus que ce que deux fonctions d'envoi de
 *  courriels ont à faire. Celui-ci n'a que deux droits — lire les comptes et
 *  écrire dans Firestore — et sa création est décrite dans docs/courriels.md.
 *
 *  Le droit de lire les trois secrets lui est donné par le déploiement, il n'y
 *  a rien à régler pour cela. */
const COMPTE = 'courriels@rapidmusic-db075.iam.gserviceaccount.com'

/** Réglages communs aux deux fonctions. */
const REGLAGES = { secrets: SECRETS, serviceAccount: COMPTE }

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
 * L'erreur est journalisée et non relancée : un réessai automatique renverrait
 * le message d'accueil en double, ce qui est pire que de ne pas l'avoir. Le
 * bandeau de l'application permet de redemander le lien.
 */
export const bienvenue = functions
  .region(REGION)
  .runWith(REGLAGES)
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
      await envoyer(user.email, mailBienvenue(lien), { type: 'bienvenue', uid: user.uid })
      functions.logger.info('Message de bienvenue envoyé', { uid: user.uid })
    } catch (e) {
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
  .runWith(REGLAGES)
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
      await envoyer(user.email, mailPro(apres?.depuis), { type: 'pro', uid })
      functions.logger.info('Confirmation Pro envoyée', { uid })
    } catch (e) {
      functions.logger.error('Confirmation Pro impossible', { uid, erreur: String(e) })
    }
  })
