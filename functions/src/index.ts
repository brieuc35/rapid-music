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
  abonnementDepuisAchat,
  clefDuJeton,
  doitAccuserReception,
  JETONS,
  jetonUtilisable,
} from './facturation.js'
import { accuserReception, ErreurPlay, lireAchat } from './play.js'
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
 * Quatre restes, dont trois que le navigateur ne peut pas atteindre :
 *
 * - `courriels` — la trace des deux messages automatiques. Elle contient
 *   l'adresse e-mail, et la collection est fermée des deux côtés par les règles.
 *   C'est ce reste-là qui rendait la suppression incomplète : les données de
 *   l'artiste partaient, son adresse restait ;
 * - `jetons` — les revendications d'achat. Les laisser ne serait pas seulement
 *   incomplet, ce serait nuisible : quelqu'un qui supprime son compte puis en
 *   recrée un se verrait refuser **son propre abonnement**, revendiqué pour
 *   toujours par un compte qui n'existe plus ;
 * - `abonnements/{uid}` — `allow write: if false` interdit au navigateur de
 *   l'effacer, c'est le prix de son inviolabilité ;
 * - `artistes/{uid}` — l'application l'efface elle-même avant de supprimer le
 *   compte, et cette ligne est donc presque toujours sans effet. Presque : un
 *   compte supprimé depuis la console Firebase ne passe pas par l'application,
 *   et laisserait tout en place.
 *
 * Effacer un document qui n'existe pas ne coûte rien et ne lève rien : ils sont
 * demandés sans condition.
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
       *  n'ait que deux traces, et un lot a une taille maximale. Les deux
       *  collections sont parcourues ensemble, elles se repèrent au même champ. */
      for (const collection of [JOURNAL, JETONS]) {
        for (;;) {
          const traces = await db
            .collection(collection)
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
      }

      functions.logger.info('Restes du compte effacés', { uid, traces: efface })
    } catch (e) {
      /*  Journalisé et non relancé : un réessai automatique reprendrait un
       *  travail déjà fait, et l'échec se voit dans les journaux. Le compte,
       *  lui, est déjà supprimé — c'est l'essentiel du droit à l'effacement. */
      functions.logger.error(`Restes du compte non effacés : ${String(e)}`, { uid })
    }
  })

/* -------------------------------------------------------------------------- */
/*  4. L'abonnement acheté dans l'application Android                          */
/* -------------------------------------------------------------------------- */

/**
 * Vérifie un achat Google Play et ouvre — ou referme — l'accès payant.
 *
 * C'est le point de confiance de tout l'abonnement. Le navigateur ne peut pas
 * écrire dans `abonnements/{uid}` : les règles de sécurité le lui interdisent
 * sans exception. Il ne peut que présenter un jeton d'achat ici, et c'est cette
 * fonction — qui parle à Google avec les droits d'administration — qui tranche.
 *
 * Trois refus, dans cet ordre :
 *
 *   1. sans compte connecté, rien. Un achat s'attache à quelqu'un ;
 *   2. sans jeton, rien ;
 *   3. si le jeton a déjà été revendiqué par un autre compte, rien — voir
 *      `facturation.ts` : Google ne dit pas à qui appartient un achat, et sans
 *      cette revendication un même jeton ouvrirait autant de comptes qu'on
 *      voudrait.
 *
 * Elle sert aussi bien au premier achat qu'aux relectures : l'application la
 * rappelle à chaque lancement avec le jeton qu'elle retrouve auprès du Play
 * Store. C'est ce qui prolonge l'abonnement au renouvellement, et c'est ce qui
 * le referme après un remboursement ou une résiliation — sans quoi un abonné
 * perdrait l'accès au bout d'un mois malgré ses paiements.
 */
