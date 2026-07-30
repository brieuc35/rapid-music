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

    <!-- Comptes des plateformes -->
    <div class="section-head" style="margin: 28px 0 14px">
      <span class="section-head__title">Comptes des plateformes</span>
    </div>

    <div class="notice">
      <Icon name="bell" />
      <div>
        <b>La synchronisation automatique n'est pas disponible.</b>
        Spotify, Apple Music et Deezer n'exposent aucune API publique de revenus par
        artiste, et une connexion sécurisée à votre compte exigerait un serveur —
        RapidMusic fonctionne sans serveur, directement dans votre navigateur.
        Vous pouvez en revanche lier la référence de vos profils et
        <b>importer les relevés de votre distributeur</b> pour alimenter vos revenus.
      </div>
    </div>

    <div class="grid grid--cards" style="margin-bottom: 8px">
      <PlatformCard
        v-for="p in platformList"
        :key="p.name"
        :platform="p.name"
        :color="p.color"
        :link="p.link"
        :total="p.total"
        @link="openLink"
        @import="openImport"
      />
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

    <!-- Lier / gérer un compte -->
    <Modal :open="!!linkTarget" :title="`Compte ${linkTarget}`" @close="linkTarget = ''">
      <div class="field">
        <label>Profil artiste sur {{ linkTarget }}</label>
        <input v-model="linkAccount" :placeholder="accountPlaceholder" />
        <p class="field-help">
          Identifiant, nom d'artiste ou lien vers votre page — conservé comme référence.
        </p>
      </div>
      <div class="notice notice--sm">
        <Icon name="bell" />
        <div>
          Aucune donnée n'est récupérée automatiquement depuis {{ linkTarget }} :
          utilisez « Importer » pour charger un relevé de votre distributeur.
        </div>
      </div>
      <template #footer>
        <button v-if="existingLink" class="btn btn--danger" @click="unlink">
          <Icon name="trash" /> Délier
        </button>
        <button class="btn btn--subtle" @click="linkTarget = ''">Annuler</button>
        <button class="btn btn--primary" :disabled="!linkAccount.trim()" @click="saveLinkAccount">
          <Icon name="check" /> Enregistrer
        </button>
      </template>
    </Modal>

    <!-- Import d'un relevé -->
    <Modal :open="!!importTarget" :title="`Importer un relevé — ${importTarget}`" @close="closeImport">
      <template v-if="!importPreview.length">
        <p class="soft" style="margin: 0 0 14px; line-height: 1.6">
          Chargez le relevé CSV fourni par votre distributeur. Le fichier doit contenir
          une colonne <b>période</b>, une colonne <b>streams</b> et une colonne
          <b>revenu</b> — les intitulés exacts et le séparateur sont détectés
          automatiquement.
        </p>
        <input ref="csvInput" type="file" accept=".csv,text/csv,text/plain" class="hidden" @change="onCsvSelected" />
        <button class="btn btn--ghost btn--block" @click="csvInput?.click()">
          <Icon name="doc" /> Choisir un fichier CSV
        </button>
        <p class="field-help" style="text-align: center; margin-top: 10px">
          Exemple d'en-tête : <code>Période;Streams;Revenu net</code>
        </p>
      </template>

      <template v-else>
        <p class="soft" style="margin: 0 0 12px">
          <b>{{ importPreview.length }}</b> ligne(s) prête(s) à être importée(s) pour
          <b>{{ importTarget }}</b> :
        </p>
        <div class="tablewrap" style="max-height: 220px; overflow-y: auto">
          <table class="tbl">
            <thead>
              <tr><th>Période</th><th style="text-align: right">Streams</th><th style="text-align: right">Revenu</th></tr>
            </thead>
            <tbody>
              <tr v-for="(r, i) in importPreview" :key="i">
                <td>{{ r.period }}</td>
                <td class="mono" style="text-align: right">{{ number(r.streams) }}</td>
                <td class="mono" style="text-align: right">{{ money(r.amount, true) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p class="field-help" style="margin-top: 12px">
          Une période déjà présente pour {{ importTarget }} sera mise à jour.
        </p>
      </template>

      <div v-if="importProblems.length" class="import-problems">
        <b>{{ importProblems.length }} avertissement(s) :</b>
        <ul>
          <li v-for="(p, i) in importProblems.slice(0, 5)" :key="i">{{ p }}</li>
        </ul>
        <span v-if="importProblems.length > 5" class="muted">
          … et {{ importProblems.length - 5 }} autre(s).
        </span>
      </div>

      <template #footer>
        <button class="btn btn--subtle" @click="closeImport">Annuler</button>
        <button
          v-if="importPreview.length"
          class="btn btn--primary"
          @click="confirmImport"
        >
          <Icon name="check" /> Importer {{ importPreview.length }} ligne(s)
        </button>
      </template>
    </Modal>

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
import PlatformCard from '@/components/PlatformCard.vue'
import { store, upsert, remove, uid, getLink, saveLink, removeLink } from '@/store'
import type { RoyaltyEntry } from '@/store/types'
import { money, number, compact, formatDate } from '@/utils/format'
import { platformColors, platformColor } from '@/utils/platforms'
import { parseRoyaltyCsv, type ParsedRow } from '@/utils/csv'

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
  return rows
    .sort((a, b) => b.amount - a.amount)
    .map((r) => ({
      ...r,
      color: platformColor(r.platform, r.color),
      pct: Math.round((r.amount / max) * 100),
    }))
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
  [...store.royalties]
    .sort((a, b) => b.period.localeCompare(a.period) || b.amount - a.amount)
    .map((r) => ({ ...r, color: platformColor(r.platform, r.color) })),
)

/* ---------------------------------------------------------------------- */
/*  Comptes des plateformes                                               */
/* ---------------------------------------------------------------------- */

/** Plateformes de référence, plus toute plateforme déjà présente dans les données. */
const platformList = computed(() => {
  const names = new Set([...Object.keys(platformColors), ...store.royalties.map((r) => r.platform)])
  return [...names]
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b))
    .map((name) => ({
      name,
      color: platformColor(name),
      link: getLink(name),
      total: store.royalties
        .filter((r) => r.platform === name)
        .reduce((s, r) => s + r.amount, 0),
    }))
})

