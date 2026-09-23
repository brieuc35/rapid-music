/* -------------------------------------------------------------------------- */
/*  Connexion au projet Firebase                                              */
/*                                                                            */
/*  Ces valeurs identifient le projet ; elles ne donnent aucun droit et sont   */
/*  publiques par conception — elles se retrouvent de toute façon dans les     */
/*  fichiers compilés du site. Ce qui protège les données, ce sont les règles  */
/*  de sécurité (voir firestore.rules), pas la dissimulation de ces clés.      */
/*                                                                            */
/*  À ne jamais confondre avec une clé de compte de service                    */
/*  (« serviceAccountKey.json ») : celle-là contourne les règles et n'a rien   */
/*  à faire dans une application chargée par un navigateur.                   */
/* -------------------------------------------------------------------------- */

import { initializeApp } from 'firebase/app'
import {
  browserLocalPersistence,
  indexedDBLocalPersistence,
  initializeAuth,
} from 'firebase/auth'
/*  Version allégée de Firestore : lectures et écritures ponctuelles, sans
 *  écoute temps réel ni cache géré par le SDK. C'est exactement ce que fait
 *  cette application — un document lu à l'ouverture, réécrit à chaque
 *  modification — et cela divise par plus de deux le poids du téléchargement.
 *  La consultation hors connexion est assurée par notre propre copie locale
 *  (voir store/sync.ts). */
import { getFirestore } from 'firebase/firestore/lite'
import { getFunctions } from 'firebase/functions'

const app = initializeApp({
  apiKey: 'AIzaSyBqMB4pMtmLF1krzhmETlf3pbjrb93uAjk',
  authDomain: 'rapidmusic-db075.firebaseapp.com',
  projectId: 'rapidmusic-db075',
  storageBucket: 'rapidmusic-db075.firebasestorage.app',
  messagingSenderId: '1084456617285',
  appId: '1:1084456617285:web:051814589d2454e4362a2c',
})

/*  `initializeAuth` et non `getAuth`, et ce n'est pas un détail de style :
 *  c'est ce qui empêchait l'application iPhone de démarrer.
 *
 *  `getAuth` est un raccourci qui choisit tout seul, et qui choisit pour un
 *  navigateur. Il installe notamment le « popup redirect resolver », la pièce
 *  qui sert à se connecter par Google ou Facebook dans une fenêtre surgissante.
 *  Celle-ci va chercher une page chez `authDomain`, sur `https://`.
 *
 *  Dans l'enveloppe de l'App Store, la page n'est pas servie en `https://` mais
 *  sous le schéma `capacitor://` : ce chargement n'aboutit jamais, et rien ne
 *  le signale. `onAuthStateChanged` n'est alors jamais appelé — ni avec un
 *  artiste, ni avec `null`. Or c'est lui qui lève `authReady`. L'application
 *  restait donc sur son écran d'attente, indéfiniment, sans planter : aucune
 *  trace dans les rapports de panne, puisqu'il n'y avait pas de panne.
 *
 *  `initializeAuth` demande de nommer ce qu'on veut, et rien de plus. Sans
 *  résolveur, car cette application n'ouvre aucune fenêtre surgissante : elle
 *  ne connaît que l'adresse et le mot de passe. La liste de persistances est
 *  celle que `getAuth` aurait retenue, essayée dans l'ordre — IndexedDB
 *  d'abord, `localStorage` s'il est indisponible, ce qui arrive en navigation
 *  privée.
 *
 *  Rien ne change pour le site : c'est le même stockage, et la session s'y
 *  rétablit comme avant. */
export const auth = initializeAuth(app, {
  persistence: [indexedDBLocalPersistence, browserLocalPersistence],
})

/*  Langue des messages envoyés par Firebase — confirmation d'adresse,
 *  réinitialisation de mot de passe. Sans ce réglage ils partent en anglais,
 *  quelle que soit la langue de l'application.
 *
 *  C'est ici que ça se décide, et non dans les modèles de la console : ceux-ci
 *  ne permettent de retoucher qu'un seul texte à la fois, alors que Firebase
 *  possède déjà ses propres traductions. Fixée à « fr » plutôt que déduite du
 *  navigateur : l'application est en français, ses e-mails aussi. */
auth.languageCode = 'fr'

export const db = getFirestore(app)

/*  Analytics est délibérément absent. En France, la mesure d'audience Google
 *  relève du consentement : l'activer imposerait un bandeau de cookies et une
 *  mention dans la politique de confidentialité. Elle alourdirait aussi le
 *  chargement sans rien apporter à l'artiste. À réintroduire, si besoin, avec
 *  le consentement qui va avec — pas avant. */

/*  Les fonctions serveur, dans la même région qu'elles : sans ce second
 *  argument le SDK appelle « us-central1 », qui ne les héberge pas, et
 *  l'appel échoue en 404 sans dire pourquoi. */
export const functions = getFunctions(app, 'europe-west1')
