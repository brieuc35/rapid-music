<template>
  <div class="page">
    <PageHeader title="Concerts" subtitle="Vos dates de tournée, cachets et billetterie.">
      <template #actions>
        <button class="btn btn--primary" @click="openNew"><Icon name="plus" /> Ajouter une date</button>
      </template>
    </PageHeader>

    <div class="grid grid--stats" style="margin-bottom: 22px">
      <div class="stat">
        <div class="stat__val mono">{{ upcoming.length }}</div>
        <div class="stat__label">Dates à venir</div>
      </div>
      <div class="stat">
        <div class="stat__val mono">
          <template v-if="isPro">{{ money(totalFees) }}</template>
          <RouterLink v-else to="/abonnement" class="locked"><Icon name="star" /> Pro</RouterLink>
        </div>
        <div class="stat__label">Cachets à venir</div>
      </div>
      <div class="stat">
        <div class="stat__val mono">{{ number(ticketsSold) }}</div>
        <div class="stat__label">Billets vendus</div>
      </div>
      <div class="stat">
        <div class="stat__val mono">{{ fillRate }} %</div>
        <div class="stat__label">Taux de remplissage moyen</div>
      </div>
    </div>

    <div class="toolbar">
      <div class="search">
        <Icon name="search" />
        <input v-model="q" placeholder="Rechercher une salle, une ville…" />
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

    <div v-if="filtered.length" class="card" style="overflow: hidden">
      <div class="list">
        <div v-for="c in filtered" :key="c.id" class="row concert-row">
          <div class="datechip" :class="{ 'datechip--past': isPast(c) }">
            <span class="datechip__d">{{ dayNum(c.date) }}</span>
            <span class="datechip__m">{{ monthShort(c.date) }}</span>
          </div>

          <div class="row__main">
            <div class="hstack" style="gap: 8px">
              <span class="row__title">{{ c.venue }}</span>
              <span class="badge" :class="statusBadge(c.status)">{{ c.status }}</span>
            </div>
            <div class="row__sub">
              <Icon name="pin" style="width: 13px; height: 13px; vertical-align: -2px" />
              {{ c.city }}, {{ c.country }} · {{ c.time }} · {{ c.promoter || 'Promoteur ?' }}
            </div>
          </div>

          <div class="concert-tickets" v-if="c.capacity">
            <div class="hstack" style="justify-content: space-between; font-size: 12px">
              <span class="muted">{{ number(c.ticketsSold) }}/{{ number(c.capacity) }}</span>
              <b class="mono">{{ pct(c) }}%</b>
            </div>
            <div class="bar" style="margin-top: 5px">
              <div class="bar__fill" :style="{ width: pct(c) + '%' }" />
            </div>
          </div>

          <div class="concert-fee">
            <div v-if="isPro" class="mono" style="font-weight: 700">{{ money(c.fee) }}</div>
            <RouterLink v-else to="/abonnement" class="locked locked--sm">
              <Icon name="star" /> Pro
            </RouterLink>
            <div class="muted micro">cachet</div>
          </div>

          <div class="hstack" style="gap: 6px">
            <button class="icon-sm" @click="openEdit(c)"><Icon name="edit" /></button>
            <button class="icon-sm icon-sm--danger" @click="askDelete(c)"><Icon name="trash" /></button>
          </div>
        </div>
      </div>
    </div>

    <EmptyState
      v-else
      icon="concert"
      title="Aucun concert"
      text="Ajoutez vos dates pour suivre votre tournée."
    >
      <button class="btn btn--primary" @click="openNew"><Icon name="plus" /> Ajouter une date</button>
    </EmptyState>

    <Modal :open="showForm" :title="editing.id ? 'Modifier la date' : 'Nouvelle date'" @close="showForm = false">
      <div class="field">
        <label>Salle / Festival</label>
        <input v-model="editing.venue" placeholder="Ex : La Cigale" />
      </div>
      <div class="field--row">
        <div class="field"><label>Ville</label><input v-model="editing.city" /></div>
        <div class="field"><label>Pays</label><input v-model="editing.country" /></div>
      </div>
      <div class="field--row">
        <div class="field"><label>Date</label><input v-model="editing.date" type="date" /></div>
        <div class="field"><label>Heure</label><input v-model="editing.time" type="time" /></div>
      </div>
      <div class="field--row">
        <div class="field">
          <label>Statut</label>
          <select v-model="editing.status">
            <option v-for="s in statuses" :key="s">{{ s }}</option>
          </select>
        </div>
        <div class="field">
          <label>Cachet (€)</label>
          <input v-if="isPro" v-model.number="editing.fee" type="number" min="0" />
          <RouterLink v-else to="/abonnement" class="btn btn--ghost btn--block">
            <Icon name="star" /> Réservé à Pro
          </RouterLink>
        </div>
      </div>
      <div class="field--row">
        <div class="field"><label>Jauge</label><input v-model.number="editing.capacity" type="number" min="0" /></div>
        <div class="field"><label>Billets vendus</label><input v-model.number="editing.ticketsSold" type="number" min="0" /></div>
      </div>
      <div class="field"><label>Promoteur</label><input v-model="editing.promoter" /></div>
      <div class="field"><label>Notes</label><textarea v-model="editing.notes" /></div>
      <template #footer>
        <button class="btn btn--subtle" @click="showForm = false">Annuler</button>
        <button class="btn btn--primary" :disabled="!editing.venue" @click="save"><Icon name="check" /> Enregistrer</button>
      </template>
    </Modal>

    <ConfirmDialog :open="!!toDelete" :label="toDelete ? `${toDelete.venue} (${toDelete.city})` : ''" @cancel="toDelete = null" @confirm="confirmDelete" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive } from 'vue'
