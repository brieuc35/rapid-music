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
import { getAuth } from 'firebase/auth'
/*  Version allégée de Firestore : lectures et écritures ponctuelles, sans
 *  écoute temps réel ni cache géré par le SDK. C'est exactement ce que fait
 *  cette application — un document lu à l'ouverture, réécrit à chaque
 *  modification — et cela divise par plus de deux le poids du téléchargement.
 *  La consultation hors connexion est assurée par notre propre copie locale
 *  (voir store/sync.ts). */
import { getFirestore } from 'firebase/firestore/lite'

const app = initializeApp({
  apiKey: 'AIzaSyBqMB4pMtmLF1krzhmETlf3pbjrb93uAjk',
  authDomain: 'rapidmusic-db075.firebaseapp.com',
  projectId: 'rapidmusic-db075',
  storageBucket: 'rapidmusic-db075.firebasestorage.app',
  messagingSenderId: '1084456617285',
  appId: '1:1084456617285:web:051814589d2454e4362a2c',
})

export const auth = getAuth(app)

export const db = getFirestore(app)

/*  Analytics est délibérément absent. En France, la mesure d'audience Google
 *  relève du consentement : l'activer imposerait un bandeau de cookies et une
 *  mention dans la politique de confidentialité. Elle alourdirait aussi le
 *  chargement sans rien apporter à l'artiste. À réintroduire, si besoin, avec
 *  le consentement qui va avec — pas avant. */
