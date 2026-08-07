<template>
  <div class="page">
    <PageHeader title="Contrats" subtitle="Tous vos accords et engagements au même endroit.">
      <template #actions>
        <button v-if="isPro" class="btn btn--primary" @click="openNew">
          <Icon name="plus" /> Nouveau contrat
        </button>
      </template>
    </PageHeader>

    <ProGate
      title="Gardez la main sur vos contrats"
      lead="Avances, taux, échéances : l'onglet Contrats réunit vos engagements et vous alerte sur ce qui reste à signer."
      :features="[
        'Suivi par statut : actif, en attente, expiré',
        'Avance ou valeur, et taux artiste pour chaque accord',
        'Périodes de validité et échéances en un coup d\'œil',
        'Recherche par intitulé, partenaire ou type de contrat',
        'Valeur cumulée de vos avances',
      ]"
    >

    <!-- Summary -->
    <div class="grid grid--stats" style="margin-bottom: 22px">
      <div class="stat">
        <div class="stat__val mono">{{ store.contracts.length }}</div>
        <div class="stat__label">Contrats au total</div>
      </div>
      <div class="stat">
        <div class="stat__val mono" style="color: var(--green)">{{ activeCount }}</div>
        <div class="stat__label">Actifs</div>
      </div>
      <div class="stat">
        <div class="stat__val mono" style="color: var(--amber)">{{ negoCount }}</div>
        <div class="stat__label">En attente</div>
      </div>
      <div class="stat">
        <div class="stat__val mono">{{ money(totalValue) }}</div>
        <div class="stat__label">Valeur cumulée (avances)</div>
      </div>
    </div>

    <!-- Toolbar -->
    <div class="toolbar">
      <div class="search">
        <Icon name="search" />
        <input v-model="q" type="text" placeholder="Rechercher un contrat, un partenaire…" />
      </div>
      <div class="chips">
        <button
          v-for="f in filters"
          :key="f"
          class="chip"
          :class="{ 'chip--active': activeFilter === f }"
          @click="activeFilter = f"
        >
          {{ f }}
        </button>
      </div>
    </div>

    <!-- List -->
    <div v-if="filtered.length" class="grid grid--cards">
      <div v-for="c in filtered" :key="c.id" class="card card--pad contract">
        <div class="hstack" style="justify-content: space-between; align-items: flex-start">
          <span class="badge badge--violet badge--plain">{{ c.type }}</span>
          <span class="badge" :class="statusBadge(c.status)">{{ c.status }}</span>
        </div>
        <h3 class="contract__title">{{ c.title }}</h3>
        <div class="soft" style="font-size: 13.5px; margin-bottom: 14px">
          <Icon name="building" style="width: 14px; height: 14px; vertical-align: -2px" />
          {{ c.party }}
        </div>

        <div class="contract__meta">
          <div>
            <div class="muted micro">Période</div>
            <div class="mono" style="font-size: 13.5px">
              {{ formatDate(c.startDate, { month: 'short', year: '2-digit' }) }} →
              {{ formatDate(c.endDate, { month: 'short', year: '2-digit' }) }}
            </div>
          </div>
          <div>
            <div class="muted micro">Avance / Valeur</div>
            <div class="mono" style="font-size: 13.5px">{{ c.value ? money(c.value) : '—' }}</div>
          </div>
          <div>
            <div class="muted micro">Taux artiste</div>
            <div class="mono" style="font-size: 13.5px">{{ c.royaltyRate }} %</div>
          </div>
        </div>

        <p v-if="c.notes" class="contract__notes">{{ c.notes }}</p>

        <div class="contract__actions">
          <button class="btn btn--ghost btn--sm" @click="openEdit(c)">
            <Icon name="edit" /> Modifier
          </button>
          <button class="btn btn--danger btn--sm" @click="askDelete(c)">
            <Icon name="trash" />
          </button>
        </div>
      </div>
    </div>

    <EmptyState
      v-else
      icon="contract"
      title="Aucun contrat trouvé"
      text="Ajoutez votre premier contrat pour le suivre ici."
    >
      <button class="btn btn--primary" @click="openNew"><Icon name="plus" /> Nouveau contrat</button>
    </EmptyState>

    </ProGate>

    <!-- Modal form -->
    <Modal :open="showForm" :title="editing.id ? 'Modifier le contrat' : 'Nouveau contrat'" @close="showForm = false">
      <div class="field">
        <label>Intitulé</label>
        <input v-model="editing.title" placeholder="Ex : Contrat d'enregistrement…" />
      </div>
      <div class="field--row">
        <div class="field">
          <label>Partenaire</label>
          <input v-model="editing.party" placeholder="Label, éditeur, agence…" />
        </div>
        <div class="field">
          <label>Type</label>
          <select v-model="editing.type">
            <option v-for="t in types" :key="t">{{ t }}</option>
          </select>
        </div>
      </div>
      <div class="field--row">
        <div class="field">
          <label>Statut</label>
          <select v-model="editing.status">
            <option v-for="s in statuses" :key="s">{{ s }}</option>
          </select>
        </div>
        <div class="field">
          <label>Taux artiste (%)</label>
          <input v-model.number="editing.royaltyRate" type="number" min="0" max="100" />
        </div>
      </div>
      <div class="field--row">
        <div class="field">
          <label>Date de début</label>
          <input v-model="editing.startDate" type="date" />
        </div>
        <div class="field">
          <label>Date de fin</label>
          <input v-model="editing.endDate" type="date" />
        </div>
      </div>
      <div class="field">
        <label>Avance / Valeur (€)</label>
        <input v-model.number="editing.value" type="number" min="0" />
      </div>
      <div class="field">
        <label>Notes</label>
        <textarea v-model="editing.notes" placeholder="Clauses, options, remarques…" />
      </div>

      <template #footer>
        <button class="btn btn--subtle" @click="showForm = false">Annuler</button>
        <button class="btn btn--primary" :disabled="!editing.title" @click="save">
          <Icon name="check" /> Enregistrer
        </button>
      </template>
    </Modal>

    <ConfirmDialog
      :open="!!toDelete"
      :label="toDelete?.title"
      @cancel="toDelete = null"
      @confirm="confirmDelete"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive } from 'vue'
