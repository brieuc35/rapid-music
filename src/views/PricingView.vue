<template>
  <div class="page">
    <PageHeader
      title="Abonnement"
      subtitle="Deux formules : l'essentiel gratuit, la carrière en Pro."
    />

    <!-- Ni bouton ni panne : il n'y a simplement pas de parcours d'achat ici.
         Le dire vaut mieux que de laisser chercher.

         Deux textes, et la distinction n'est pas cosmétique. Dans l'application
         de l'App Store, renvoyer vers un paiement extérieur — fût-il celui du
         Play Store — contrevient à la règle 3.1.1 d'Apple et fait refuser la
         fiche. On y annonce donc l'absence, sans indiquer d'ailleurs. -->
    <div v-if="!isPaidPro && !achatPossible" class="notice">
      <Icon name="bell" />
      <div v-if="surIPhone">
        <b>La formule Pro n'est pas encore disponible sur iPhone.</b>
        Tout ce que montre la colonne « Gratuit » vous est ouvert, sans limite de
        durée. Nous vous préviendrons dès que Pro arrivera ici.
      </div>
      <div v-else>
        <b>L'abonnement se souscrit depuis l'application Android.</b>
        Installez RapidMusic depuis le Play Store et ouvrez cette page à
        nouveau : le paiement passe par votre compte Google, avec les moyens de
        paiement qui y sont déjà enregistrés.
      </div>
    </div>

    <div v-if="erreurAchat" class="notice notice--danger">
      <Icon name="bell" />
      <div>{{ erreurAchat }}</div>
    </div>

    <!-- État de l'abonnement en cours.
         Un abonnement réellement payé et une démonstration ne se présentent pas
         de la même façon : le premier ne s'arrête pas depuis le navigateur, et
         proposer « Résilier » sur un bouton qui ne résilie rien serait la pire
         des réponses à quelqu'un qui veut arrêter de payer. -->
    <div v-if="isPaidPro" class="card card--pad current">
      <div class="hstack" style="gap: 14px">
        <span class="current__ico"><Icon name="star" /></span>
        <div class="row__main">
          <b style="font-size: 15.5px">Vous êtes abonné à RapidMusic Pro</b>
          <div class="muted" style="font-size: 13.5px; margin-top: 2px">
            <!-- Sans montant : il dépend de la formule souscrite, et Google en
                 est la source. L'écrire ici annoncerait un prix mensuel à un
                 abonné annuel. -->
            Actif depuis le {{ formatDate(paidSubscription?.depuis || '') }}
            <template v-if="paidSubscription?.jusqua">
              · payé jusqu'au {{ formatDate(paidSubscription.jusqua) }}
            </template>
          </div>
        </div>
      </div>
      <p class="current__note">
        <Icon name="mail" />
        Pour changer de moyen de paiement ou mettre fin à votre abonnement,
        écrivez-nous : la résiliation se fait auprès du prestataire de paiement et non
        depuis cette page.
      </p>
    </div>

    <div v-else-if="isPro" class="card card--pad current current--demo">
      <div class="hstack" style="gap: 14px">
        <span class="current__ico"><Icon name="star" /></span>
        <div class="row__main">
          <b style="font-size: 15.5px">Démonstration Pro en cours</b>
          <div class="muted" style="font-size: 13.5px; margin-top: 2px">
            Ouverte le {{ formatDate(store.subscription.since) }} · aucun montant
            n'a été prélevé
          </div>
        </div>
        <button class="btn btn--ghost" @click="showCancel = true">Arrêter</button>
      </div>
    </div>

    <div class="plans">
      <!-- Gratuit -->
      <div class="plan">
        <div class="plan__head">
          <span class="plan__name">Gratuit</span>
          <div class="plan__price">0 €<span>/mois</span></div>
          <p class="plan__lead">Tout ce qu'il faut pour s'organiser au quotidien.</p>
        </div>
        <ul class="plan__list">
          <li v-for="f in freeFeatures" :key="f"><Icon name="check" /> {{ f }}</li>
        </ul>
        <div class="plan__foot">
          <span v-if="!isPro" class="badge badge--green">Votre formule</span>
          <span v-else class="muted" style="font-size: 13px">Inclus dans Pro</span>
        </div>
      </div>

      <!-- Pro -->
      <div class="plan plan--pro">
        <span class="plan__ribbon">Recommandé</span>
        <div class="plan__head">
          <span class="plan__name">Pro</span>

          <!-- Deux formules, un seul bloc : l'offre est la même, seule la durée
               d'engagement change. En faire deux cartes ferait croire à deux
               produits différents. -->
          <div class="duree" role="group" aria-label="Durée de l'abonnement">
            <button
              v-for="f in formules"
              :key="f.produit"
              class="duree__choix"
              :class="{ 'duree__choix--actif': formule === f.produit }"
              :aria-pressed="formule === f.produit"
              @click="formule = f.produit"
            >
              {{ f.duree }}
              <b v-if="f.economie" class="duree__gain">{{ f.economie }}</b>
            </button>
          </div>

          <div class="plan__price">
            {{ formuleChoisie }}<span>/mois</span>
          </div>
          <p class="plan__lead">
            Vos revenus, vos contrats et les montants de vos concerts.
          </p>
        </div>
        <ul class="plan__list">
          <li v-for="f in proFeatures" :key="f"><Icon name="check" /> {{ f }}</li>
        </ul>
        <div class="plan__foot">
          <template v-if="!isPro">
            <button
              v-if="achatPossible"
              class="btn btn--primary btn--block"
              :disabled="achatEnCours"
              @click="souscrire"
            >
              <Icon name="star" />
              {{ achatEnCours ? 'Un instant…' : 'Passer à Pro' }}
            </button>
            <span v-else class="muted" style="font-size: 13px">
              {{ surIPhone ? 'Bientôt sur iPhone' : "Depuis l'application Android" }}
            </span>
            <!-- Le prix engagé, redit sous le bouton : l'annuel se paie en une
                 fois, et le découvrir sur l'écran de Google serait une surprise
                 désagréable. -->
            <span
              v-if="achatPossible && formule === PRODUIT_ANNUEL"
              class="muted"
              style="display: block; margin-top: 8px; font-size: 12.5px; text-align: center"
            >
              {{ ecrireTarif(tarifAnnuel) }} prélevés une fois par an
            </span>
          </template>
          <span v-else class="badge badge--violet">Votre formule</span>
        </div>
      </div>
    </div>

    <!-- Comparatif -->
    <div class="card" style="margin-top: 22px; overflow: hidden">
      <div class="section-head" style="padding: 18px 20px 12px">
        <span class="section-head__title">Ce que change l'abonnement</span>
      </div>
      <!--  `tbl--compare` : ce tableau-ci se lit d'un bloc, il ne se parcourt
            pas comme un relevé de chiffres. Il tient donc dans la largeur de
            l'encadré au lieu de défiler — un défilement horizontal y cachait
            la colonne « Pro », la seule qui justifie l'abonnement. -->
      <div class="tablewrap">
        <table class="tbl tbl--compare">
          <thead>
            <tr>
              <th>Onglet</th>
              <th style="text-align: center">Gratuit</th>
              <th style="text-align: center">Pro</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in comparison" :key="row.label">
              <td>
                <b>{{ row.label }}</b>
                <div class="muted" style="font-size: 12.5px">{{ row.detail }}</div>
              </td>
              <td style="text-align: center">
                <!-- Une limite chiffrée remplace la coche : une coche seule
                     laisserait croire à un accès sans restriction. -->
                <span v-if="row.freeLabel" class="ico-part">{{ row.freeLabel }}</span>
                <Icon v-else-if="row.free" name="check" class="ico-yes" />
                <span v-else class="ico-no">—</span>
              </td>
              <td style="text-align: center">
                <span v-if="row.soon" class="ico-soon">Bientôt</span>
                <Icon v-else name="check" class="ico-yes" />
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Résiliation -->
    <Modal :open="showCancel" title="Arrêter la démonstration" @close="showCancel = false">
      <p style="margin: 0; color: var(--text-soft); line-height: 1.6">
        Vous repasserez à la formule gratuite. Les onglets Revenus et Contrats
        seront de nouveau verrouillés, mais
        <b style="color: var(--text)">aucune donnée ne sera supprimée</b> : tout sera
        retrouvé en cas de réactivation.
      </p>
      <!-- La question que se pose quiconque a plus de trois contacts avant de
           cliquer. Y répondre ici évite de la découvrir après coup. -->
      <p style="margin: 12px 0 0; color: var(--text-soft); line-height: 1.6">
        Vos contacts au-delà de {{ FREE_CONTACTS }} restent consultables et modifiables ;
        seul l'ajout d'un nouveau contact demandera de repasser à Pro.
      </p>
      <template #footer>
        <button class="btn btn--subtle" @click="showCancel = false">Annuler</button>
        <button class="btn btn--danger" @click="doCancel">Arrêter</button>
      </template>
    </Modal>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import PageHeader from '@/components/PageHeader.vue'
