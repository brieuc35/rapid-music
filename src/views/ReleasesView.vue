<template>
  <div class="page">
    <PageHeader title="Sorties" subtitle="Votre catalogue : singles, EP, albums et plus.">
      <template #actions>
        <button class="btn btn--primary" @click="openNew"><Icon name="plus" /> Nouvelle sortie</button>
      </template>
    </PageHeader>

    <div class="grid grid--stats" style="margin-bottom: 22px">
      <div class="stat">
        <div class="stat__val mono">{{ store.releases.length }}</div>
        <div class="stat__label">Titres au catalogue</div>
      </div>
      <div class="stat">
        <div class="stat__val mono" style="color: var(--green)">{{ published }}</div>
        <div class="stat__label">Publiés</div>
      </div>
      <div class="stat">
        <div class="stat__val mono" style="color: var(--violet-600)">{{ planned }}</div>
        <div class="stat__label">À venir</div>
      </div>
      <div class="stat">
        <div class="stat__val mono">{{ compact(totalStreams) }}</div>
        <div class="stat__label">Streams cumulés</div>
      </div>
    </div>

    <div class="toolbar">
      <div class="search">
        <Icon name="search" />
        <input v-model="q" placeholder="Rechercher un titre…" />
      </div>
      <div class="chips">
        <button v-for="f in filters" :key="f" class="chip" :class="{ 'chip--active': activeFilter === f }" @click="activeFilter = f">{{ f }}</button>
      </div>
    </div>

    <div v-if="filtered.length" class="grid grid--cards">
      <div v-for="r in filtered" :key="r.id" class="card release">
        <div class="release__cover" :style="{ background: coverGradient(r.cover) }">
          <span class="release__type">{{ r.type }}</span>
          <Icon name="music" class="release__note" />
          <span class="badge release__status" :class="statusBadge(r.status)">{{ r.status }}</span>
        </div>
        <div class="release__body">
          <h3 class="release__title">{{ r.title }}</h3>
          <div class="soft" style="font-size: 13px">
            {{ formatDate(r.date) }}<template v-if="r.featuring"> · feat. {{ r.featuring }}</template>
          </div>

          <div class="release__stats">
            <div>
              <div class="mono" style="font-weight: 700; font-size: 15px">{{ compact(r.streams) }}</div>
              <div class="muted micro">streams</div>
            </div>
            <div v-if="r.isrc">
              <div class="mono" style="font-size: 13px">{{ r.isrc }}</div>
              <div class="muted micro">ISRC</div>
            </div>
          </div>

          <div class="release__actions">
            <button class="btn btn--ghost btn--sm" @click="openEdit(r)"><Icon name="edit" /> Modifier</button>
            <button class="btn btn--danger btn--sm" @click="askDelete(r)"><Icon name="trash" /></button>
          </div>
        </div>
      </div>
    </div>

    <EmptyState v-else icon="release" title="Aucune sortie" text="Ajoutez votre premier titre au catalogue.">
      <button class="btn btn--primary" @click="openNew"><Icon name="plus" /> Nouvelle sortie</button>
    </EmptyState>

    <Modal :open="showForm" :title="editing.id ? 'Modifier la sortie' : 'Nouvelle sortie'" @close="showForm = false">
      <div class="field"><label>Titre</label><input v-model="editing.title" placeholder="Ex : Néon" /></div>
      <div class="field--row">
        <div class="field">
          <label>Type</label>
          <select v-model="editing.type"><option v-for="t in types" :key="t">{{ t }}</option></select>
        </div>
        <div class="field">
          <label>Statut</label>
          <select v-model="editing.status"><option v-for="s in statuses" :key="s">{{ s }}</option></select>
        </div>
      </div>
      <div class="field"><label>Date de sortie</label><input v-model="editing.date" type="date" /></div>
      <div class="field--row">
        <div class="field"><label>Featuring</label><input v-model="editing.featuring" placeholder="Optionnel" /></div>
        <div class="field"><label>ISRC</label><input v-model="editing.isrc" placeholder="FR-XXX-..." /></div>
      </div>
      <div class="field">
        <label>Couleur de pochette</label>
        <div class="swatches">
          <button
            v-for="col in palette"
            :key="col"
            class="swatch"
            :class="{ 'swatch--active': editing.cover === col }"
            :style="{ background: col }"
            @click="editing.cover = col"
          />
        </div>
      </div>
      <div class="field"><label>Notes</label><textarea v-model="editing.notes" /></div>
      <template #footer>
        <button class="btn btn--subtle" @click="showForm = false">Annuler</button>
        <button class="btn btn--primary" :disabled="!editing.title" @click="save"><Icon name="check" /> Enregistrer</button>
      </template>
    </Modal>

    <ConfirmDialog :open="!!toDelete" :label="toDelete?.title" @cancel="toDelete = null" @confirm="confirmDelete" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive } from 'vue'
