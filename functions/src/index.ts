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
import { getFirestore } from 'firebase-admin/firestore'
import { mailBienvenue, mailPro, passeAPro, type Abonnement } from './courriels.js'
import {
  CHAMP_COMPTE,
  envoyer,
  JOURNAL,
  SMTP_CLE,
  SMTP_HOTE,
  SMTP_IDENTIFIANT,
  sujetTrace,
} from './envoi.js'

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
    /*  Le lien est demandé à part, et son échec n'emporte pas le message.
     *
     *  Firebase limite le nombre de liens qu'on peut lui demander et refuse
     *  au-delà — « TOO_MANY_ATTEMPTS_TRY_LATER », rencontré dès les premiers
     *  essais. Dans le montage précédent, un refus ici supprimait l'accueil tout
     *  entier : l'artiste n'avait plus rien, alors que le message avait tout à
     *  dire sans le lien. Le bandeau de l'application sait le redemander. */
    let lien: string | null = null
    try {
      lien = await getAuth().generateEmailVerificationLink(user.email, {
        url: 'https://rapidmusic.fr/',
        handleCodeInApp: false,
      })
    } catch (e) {
      functions.logger.warn(`Lien de confirmation indisponible, message envoyé sans lui : ${String(e)}`, {
        uid: user.uid,
      })
    }

    try {
      await envoyer(user.email, mailBienvenue(lien), sujetTrace('bienvenue', user.uid))
      functions.logger.info('Message de bienvenue envoyé', { uid: user.uid, avecLien: lien !== null })
    } catch (e) {
      /*  La raison va dans le message et non dans un champ à côté : le panneau
       *  « Erreurs » de la console n'affiche que le message, et une erreur qui
       *  ne dit pas sa cause oblige à retrouver la ligne complète ailleurs. */
      functions.logger.error(`Message de bienvenue impossible : ${String(e)}`, { uid: user.uid })
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
      await envoyer(user.email, mailPro(apres?.depuis), sujetTrace('pro', uid))
      functions.logger.info('Confirmation Pro envoyée', { uid })
    } catch (e) {
      functions.logger.error(`Confirmation Pro impossible : ${String(e)}`, { uid })
    }
  })

/* -------------------------------------------------------------------------- */
/*  3. Suppression d'un compte                                                 */
/* -------------------------------------------------------------------------- */

/*  Nombre de traces effacées par tour. Un lot Firestore accepte 500 écritures ;
 *  on reste en dessous pour laisser la place aux deux documents joints au
 *  premier tour. Un compte ordinaire n'a que deux traces — cette boucle ne sert
 *  qu'aux comptes dont un envoi a échoué et été réessayé plusieurs fois. */
const PAR_TOUR = 400

/**
 * Efface ce que la suppression du compte laisse derrière elle.
 *
 * Trois restes, dont deux que le navigateur ne peut pas atteindre :
 *
 * - `courriels` — la trace des deux messages automatiques. Elle contient
 *   l'adresse e-mail, et la collection est fermée des deux côtés par les règles.
 *   C'est ce reste-là qui rendait la suppression incomplète : les données de
 *   l'artiste partaient, son adresse restait ;
 * - `abonnements/{uid}` — `allow write: if false` interdit au navigateur de
 *   l'effacer, c'est le prix de son inviolabilité ;
 * - `artistes/{uid}` — l'application l'efface elle-même avant de supprimer le
 *   compte, et cette ligne est donc presque toujours sans effet. Presque : un
 *   compte supprimé depuis la console Firebase ne passe pas par l'application,
 *   et laisserait tout en place.
 *
 * Effacer un document qui n'existe pas ne coûte rien et ne lève rien : les
 * trois sont demandés sans condition.
 *
 * Aucun secret n'est réclamé ici — cette fonction n'envoie rien.
 */
export const oubli = functions
  .region(REGION)
  .runWith({ serviceAccount: COMPTE })
  .auth.user()
  .onDelete(async (user) => {
    const { uid } = user
    const db = getFirestore()

    try {
      let efface = 0
      let premier = true

      /*  Boucle plutôt qu'une seule requête : rien ne garantit qu'un compte
       *  n'ait que deux traces, et un lot a une taille maximale. */
      for (;;) {
        const traces = await db
          .collection(JOURNAL)
          .where(CHAMP_COMPTE, '==', uid)
          .limit(PAR_TOUR)
          .get()

        if (traces.empty && !premier) break

        const lot = db.batch()
        if (premier) {
          lot.delete(db.doc(`artistes/${uid}`))
          lot.delete(db.doc(`abonnements/${uid}`))
          premier = false
        }
        traces.forEach((t) => lot.delete(t.ref))
        await lot.commit()
        efface += traces.size

        if (traces.size < PAR_TOUR) break
      }

      functions.logger.info('Restes du compte effacés', { uid, traces: efface })
    } catch (e) {
      /*  Journalisé et non relancé : un réessai automatique reprendrait un
       *  travail déjà fait, et l'échec se voit dans les journaux. Le compte,
       *  lui, est déjà supprimé — c'est l'essentiel du droit à l'effacement. */
      functions.logger.error(`Restes du compte non effacés : ${String(e)}`, { uid })
    }
  })
