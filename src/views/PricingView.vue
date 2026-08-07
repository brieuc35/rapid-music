<template>
  <div class="page">
    <PageHeader
      title="Abonnement"
      subtitle="Deux formules : l'essentiel gratuit, la carrière en Pro."
    />

    <div class="notice">
      <Icon name="bell" />
      <div>
        <b>Aucun paiement n'est encaissé.</b>
        RapidMusic fonctionne sans serveur ni prestataire de paiement : le bouton ci-dessous
        active Pro en démonstration, pour que vous puissiez juger l'offre. Une facturation
        réelle exigerait un serveur et un prestataire tel que Stripe.
      </div>
    </div>

    <!-- État de l'abonnement en cours -->
    <div v-if="isPro" class="card card--pad current">
      <div class="hstack" style="gap: 14px">
        <span class="current__ico"><Icon name="star" /></span>
        <div class="row__main">
          <b style="font-size: 15.5px">Vous êtes abonné à RapidMusic Pro</b>
          <div class="muted" style="font-size: 13.5px; margin-top: 2px">
            Actif depuis le {{ formatDate(store.subscription.since) }} ·
            {{ money(PRO_PRICE, true) }} par mois
          </div>
        </div>
        <button class="btn btn--ghost" @click="showCancel = true">Résilier</button>
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
            Vos revenus, vos contrats et les opportunités du milieu.
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
                <Icon v-if="row.free" name="check" class="ico-yes" />
                <span v-else class="ico-no">—</span>
              </td>
              <td style="text-align: center"><Icon name="check" class="ico-yes" /></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Activation -->
    <Modal :open="showActivate" title="Activer RapidMusic Pro" @close="showActivate = false">
      <p style="margin: 0 0 14px; color: var(--text-soft); line-height: 1.6">
        Pro donne accès aux revenus, aux contrats, à tout l'onglet Réseau et aux
        montants de vos concerts, pour {{ money(PRO_PRICE, true) }} par mois.
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
    <Modal :open="showCancel" title="Résilier Pro" @close="showCancel = false">
      <p style="margin: 0; color: var(--text-soft); line-height: 1.6">
        Vous repasserez à la formule gratuite. Les onglets Revenus, Contrats et Réseau
        seront de nouveau verrouillés, mais
        <b style="color: var(--text)">aucune donnée ne sera supprimée</b> : tout sera
        retrouvé en cas de réactivation.
      </p>
      <template #footer>
        <button class="btn btn--subtle" @click="showCancel = false">Annuler</button>
        <button class="btn btn--danger" @click="doCancel">Résilier</button>
      </template>
    </Modal>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import PageHeader from '@/components/PageHeader.vue'
import Icon from '@/components/Icon.vue'
import Modal from '@/components/Modal.vue'
import { store, isPro, activatePro, cancelPro, PRO_PRICE } from '@/store'
import { money, formatDate } from '@/utils/format'

const freeFeatures = [
  'Tableau de bord et indicateurs',
  'Agenda et évènements',
  'Catalogue des sorties',
  'Dates de concerts et billetterie',
  'Carnet de contacts',
  'Profil artiste et fiche label',
]

const proFeatures = [
  'Tout le gratuit, sans limite',
  'Revenus et royalties : suivi par plateforme et historique',
  'Import des relevés de distributeur en un fichier',
  'Contrats : suivi des statuts, avances et taux',
  'Réseau : le fil du milieu, l’annuaire des membres et les annonces',
  'Cachets de vos concerts et total à venir',
]

const comparison = [
  { label: 'Tableau de bord', detail: 'Vue d’ensemble de la carrière', free: true },
  { label: 'Agenda', detail: 'Évènements et calendrier', free: true },
  { label: 'Sorties', detail: 'Catalogue des titres', free: true },
  { label: 'Contacts', detail: 'Carnet d’adresses', free: true },
  { label: 'Profil et Label', detail: 'Votre fiche et celle de votre label', free: true },
  { label: 'Concerts — dates', detail: 'Salle, ville, horaires, billetterie', free: true },
  { label: 'Concerts — cachets', detail: 'Montants négociés et total à venir', free: false },
  { label: 'Royalties & Revenus', detail: 'Suivi, graphiques, import de relevés', free: false },
  { label: 'Contrats', detail: 'Statuts, avances, taux artiste', free: false },
  { label: 'Réseau', detail: 'Fil du milieu, annuaire des membres, annonces', free: false },
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
</style>