const linkTarget = ref('')
const linkAccount = ref('')
const existingLink = computed(() => (linkTarget.value ? getLink(linkTarget.value) : undefined))
const accountPlaceholder = computed(() =>
  linkTarget.value === 'Spotify'
    ? 'open.spotify.com/artist/…'
    : `Votre profil ${linkTarget.value}`,
)

function openLink(platform: string) {
  linkTarget.value = platform
  linkAccount.value = getLink(platform)?.account ?? ''
}
function saveLinkAccount() {
  const current = getLink(linkTarget.value)
  saveLink({
    platform: linkTarget.value,
    account: linkAccount.value.trim(),
    lastImport: current?.lastImport ?? '',
    lastImportCount: current?.lastImportCount ?? 0,
  })
  linkTarget.value = ''
}
function unlink() {
  removeLink(linkTarget.value)
  linkTarget.value = ''
}

/* Import de relevé */
const importTarget = ref('')
const importPreview = ref<ParsedRow[]>([])
const importProblems = ref<string[]>([])
const csvInput = ref<HTMLInputElement | null>(null)

function openImport(platform: string) {
  importTarget.value = platform
  importPreview.value = []
  importProblems.value = []
}
function closeImport() {
  importTarget.value = ''
  importPreview.value = []
  importProblems.value = []
}

async function onCsvSelected(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file) return

  try {
    const text = await file.text()
    const { rows, problems } = parseRoyaltyCsv(text)
    importPreview.value = rows
    importProblems.value = problems
  } catch {
    importPreview.value = []
    importProblems.value = ['Ce fichier n’a pas pu être lu.']
  }
}

function confirmImport() {
  const platform = importTarget.value
  importPreview.value.forEach((row) => {
    const existing = store.royalties.find(
      (r) => r.platform === platform && r.period === row.period,
    )
    upsert('royalties', {
      id: existing?.id ?? uid(),
      platform,
      period: row.period,
      streams: row.streams,
      amount: row.amount,
      color: platformColor(platform),
    })
  })

  const current = getLink(platform)
  saveLink({
    platform,
    account: current?.account ?? '',
    lastImport: new Date().toISOString().slice(0, 10),
    lastImportCount: importPreview.value.length,
  })

  if (!periods.value.includes(selectedPeriod.value)) {
    selectedPeriod.value = periods.value[0] ?? ''
  }
  closeImport()
}

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

.notice {
  display: flex;
  gap: 13px;
  background: var(--amber-bg);
  border: 1px solid #f8e3bb;
  border-radius: var(--radius);
  padding: 15px 17px;
  margin-bottom: 18px;
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
  margin: 4px 0 0;
  font-size: 13px;
  padding: 12px 14px;
}

.field-help {
  font-size: 12.5px;
  color: var(--text-muted);
  margin: 6px 0 0;
  line-height: 1.5;
}
.field-help code {
  background: var(--surface-2);
  padding: 1px 6px;
  border-radius: 5px;
  font-size: 12px;
}

.import-problems {
  margin-top: 16px;
  background: var(--red-bg);
  border-radius: var(--radius-sm);
  padding: 12px 14px;
  font-size: 12.5px;
  color: #8f2020;
  line-height: 1.5;
}
.import-problems ul {
  margin: 6px 0 0;
  padding-left: 18px;
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
