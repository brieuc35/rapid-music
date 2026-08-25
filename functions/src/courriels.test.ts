/* -------------------------------------------------------------------------- */
/*  Tests de la logique des courriels                                          */
/*                                                                            */
/*    cd functions && npm test                                                 */
/*                                                                            */
/*  Aucune dépendance : le lanceur de tests est celui de Node. Ce qui est       */
/*  vérifié ici est exactement ce qui peut l'être hors de Firebase — la         */
/*  décision d'envoyer, et le contenu produit. L'envoi lui-même, les            */
/*  déclencheurs et l'extension ne peuvent l'être qu'une fois déployés.         */
/* -------------------------------------------------------------------------- */

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { CID_LOGO, echapper, enFrancais, estPro, formaterDate, mailBienvenue, mailPro, passeAPro } from './courriels.js'

/* -------------------------------------------------------------------------- */
/*  Quand faut-il annoncer l'abonnement Pro ?                                  */
/* -------------------------------------------------------------------------- */

test('annonce Pro : au passage de libre à pro', () => {
  assert.equal(passeAPro({ plan: 'free' }, { plan: 'pro' }), true)
})

test('annonce Pro : à la création directe du document en pro', () => {
  assert.equal(passeAPro(null, { plan: 'pro' }), true)
})

test("annonce Pro : pas deux fois si le document est réécrit en restant pro", () => {
  // Le cas qui compte : un déclencheur Firestore se réveille à chaque écriture.
  assert.equal(passeAPro({ plan: 'pro' }, { plan: 'pro' }), false)
  assert.equal(
    passeAPro({ plan: 'pro', depuis: '2026-01-01' }, { plan: 'pro', depuis: '2026-01-01', jusqua: '2027-01-01' }),
    false,
  )
})

test('annonce Pro : rien à la résiliation ni à la suppression', () => {
  assert.equal(passeAPro({ plan: 'pro' }, { plan: 'free' }), false)
  assert.equal(passeAPro({ plan: 'pro' }, null), false)
})

test('annonce Pro : rien pour un plan inconnu ou un document vide', () => {
  assert.equal(passeAPro(null, { plan: 'premium' }), false)
  assert.equal(passeAPro(null, {}), false)
  assert.equal(passeAPro(null, null), false)
})

test("annonce Pro : rien si l'échéance est déjà dépassée", () => {
  // Un document écrit en pro mais périmé ne doit pas déclencher de félicitations.
  const hier = new Date(Date.now() - 86400000).toISOString().slice(0, 10)
  assert.equal(passeAPro(null, { plan: 'pro', jusqua: hier }), false)
})

test('annonce Pro : le renouvellement d\'un abonnement périmé annonce à nouveau', () => {
  const hier = new Date(Date.now() - 86400000).toISOString().slice(0, 10)
  const demain = new Date(Date.now() + 86400000).toISOString().slice(0, 10)
  assert.equal(passeAPro({ plan: 'pro', jusqua: hier }, { plan: 'pro', jusqua: demain }), true)
})

/* -------------------------------------------------------------------------- */
/*  La règle « est-il abonné ? » doit dire la même chose que le navigateur      */
/* -------------------------------------------------------------------------- */

test('estPro : mêmes réponses que subscriptionActive du navigateur', () => {
  const jour = '2026-06-15'
  assert.equal(estPro({ plan: 'pro' }, jour), true)
  assert.equal(estPro({ plan: 'free' }, jour), false)
  assert.equal(estPro(null, jour), false)
  assert.equal(estPro({}, jour), false)
  // Une échéance au jour même reste valable ; la veille ne l'est plus.
  assert.equal(estPro({ plan: 'pro', jusqua: '2026-06-15' }, jour), true)
  assert.equal(estPro({ plan: 'pro', jusqua: '2026-06-14' }, jour), false)
})

/* -------------------------------------------------------------------------- */
/*  Échappement                                                                */
/* -------------------------------------------------------------------------- */

test('echapper : neutralise ce qui casserait le HTML', () => {
  assert.equal(echapper('<script>'), '&lt;script&gt;')
  assert.equal(echapper('a&b'), 'a&amp;b')
  assert.equal(echapper(`"guillemets" et 'apostrophe'`), '&quot;guillemets&quot; et &#39;apostrophe&#39;')
})

test("echapper : l'esperluette est traitée en premier, sans double échappement", () => {
  // Si « & » passait après « < », le résultat serait « &amp;lt; » et le lecteur
  // verrait le code au lieu du signe.
  assert.equal(echapper('<'), '&lt;')
  assert.equal(echapper('&lt;'), '&amp;lt;')
})

/* -------------------------------------------------------------------------- */
/*  Contenu des messages                                                       */
/* -------------------------------------------------------------------------- */

