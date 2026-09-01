/* -------------------------------------------------------------------------- */
/*  Tests de la lecture d'un achat Play                                        */
/*                                                                            */
/*    cd functions && npm test                                                 */
/*                                                                            */
/*  Aucune dépendance : le lanceur est celui de Node.                          */
/*                                                                            */
/*  Ces cas-là sont la raison d'être du module. Un paiement en échec, une mise  */
/*  en pause, un remboursement : on ne sait pas les provoquer à la demande sur  */
/*  un vrai compte, et les découvrir en production reviendrait à les découvrir  */
/*  sur un abonné payant.                                                      */
/* -------------------------------------------------------------------------- */

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { estPro } from './courriels.js'
import {
  abonnementDepuisAchat,
  clefDuJeton,
  doitAccuserReception,
  jetonUtilisable,
  ouvreLAcces,
  PRODUIT,
  type AchatPlay,
} from './facturation.js'

/** Un achat actif ordinaire, que chaque test déforme à sa guise. */
function achat(modif: Partial<AchatPlay> = {}): AchatPlay {
  return {
    subscriptionState: 'SUBSCRIPTION_STATE_ACTIVE',
    acknowledgementState: 'ACKNOWLEDGEMENT_STATE_ACKNOWLEDGED',
    startTime: '2026-09-01T08:30:00Z',
    lineItems: [{ productId: PRODUIT, expiryTime: '2026-10-01T08:30:00Z' }],
    ...modif,
  }
}

/* -------------------------------------------------------------------------- */
/*  Quels états ouvrent l'accès                                                */
/* -------------------------------------------------------------------------- */

test('un abonnement actif ouvre l’accès', () => {
  assert.equal(ouvreLAcces('SUBSCRIPTION_STATE_ACTIVE'), true)
})

test('un abonnement résilié reste ouvert jusqu’à son échéance', () => {
  //  « Résilié » veut dire que la reconduction est coupée, pas que le mois en
  //  cours est perdu. Fermer ici volerait les jours déjà réglés.
  assert.equal(ouvreLAcces('SUBSCRIPTION_STATE_CANCELED'), true)
})

test('un prélèvement en échec ne coupe pas tout de suite', () => {
  //  Sinon une carte expirée fermerait l'application du jour au lendemain,
  //  avant même que l'artiste ait été prévenu.
  assert.equal(ouvreLAcces('SUBSCRIPTION_STATE_IN_GRACE_PERIOD'), true)
})

test('les états qui doivent fermer ferment', () => {
  for (const etat of [
    'SUBSCRIPTION_STATE_ON_HOLD',
    'SUBSCRIPTION_STATE_PAUSED',
    'SUBSCRIPTION_STATE_EXPIRED',
    'SUBSCRIPTION_STATE_PENDING',
    'SUBSCRIPTION_STATE_UNSPECIFIED',
  ]) {
    assert.equal(ouvreLAcces(etat), false, `${etat} n'aurait pas dû ouvrir`)
  }
})

test('un état absent ou inconnu ferme', () => {
  //  Le doute profite à la fermeture : un état que Google ajouterait demain ne
  //  doit pas ouvrir l'accès au seul motif qu'on ne le connaît pas.
  assert.equal(ouvreLAcces(undefined), false)
  assert.equal(ouvreLAcces('SUBSCRIPTION_STATE_TOUT_NEUF'), false)
  assert.equal(ouvreLAcces(''), false)
})

/* -------------------------------------------------------------------------- */
/*  La revendication du jeton — ce qui empêche de partager un abonnement        */
/* -------------------------------------------------------------------------- */

test('un jeton que personne n’a revendiqué est utilisable', () => {
  assert.equal(jetonUtilisable(undefined, 'artiste-42'), true)
})

test('son propriétaire peut s’en resservir', () => {
  //  C'est le cas courant : l'application revérifie son abonnement à chaque
  //  lancement, avec le même jeton.
  assert.equal(jetonUtilisable('artiste-42', 'artiste-42'), true)
})

test('un autre compte ne peut pas s’en servir', () => {
  //  Sans cette règle, faire circuler un jeton d'achat ouvrirait autant de
  //  comptes qu'on voudrait — un abonnement payé, dix comptes servis.
  assert.equal(jetonUtilisable('artiste-42', 'artiste-7'), false)
  assert.equal(jetonUtilisable('', 'artiste-7'), false)
})

test('l’empreinte du jeton est stable et discriminante', () => {
  //  Stable : c'est elle qui permet de reconnaître un jeton déjà vu.
  assert.equal(clefDuJeton('abc'), clefDuJeton('abc'))
  assert.notEqual(clefDuJeton('abc'), clefDuJeton('abd'))
})