import Icon from '@/components/Icon.vue'
import Modal from '@/components/Modal.vue'
import {
  store,
  isPro,
  isPaidPro,
  paidSubscription,
  cancelPro,
  relireAbonnement,
  PRO_PRICE,
  PRO_PRICE_ANNUEL,
  PRO_MOIS_OFFERTS,
  FREE_CONTACTS,
} from '@/store'
import { formatDate } from '@/utils/format'
import { surIOS } from '@/utils/enveloppe-native'
import {
  acheterPro,
  ecrireTarif,
  ErreurAchat,
  facturationPossible,
  lireTarifs,
  PRODUIT_ANNUEL,
  PRODUIT_MENSUEL,
  verifierAupresDuServeur,
  type Tarif,
} from '@/utils/facturation-play'

const freeFeatures = [
  'Tableau de bord et indicateurs',
  'Agenda et évènements',
  'Catalogue des sorties',
  'Dates de concerts et billetterie',
  `Carnet de contacts (${FREE_CONTACTS} contacts)`,
  'Profil artiste et fiche label',
]

/*  Le Réseau n'y figure pas : il n'est pas encore ouvert, et une fonction
 *  annoncée dans la liste de ce qu'on paie est une fonction promise. Il est
 *  mentionné plus bas, comme ce qui viendra s'ajouter — pas comme une raison de
 *  payer aujourd'hui. */
