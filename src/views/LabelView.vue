<template>
  <div class="page">
    <PageHeader title="Label" subtitle="Les informations de votre label et de votre roster.">
      <template #actions>
        <button v-if="!editMode" class="btn btn--ghost" @click="startEdit"><Icon name="edit" /> Modifier</button>
        <template v-else>
          <button class="btn btn--subtle" @click="cancelEdit">Annuler</button>
          <button class="btn btn--primary" @click="saveEdit"><Icon name="check" /> Enregistrer</button>
        </template>
      </template>
    </PageHeader>

    <!-- Hero -->
    <div class="card label-hero">
      <div class="label-hero__logo">
        <Icon name="label" />
      </div>
      <div class="label-hero__body">
        <template v-if="!editMode">
          <h2 class="label-hero__name">{{ store.label.name }}</h2>
          <p class="label-hero__tag">{{ store.label.tagline }}</p>
          <div class="label-hero__meta">
            <span><Icon name="pin" /> {{ store.label.location }}</span>
            <span><Icon name="calendar" /> Depuis {{ store.label.founded }}</span>
            <a :href="`https://${store.label.website}`" target="_blank" rel="noopener"><Icon name="globe" /> {{ store.label.website }}</a>
            <a :href="`mailto:${store.label.email}`"><Icon name="mail" /> {{ store.label.email }}</a>
          </div>
        </template>
        <template v-else>
          <div class="field--row">
            <div class="field"><label>Nom du label</label><input v-model="draft.name" /></div>
            <div class="field"><label>Fondé en</label><input v-model="draft.founded" /></div>
          </div>
          <div class="field"><label>Slogan</label><input v-model="draft.tagline" /></div>
          <div class="field--row">
            <div class="field"><label>Localisation</label><input v-model="draft.location" /></div>
            <div class="field"><label>Site web</label><input v-model="draft.website" /></div>
          </div>
          <div class="field"><label>Email</label><input v-model="draft.email" /></div>
        </template>
      </div>
    </div>

    <div class="grid grid--2" style="margin-top: 18px">
      <!-- Partners -->
      <div class="card card--pad">
        <div class="section-head"><span class="section-head__title">Partenaires clés</span></div>
        <div class="vstack" style="gap: 12px">
          <div class="partner">
            <div class="partner__ico" style="background: var(--blue-bg); color: var(--blue)"><Icon name="globe" /></div>
            <div class="row__main">
              <div class="muted micro">Distribution</div>
              <input v-if="editMode" v-model="draft.distribution" class="inline-input" />
              <div v-else class="row__title">{{ store.label.distribution }}</div>
            </div>
          </div>
          <div class="partner">
            <div class="partner__ico" style="background: var(--violet-100); color: var(--violet-600)"><Icon name="doc" /></div>
            <div class="row__main">
              <div class="muted micro">Édition / Publishing</div>
              <input v-if="editMode" v-model="draft.publishing" class="inline-input" />
              <div v-else class="row__title">{{ store.label.publishing }}</div>
            </div>
          </div>
        </div>

        <div class="section-head" style="margin-top: 24px"><span class="section-head__title">Profil artiste</span></div>
        <div class="vstack" style="gap: 12px">
          <div class="partner">
            <Avatar
              :name="store.artist.stageName"
              :photo="store.artist.photo"
              :size="42"
              radius="12px"
              :font="14"
            />
            <div class="row__main" v-if="!editMode">
              <div class="row__title">{{ store.artist.stageName }}</div>
              <div class="row__sub">{{ store.artist.realName }} · {{ store.artist.genre }} · {{ store.artist.city }}</div>
            </div>
            <div class="row__main" v-else style="display: grid; gap: 8px">
              <div class="field--row" style="margin: 0">
                <div class="field" style="margin: 0"><label>Nom de scène</label><input v-model="draftArtist.stageName" /></div>
                <div class="field" style="margin: 0"><label>Nom réel</label><input v-model="draftArtist.realName" /></div>
              </div>
              <div class="field--row" style="margin: 0">
                <div class="field" style="margin: 0"><label>Genre</label><input v-model="draftArtist.genre" /></div>
                <div class="field" style="margin: 0"><label>Ville</label><input v-model="draftArtist.city" /></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Roster -->
      <div class="card card--pad">
        <div class="section-head">
          <span class="section-head__title">Roster ({{ roster.length }})</span>
          <button v-if="editMode" class="btn btn--ghost btn--sm" @click="addRosterRow"><Icon name="plus" /> Ajouter</button>
        </div>
        <div class="vstack" style="gap: 10px">
          <div v-for="(a, i) in roster" :key="i" class="roster-row">
            <div class="roster-avatar">{{ initials(a.name || '?') }}</div>
            <template v-if="!editMode">
              <div class="row__main">
                <div class="row__title">{{ a.name }}</div>
                <div class="row__sub">{{ a.genre }}</div>
              </div>
              <span v-if="a.name === store.artist.stageName" class="badge badge--violet">Vous</span>
            </template>
            <template v-else>
              <input v-model="a.name" class="inline-input" placeholder="Nom" style="flex: 1" />
              <input v-model="a.genre" class="inline-input" placeholder="Genre" style="flex: 1" />
              <button class="icon-sm icon-sm--danger" @click="roster.splice(i, 1)"><Icon name="trash" /></button>
            </template>
          </div>
        </div>
      </div>
    </div>

    <!-- Danger zone -->
    <div class="card card--pad" style="margin-top: 18px; border-color: var(--red-bg)">
      <div class="hstack" style="justify-content: space-between; flex-wrap: wrap; gap: 12px">
        <div>
          <div class="section-head__title">Données de démonstration</div>
          <p class="muted" style="font-size: 13.5px; margin-top: 2px">
            Vos données sont enregistrées localement dans ce navigateur. Réinitialisez pour repartir des exemples.
          </p>
        </div>
        <button class="btn btn--danger" @click="showReset = true"><Icon name="trash" /> Réinitialiser les données</button>
      </div>
    </div>

    <Modal :open="showReset" title="Réinitialiser les données" @close="showReset = false">
      <p style="margin: 0; color: var(--text-soft); line-height: 1.6">
        Toutes vos modifications seront remplacées par les données d'exemple. Cette action est définitive.
      </p>
      <template #footer>
        <button class="btn btn--subtle" @click="showReset = false">Annuler</button>
        <button class="btn btn--danger" @click="doReset"><Icon name="trash" /> Tout réinitialiser</button>
      </template>
    </Modal>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import PageHeader from '@/components/PageHeader.vue'