import PageHeader from '@/components/PageHeader.vue'
import Icon from '@/components/Icon.vue'
import Modal from '@/components/Modal.vue'
import EmptyState from '@/components/EmptyState.vue'
import ConfirmDialog from '@/components/ConfirmDialog.vue'
import { store, upsert, remove, uid } from '@/store'
import type { Release } from '@/store/types'
import { compact, formatDate } from '@/utils/format'

const types: Release['type'][] = ['Single', 'EP', 'Album', 'Remix', 'Featuring']
const statuses: Release['status'][] = ['Publié', 'Planifié', 'Master prêt', 'En production']
const filters = ['Tous', 'Publié', 'Planifié', 'Master prêt', 'En production']
const palette = ['#8b5cf6', '#ec4899', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4', '#f43f5e']

const q = ref('')
const activeFilter = ref('Tous')

const sorted = computed(() => [...store.releases].sort((a, b) => b.date.localeCompare(a.date)))
const filtered = computed(() =>
  sorted.value.filter((r) => {
    const matchQ = !q.value || (r.title + r.featuring).toLowerCase().includes(q.value.toLowerCase())
    const matchF = activeFilter.value === 'Tous' || r.status === activeFilter.value
    return matchQ && matchF
  }),
)

const published = computed(() => store.releases.filter((r) => r.status === 'Publié').length)
const planned = computed(() => store.releases.filter((r) => r.status !== 'Publié').length)
const totalStreams = computed(() => store.releases.reduce((s, r) => s + r.streams, 0))

const showForm = ref(false)
const emptyRelease = (): Release => ({
  id: '',
  title: '',
  type: 'Single',
  date: '',
  status: 'Planifié',
  cover: '#8b5cf6',
  streams: 0,
  isrc: '',
  featuring: '',
  notes: '',
})
const editing = reactive<Release>(emptyRelease())

function openNew() {
  Object.assign(editing, emptyRelease())
  showForm.value = true
}
function openEdit(r: Release) {
  Object.assign(editing, JSON.parse(JSON.stringify(r)))
  showForm.value = true
}
function save() {
  if (!editing.id) editing.id = uid()
  upsert('releases', JSON.parse(JSON.stringify(editing)))
  showForm.value = false
}

const toDelete = ref<Release | null>(null)
function askDelete(r: Release) {
  toDelete.value = r
}
function confirmDelete() {
  if (toDelete.value) remove('releases', toDelete.value.id)
  toDelete.value = null
}

function coverGradient(hex: string): string {
  return `linear-gradient(140deg, ${hex}, ${hex}99)`
}
function statusBadge(status: string): string {
  return status === 'Publié' ? 'badge--green' : status === 'Master prêt' ? 'badge--blue' : status === 'En production' ? 'badge--amber' : 'badge--violet'
}
</script>

<style scoped>
.release {
  overflow: hidden;
  display: flex;
  flex-direction: column;
}
.release__cover {
  aspect-ratio: 16 / 9;
  position: relative;
  display: grid;
  place-items: center;
}
.release__note {
  width: 44px;
  height: 44px;
  color: rgba(255, 255, 255, 0.9);
}
.release__type {
  position: absolute;
  top: 12px;
  left: 12px;
  background: rgba(0, 0, 0, 0.28);
  color: #fff;
  font-size: 11px;
  font-weight: 600;
  padding: 3px 10px;
  border-radius: 20px;
  backdrop-filter: blur(4px);
}
.release__status {
  position: absolute;
  bottom: 12px;
  right: 12px;
  background: rgba(255, 255, 255, 0.92) !important;
}
.release__body {
  padding: 16px 18px 18px;
}
.release__title {
  font-size: 17px;
  font-weight: 700;
  letter-spacing: -0.01em;
}
.release__stats {
  display: flex;
  gap: 22px;
  padding: 14px 0;
  margin-top: 10px;
  border-top: 1px solid var(--border);
}
.micro {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  margin-top: 2px;
}
.release__actions {
  display: flex;
  gap: 8px;
}
.release__actions .btn:first-child {
  flex: 1;
}
.swatches {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}
.swatch {
  width: 34px;
  height: 34px;
  border-radius: 10px;
  border: 2px solid transparent;
  box-shadow: var(--shadow-sm);
  transition: transform 0.1s;
}
.swatch:hover {
  transform: scale(1.08);
}
.swatch--active {
  border-color: var(--text);
  box-shadow: 0 0 0 3px var(--violet-100);
}
</style>
