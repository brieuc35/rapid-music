/* -------------------------------------------------------------------------- */
/*  Tests de la lecture d'un abonnement App Store                              */
/*                                                                            */
/*    cd functions && npm test                                                 */
/*                                                                            */
/*  Aucune dépendance : le lanceur est celui de Node.                          */
/*                                                                            */
/*  Même raison d'être que pour Play, et une de plus : ici rien n'est           */
/*  éprouvable à la main. Il n'y a ni Mac, ni iPhone, ni compte de bac à sable  */
/*  pour provoquer un remboursement ou un échec de prélèvement. Ces tests sont  */
/*  la seule chose qui sépare ce fichier d'un espoir.                          */
/* -------------------------------------------------------------------------- */

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { estPro } from './courriels.js'
import {
  abonnementDepuisApple,
  identifiantAbonnement,
  ouvreLAccesApple,
  reçuAttendu,
  type StatutApple,
  type TransactionApple,
} from './facturation-apple.js'

const PAQUET = 'fr.rapidmusic.app'

/*  Apple compte en millisecondes depuis 1970, et non en texte ISO comme
 *  Google. Se tromper d'unité donnerait des échéances en 1970 — soit un accès
 *  refermé à tous les abonnés, en silence. */
const ACHAT = Date.UTC(2026, 2, 14, 10, 30) // 14 mars 2026
const ECHEANCE = Date.UTC(2026, 3, 14, 10, 30) // 14 avril 2026

/*  Le jour où l'on se place pour juger d'une échéance.
 *
 *  Écrit, et non « aujourd'hui » : ces dates-ci sont figées, et le jour réel
 *  finit toujours par les dépasser. Sans ce point de repère, le test passait à
 *  l'écriture puis échouait quelques mois plus tard, en annonçant une panne de
 *  l'abonnement là où il n'y avait qu'un jeu d'essai périmé. `estPro` accepte
 *  ce paramètre exactement pour cette raison. */
const PENDANT = '2026-04-01'

/** Un abonnement actif ordinaire, que chaque test déforme à sa guise. */
function actif(modif: Partial<TransactionApple> = {}, status = 1): StatutApple {
  return {
    status,
    transaction: {
      transactionId: '2000000900000002',
      originalTransactionId: '2000000900000001',
      productId: 'pro_annuel',
      bundleId: PAQUET,
      purchaseDate: ACHAT,
      originalPurchaseDate: ACHAT,
      expiresDate: ECHEANCE,
      ...modif,
    },
  }
}

/* -------------------------------------------------------------------------- */
/*  Les états                                                                  */
/* -------------------------------------------------------------------------- */

test('actif, en reprise de paiement et en période de grâce ouvrent l’accès', () => {
  for (const etat of [1, 3, 4]) {
    assert.equal(ouvreLAccesApple(etat), true, `l'état ${etat} devrait ouvrir`)
  }
})

test('expiré et révoqué ferment l’accès', () => {
  for (const etat of [2, 5]) {
    assert.equal(ouvreLAccesApple(etat), false, `l'état ${etat} devrait fermer`)
  }
})

test('un état absent ou inconnu ferme', () => {
  assert.equal(ouvreLAccesApple(undefined), false)
  /*  Le doute profite à la fermeture : si Apple ajoutait un code demain, le
   *  laisser ouvrir donnerait l'accès à tout le monde sans qu'on l'ait voulu. */
  assert.equal(ouvreLAccesApple(6), false)
  assert.equal(ouvreLAccesApple(0), false)
})

/* -------------------------------------------------------------------------- */
/*  À qui et à quoi le reçu appartient                                         */
/* -------------------------------------------------------------------------- */

test('un reçu d’une autre application est refusé', () => {
  /*  Le cas qui compte : un reçu signé par Apple l'est pour *une* application.
   *  Sans ce contrôle, l'abonnement à n'importe quelle autre application de
   *  l'App Store ouvrirait le Pro ici. */
  assert.equal(reçuAttendu({ bundleId: 'com.autre.app', productId: 'pro_annuel' }, PAQUET), false)
})

test('un reçu pour un produit qui n’est pas le nôtre est refusé', () => {
  assert.equal(reçuAttendu({ bundleId: PAQUET, productId: 'autre_chose' }, PAQUET), false)
})

test('un reçu absent ou incomplet est refusé', () => {
  assert.equal(reçuAttendu(undefined, PAQUET), false)
  assert.equal(reçuAttendu({ productId: 'pro_annuel' }, PAQUET), false)
  assert.equal(reçuAttendu({ bundleId: PAQUET }, PAQUET), false)
})

test('nos deux abonnements sont acceptés', () => {
  assert.equal(reçuAttendu({ bundleId: PAQUET, productId: 'pro_mensuel' }, PAQUET), true)
  assert.equal(reçuAttendu({ bundleId: PAQUET, productId: 'pro_annuel' }, PAQUET), true)
})