import Icon from '@/components/Icon.vue'
import Modal from '@/components/Modal.vue'
import Avatar from '@/components/Avatar.vue'
import { store, resetData } from '@/store'
import type { LabelInfo, ArtistProfile } from '@/store/types'
import { initials } from '@/utils/format'

const editMode = ref(false)
const draft = ref<LabelInfo>({ ...store.label, roster: [] })
const draftArtist = ref<ArtistProfile>({ ...store.artist })
const roster = ref<{ name: string; genre: string }[]>(JSON.parse(JSON.stringify(store.label.roster)))

function startEdit() {
  draft.value = { ...store.label, roster: [] }
  draftArtist.value = { ...store.artist }
  roster.value = JSON.parse(JSON.stringify(store.label.roster))
  editMode.value = true
}
function cancelEdit() {
  editMode.value = false
}
function addRosterRow() {
  roster.value.push({ name: '', genre: '' })
}
function saveEdit() {
  Object.assign(store.label, {
    ...draft.value,
    roster: roster.value.filter((r) => r.name.trim()),
  })
  Object.assign(store.artist, draftArtist.value)
  editMode.value = false
}

const showReset = ref(false)
function doReset() {
  resetData()
  roster.value = JSON.parse(JSON.stringify(store.label.roster))
  showReset.value = false
  editMode.value = false
}
</script>

<style scoped>
.label-hero {
  display: flex;
  gap: 24px;
  padding: 28px;
  background: var(--nav-bg);
  background-image: radial-gradient(120% 120% at 100% 0%, rgba(236, 72, 153, 0.28), transparent 55%),
    radial-gradient(120% 120% at 0% 100%, rgba(139, 92, 246, 0.32), transparent 55%);
  border: none;
  color: #fff;
  align-items: center;
  flex-wrap: wrap;
}
.label-hero__logo {
  width: 88px;
  height: 88px;
  border-radius: 22px;
  background: var(--brand-gradient);
  display: grid;
  place-items: center;
  flex-shrink: 0;
  box-shadow: 0 14px 34px rgba(236, 72, 153, 0.4);
}
.label-hero__logo svg {
  width: 40px;
  height: 40px;
  color: #fff;
}
.label-hero__body {
  flex: 1;
  min-width: 260px;
}
.label-hero__name {
  font-size: 27px;
  font-weight: 800;
  letter-spacing: -0.02em;
}
.label-hero__tag {
  color: rgba(255, 255, 255, 0.72);
  margin-top: 4px;
  font-size: 14.5px;
}
.label-hero__meta {
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
  margin-top: 16px;
  font-size: 13.5px;
}
.label-hero__meta span,
.label-hero__meta a {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  color: rgba(255, 255, 255, 0.8);
}
.label-hero__meta a:hover {
  color: #fff;
}
.label-hero__meta svg {
  width: 15px;
  height: 15px;
  color: var(--violet-400);
}
.label-hero :deep(.field label) {
  color: rgba(255, 255, 255, 0.6);
}
.label-hero :deep(.field input) {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(255, 255, 255, 0.14);
  color: #fff;
}

.partner {
  display: flex;
  align-items: center;
  gap: 13px;
}
.partner__ico {
  width: 42px;
  height: 42px;
  border-radius: 12px;
  display: grid;
  place-items: center;
  font-weight: 700;
  font-size: 14px;
  flex-shrink: 0;
}
.partner__ico svg {
  width: 20px;
  height: 20px;
}
.micro {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  margin-bottom: 2px;
}

.roster-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border: 1px solid var(--border);
  border-radius: 12px;
}
.roster-avatar {
  width: 38px;
  height: 38px;
  border-radius: 11px;
  background: var(--brand-gradient-soft);
  color: var(--violet-700);
  display: grid;
  place-items: center;
  font-weight: 700;
  font-size: 13px;
  flex-shrink: 0;
}
.inline-input {
  width: 100%;
  padding: 8px 11px;
  border-radius: 9px;
  border: 1px solid var(--border-strong);
  background: var(--surface);
  color: var(--text);
  outline: none;
  font-size: 14px;
}
.inline-input:focus {
  border-color: var(--violet-400);
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
  flex-shrink: 0;
}
.icon-sm svg {
  width: 15px;
  height: 15px;
}
.icon-sm--danger:hover {
  background: var(--red-bg);
  color: var(--red);
  border-color: var(--red-bg);
}
</style>
