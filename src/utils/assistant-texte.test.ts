/* -------------------------------------------------------------------------- */
/*  Tests de la mise en forme des réponses de l'assistant                      */
/*                                                                            */
/*    npm test                                                                 */
/*                                                                            */
/*  Le premier bloc n'est pas de la cosmétique : cette fonction produit du     */
/*  HTML inséré tel quel dans la page. Le texte qu'elle traduit vient d'un     */
/*  service tiers, qui a lui-même lu la question de l'artiste. Quelqu'un qui   */
/*  demanderait à l'assistant de répéter une balise obtiendrait, sans ces      */
/*  tests, l'exécution de cette balise dans sa propre page.                    */
/* -------------------------------------------------------------------------- */

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { enHtml } from './assistant-texte.js'

/* -------------------------------------------------------------------------- */
/*  Rien de ce qui arrive ne peut devenir une balise                           */
/* -------------------------------------------------------------------------- */

test('une balise reçue s’affiche, elle ne s’exécute pas', () => {
  const html = enHtml('Voici <script>alert(1)</script> un exemple.')
  assert.equal(html.includes('<script>'), false)
  assert.match(html, /&lt;script&gt;/)
})

test('les cinq caractères dangereux sont neutralisés', () => {
  //  Pas seulement les chevrons : une apostrophe ou un guillemet suffit à
  //  sortir d'un attribut.
  const html = enHtml(`& < > " '`)
  assert.match(html, /&amp;/)
  assert.match(html, /&lt;/)
  assert.match(html, /&gt;/)
  assert.match(html, /&quot;/)
  assert.match(html, /&#39;/)
})

test('une image piégée ne produit aucune balise', () => {
  const html = enHtml('<img src=x onerror=alert(1)>')
  //  Ce qui compte est qu'aucune balise ne naisse. Le texte « onerror=alert(1) »
  //  reste lisible à l'écran, et c'est le résultat voulu : il est affiché, pas
  //  interprété. Exiger sa disparition reviendrait à censurer un texte
  //  parfaitement inoffensif — et à faire échouer le test sur une réponse
  //  légitime qui parlerait de code.
  assert.equal(html.includes('<img'), false)
  assert.match(html, /^<p>&lt;img src=x onerror=alert\(1\)&gt;<\/p>$/)
})

/* -------------------------------------------------------------------------- */
/*  Ce qui est traduit                                                         */
/* -------------------------------------------------------------------------- */

test('chaque ligne devient un paragraphe', () => {
  assert.equal(enHtml('Première.\n\nSeconde.'), '<p>Première.</p><p>Seconde.</p>')
})

test('le gras est rendu', () => {
  assert.equal(enHtml('Attention au **taux de royalties**.'), '<p>Attention au <strong>taux de royalties</strong>.</p>')
})

test('les puces forment une liste, quelle que soit leur marque', () => {
  for (const marque of ['-', '*', '1.']) {
    const html = enHtml(`${marque} première\n${marque} seconde`)
    assert.match(html, /^<ul><li>première<\/li><li>seconde<\/li><\/ul>$/, `marque « ${marque} »`)
  }
})

test('une liste au milieu du texte garde ses voisins', () => {
  const html = enHtml('Trois points :\n- un\n- deux\nVoilà.')
  assert.equal(html, '<p>Trois points :</p><ul><li>un</li><li>deux</li></ul><p>Voilà.</p>')
})

test('du gras dans une puce est rendu aussi', () => {
  assert.match(enHtml('- le **cachet** net'), /<li>le <strong>cachet<\/strong> net<\/li>/)
})

/* -------------------------------------------------------------------------- */
/*  Les cas limites                                                            */
/* -------------------------------------------------------------------------- */

test('une réponse vide ne produit rien', () => {
  assert.equal(enHtml(''), '')
  assert.equal(enHtml('\n\n   \n'), '')
})

test('une liste qui finit la réponse est bien refermée', () => {
  //  Sans le vidage final, la dernière liste ne serait jamais écrite.
  assert.equal(enHtml('Points :\n- un'), '<p>Points :</p><ul><li>un</li></ul>')
})

test('un astérisque isolé ne casse pas le gras', () => {
  const html = enHtml('Un * seul astérisque.')
  assert.equal(html, '<p>Un * seul astérisque.</p>')
})