const LIEN = 'https://rapidmusic-db075.firebaseapp.com/__/auth/action?mode=verifyEmail&oobCode=ABC123'

test('bienvenue : le lien de confirmation est présent, en HTML et en texte', () => {
  const m = mailBienvenue(LIEN)
  /*  Dans le HTML le lien est échappé — c'est ce qu'exige un attribut « href »,
   *  et le navigateur le rétablit à la lecture. En version texte il est brut,
   *  puisqu'il doit pouvoir être recopié tel quel. */
  assert.ok(m.html.includes(echapper(LIEN)), 'lien absent du HTML')
  assert.ok(m.text.includes(LIEN), 'lien absent de la version texte')
})

test('bienvenue : un lien contenant une esperluette reste cliquable', () => {
  // Le lien de Firebase en contient toujours : mal échappé, il coupe l'attribut
  // href et le bouton mène ailleurs.
  const m = mailBienvenue(LIEN)
  assert.ok(m.html.includes('oobCode=ABC123'), 'la fin du lien a été perdue')
  assert.ok(m.html.includes('&amp;oobCode'), "l'esperluette du lien n'est pas échappée")
  assert.ok(!m.html.includes('"&oobCode'), 'esperluette brute dans un attribut')
})

/* -------------------------------------------------------------------------- */
/*  La langue de la page d'atterrissage                                        */
/* -------------------------------------------------------------------------- */

test('enFrancais : ajoute la langue à un lien qui a déjà des paramètres', () => {
  assert.equal(enFrancais('https://x.fr/action?mode=verifyEmail&oobCode=A'), 'https://x.fr/action?mode=verifyEmail&oobCode=A&lang=fr')
})

test('enFrancais : ajoute la langue à un lien sans paramètre', () => {
  assert.equal(enFrancais('https://x.fr/action'), 'https://x.fr/action?lang=fr')
})

test('enFrancais : ne double pas une langue déjà présente', () => {
  const deja = 'https://x.fr/action?oobCode=A&lang=fr'
  assert.equal(enFrancais(deja), deja)
  assert.equal(enFrancais('https://x.fr/action?lang=en'), 'https://x.fr/action?lang=en')
})

test("enFrancais : ne touche à rien d'autre dans le lien", () => {
  /*  Le code à usage unique et l'adresse de retour sont encodés : les
   *  ré-encoder les casserait. On vérifie que le lien d'origine ressort
   *  intact, préfixe compris. */
  const lien = 'https://x.fr/action?mode=verifyEmail&oobCode=aB1%2Fc&continueUrl=https%3A%2F%2Frapidmusic.fr%2F'
  const sortie = enFrancais(lien)
  assert.ok(sortie.startsWith(lien), 'le lien a été modifié')
  assert.ok(sortie.includes('oobCode=aB1%2Fc'), 'le code a été ré-encodé')
  assert.ok(sortie.includes('continueUrl=https%3A%2F%2Frapidmusic.fr%2F'), "l'adresse de retour a été ré-encodée")
})

test('enFrancais : un lien vide ressort vide', () => {
  assert.equal(enFrancais(''), '')
})

test('bienvenue : le lien du message porte la langue française', () => {
  // Sans elle, la page qui suit le bouton s'affiche en anglais.
  const m = mailBienvenue(LIEN)
  assert.ok(m.text.includes('lang=fr'), 'langue absente de la version texte')
  assert.ok(m.html.includes('lang=fr') || m.html.includes('lang%3Dfr'), 'langue absente du HTML')
})

/* -------------------------------------------------------------------------- */
/*  Bienvenue sans lien : Firebase refuse d'en fabriquer au-delà d'un certain   */
/*  nombre. Le message doit partir quand même — c'est le chemin qu'on ne        */
/*  regarde jamais, et c'est celui qui a servi en premier.                      */
/* -------------------------------------------------------------------------- */

test('bienvenue sans lien : le message existe et reste utile', () => {
  const m = mailBienvenue(null)
  assert.ok(m.html.length > 0 && m.text.length > 0)
  assert.match(m.html, /Votre compte est ouvert/)
  // La liste « Pour démarrer » reste : c'est l'essentiel de l'accueil.
  assert.match(m.html, /premier concert/)
  assert.match(m.text, /premier concert/)
})