test('la revendication porte sur l’identifiant d’origine, pas sur celui du mois', () => {
  /*  Celui du mois change à chaque renouvellement : revendiquer celui-là
   *  reviendrait à tout refaire tous les mois, et ne protégerait plus rien
   *  entre deux. */
  assert.equal(
    identifiantAbonnement({ transactionId: 'du-mois', originalTransactionId: 'dorigine' }),
    'dorigine',
  )
})

test('sans identifiant d’origine, celui du mois fait l’affaire', () => {
  assert.equal(identifiantAbonnement({ transactionId: 'du-mois' }), 'du-mois')
  assert.equal(identifiantAbonnement({}), null)
  assert.equal(identifiantAbonnement(undefined), null)
})

/* -------------------------------------------------------------------------- */
/*  La traduction en droit d'accès                                             */
/* -------------------------------------------------------------------------- */

test('un abonnement actif ouvre l’accès, avec ses deux dates', () => {
  const a = abonnementDepuisApple(actif())
  assert.deepEqual(a, { plan: 'pro', depuis: '2026-03-14', jusqua: '2026-04-14' })
  assert.equal(estPro(a, PENDANT), true)
  /*  Et l'échéance est bien honorée : le même document, lu après sa date, ne
   *  vaut plus abonnement. C'est ce qui referme l'accès quand un avis de
   *  résiliation s'est perdu en route. */
  assert.equal(estPro(a, '2026-04-15'), false)
})

test('un abonnement expiré n’ouvre rien', () => {
  assert.equal(abonnementDepuisApple(actif({}, 2)), null)
})

test('un remboursement ferme, même si l’état dit encore actif', () => {
  /*  Ceinture et bretelles : le champ est le fait, l'état est son
   *  interprétation. Apple met normalement l'état à 5, mais une réponse en
   *  retard d'un instant ne doit pas laisser l'accès ouvert à quelqu'un qui a
   *  été remboursé. */
  const rembourse = actif({ revocationDate: Date.UTC(2026, 2, 20) }, 1)
  assert.equal(abonnementDepuisApple(rembourse), null)
})

test('un paiement en échec garde l’accès pendant qu’Apple réessaie', () => {
  /*  Fermer ici couperait l'application du jour au lendemain à quelqu'un dont
   *  la carte vient d'expirer, avant même qu'il ait pu la changer. */
  assert.notEqual(abonnementDepuisApple(actif({}, 3)), null)
  assert.notEqual(abonnementDepuisApple(actif({}, 4)), null)
})

test('« abonné depuis » est la date d’origine, pas celle du renouvellement', () => {
  /*  Au bout d'un an, la date du dernier renouvellement annoncerait « depuis le
   *  mois dernier » à quelqu'un qui paie depuis douze mois. */
  const renouvele = actif({
    originalPurchaseDate: Date.UTC(2025, 2, 14),
    purchaseDate: Date.UTC(2026, 2, 14),
  })
  assert.equal(abonnementDepuisApple(renouvele)?.depuis, '2025-03-14')
})

test('sans date d’origine, celle de l’achat en cours prend le relais', () => {
  const sansOrigine = actif({ originalPurchaseDate: undefined })
  assert.equal(abonnementDepuisApple(sansOrigine)?.depuis, '2026-03-14')
})

test('sans aucune date d’achat, rien ne s’ouvre', () => {
  /*  Mieux vaut refuser que d'écrire un abonnement dont on ne sait pas dire
   *  depuis quand il court : la page d'abonnement l'affiche. */
  const sansDate = actif({ originalPurchaseDate: undefined, purchaseDate: undefined })
  assert.equal(abonnementDepuisApple(sansDate), null)
})

test('un abonnement sans échéance ouvre quand même l’accès', () => {
  const a = abonnementDepuisApple(actif({ expiresDate: undefined }))
  assert.deepEqual(a, { plan: 'pro', depuis: '2026-03-14' })
})

test('les dates sont ramenées au jour, en faveur de l’abonné', () => {
  /*  Une échéance à midi vaut jusqu'au soir : `subscriptionActive` compare des
   *  jours. Une journée offerte vaut mieux qu'une journée volée à quelqu'un qui
   *  a payé. */
  const midi = actif({ expiresDate: Date.UTC(2026, 3, 14, 12, 0) })
  assert.equal(abonnementDepuisApple(midi)?.jusqua, '2026-04-14')
})

test('une date absurde ne fabrique pas une échéance absurde', () => {
  /*  `NaN` donnerait une date invalide, et `toISOString` lèverait. Une échéance
   *  manquante est préférable : l'accès s'ouvre sans date de fin plutôt que la
   *  vérification ne s'écroule. */
  const casse = actif({ expiresDate: Number.NaN })
  assert.deepEqual(abonnementDepuisApple(casse), { plan: 'pro', depuis: '2026-03-14' })
})

test('une transaction absente ne fait rien ouvrir', () => {
  assert.equal(abonnementDepuisApple({ status: 1 }), null)
  assert.equal(abonnementDepuisApple({}), null)
})
