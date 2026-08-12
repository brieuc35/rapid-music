<template>
  <div class="page">
    <PageHeader title="Label" subtitle="Les informations de votre label et de vos partenaires.">
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
          <div class="label-hero__meta">
            <span><Icon name="pin" /> {{ store.label.location }}</span>
            <a :href="`https://${store.label.website}`" target="_blank" rel="noopener"><Icon name="globe" /> {{ store.label.website }}</a>
            <a :href="`mailto:${store.label.email}`"><Icon name="mail" /> {{ store.label.email }}</a>
          </div>
        </template>
        <template v-else>
          <div class="field"><label>Nom du label</label><input v-model="draft.name" /></div>
          <div class="field--row">
            <div class="field"><label>Localisation</label><input v-model="draft.location" /></div>
            <div class="field"><label>Site web</label><input v-model="draft.website" /></div>
          </div>
          <div class="field"><label>Email</label><input v-model="draft.email" /></div>
        </template>
      </div>
    </div>

    <!-- Partners -->
    <div class="card card--pad" style="margin-top: 18px">
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
import { store, resetData } from '@/store'
import type { LabelInfo } from '@/store/types'

const editMode = ref(false)
/*  Copie complète du label, et pas seulement des champs du formulaire : ce qui
 *  n'est plus modifiable ici est ainsi réenregistré tel quel, sans rien perdre
 *  de ce qui avait été saisi avant. */
const copie = (): LabelInfo => JSON.parse(JSON.stringify(store.label))

const draft = ref<LabelInfo>(copie())

function startEdit() {
  draft.value = copie()
  editMode.value = true
}
function cancelEdit() {
  editMode.value = false
}
function saveEdit() {
  Object.assign(store.label, draft.value)
  editMode.value = false
}

const showReset = ref(false)
function doReset() {
  resetData()
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
  /*  260 px suffisent pour tenir à côté du logo ; en dessous le bloc passe à la
   *  ligne. Le `min()` évite qu'il déborde de la carte sur les écrans les plus
   *  étroits, où même la largeur disponible seule est inférieure à 260 px. */
  min-width: min(260px, 100%);
}
.label-hero__name {
  font-size: 27px;
  font-weight: 800;
  letter-spacing: -0.02em;
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
</style>