test('bienvenue sans lien : aucun bouton ni lien mort', () => {
  const m = mailBienvenue(null)
  assert.ok(!m.html.includes('Confirmer mon adresse'), 'bouton présent sans lien derrière')
  assert.ok(!/href="cid|href=""/.test(m.html), 'lien vide dans le message')
  assert.ok(!m.html.includes('null') && !m.text.includes('null'), '« null » visible dans le message')
})

test("bienvenue sans lien : l'objet ne promet pas une confirmation absente", () => {
  // Promettre au-dessus ce que le corps ne porte pas fait chercher un bouton
  // qui n'existe pas.
  assert.equal(mailBienvenue(null).subject, 'Bienvenue sur RapidMusic')
  assert.match(mailBienvenue(LIEN).subject, /confirmez/i)
})

test('bienvenue sans lien : le message dit où retrouver la confirmation', () => {
  const m = mailBienvenue(null)
  assert.match(m.html, /bandeau/)
  assert.match(m.text, /bandeau/)
})

test('bienvenue : objet et corps parlent de confirmation et de bienvenue', () => {
  const m = mailBienvenue(LIEN)
  assert.match(m.subject, /Bienvenue/)
  assert.match(m.subject, /confirmez/i)
  assert.match(m.html, /Confirmer mon adresse/)
})

test('Pro : annonce l\'abonnement actif, et renvoie le reçu au prestataire', () => {
  const m = mailPro('2026-08-19')
  assert.match(m.subject, /Pro/)
  assert.match(m.html, /19 août 2026/)
  assert.match(m.html, /reçu/i)
  assert.match(m.text, /19 août 2026/)
})

test('Pro : sans date, la phrase reste correcte', () => {
  const m = mailPro(undefined)
  assert.ok(!m.html.includes('undefined'), '« undefined » visible dans le message')
  assert.ok(!m.html.includes('depuis le '), 'phrase de date laissée en suspens')
  assert.match(m.html, /abonnement Pro est en cours\./)
})

test('Pro : une date illisible ne produit pas « Invalid Date »', () => {
  const m = mailPro('pas-une-date')
  assert.ok(!m.html.includes('Invalid Date'))
  assert.match(m.html, /pas-une-date/)
})

test('formaterDate : jour, mois en français, année', () => {
  assert.equal(formaterDate('2026-01-03'), '3 janvier 2026')
  assert.equal(formaterDate('2026-12-25'), '25 décembre 2026')
})

/* -------------------------------------------------------------------------- */
/*  Contraintes communes aux deux messages                                     */
/* -------------------------------------------------------------------------- */

for (const [nom, courriel] of [
  ['bienvenue', mailBienvenue(LIEN)],
  ['Pro', mailPro('2026-08-19')],
] as const) {
  test(`${nom} : les trois champs attendus sont remplis`, () => {
    assert.equal(typeof courriel.subject, 'string')
    assert.ok(courriel.subject.length > 0 && courriel.subject.length < 90)
    assert.ok(courriel.html.length > 0)
    assert.ok(courriel.text.length > 0)
  })

  test(`${nom} : aucune feuille de style ni image chargée de l'extérieur`, () => {
    /*  Les messageries suppriment le `<style>` et bloquent par défaut les images
     *  qu'il faut aller chercher sur un serveur. Une image embarquée dans le
     *  message — désignée par « cid: » — n'est pas concernée : c'est justement
     *  la parade, et elle est vérifiée par le test suivant. */
    assert.ok(!/<style/i.test(courriel.html), 'balise <style> présente')
    assert.ok(!/src\s*=\s*["']https?:/i.test(courriel.html), 'image chargée depuis un serveur')
    assert.ok(!/<link/i.test(courriel.html), 'balise <link> présente')
  })

  test(`${nom} : le logo embarqué est désigné dans l'en-tête`, () => {
    /*  `envoi.ts` joint le logo à tous les messages, sans condition. Ce test
     *  garde l'autre moitié de l'accord : si l'enveloppe cessait de le
     *  désigner, chaque message partirait avec une pièce jointe orpheline, que
     *  certaines messageries afficheraient comme un fichier reçu. */
    assert.ok(courriel.html.includes(`cid:${CID_LOGO}`), 'le logo embarqué n’est pas désigné')
  })

  test(`${nom} : une image embarquée porte un texte de remplacement`, () => {
    // Bloquée ou non chargée, elle ne doit pas laisser un nom de fichier à l'écran.
    for (const balise of courriel.html.match(/<img[^>]*>/gi) ?? []) {
      assert.match(balise, /alt=/, 'image sans attribut alt')
    }
  })

  test(`${nom} : les liens légaux obligatoires sont présents`, () => {
    assert.ok(courriel.html.includes('/#/confidentialite'))
    assert.ok(courriel.html.includes('/#/conditions'))
  })

  test(`${nom} : la version texte ne contient pas de HTML`, () => {
    // Elle est lue telle quelle par les clients en mode texte.
    assert.ok(!/<[a-z/]/i.test(courriel.text), 'balises dans la version texte')
  })
}