const proFeatures = [
  'Tout le gratuit, sans limite',
  'Revenus et royalties : suivi par plateforme et historique',
  'Import des relevés de distributeur en un fichier',
  'Contrats : suivi des statuts, avances et taux',
  'Carnet de contacts sans limite de nombre',
  'Cachets de vos concerts et total à venir',
]

const comparison = [
  { label: 'Tableau de bord', detail: 'Vue d’ensemble de la carrière', free: true },
  { label: 'Agenda', detail: 'Évènements et calendrier', free: true },
  { label: 'Sorties', detail: 'Catalogue des titres', free: true },
  {
    label: 'Contacts',
    detail: 'Carnet d’adresses',
    free: true,
    freeLabel: `${FREE_CONTACTS} max`,
  },
  { label: 'Profil et Label', detail: 'Votre fiche et celle de votre label', free: true },
  { label: 'Concerts — dates', detail: 'Salle, ville, horaires, billetterie', free: true },
  { label: 'Concerts — cachets', detail: 'Montants négociés et total à venir', free: false },
  { label: 'Royalties & Revenus', detail: 'Suivi, graphiques, import de relevés', free: false },
  { label: 'Contrats', detail: 'Statuts, avances, taux artiste', free: false },
  {
    label: 'Réseau',
    detail: 'Fil du milieu, annuaire des membres, annonces',
    free: false,
    // Annoncé sans être compté : la colonne Pro dira « bientôt » et non une
    // coche. Le retirer du tableau serait plus discret, mais on ne saurait plus
    // que c'est prévu.
    soon: true,
  },
]

const showCancel = ref(false)

/*  Calculé une fois : la disponibilité ne change pas en cours de session, et
 *  l'interroger dans le gabarit le referait à chaque rendu. */
const achatPossible = facturationPossible()

/*  Dans l'enveloppe App Store : ni bouton d'achat, ni renvoi vers le Play Store.
 *  Constant pour la session, comme la disponibilité de la facturation. */
const surIPhone = surIOS()
const achatEnCours = ref(false)
const erreurAchat = ref('')

/** La formule choisie. L'annuelle par défaut : c'est la meilleure des deux. */
const formule = ref<string>(PRODUIT_ANNUEL)

/*  Les prix relevés auprès du Play Store, vides tant qu'il n'a pas répondu —
 *  ou pour toujours hors de l'application. */
const tarifsPlay = ref(new Map<string, Tarif>())

onMounted(async () => {
  tarifsPlay.value = await lireTarifs()
})

