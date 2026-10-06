/* -------------------------------------------------------------------------- */
/*  Tests du diagnostic des secrets Apple                                      */
/*                                                                            */
/*    cd functions && npm test                                                 */
/*                                                                            */
/*  `formeDesSecrets` ne sert qu'aux 401 d'Apple — ceux où l'on ne peut ni     */
/*  afficher les valeurs refusées, ni savoir laquelle des trois Apple rejette. */
/*  Un diagnostic qui mentirait ferait chercher au mauvais endroit, et un      */
/*  diagnostic bavard laisserait filtrer une clef privée dans un journal que   */
/*  bien d'autres peuvent lire. Les deux risques sont couverts ici.            */
/* -------------------------------------------------------------------------- */

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { formeDesSecrets } from './apple.js'

/* -------------------------------------------------------------------------- */
/*  La forme des secrets                                                       */
/*                                                                            */
/*  Ce diagnostic n'existe que pour les 401 d'Apple, où l'on ne peut ni        */
/*  afficher les valeurs ni savoir laquelle est refusée. Il doit donc dire     */
/*  juste — et surtout ne jamais laisser filtrer un secret.                    */
/* -------------------------------------------------------------------------- */

test('la forme des secrets signale ce qui est bien formé', () => {
  process.env.APPLE_ID_CLE = 'ABCD123456'
  process.env.APPLE_ID_EDITEUR = '69a6de70-1234-47e3-e053-5b8c7c11a4d1'
  process.env.APPLE_CLE = '-----BEGIN PRIVATE KEY-----\nMIGT\n-----END PRIVATE KEY-----'

  const forme = formeDesSecrets()
  assert.match(forme, /APPLE_ID_CLE : 10 car\. \(attendu 10, forme ok\)/)
  assert.match(forme, /APPLE_ID_EDITEUR : 36 car\. \(attendu 36, forme ok\)/)
  assert.match(forme, /début ok, fin ok/)
  assert.ok(!forme.includes('INATTENDU'))
})

test('la forme des secrets dénonce les blancs collés au copier-coller', () => {
  process.env.APPLE_ID_CLE = 'ABCD123456\n'
  process.env.APPLE_ID_EDITEUR = ' 69a6de70-1234-47e3-e053-5b8c7c11a4d1 '
  process.env.APPLE_CLE = '-----BEGIN PRIVATE KEY-----\nMIGT\n-----END PRIVATE KEY-----\n'

  const forme = formeDesSecrets()
  //  Les longueurs restent celles des valeurs nettoyées : c'est bien le
  //  nettoyage que l'on contrôle, pas la saisie.
  assert.match(forme, /APPLE_ID_CLE : 10 car\./)
  assert.match(forme, /APPLE_ID_EDITEUR : 36 car\./)
  assert.ok(forme.includes('contenait des blancs'))
  assert.match(forme, /début ok, fin ok/)
})

test('la forme des secrets ne laisse filtrer aucune valeur', () => {
  process.env.APPLE_ID_CLE = 'SECRETKEY1'
  process.env.APPLE_ID_EDITEUR = '69a6de70-1234-47e3-e053-5b8c7c11a4d1'
  process.env.APPLE_CLE = '-----BEGIN PRIVATE KEY-----\nTRESSECRET\n-----END PRIVATE KEY-----'

  const forme = formeDesSecrets()
  assert.ok(!forme.includes('SECRETKEY1'))
  assert.ok(!forme.includes('TRESSECRET'))
  assert.ok(!forme.includes('69a6de70'))
})

test('la forme des secrets signale une clef tronquée', () => {
  process.env.APPLE_ID_CLE = 'TROPCOURT'
  process.env.APPLE_ID_EDITEUR = 'pas-un-uuid'
  process.env.APPLE_CLE = 'MIGTAgEAMBMGByqGSM49'

  const forme = formeDesSecrets()
  assert.match(forme, /APPLE_ID_CLE : 9 car\. \(attendu 10, forme INATTENDUE\)/)
  assert.match(forme, /APPLE_ID_EDITEUR : 11 car\. \(attendu 36, forme INATTENDUE\)/)
  assert.match(forme, /début INATTENDU, fin INATTENDUE/)
})
