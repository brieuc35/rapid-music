/* -------------------------------------------------------------------------- */
/*  Tests de la lecture des liens d'action                                     */
/*                                                                            */
/*    npm test                                                                 */
/*                                                                            */
/*  Aucune dépendance : le lanceur est celui de Node. Ce qui est vérifié ici    */
/*  est ce qui peut l'être sans Firebase ni navigateur — l'extraction du code   */
/*  et le refus d'une adresse de retour étrangère. Le reste (appliquer le code, */
/*  changer un mot de passe) demande un vrai compte.                           */
/* -------------------------------------------------------------------------- */

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { lireAction, messageAction, retourSur, TITRES } from './auth-action.js'

const CODE = 'aB1_c-D2eF3'

/* -------------------------------------------------------------------------- */
/*  Des deux côtés du dièse                                                    */
/* -------------------------------------------------------------------------- */

test('lireAction : paramètres après le dièse', () => {
  const a = lireAction(`https://rapidmusic.fr/#/action?mode=verifyEmail&oobCode=${CODE}`)
  assert.equal(a.mode, 'verifyEmail')
  assert.equal(a.code, CODE)
})

test('lireAction : paramètres avant le dièse', () => {
  /*  L'autre assemblage possible. Ne regarder qu'un seul côté ferait échouer la
   *  moitié des cas, sans que rien ne dise pourquoi. */
  const a = lireAction(`https://rapidmusic.fr/?mode=resetPassword&oobCode=${CODE}#/action`)
  assert.equal(a.mode, 'resetPassword')
  assert.equal(a.code, CODE)
})

test('lireAction : si les deux côtés portent un code, celui du fragment gagne', () => {
  const a = lireAction(`https://rapidmusic.fr/?mode=verifyEmail&oobCode=AVANT#/action?mode=resetPassword&oobCode=APRES`)
  assert.equal(a.code, 'APRES')
  assert.equal(a.mode, 'resetPassword')
})

test('lireAction : un code contenant tirets et soulignés survit', () => {
  // Les codes de Firebase en contiennent : un découpage trop zélé les casserait.
  const a = lireAction(`https://rapidmusic.fr/#/action?mode=verifyEmail&oobCode=${CODE}`)
  assert.equal(a.code, CODE)
})

test("lireAction : l'adresse de retour est rendue telle qu'elle a été reçue", () => {
  const a = lireAction(
    `https://rapidmusic.fr/#/action?mode=verifyEmail&oobCode=${CODE}&continueUrl=${encodeURIComponent('https://rapidmusic.fr/')}`,
  )
  assert.equal(a.suite, 'https://rapidmusic.fr/')
})

/* -------------------------------------------------------------------------- */
/*  Ce qui manque                                                              */
/* -------------------------------------------------------------------------- */

test('lireAction : sans code, le mode est quand même rendu', () => {
  // Pour pouvoir dire « lien incomplet » plutôt que « lien inconnu ».
  const a = lireAction('https://rapidmusic.fr/#/action?mode=verifyEmail')
  assert.equal(a.mode, 'verifyEmail')
  assert.equal(a.code, null)
})

test('lireAction : une adresse sans paramètre ne rend rien', () => {
  const a = lireAction('https://rapidmusic.fr/#/action')
  assert.equal(a.mode, null)
  assert.equal(a.code, null)
})

test("lireAction : une adresse illisible ne fait pas tomber la page", () => {
  const a = lireAction('pas une adresse')
  assert.equal(a.mode, null)
  assert.equal(a.code, null)
})

/* -------------------------------------------------------------------------- */
/*  L'adresse de retour, qui vient de l'extérieur                              */
/* -------------------------------------------------------------------------- */

test('retourSur : accepte notre domaine, avec ou sans www', () => {
  assert.equal(retourSur('https://rapidmusic.fr/'), 'https://rapidmusic.fr/')
  assert.equal(retourSur('https://www.rapidmusic.fr/#/concerts'), 'https://www.rapidmusic.fr/#/concerts')
})

test('retourSur : refuse un domaine étranger', () => {
  /*  Le cas qui compte : cette adresse arrive par le lien, donc modifiable par
   *  n'importe qui. La suivre renverrait un artiste ailleurs depuis une page à
   *  nos couleurs — la forme même d'une escroquerie. */
  assert.equal(retourSur('https://rapidmusic.fr.exemple.net/'), null)
  assert.equal(retourSur('https://exemple.net/'), null)
  assert.equal(retourSur('https://notrapidmusic.fr/'), null)
})

test('retourSur : refuse ce qui n’est pas une adresse, et l’absence', () => {
  assert.equal(retourSur('javascript:alert(1)'), null)
  assert.equal(retourSur(''), null)
  assert.equal(retourSur(null), null)
})

/* -------------------------------------------------------------------------- */
/*  Les messages                                                               */
/* -------------------------------------------------------------------------- */

test('messageAction : les échecs courants disent quoi faire', () => {
  assert.match(messageAction('auth/expired-action-code'), /expiré/)
  assert.match(messageAction('auth/invalid-action-code'), /déjà été utilisé/)
  assert.match(messageAction('auth/weak-password'), /6 caractères/)
})

test('messageAction : un code inconnu reste compréhensible', () => {
  const m = messageAction('auth/quelque-chose-de-nouveau')
  assert.ok(m.length > 0)
  assert.ok(!m.includes('auth/'), 'le vocabulaire de Firebase ne doit pas fuiter à l’écran')
})

test('TITRES : les quatre opérations de Firebase ont un intitulé français', () => {
  for (const mode of ['verifyEmail', 'verifyAndChangeEmail', 'resetPassword', 'recoverEmail']) {
    assert.ok(TITRES[mode], `intitulé manquant pour ${mode}`)
    assert.ok(!/[a-z]+[A-Z]/.test(TITRES[mode]), `intitulé resté en anglais : ${TITRES[mode]}`)
  }
})
