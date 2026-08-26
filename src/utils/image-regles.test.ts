/* -------------------------------------------------------------------------- */
/*  Tests de ce qu'on accepte comme photo de profil                            */
/*                                                                            */
/*    npm test                                                                 */
/*                                                                            */
/*  Aucune dépendance : le lanceur est celui de Node. Ces règles-là sont       */
/*  vérifiables sans navigateur, et c'est précisément elles qui refusaient des */
/*  photos valables — le redimensionnement, lui, demande un vrai navigateur et */
/*  se vérifie à l'écran.                                                      */
/* -------------------------------------------------------------------------- */

import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  MAX_INPUT_BYTES,
  estHeic,
  messageEchecDecodage,
  refuserFichier,
} from './image-regles.js'

const PETIT = 200 * 1024

/* -------------------------------------------------------------------------- */
/*  Les types que renvoient les sélecteurs de fichiers                         */
/* -------------------------------------------------------------------------- */

test('une image annoncée comme telle passe', () => {
  assert.equal(refuserFichier('image/jpeg', PETIT), null)
  assert.equal(refuserFichier('image/png', PETIT), null)
  assert.equal(refuserFichier('image/webp', PETIT), null)
})

test('un fichier sans type annoncé passe', () => {
  /*  Le sélecteur de fichiers d'Android ne connaît pas toujours le type de ce
   *  qu'il renvoie. Sans cette tolérance, une photo parfaitement valable était
   *  refusée avant même d'être ouverte. */
  assert.equal(refuserFichier('', PETIT), null)
})

test('un type générique passe : c’est l’étiquette qui manque, pas l’image', () => {
  assert.equal(refuserFichier('application/octet-stream', PETIT), null)
  assert.equal(refuserFichier('binary/octet-stream', PETIT), null)
  assert.equal(refuserFichier('content/unknown', PETIT), null)
})

test('la casse et les espaces ne changent rien', () => {
  assert.equal(refuserFichier('  IMAGE/JPEG  ', PETIT), null)
  assert.equal(refuserFichier('  Application/Octet-Stream ', PETIT), null)
})

test('ce qui est manifestement autre chose est refusé', () => {
  for (const type of ['application/pdf', 'text/plain', 'video/mp4', 'audio/mpeg']) {
    assert.equal(
      refuserFichier(type, PETIT),
      "Ce fichier n'est pas une image.",
      `${type} aurait dû être refusé`,
    )
  }
})

/* -------------------------------------------------------------------------- */
/*  Le poids                                                                   */
/* -------------------------------------------------------------------------- */

test('une photo de téléphone ordinaire passe', () => {
  //  Douze mégapixels, qualité haute : le cas courant, qui était refusé quand
  //  le plafond était à 10 Mo.
  assert.equal(refuserFichier('image/jpeg', 12 * 1024 * 1024), null)
})

test('au-delà du plafond, le refus dit quoi faire', () => {
  const m = refuserFichier('image/jpeg', MAX_INPUT_BYTES + 1)
  assert.ok(m, 'un fichier au-dessus du plafond doit être refusé')
  assert.match(m, /25 Mo/)
  assert.match(m, /capture d'écran/)
})

test('exactement au plafond, ça passe encore', () => {
  assert.equal(refuserFichier('image/jpeg', MAX_INPUT_BYTES), null)
})

test('le poids prime sur le type : une vidéo énorme parle de son poids', () => {
  //  Peu importe l'ordre choisi, mais il doit être déterminé : deux messages
  //  possibles pour un même fichier, c'est un message au hasard.
  assert.match(refuserFichier('video/mp4', MAX_INPUT_BYTES + 1) ?? '', /25 Mo/)
})

/* -------------------------------------------------------------------------- */
/*  Le message quand l'image ne s'ouvre pas                                    */
/* -------------------------------------------------------------------------- */

test('estHeic reconnaît les photos des appareils récents', () => {
  assert.equal(estHeic('IMG_0042.HEIC'), true)
  assert.equal(estHeic('photo.heif'), true)
  assert.equal(estHeic('  photo.heic  '), true)
  assert.equal(estHeic('photo.jpg'), false)
  assert.equal(estHeic('heic.jpg'), false)
})

test('un échec sur du HEIC nomme le format et donne la sortie', () => {
  const m = messageEchecDecodage('20260826_173300.HEIC')
  assert.match(m, /HEIC/)
  assert.match(m, /JPEG/)
})

test('un échec sur autre chose reste utile', () => {
  const m = messageEchecDecodage('photo.jpg')
  assert.doesNotMatch(m, /HEIC/)
  assert.match(m, /capture d'écran/)
})