test('l’empreinte fait un nom de document valable', () => {
  //  Un jeton d'achat peut être long et contenir des caractères interdits dans
  //  un nom de document Firestore. L'empreinte, elle, est toujours acceptable.
  const c = clefDuJeton('un/jeton/avec des barres obliques et 1000 caractères'.repeat(40))
  assert.match(c, /^[0-9a-f]{64}$/)
})

test('l’empreinte ne laisse pas deviner le jeton', () => {
  //  Un jeton d'achat donne accès à un abonnement : il n'y a aucune raison de
  //  le conserver en clair alors qu'une empreinte suffit.
  const jeton = 'jeton-secret-de-google'
  assert.equal(clefDuJeton(jeton).includes(jeton), false)
})

/* -------------------------------------------------------------------------- */
/*  L'accusé de réception — trois jours avant remboursement automatique         */
/* -------------------------------------------------------------------------- */

test('un achat en attente doit être confirmé', () => {
  const a = achat({ acknowledgementState: 'ACKNOWLEDGEMENT_STATE_PENDING' })
  assert.equal(doitAccuserReception(a), true)
})

test('un achat déjà confirmé ne l’est pas deux fois', () => {
  assert.equal(doitAccuserReception(achat()), false)
})

/* -------------------------------------------------------------------------- */
/*  La traduction en document d'abonnement                                     */
/* -------------------------------------------------------------------------- */

test('un achat actif donne un abonnement pro daté', () => {
  assert.deepEqual(abonnementDepuisAchat(achat()), {
    plan: 'pro',
    depuis: '2026-09-01',
    jusqua: '2026-10-01',
  })
})

test('un achat fermé ne donne rien', () => {
  assert.equal(abonnementDepuisAchat(achat({ subscriptionState: 'SUBSCRIPTION_STATE_EXPIRED' })), null)
})

test('l’échéance retenue est la plus lointaine', () => {
  const a = achat({
    lineItems: [
      { productId: PRODUIT, expiryTime: '2026-10-01T08:30:00Z' },
      { productId: PRODUIT, expiryTime: '2026-12-01T08:30:00Z' },
    ],
  })
  assert.equal(abonnementDepuisAchat(a)?.jusqua, '2026-12-01')
})

test('une ligne d’un autre produit est ignorée', () => {
  const a = achat({
    lineItems: [
      { productId: PRODUIT, expiryTime: '2026-10-01T08:30:00Z' },
      { productId: 'autre_chose', expiryTime: '2027-01-01T08:30:00Z' },
    ],
  })
  assert.equal(abonnementDepuisAchat(a)?.jusqua, '2026-10-01')
})

test('sans échéance connue, l’abonnement reste ouvert', () => {
  //  Le champ est facultatif chez Google. L'absence d'échéance ne doit pas
  //  valoir échéance dépassée : ce serait fermer l'accès de quelqu'un qui paie.
  const a = achat({ lineItems: [] })
  assert.deepEqual(abonnementDepuisAchat(a), { plan: 'pro', depuis: '2026-09-01' })
})

test('un horodatage illisible ne produit pas de date inventée', () => {
  const a = achat({ lineItems: [{ productId: PRODUIT, expiryTime: 'la semaine prochaine' }] })
  assert.equal(abonnementDepuisAchat(a)?.jusqua, undefined)
})

test('un achat sans date de début est refusé', () => {
  //  `depuis` est affiché à l'artiste. Mieux vaut refuser que d'inscrire une
  //  date d'aujourd'hui qui laisserait croire à un abonnement tout neuf.
  assert.equal(abonnementDepuisAchat(achat({ startTime: undefined })), null)
})

/* -------------------------------------------------------------------------- */
/*  Les deux moitiés doivent dire la même chose                                */
/* -------------------------------------------------------------------------- */

test('ce que la facturation produit, le reste le reconnaît comme pro', () => {
  //  `estPro` décide de l'envoi du courriel de confirmation, et sa jumelle
  //  `subscriptionActive` décide de l'accès dans le navigateur. Un document
  //  produit ici mais rejeté là ouvrirait un abonnement dont personne ne
  //  profite.
  const a = abonnementDepuisAchat(achat())
  assert.ok(a)
  assert.equal(estPro(a, '2026-09-15'), true)
})

test('une échéance dépassée referme, des deux côtés', () => {
  const a = abonnementDepuisAchat(achat())
  assert.ok(a)
  assert.equal(estPro(a, '2026-10-02'), false)
})

test('le dernier jour payé reste ouvert', () => {
  //  L'échéance est ramenée au jour, et l'arrondi joue en faveur de l'abonné :
  //  une échéance à 8 h 30 vaut jusqu'au soir. Une journée offerte vaut mieux
  //  qu'une journée volée.
  const a = abonnementDepuisAchat(achat())
  assert.ok(a)
  assert.equal(estPro(a, '2026-10-01'), true)
})
