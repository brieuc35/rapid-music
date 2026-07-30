<template>
  <div class="page">
    <PageHeader title="Calendrier studio" subtitle="Sessions d'enregistrement, mix, répétitions et réunions.">
      <template #actions>
        <button class="btn btn--primary" @click="openNew"><Icon name="plus" /> Réserver une session</button>
      </template>
    </PageHeader>

    <div class="studio-layout">
      <!-- Calendar -->
      <div class="card card--pad">
        <div class="cal-head">
          <div class="hstack" style="gap: 6px">
            <button class="icon-sm" @click="shiftMonth(-1)"><Icon name="up" style="transform: rotate(-90deg)" /></button>
            <button class="icon-sm" @click="shiftMonth(1)"><Icon name="down" style="transform: rotate(-90deg)" /></button>
          </div>
          <h3 class="cal-title">{{ monthLabel }}</h3>
          <button class="btn btn--subtle btn--sm" @click="goToday">Aujourd'hui</button>
        </div>

        <div class="cal-grid cal-grid--head">
          <span v-for="d in weekDays" :key="d">{{ d }}</span>
        </div>
        <div class="cal-grid">
          <button
            v-for="(cell, i) in cells"
            :key="i"
            class="cal-cell"
            :class="{ 'cal-cell--out': !cell.inMonth, 'cal-cell--today': cell.isToday, 'cal-cell--sel': cell.iso === selectedDate }"
            @click="selectDate(cell.iso)"
          >
            <span class="cal-cell__num">{{ cell.day }}</span>
            <span class="cal-cell__dots">
              <span
                v-for="s in cell.sessions.slice(0, 3)"
                :key="s.id"
                class="cal-dot"
                :style="{ background: typeColor(s.type) }"
              />
            </span>
          </button>
        </div>
      </div>

      <!-- Day detail / upcoming -->
      <div class="card card--pad">
        <div class="section-head">
          <span class="section-head__title">{{ selectedDate ? formatDate(selectedDate, { weekday: 'long', day: 'numeric', month: 'long' }) : 'Sessions à venir' }}</span>
          <button v-if="selectedDate" class="btn btn--subtle btn--sm" @click="selectedDate = ''">Tout voir</button>
        </div>

        <div class="vstack" style="gap: 10px; margin-top: 6px">
          <div v-for="s in sideList" :key="s.id" class="sess">
            <span class="sess__bar" :style="{ background: typeColor(s.type) }" />
            <div class="sess__main">
              <div class="hstack" style="gap: 8px; justify-content: space-between">
                <b style="font-size: 14px">{{ s.title }}</b>
                <span class="badge badge--plain" :style="{ color: typeColor(s.type), background: typeColor(s.type) + '1f' }">{{ s.type }}</span>
              </div>
              <div class="row__sub" style="margin-top: 3px">
                <Icon name="pin" style="width: 12px; height: 12px; vertical-align: -1px" /> {{ s.studio }}
                · <Icon name="clock" style="width: 12px; height: 12px; vertical-align: -1px" /> {{ s.startTime }}–{{ s.endTime }}
                <template v-if="!selectedDate"> · {{ formatDate(s.date) }}</template>
              </div>
              <div v-if="s.engineer && s.engineer !== '—'" class="muted" style="font-size: 12.5px; margin-top: 2px">Ingé : {{ s.engineer }}</div>
            </div>
            <div class="vstack" style="align-items: flex-end; gap: 6px">
              <b v-if="s.cost" class="mono" style="font-size: 13px">{{ money(s.cost) }}</b>
              <span class="hstack" style="gap: 5px">
                <button class="icon-sm" @click="openEdit(s)"><Icon name="edit" /></button>
                <button class="icon-sm icon-sm--danger" @click="askDelete(s)"><Icon name="trash" /></button>
              </span>
            </div>
          </div>

          <EmptyState
            v-if="!sideList.length"
            icon="studio"
            :title="selectedDate ? 'Journée libre' : 'Aucune session à venir'"
            :text="selectedDate ? 'Aucune session ce jour.' : 'Réservez votre prochaine session.'"
          />
        </div>
      </div>
    </div>

    <Modal :open="showForm" :title="editing.id ? 'Modifier la session' : 'Nouvelle session'" @close="showForm = false">
      <div class="field"><label>Intitulé</label><input v-model="editing.title" placeholder="Ex : Enregistrement voix" /></div>
      <div class="field--row">
        <div class="field"><label>Studio</label><input v-model="editing.studio" /></div>
        <div class="field">
          <label>Type</label>
          <select v-model="editing.type"><option v-for="t in types" :key="t">{{ t }}</option></select>
        </div>
      </div>
      <div class="field--row">
        <div class="field"><label>Date</label><input v-model="editing.date" type="date" /></div>
        <div class="field"><label>Coût (€)</label><input v-model.number="editing.cost" type="number" min="0" /></div>
      </div>
      <div class="field--row">
        <div class="field"><label>Début</label><input v-model="editing.startTime" type="time" /></div>
        <div class="field"><label>Fin</label><input v-model="editing.endTime" type="time" /></div>
      </div>
      <div class="field"><label>Ingénieur / Intervenant</label><input v-model="editing.engineer" /></div>
      <div class="field"><label>Notes</label><textarea v-model="editing.notes" /></div>
      <template #footer>
        <button class="btn btn--subtle" @click="showForm = false">Annuler</button>
        <button class="btn btn--primary" :disabled="!editing.title || !editing.date" @click="save"><Icon name="check" /> Enregistrer</button>
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
import type { StudioSession } from '@/store/types'
import { money, formatDate, daysFromNow } from '@/utils/format'