import { RouterLink } from 'vue-router'
import PageHeader from '@/components/PageHeader.vue'
import Icon from '@/components/Icon.vue'
import Modal from '@/components/Modal.vue'
import EmptyState from '@/components/EmptyState.vue'
import ConfirmDialog from '@/components/ConfirmDialog.vue'
import { store, upsert, remove, uid, isPro } from '@/store'
import type { Concert } from '@/store/types'
import { money, number, dayNum, monthShort, daysFromNow } from '@/utils/format'

const statuses: Concert['status'][] = ['Confirmé', 'Option', 'Annoncé', 'Terminé']
const filters = ['Tous', 'À venir', 'Confirmé', 'Option', 'Terminé']

const q = ref('')
const activeFilter = ref('Tous')

const sorted = computed(() => [...store.concerts].sort((a, b) => a.date.localeCompare(b.date)))

const filtered = computed(() =>
  sorted.value.filter((c) => {
    const matchQ = !q.value || (c.venue + c.city + c.country + c.promoter).toLowerCase().includes(q.value.toLowerCase())
    let matchF = true
    if (activeFilter.value === 'À venir') matchF = c.status !== 'Terminé' && daysFromNow(c.date) >= 0
    else if (activeFilter.value !== 'Tous') matchF = c.status === activeFilter.value
    return matchQ && matchF
  }),
)

const upcoming = computed(() => store.concerts.filter((c) => c.status !== 'Terminé' && daysFromNow(c.date) >= 0))
const totalFees = computed(() => upcoming.value.reduce((s, c) => s + c.fee, 0))
const ticketsSold = computed(() => upcoming.value.reduce((s, c) => s + c.ticketsSold, 0))
const fillRate = computed(() => {
  const rel = store.concerts.filter((c) => c.capacity > 0)
  if (!rel.length) return 0
  return Math.round((rel.reduce((s, c) => s + c.ticketsSold / c.capacity, 0) / rel.length) * 100)
})

function pct(c: Concert): number {
  return c.capacity ? Math.min(100, Math.round((c.ticketsSold / c.capacity) * 100)) : 0
}
function isPast(c: Concert): boolean {
  return c.status === 'Terminé' || daysFromNow(c.date) < 0
}

const showForm = ref(false)
const emptyConcert = (): Concert => ({
  id: '',
  venue: '',
  city: '',
  country: 'France',
  date: '',
  time: '20:30',
  status: 'Option',
  capacity: 0,
  ticketsSold: 0,
  fee: 0,
  promoter: '',
  notes: '',
})
const editing = reactive<Concert>(emptyConcert())

function openNew() {
  Object.assign(editing, emptyConcert())
  showForm.value = true
}
function openEdit(c: Concert) {
  Object.assign(editing, JSON.parse(JSON.stringify(c)))
  showForm.value = true
}
function save() {
  if (!editing.id) editing.id = uid()
  upsert('concerts', JSON.parse(JSON.stringify(editing)))
  showForm.value = false
}

const toDelete = ref<Concert | null>(null)
function askDelete(c: Concert) {
  toDelete.value = c
}
function confirmDelete() {
  if (toDelete.value) remove('concerts', toDelete.value.id)
  toDelete.value = null
}

function statusBadge(status: string): string {
  return status === 'Confirmé'
    ? 'badge--green'
    : status === 'Option'
      ? 'badge--amber'
      : status === 'Terminé'
        ? 'badge--gray'
        : 'badge--blue'
}
</script>

<style scoped>
.concert-row {
  gap: 18px;
}
.datechip {
  width: 50px;
  height: 50px;
  border-radius: 12px;
  background: var(--brand-gradient-soft);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.datechip--past {
  background: var(--surface-2);
  filter: grayscale(1);
  opacity: 0.7;
}
.datechip__d {
  font-weight: 700;
  font-size: 18px;
  line-height: 1;
  color: var(--violet-700);
}
.datechip__m {
  font-size: 11px;
  color: var(--violet-600);
  text-transform: uppercase;
}
.concert-tickets {
  width: 150px;
  flex-shrink: 0;
}
.concert-fee {
  width: 90px;
  text-align: right;
  flex-shrink: 0;
}
.micro {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}
.locked {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 13px;
  font-weight: 700;
  color: var(--violet-600);
  background: var(--brand-gradient-soft);
  padding: 3px 10px;
  border-radius: 20px;
}
.locked svg {
  width: 13px;
  height: 13px;
  fill: var(--violet-600);
}
.locked:hover {
  background: var(--violet-200);
}
.locked--sm {
  font-size: 12px;
  padding: 2px 8px;
}
.icon-sm {
  width: 34px;
  height: 34px;
  border-radius: 9px;
  border: 1px solid var(--border-strong);
  background: var(--surface);
  color: var(--text-soft);
  display: grid;
  place-items: center;
}
.icon-sm svg {
  width: 16px;
  height: 16px;
}
.icon-sm:hover {
  background: var(--surface-2);
  color: var(--text);
}
.icon-sm--danger:hover {
  background: var(--red-bg);
  color: var(--red);
  border-color: var(--red-bg);
}
@media (max-width: 760px) {
  .concert-tickets,
  .concert-fee {
    display: none;
  }
}
</style>