/**
 * Le prix d'un produit : celui de Google s'il a répondu, celui du code sinon.
 *
 * L'ordre compte. Le montant écrit dans le code n'est qu'un pis-aller pour
 * présenter l'offre là où l'on ne peut pas acheter ; partout où un achat est
 * possible, c'est le prix réellement débité qui s'affiche.
 */
function tarif(produit: string, secours: number): Tarif {
  return tarifsPlay.value.get(produit) ?? { montant: secours, devise: 'EUR' }
}

const tarifMensuel = computed(() => tarif(PRODUIT_MENSUEL, PRO_PRICE))
const tarifAnnuel = computed(() => tarif(PRODUIT_ANNUEL, PRO_PRICE_ANNUEL))

/** L'annuel ramené au mois, pour que les deux formules se comparent d'un coup d'œil. */
const annuelParMois = computed(() =>
  ecrireTarif({ montant: tarifAnnuel.value.montant / 12, devise: tarifAnnuel.value.devise }),
)

const formules = computed(() => [
  { produit: PRODUIT_MENSUEL, duree: 'Au mois', economie: '' },
  {
    produit: PRODUIT_ANNUEL,
    duree: "À l'année",
    economie: PRO_MOIS_OFFERTS > 0 ? `${PRO_MOIS_OFFERTS} mois offerts` : '',
  },
])

/**
 * Le prix affiché en grand, toujours ramené au mois.
 *
 * Comparer « 9,99 € » et « 99 € » demanderait une division mentale au moment
 * précis où l'on décide. Le montant réellement prélevé est redit sous le
 * bouton : l'engagement annuel ne doit pas se découvrir sur l'écran de Google.
 */
const formuleChoisie = computed(() =>
  formule.value === PRODUIT_ANNUEL
    ? annuelParMois.value
    : ecrireTarif(tarifMensuel.value),
)

/**
 * Achète l'abonnement, puis le fait confirmer par le serveur.
 *
 * Les deux étapes comptent, et la seconde davantage : le paiement se joue chez
 * Google, mais l'accès ne s'ouvre que lorsque la fonction serveur a vérifié
 * l'achat auprès de lui. Rien de ce qui se passe dans ce fichier ne peut
 * ouvrir l'accès tout seul — `abonnements/{uid}` est fermé au navigateur.
 */
async function souscrire() {
  achatEnCours.value = true
  erreurAchat.value = ''
  try {
    const jeton = await acheterPro(formule.value)
    await verifierAupresDuServeur(jeton)
    await relireAbonnement()
  } catch (e) {
    /*  Un abandon n'est pas une erreur : refermer la fenêtre de paiement est
     *  un choix, et afficher un message rouge à quelqu'un qui a simplement
     *  changé d'avis le laisserait croire à une panne. */
    if (e instanceof DOMException && e.name === 'AbortError') return
    erreurAchat.value =
      e instanceof ErreurAchat
        ? e.message
        : "L'abonnement n'a pas pu être confirmé. Si le montant a été débité, il sera reconnu au prochain lancement de l'application."
  } finally {
    achatEnCours.value = false
  }
}

function doCancel() {
  cancelPro()
  showCancel.value = false
}
</script>

<style scoped>
.notice {
  display: flex;
  gap: 13px;
  background: var(--amber-bg);
  border: 1px solid #f8e3bb;
  border-radius: var(--radius);
  padding: 15px 17px;
  margin-bottom: 20px;
  font-size: 13.5px;
  line-height: 1.6;
  color: #7a5410;
}
.notice svg {
  width: 19px;
  height: 19px;
  flex-shrink: 0;
  margin-top: 1px;
  color: var(--amber);
}
/* Le choix de la durée. Deux boutons collés plutôt qu'une liste déroulante :
   l'écart entre les deux formules est l'argument, et il doit se voir sans
   qu'on ait à ouvrir quoi que ce soit. */
.duree {
  display: flex;
  gap: 4px;
  background: var(--bg);
  border: 1px solid var(--border);
  border-radius: 999px;
  padding: 3px;
  margin-bottom: 14px;
}
.duree__choix {
  flex: 1;
  border: 0;
  background: none;
  border-radius: 999px;
  padding: 7px 10px;
  font: inherit;
  font-size: 13px;
  font-weight: 600;
  color: var(--text-soft);
  cursor: pointer;
  line-height: 1.25;
}
.duree__choix--actif {
  background: var(--surface);
  color: var(--violet-600);
  box-shadow: 0 1px 3px rgba(20, 16, 31, 0.12);
}
.duree__gain {
  display: block;
  font-size: 11px;
  font-weight: 700;
  color: var(--green);
}

