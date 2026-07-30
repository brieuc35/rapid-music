<template>
  <div class="page">
    <PageHeader title="Royalties & Revenus" subtitle="Suivi de vos revenus des plateformes de streaming.">
      <template #actions>
        <button class="btn btn--primary" @click="openNew"><Icon name="plus" /> Ajouter un relevé</button>
      </template>
    </PageHeader>

    <div class="grid grid--stats" style="margin-bottom: 22px">
      <div class="stat">
        <div class="stat__ico" style="background: var(--green-bg); color: var(--green)"><Icon name="wallet" /></div>
        <div class="stat__val mono">{{ money(totalRevenue) }}</div>
        <div class="stat__label">Revenus cumulés</div>
      </div>
      <div class="stat">
        <div class="stat__ico" style="background: var(--violet-100); color: var(--violet-600)"><Icon name="release" /></div>
        <div class="stat__val mono">{{ compact(totalStreams) }}</div>
        <div class="stat__label">Streams cumulés</div>
      </div>
      <div class="stat">
        <div class="stat__ico" style="background: var(--blue-bg); color: var(--blue)"><Icon name="money" /></div>
        <div class="stat__val mono">{{ money(avgPerThousand, true) }}</div>
        <div class="stat__label">Revenu moyen / 1000 streams</div>
      </div>
      <div class="stat">
        <div class="stat__ico" style="background: var(--amber-bg); color: var(--amber)"><Icon name="star" /></div>
        <div class="stat__val" style="font-size: 20px">{{ topPlatform }}</div>
        <div class="stat__label">Plateforme n°1</div>
      </div>
    </div>

    <div class="grid grid--2">
      <!-- Chart -->
      <div class="card card--pad">
        <div class="section-head"><span class="section-head__title">Évolution des revenus</span></div>
        <div class="chart">
          <div v-for="pt in chartData" :key="pt.period" class="chart__col">
            <div class="chart__bar-wrap">
              <span class="chart__val mono">{{ money(pt.amount) }}</span>
              <div class="chart__bar" :style="{ height: pt.h + '%' }" />
            </div>
            <span class="chart__label">{{ pt.period }}</span>
          </div>
        </div>
      </div>

      <!-- By platform (latest period) -->
      <div class="card card--pad">
        <div class="section-head">
          <span class="section-head__title">Par plateforme</span>
          <select v-model="selectedPeriod" class="mini-select">
            <option v-for="p in periods" :key="p">{{ p }}</option>
          </select>
        </div>
        <div class="vstack" style="gap: 15px; margin-top: 4px">
          <div v-for="p in byPlatform" :key="p.platform" class="vstack" style="gap: 6px">
            <div class="hstack" style="justify-content: space-between; font-size: 13.5px">
              <span class="hstack" style="gap: 8px"><span class="dot" :style="{ background: p.color }" /><b>{{ p.platform }}</b></span>
              <span class="soft mono">{{ money(p.amount) }} · {{ compact(p.streams) }} streams</span>
            </div>
            <div class="bar"><div class="bar__fill" :style="{ width: p.pct + '%', background: p.color }" /></div>
          </div>
          <p v-if="!byPlatform.length" class="muted" style="text-align: center; padding: 20px">Aucune donnée pour cette période.</p>
        </div>
      </div>
    </div>

    <!-- Detailed table -->
    <div class="card" style="margin-top: 18px; overflow: hidden">
      <div class="section-head" style="padding: 18px 20px 12px"><span class="section-head__title">Relevés détaillés</span></div>
      <div class="tablewrap">
        <table class="tbl">
          <thead>
            <tr>
              <th>Plateforme</th>
              <th>Période</th>
              <th style="text-align: right">Streams</th>
              <th style="text-align: right">Revenu net</th>
              <th style="text-align: right">/ 1000</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="r in sortedRoyalties" :key="r.id">
              <td>
                <span class="hstack" style="gap: 9px"><span class="dot" :style="{ background: r.color }" /><b>{{ r.platform }}</b></span>
              </td>
              <td class="soft">{{ r.period }}</td>
              <td class="mono" style="text-align: right">{{ number(r.streams) }}</td>
              <td class="mono" style="text-align: right; font-weight: 600">{{ money(r.amount) }}</td>
              <td class="mono soft" style="text-align: right">{{ r.streams ? money((r.amount / r.streams) * 1000, true) : '—' }}</td>
              <td style="text-align: right">
                <span class="hstack" style="gap: 6px; justify-content: flex-end">
                  <button class="icon-sm" @click="openEdit(r)"><Icon name="edit" /></button>
                  <button class="icon-sm icon-sm--danger" @click="askDelete(r)"><Icon name="trash" /></button>
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <Modal :open="showForm" :title="editing.id ? 'Modifier le relevé' : 'Nouveau relevé'" @close="showForm = false">
      <div class="field--row">
        <div class="field">
          <label>Plateforme</label>
          <input v-model="editing.platform" list="platforms" placeholder="Spotify, Apple Music…" @input="syncColor" />
          <datalist id="platforms">
            <option v-for="p in Object.keys(platformColors)" :key="p" :value="p" />
          </datalist>
        </div>
        <div class="field"><label>Période</label><input v-model="editing.period" placeholder="Ex : Juin 2026" /></div>
      </div>
      <div class="field--row">
        <div class="field"><label>Streams</label><input v-model.number="editing.streams" type="number" min="0" /></div>
        <div class="field"><label>Revenu net (€)</label><input v-model.number="editing.amount" type="number" min="0" step="0.01" /></div>
      </div>
      <template #footer>
        <button class="btn btn--subtle" @click="showForm = false">Annuler</button>
        <button class="btn btn--primary" :disabled="!editing.platform || !editing.period" @click="save"><Icon name="check" /> Enregistrer</button>
      </template>
    </Modal>

    <ConfirmDialog :open="!!toDelete" :label="toDelete ? `${toDelete.platform} — ${toDelete.period}` : ''" @cancel="toDelete = null" @confirm="confirmDelete" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive } from 'vue'