export const verifierAchat = functions
  .region(REGION)
  .runWith({ serviceAccount: COMPTE })
  .https.onCall(async (data, context) => {
    const uid = context.auth?.uid
    if (!uid) {
      throw new functions.https.HttpsError('unauthenticated', 'Connectez-vous pour vérifier un achat.')
    }

    const jeton = typeof data?.jeton === 'string' ? data.jeton.trim() : ''
    if (!jeton) {
      throw new functions.https.HttpsError('invalid-argument', "Le jeton d'achat manque.")
    }

    const db = getFirestore()
    const doc = db.doc(`abonnements/${uid}`)

    let achat
    try {
      achat = await lireAchat(jeton)
    } catch (e) {
      /*  Un 404 veut dire que Google ne connaît pas ce jeton : c'est un refus,
       *  pas une panne, et il ne sert à rien de le réessayer. Tout le reste —
       *  compte non invité dans la Play Console, indisponibilité — est une
       *  panne de notre côté, qu'il faut voir dans les journaux et qui mérite
       *  d'être retentée. */
      const statut = e instanceof ErreurPlay ? e.statut : 0
      functions.logger.error(`Achat illisible : ${String(e)}`, { uid, statut })
      if (statut === 404 || statut === 400) {
        throw new functions.https.HttpsError('not-found', "Cet achat est introuvable chez Google.")
      }
      throw new functions.https.HttpsError('unavailable', "La vérification a échoué, réessayez.")
    }

    /*  La revendication, dans une transaction : deux appels simultanés avec le
     *  même jeton doivent aboutir à un seul propriétaire. Une lecture suivie
     *  d'une écriture les laisserait tous les deux passer. */
    const revendication = db.doc(`${JETONS}/${clefDuJeton(jeton)}`)
    try {
      await db.runTransaction(async (t) => {
        const vu = await t.get(revendication)
        const proprietaire = vu.exists ? (vu.data()?.[CHAMP_COMPTE] as string | undefined) : undefined
        if (!jetonUtilisable(proprietaire, uid)) {
          throw new functions.https.HttpsError(
            'permission-denied',
            "Cet abonnement est déjà rattaché à un autre compte.",
          )
        }
        if (!vu.exists) {
          t.set(revendication, { [CHAMP_COMPTE]: uid, le: new Date().toISOString() })
        }
      })
    } catch (e) {
      if (e instanceof functions.https.HttpsError) {
        /*  Journalisé en avertissement : ce n'est pas une panne, mais ce n'est
         *  pas anodin non plus — c'est soit deux comptes sur un même téléphone,
         *  soit un jeton qu'on a fait circuler. Dans les deux cas on veut
         *  pouvoir le constater. */
        functions.logger.warn('Jeton déjà revendiqué par un autre compte', { uid })
        throw e
      }
      functions.logger.error(`Revendication impossible : ${String(e)}`, { uid })
      throw new functions.https.HttpsError('unavailable', "La vérification a échoué, réessayez.")
    }

    const abonnement = abonnementDepuisAchat(achat)

    if (!abonnement) {
      /*  Expiré, suspendu, remboursé, mis en pause : le document disparaît et
       *  l'accès se referme. Effacer un document absent ne coûte rien. */
      await doc.delete()
      functions.logger.info('Abonnement refermé', { uid, etat: achat.subscriptionState })
      return { pro: false }
    }

    /*  L'accusé de réception avant l'écriture : s'il échoue, mieux vaut ne pas
     *  avoir ouvert un accès que Google s'apprête à rembourser. */
    if (doitAccuserReception(achat)) {
      await accuserReception(jeton)
    }

    /*  `set` sans fusion : le document doit refléter l'état chez Google, pas
     *  s'accumuler avec ce qu'il contenait avant. Une échéance retirée par
     *  Google doit disparaître ici aussi. */
    await doc.set(abonnement)
    functions.logger.info('Abonnement ouvert', { uid, jusqua: abonnement.jusqua ?? '(sans échéance)' })
    return { pro: true, jusqua: abonnement.jusqua ?? null }
  })
