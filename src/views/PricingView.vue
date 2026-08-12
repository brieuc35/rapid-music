<template>
  <div class="page">
    <PageHeader
      title="Abonnement"
      subtitle="Deux formules : l'essentiel gratuit, la carrière en Pro."
    />

    <!-- Sans objet pour qui a un abonnement enregistré sur le serveur : ce
         bandeau explique le bouton de démonstration, qui ne lui est pas
         proposé. -->
    <div v-if="!isPaidPro" class="notice">
      <Icon name="bell" />
      <div>
        <b>Aucun paiement n'est encaissé.</b>
        RapidMusic n'est relié à aucun prestataire de paiement : le bouton ci-dessous
        active Pro en démonstration, pour que vous puissiez juger l'offre. Une facturation
        réelle exigerait un prestataire tel que Stripe, et une vérification du paiement
        côté serveur — cette bascule-ci se fait dans le navigateur.
      </div>
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
            Actif depuis le {{ formatDate(paidSubscription?.depuis || '') }} ·
            {{ money(PRO_PRICE, true) }} par mois
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
          <div class="plan__price">
            {{ money(PRO_PRICE, true) }}<span>/mois</span>
          </div>
          <p class="plan__lead">
            Vos revenus, vos contrats et les montants de vos concerts.
          </p>
        </div>
        <ul class="plan__list">
          <li v-for="f in proFeatures" :key="f"><Icon name="check" /> {{ f }}</li>
        </ul>
        <div class="plan__foot">
          <button v-if="!isPro" class="btn btn--primary btn--block" @click="showActivate = true">
            <Icon name="star" /> Activer Pro
          </button>
          <span v-else class="badge badge--violet">Votre formule</span>
        </div>
      </div>
    </div>

    <!-- Comparatif -->
    <div class="card" style="margin-top: 22px; overflow: hidden">
      <div class="section-head" style="padding: 18px 20px 12px">
        <span class="section-head__title">Ce que change l'abonnement</span>
      </div>
      <div class="tablewrap">
        <table class="tbl">
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

    <!-- Activation -->
    <Modal :open="showActivate" title="Activer RapidMusic Pro" @close="showActivate = false">
      <p style="margin: 0 0 14px; color: var(--text-soft); line-height: 1.6">
        Pro donne accès aux revenus, aux contrats et aux montants de vos concerts,
        pour {{ money(PRO_PRICE, true) }} par mois. Le Réseau des professionnels
        s'y ajoutera à son ouverture, sans supplément.
      </p>
      <div class="notice notice--sm">
        <Icon name="bell" />
        <div>
          <b>Aucune coordonnée bancaire n'est demandée et aucun montant n'est prélevé.</b>
          Cette activation est une démonstration locale, destinée à vous laisser essayer
          les fonctions concernées.
        </div>
      </div>
      <template #footer>
        <button class="btn btn--subtle" @click="showActivate = false">Annuler</button>
        <button class="btn btn--primary" @click="doActivate">
          <Icon name="check" /> Activer la démonstration
        </button>
      </template>
    </Modal>

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
import { ref } from 'vue'
import PageHeader from '@/components/PageHeader.vue'
import Icon from '@/components/Icon.vue'
import Modal from '@/components/Modal.vue'
import {
  store,
  isPro,
  isPaidPro,
  paidSubscription,
  activatePro,
  cancelPro,
  PRO_PRICE,
  FREE_CONTACTS,
} from '@/store'
import { money, formatDate } from '@/utils/format'

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

const showActivate = ref(false)
const showCancel = ref(false)

function doActivate() {
  activatePro()
  showActivate.value = false
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
.notice--sm {
  margin: 0;
  font-size: 13px;
  padding: 12px 14px;
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
</style>