import PageHeader from '@/components/PageHeader.vue'
import Icon from '@/components/Icon.vue'
import Modal from '@/components/Modal.vue'
import ConfirmDialog from '@/components/ConfirmDialog.vue'
import { store, upsert, remove, uid } from '@/store'
import type { RoyaltyEntry } from '@/store/types'
import { money, number, compact } from '@/utils/format'

const platformColors: Record<string, string> = {
  Spotify: '#1db954',
  'Apple Music': '#fa2d48',
  Deezer: '#ef5466',
  'YouTube Music': '#ff0000',
  'Amazon Music': '#25d1da',
  Tidal: '#000000',
  Bandcamp: '#629aa9',
  SoundCloud: '#ff5500',
}

const totalRevenue = computed(() => store.royalties.reduce((s, r) => s + r.amount, 0))
const totalStreams = computed(() => store.royalties.reduce((s, r) => s + r.streams, 0))
const avgPerThousand = computed(() => (totalStreams.value ? (totalRevenue.value / totalStreams.value) * 1000 : 0))

const topPlatform = computed(() => {
  const map = new Map<string, number>()
  store.royalties.forEach((r) => map.set(r.platform, (map.get(r.platform) ?? 0) + r.amount))
  let best = '—'
  let max = -1
  map.forEach((v, k) => {
    if (v > max) {
      max = v
      best = k
    }
  })
  return best
})

// periods ordered by first appearance in seed (latest first)
const periods = computed(() => Array.from(new Set(store.royalties.map((r) => r.period))))
const selectedPeriod = ref(periods.value[0] ?? '')

const byPlatform = computed(() => {
  const rows = store.royalties.filter((r) => r.period === selectedPeriod.value)
  const max = Math.max(1, ...rows.map((r) => r.amount))
  return rows.sort((a, b) => b.amount - a.amount).map((r) => ({ ...r, pct: Math.round((r.amount / max) * 100) }))
})

const chartData = computed(() => {
  const map = new Map<string, number>()
  store.royalties.forEach((r) => map.set(r.period, (map.get(r.period) ?? 0) + r.amount))
  const arr = Array.from(map.entries()).map(([period, amount]) => ({ period, amount }))
  arr.reverse() // chronological-ish (oldest -> newest as stored newest-first)
  const max = Math.max(1, ...arr.map((a) => a.amount))
  return arr.map((a) => ({ ...a, h: Math.round((a.amount / max) * 100) }))
})

const sortedRoyalties = computed(() =>
  [...store.royalties].sort((a, b) => b.period.localeCompare(a.period) || b.amount - a.amount),
)

const showForm = ref(false)
const emptyEntry = (): RoyaltyEntry => ({ id: '', platform: '', period: '', streams: 0, amount: 0, color: '#8b5cf6' })
const editing = reactive<RoyaltyEntry>(emptyEntry())

function syncColor() {
  const c = platformColors[editing.platform]
  if (c) editing.color = c
}
function openNew() {
  Object.assign(editing, emptyEntry())
  showForm.value = true
}
function openEdit(r: RoyaltyEntry) {
  Object.assign(editing, JSON.parse(JSON.stringify(r)))
  showForm.value = true
}
function save() {
  if (!editing.id) editing.id = uid()
  if (!platformColors[editing.platform] && editing.color === '#8b5cf6') {
    // keep default
  }
  syncColor()
  upsert('royalties', JSON.parse(JSON.stringify(editing)))
  if (!periods.value.includes(selectedPeriod.value)) selectedPeriod.value = editing.period
  showForm.value = false
}

const toDelete = ref<RoyaltyEntry | null>(null)
function askDelete(r: RoyaltyEntry) {
  toDelete.value = r
}
function confirmDelete() {
  if (toDelete.value) remove('royalties', toDelete.value.id)
  toDelete.value = null
}
</script>

<style scoped>
.dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
}
.mini-select {
  border: 1px solid var(--border-strong);
  border-radius: 9px;
  padding: 6px 10px;
  background: var(--surface);
  color: var(--text);
  font-size: 13px;
  outline: none;
}
.icon-sm {
  width: 32px;
  height: 32px;
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

/* Chart */
.chart {
  display: flex;
  align-items: flex-end;
  gap: 14px;
  height: 220px;
  padding-top: 20px;
}
.chart__col {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  height: 100%;
  justify-content: flex-end;
  gap: 8px;
}
.chart__bar-wrap {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-end;
  flex: 1;
  gap: 6px;
}
.chart__bar {
  width: 60%;
  max-width: 46px;
  min-height: 4px;
  border-radius: 8px 8px 4px 4px;
  background: var(--brand-gradient);
  transition: height 0.4s cubic-bezier(0.2, 0.8, 0.2, 1);
}
.chart__val {
  font-size: 11.5px;
  font-weight: 600;
  color: var(--text-soft);
}
.chart__label {
  font-size: 12px;
  color: var(--text-muted);
  white-space: nowrap;
}
</style>