const types: StudioSession['type'][] = ['Enregistrement', 'Mix', 'Mastering', 'Répétition', 'Écriture', 'Réunion']
const typeColors: Record<string, string> = {
  Enregistrement: '#8b5cf6',
  Mix: '#3b82f6',
  Mastering: '#ec4899',
  Répétition: '#10b981',
  Écriture: '#f59e0b',
  Réunion: '#06b6d4',
}
function typeColor(t: string): string {
  return typeColors[t] ?? '#8b5cf6'
}

const weekDays = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']

function toISO(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const cursor = ref(new Date())
const selectedDate = ref('')

const monthLabel = computed(() =>
  cursor.value.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }),
)

function shiftMonth(delta: number) {
  const d = new Date(cursor.value)
  d.setMonth(d.getMonth() + delta)
  cursor.value = d
}
function goToday() {
  cursor.value = new Date()
  selectedDate.value = toISO(new Date())
}

const cells = computed(() => {
  const year = cursor.value.getFullYear()
  const month = cursor.value.getMonth()
  const first = new Date(year, month, 1)
  const startOffset = (first.getDay() + 6) % 7 // Monday-first
  const start = new Date(year, month, 1 - startOffset)
  const todayISO = toISO(new Date())
  const out = []
  for (let i = 0; i < 42; i++) {
    const d = new Date(start)
    d.setDate(start.getDate() + i)
    const iso = toISO(d)
    out.push({
      iso,
      day: d.getDate(),
      inMonth: d.getMonth() === month,
      isToday: iso === todayISO,
      sessions: store.studio.filter((s) => s.date === iso),
    })
  }
  return out
})

function selectDate(iso: string) {
  selectedDate.value = selectedDate.value === iso ? '' : iso
}

const sideList = computed(() => {
  if (selectedDate.value) {
    return store.studio
      .filter((s) => s.date === selectedDate.value)
      .sort((a, b) => a.startTime.localeCompare(b.startTime))
  }
  return store.studio
    .filter((s) => daysFromNow(s.date) >= 0)
    .sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime))
})

const showForm = ref(false)
const emptySession = (): StudioSession => ({
  id: '',
  title: '',
  studio: '',
  date: selectedDate.value || toISO(new Date()),
  startTime: '10:00',
  endTime: '14:00',
  type: 'Enregistrement',
  cost: 0,
  engineer: '',
  notes: '',
})
const editing = reactive<StudioSession>(emptySession())

function openNew() {
  Object.assign(editing, emptySession())
  showForm.value = true
}
function openEdit(s: StudioSession) {
  Object.assign(editing, JSON.parse(JSON.stringify(s)))
  showForm.value = true
}
function save() {
  if (!editing.id) editing.id = uid()
  upsert('studio', JSON.parse(JSON.stringify(editing)))
  showForm.value = false
}

const toDelete = ref<StudioSession | null>(null)
function askDelete(s: StudioSession) {
  toDelete.value = s
}
function confirmDelete() {
  if (toDelete.value) remove('studio', toDelete.value.id)
  toDelete.value = null
}
</script>

<style scoped>
.studio-layout {
  display: grid;
  grid-template-columns: 1.35fr 1fr;
  gap: 18px;
  align-items: start;
}
@media (max-width: 980px) {
  .studio-layout {
    grid-template-columns: 1fr;
  }
}

.cal-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}
.cal-title {
  font-size: 17px;
  font-weight: 700;
  text-transform: capitalize;
}
.cal-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 6px;
}
.cal-grid--head {
  margin-bottom: 8px;
}
.cal-grid--head span {
  text-align: center;
  font-size: 11.5px;
  font-weight: 600;
  color: var(--text-muted);
  text-transform: uppercase;
}
.cal-cell {
  aspect-ratio: 1;
  border: 1px solid var(--border);
  background: var(--surface);
  border-radius: 11px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  padding: 7px 4px 4px;
  gap: 5px;
  transition: all 0.12s;
}
.cal-cell:hover {
  border-color: var(--violet-400);
  background: var(--violet-50);
}
.cal-cell__num {
  font-size: 13.5px;
  font-weight: 600;
  color: var(--text);
}
.cal-cell--out {
  opacity: 0.38;
}
.cal-cell--today {
  border-color: var(--violet-400);
}
.cal-cell--today .cal-cell__num {
  background: var(--brand-gradient);
  color: #fff;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: grid;
  place-items: center;
}
.cal-cell--sel {
  border-color: var(--violet-600);
  box-shadow: 0 0 0 2px var(--violet-100);
}
.cal-cell__dots {
  display: flex;
  gap: 3px;
}
.cal-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
}

.sess {
  display: flex;
  gap: 12px;
  padding: 12px;
  border: 1px solid var(--border);
  border-radius: 13px;
  background: var(--surface);
}
.sess:hover {
  background: var(--surface-2);
}
.sess__bar {
  width: 4px;
  border-radius: 4px;
  flex-shrink: 0;
}
.sess__main {
  flex: 1;
  min-width: 0;
}
.icon-sm {
  width: 30px;
  height: 30px;
  border-radius: 8px;
  border: 1px solid var(--border-strong);
  background: var(--surface);
  color: var(--text-soft);
  display: grid;
  place-items: center;
}
.icon-sm svg {
  width: 15px;
  height: 15px;
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
</style>