/* Un échec d'achat ne se dit pas dans l'ambre des informations : quelqu'un qui
   vient de payer doit voir tout de suite que quelque chose n'a pas abouti. */
.notice--danger {
  background: var(--red-bg);
  border-color: #f5c2c2;
  color: #8a2020;
}
.notice--danger svg {
  color: var(--red);
}

.current {
  margin-bottom: 20px;
  border-color: var(--violet-200);
}
/* Une démonstration se distingue d'un abonnement payé jusque dans le cadre :
   les pointillés disent partout dans l'application « annoncé, pas acquis ». */
.current--demo {
  border-style: dashed;
  border-color: var(--border-strong);
}
.current__note {
  display: flex;
  gap: 9px;
  align-items: flex-start;
  margin: 14px 0 0;
  padding-top: 14px;
  border-top: 1px solid var(--border);
  color: var(--text-soft);
  font-size: 13px;
  line-height: 1.55;
}
.current__note svg {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
  margin-top: 1px;
  color: var(--violet-600);
}
.current__ico {
  width: 42px;
  height: 42px;
  border-radius: 12px;
  background: var(--brand-gradient);
  display: grid;
  place-items: center;
  flex-shrink: 0;
}
.current__ico svg {
  width: 20px;
  height: 20px;
  color: #fff;
  fill: #fff;
}

.plans {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(300px, 100%), 1fr));
  gap: 18px;
}
.plan {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: 26px 24px 22px;
  box-shadow: var(--shadow-sm);
  display: flex;
  flex-direction: column;
  position: relative;
}
.plan--pro {
  border-color: var(--violet-400);
  box-shadow: 0 10px 30px rgba(124, 58, 237, 0.13);
}
.plan__ribbon {
  position: absolute;
  top: -11px;
  left: 24px;
  background: var(--brand-gradient);
  color: #fff;
  font-size: 11.5px;
  font-weight: 700;
  padding: 4px 12px;
  border-radius: 20px;
}
.plan__name {
  font-size: 13px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--violet-600);
}
.plan__price {
  font-size: 34px;
  font-weight: 800;
  letter-spacing: -0.03em;
  margin: 6px 0 4px;
}
.plan__price span {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-muted);
  letter-spacing: 0;
}
.plan__lead {
  color: var(--text-soft);
  font-size: 14px;
  line-height: 1.55;
}
.plan__list {
  list-style: none;
  margin: 20px 0 22px;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
  flex: 1;
}
.plan__list li {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  font-size: 14px;
  line-height: 1.5;
}
.plan__list svg {
  width: 16px;
  height: 16px;
  color: var(--green);
  flex-shrink: 0;
  margin-top: 2px;
}
.plan__foot {
  display: flex;
  justify-content: center;
}

.ico-yes {
  width: 18px;
  height: 18px;
  color: var(--green);
}
.ico-no {
  color: var(--text-muted);
}
/* Une limite chiffrée dans la colonne Gratuit : ni un oui franc, ni un non. */
.ico-part {
  display: inline-block;
  background: var(--surface-2);
  border: 1px solid var(--border);
  color: var(--text-soft);
  font-size: 11.5px;
  font-weight: 700;
  border-radius: 20px;
  padding: 2px 9px;
  white-space: nowrap;
}
/* Ni coche ni tiret : un état à part, pour qu'on ne lise pas « compris dans
   l'abonnement » là où c'est encore à venir. */
.ico-soon {
  display: inline-block;
  background: var(--violet-50);
  color: var(--violet-700);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.03em;
  text-transform: uppercase;
  border-radius: 20px;
  padding: 3px 9px;
  white-space: nowrap;
}

/*  Sur un téléphone, les deux colonnes de verdict prenaient 184 px des 322
 *  disponibles pour afficher une coche : le libellé se retrouvait sur quatre
 *  lignes et le tableau s'allongeait démesurément. Les pastilles maigrissent
 *  pour que ces colonnes tiennent en 74 px, et la place revient au texte. */
@media (max-width: 620px) {
  .ico-part {
    font-size: 11px;
    padding: 2px 7px;
  }
  .ico-soon {
    font-size: 10px;
    letter-spacing: 0;
    padding: 3px 7px;
  }
}
</style>