import PageHeader from '@/components/PageHeader.vue'
import ProGate from '@/components/ProGate.vue'
import Icon from '@/components/Icon.vue'
import Modal from '@/components/Modal.vue'
import EmptyState from '@/components/EmptyState.vue'
import ConfirmDialog from '@/components/ConfirmDialog.vue'
import { store, upsert, remove, uid, isPro } from '@/store'
import type { Contract } from '@/store/types'
import { money, formatDate } from '@/utils/format'

const types: Contract['type'][] = [
  'Enregistrement',
  'Édition',
  'Distribution',
  'Management',
  'Booking',
  'Licence',
  'Autre',
]
const statuses: Contract['status'][] = ['Actif', 'En attente', 'Expiré']
const filters = ['Tous', 'Actif', 'En attente', 'Expiré']

const q = ref('')
const activeFilter = ref('Tous')

const filtered = computed(() =>
  store.contracts.filter((c) => {
    const matchQ =
      !q.value ||
      (c.title + c.party + c.type).toLowerCase().includes(q.value.toLowerCase())
    const matchF = activeFilter.value === 'Tous' || c.status === activeFilter.value
    return matchQ && matchF
  }),
)

const activeCount = computed(() => store.contracts.filter((c) => c.status === 'Actif').length)
const negoCount = computed(
  () => store.contracts.filter((c) => c.status === 'En attente').length,
)
const totalValue = computed(() => store.contracts.reduce((s, c) => s + (c.value || 0), 0))

const showForm = ref(false)
const emptyContract = (): Contract => ({
  id: '',
  title: '',
  party: '',
  type: 'Enregistrement',
  status: 'En attente',
  startDate: '',
  endDate: '',
  value: 0,
  royaltyRate: 20,
  notes: '',
})
const editing = reactive<Contract>(emptyContract())

function openNew() {
  Object.assign(editing, emptyContract())
  showForm.value = true
}
function openEdit(c: Contract) {
  Object.assign(editing, JSON.parse(JSON.stringify(c)))
  showForm.value = true
}
function save() {
  if (!editing.id) editing.id = uid()
  upsert('contracts', JSON.parse(JSON.stringify(editing)))
  showForm.value = false
}

const toDelete = ref<Contract | null>(null)
function askDelete(c: Contract) {
  toDelete.value = c
}
function confirmDelete() {
  if (toDelete.value) remove('contracts', toDelete.value.id)
  toDelete.value = null
}

function statusBadge(status: string): string {
  return status === 'Actif'
    ? 'badge--green'
    : status === 'Expiré'
      ? 'badge--red'
      : status === 'En attente'
        ? 'badge--amber'
        : 'badge--blue'
}
</script>

<style scoped>
.contract {
  display: flex;
  flex-direction: column;
}
.contract__title {
  font-size: 16px;
  font-weight: 700;
  letter-spacing: -0.01em;
  margin: 14px 0 4px;
  line-height: 1.3;
}
.contract__meta {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  padding: 14px 0;
  border-top: 1px solid var(--border);
  border-bottom: 1px solid var(--border);
}
.micro {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  margin-bottom: 3px;
}
.contract__notes {
  font-size: 13px;
  color: var(--text-soft);
  margin: 14px 0 0;
  line-height: 1.5;
}
.contract__actions {
  display: flex;
  gap: 8px;
  margin-top: 16px;
}
.contract__actions .btn:first-child {
  flex: 1;
}
</style>
