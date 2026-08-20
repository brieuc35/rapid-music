/* -------------------------------------------------------------------------- */
/*  Tests des réglages de connexion au service d'envoi                         */
/*                                                                            */
/*  L'envoi lui-même ne peut pas être vérifié ici — il lui faut un serveur      */
/*  SMTP. Ce qui est vérifiable, et qui casse en silence, c'est la traduction   */
/*  des secrets en réglages : un port mal lu ou un chiffrement mal choisi ne    */
/*  produit pas d'erreur, il produit une connexion qui reste suspendue.        */
/* -------------------------------------------------------------------------- */

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { optionsSmtp } from './envoi.js'

test('sans port : 465, chiffré d’emblée', () => {
  const o = optionsSmtp('smtp-relay.brevo.com', 'moi', 'secret')
  assert.equal(o.host, 'smtp-relay.brevo.com')
  assert.equal(o.port, 465)
  assert.equal(o.secure, true)
})

test('port 465 explicite : chiffré d’emblée', () => {
  const o = optionsSmtp('smtp-relay.brevo.com:465', 'moi', 'secret')
  assert.equal(o.port, 465)
  assert.equal(o.secure, true)
})

test('port 587 : chiffrement négocié, surtout pas « secure »', () => {
  // Le cas qui pend sans message d'erreur si on se trompe.
  const o = optionsSmtp('smtp-relay.brevo.com:587', 'moi', 'secret')
  assert.equal(o.host, 'smtp-relay.brevo.com')
  assert.equal(o.port, 587)
  assert.equal(o.secure, false)
})

test('port 2525 : traité comme 587', () => {
  const o = optionsSmtp('smtp.exemple.fr:2525', 'moi', 'secret')
  assert.equal(o.port, 2525)
  assert.equal(o.secure, false)
})

test("l'identifiant et la clé sont transmis tels quels", () => {
  // Une clé SMTP peut contenir n'importe quoi : rien ne doit la transformer.
  const o = optionsSmtp('smtp.exemple.fr', 'utilisateur@exemple.fr', 'xsmtp:sib/@=+')
  assert.equal(o.auth.user, 'utilisateur@exemple.fr')
  assert.equal(o.auth.pass, 'xsmtp:sib/@=+')
})

test('un secret manquant donne un message qui nomme les trois secrets', () => {
  const cas: [string, string, string][] = [
    ['', 'moi', 'secret'],
    ['hote', '', 'secret'],
    ['hote', 'moi', ''],
  ]
  for (const [hote, identifiant, cle] of cas) {
    assert.throws(() => optionsSmtp(hote, identifiant, cle), /SMTP_HOTE.*SMTP_IDENTIFIANT.*SMTP_CLE/s)
  }
})

test('un retour à la ligne collé au bout d’un secret ne casse rien', () => {
  // Le copier-coller depuis un gestionnaire de mots de passe en ajoute souvent
  // un. Il ne se voit sur aucun écran, et provoquerait un refus muet.
  const o = optionsSmtp('  smtp-relay.brevo.com\n', 'b60cc1001@smtp-brevo.com\n', ' xsmtpsib-abc \n')
  assert.equal(o.host, 'smtp-relay.brevo.com')
  assert.equal(o.port, 465)
  assert.equal(o.auth.user, 'b60cc1001@smtp-brevo.com')
  assert.equal(o.auth.pass, 'xsmtpsib-abc')
})

test('un port survit aussi aux blancs autour de l’hôte', () => {
  const o = optionsSmtp(' smtp-relay.brevo.com:587 \n', 'moi', 'secret')
  assert.equal(o.host, 'smtp-relay.brevo.com')
  assert.equal(o.port, 587)
  assert.equal(o.secure, false)
})

test('un secret ne contenant que des blancs vaut absent', () => {
  assert.throws(() => optionsSmtp('  \n ', 'moi', 'secret'), /SMTP_HOTE/)
  assert.throws(() => optionsSmtp('hote', '   ', 'secret'), /SMTP_IDENTIFIANT/)
  assert.throws(() => optionsSmtp('hote', 'moi', '\n'), /SMTP_CLE/)
})

test('un port illisible est refusé, plutôt que traité comme 465', () => {
  // Sans ce contrôle, « hote:abc » donnait un port NaN et une panne obscure.
  assert.throws(() => optionsSmtp('smtp.exemple.fr:abc', 'moi', 'secret'), /Port SMTP invalide/)
  assert.throws(() => optionsSmtp('smtp.exemple.fr:0', 'moi', 'secret'), /Port SMTP invalide/)
  assert.throws(() => optionsSmtp('smtp.exemple.fr:99999', 'moi', 'secret'), /Port SMTP invalide/)
})
