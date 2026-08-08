<template>
  <div class="page">
    <PageHeader title="Mon profil" subtitle="Vos informations d'artiste et vos réglages de compte.">
      <template #actions>
        <button v-if="!editMode" class="btn btn--ghost" @click="startEdit">
          <Icon name="edit" /> Modifier
        </button>
        <template v-else>
          <button class="btn btn--subtle" @click="cancelEdit">Annuler</button>
          <button class="btn btn--primary" :disabled="!draft.stageName.trim()" @click="saveEdit">
            <Icon name="check" /> Enregistrer
          </button>
        </template>
      </template>
    </PageHeader>

    <!-- Bandeau profil -->
    <div class="card hero">
      <div class="hero__left">
        <div class="photo-wrap">
          <Avatar
            :name="displayed.stageName"
            :photo="displayed.photo"
            :size="112"
            radius="28px"
            :font="38"
          />
          <button v-if="editMode" class="photo-edit" @click="pickPhoto" title="Changer la photo">
            <Icon name="edit" />
          </button>
        </div>

        <div v-if="editMode" class="photo-actions">
          <input
            ref="fileInput"
            type="file"
            accept="image/*"
            class="hidden"
            @change="onPhotoSelected"
          />
          <button class="btn btn--ghost btn--sm" @click="pickPhoto">
            <Icon name="plus" /> {{ draft.photo ? 'Remplacer' : 'Ajouter une photo' }}
          </button>
          <button v-if="draft.photo" class="btn btn--danger btn--sm" @click="draft.photo = ''">
            <Icon name="trash" /> Retirer
          </button>
        </div>
        <p v-if="photoError" class="photo-error">{{ photoError }}</p>
      </div>

      <div class="hero__body">
        <template v-if="!editMode">
          <h2 class="hero__name">{{ displayed.stageName }}</h2>
          <p class="hero__real" v-if="displayed.realName">{{ displayed.realName }}</p>
          <div class="hero__tags">
            <span v-if="displayed.genre" class="pill"><Icon name="music" /> {{ displayed.genre }}</span>
            <span v-if="displayed.city" class="pill"><Icon name="pin" /> {{ displayed.city }}</span>
          </div>
          <p v-if="displayed.bio" class="hero__bio">{{ displayed.bio }}</p>
        </template>

        <template v-else>
          <div class="field--row">
            <div class="field">
              <label>Nom de scène</label>
              <input v-model="draft.stageName" placeholder="Ex : NOVA" />
            </div>
            <div class="field">
              <label>Nom réel</label>
              <input v-model="draft.realName" placeholder="Prénom Nom" />
            </div>
          </div>
          <div class="field--row">
            <div class="field">
              <label>Style de musique</label>
              <input v-model="draft.genre" list="genres" placeholder="Ex : Électro-pop" />
              <datalist id="genres">
                <option v-for="g in genreSuggestions" :key="g" :value="g" />
              </datalist>
            </div>
            <div class="field">
              <label>Ville</label>
              <input v-model="draft.city" placeholder="Ex : Paris, FR" />
            </div>
          </div>
          <div class="field">
            <label>Biographie</label>
            <textarea v-model="draft.bio" placeholder="Quelques lignes sur votre univers…" />
          </div>
        </template>
      </div>
    </div>

    <div class="grid grid--2" style="margin-top: 18px">
      <!-- Coordonnées -->
      <div class="card card--pad">
        <div class="section-head"><span class="section-head__title">Coordonnées</span></div>

        <template v-if="!editMode">
          <div class="vstack" style="gap: 12px">
            <div class="info">
              <div class="info__ico" style="background: var(--violet-100); color: var(--violet-600)">
                <Icon name="mail" />
              </div>
              <div class="row__main">
                <div class="muted micro">Email</div>
                <a v-if="displayed.email" :href="`mailto:${displayed.email}`" class="info__val link">{{ displayed.email }}</a>
                <div v-else class="info__val muted">Non renseigné</div>
              </div>
            </div>
            <div class="info">
              <div class="info__ico" style="background: var(--green-bg); color: var(--green)">
                <Icon name="phone" />
              </div>
              <div class="row__main">
                <div class="muted micro">Téléphone</div>
                <a v-if="displayed.phone" :href="`tel:${displayed.phone}`" class="info__val link">{{ displayed.phone }}</a>
                <div v-else class="info__val muted">Non renseigné</div>
              </div>
            </div>
          </div>
        </template>
        <template v-else>
          <div class="field"><label>Email</label><input v-model="draft.email" type="email" /></div>
          <div class="field" style="margin-bottom: 0"><label>Téléphone</label><input v-model="draft.phone" type="tel" /></div>
        </template>
      </div>

      <!-- Présence en ligne -->
      <div class="card card--pad">
        <div class="section-head"><span class="section-head__title">Présence en ligne</span></div>

        <template v-if="!editMode">
          <div class="vstack" style="gap: 12px">
            <div class="info">
              <div class="info__ico" style="background: var(--red-bg); color: var(--red)">
                <Icon name="users" />
              </div>
              <div class="row__main">
                <div class="muted micro">Instagram</div>
                <div class="info__val" :class="{ muted: !displayed.instagram }">
                  {{ displayed.instagram || 'Non renseigné' }}
                </div>
              </div>
            </div>
            <div class="info">
              <div class="info__ico" style="background: var(--green-bg); color: var(--green)">
                <Icon name="music" />
              </div>
              <div class="row__main">
                <div class="muted micro">Spotify</div>
                <div class="info__val" :class="{ muted: !displayed.spotify }">
                  {{ displayed.spotify || 'Non renseigné' }}
                </div>
              </div>
            </div>
            <div class="info">
              <div class="info__ico" style="background: var(--blue-bg); color: var(--blue)">
                <Icon name="globe" />
              </div>
              <div class="row__main">
                <div class="muted micro">Site web</div>
                <a
                  v-if="displayed.website"
                  :href="externalUrl(displayed.website)"
                  target="_blank"
                  rel="noopener"
                  class="info__val link"
                >{{ displayed.website }}</a>
                <div v-else class="info__val muted">Non renseigné</div>
              </div>
            </div>
          </div>
        </template>
        <template v-else>
          <div class="field"><label>Instagram</label><input v-model="draft.instagram" placeholder="@votrecompte" /></div>
          <div class="field"><label>Spotify</label><input v-model="draft.spotify" placeholder="Nom d'artiste" /></div>
          <div class="field" style="margin-bottom: 0"><label>Site web</label><input v-model="draft.website" placeholder="monsite.fr" /></div>
        </template>
      </div>
    </div>

    <!-- Compte -->
    <div class="card card--pad" style="margin-top: 18px">
      <div class="section-head"><span class="section-head__title">Compte</span></div>
      <div class="account">
        <div>
          <div style="font-weight: 600; font-size: 14.5px">Se déconnecter</div>
          <p class="muted" style="font-size: 13.5px; margin-top: 3px; line-height: 1.5">
            Verrouille l'application sur cet appareil. Vos données restent enregistrées
            et seront retrouvées à la reconnexion.
          </p>
        </div>
        <button class="btn btn--danger" @click="showLogout = true">
          <Icon name="external" /> Déconnexion
        </button>
      </div>
    </div>

    <Modal :open="showLogout" title="Se déconnecter" @close="showLogout = false">
      <p style="margin: 0; color: var(--text-soft); line-height: 1.6">
        Vous allez être déconnecté de RapidMusic sur cet appareil.
        <b style="color: var(--text)">Aucune donnée ne sera perdue</b> : contrats, concerts,
        sorties et contacts restent enregistrés localement.
      </p>
      <template #footer>
        <button class="btn btn--subtle" @click="showLogout = false">Annuler</button>
        <button class="btn btn--danger" @click="doLogout"><Icon name="external" /> Se déconnecter</button>
      </template>
    </Modal>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import PageHeader from '@/components/PageHeader.vue'
import Icon from '@/components/Icon.vue'
import Avatar from '@/components/Avatar.vue'
import Modal from '@/components/Modal.vue'
import { store, logout } from '@/store'
import type { ArtistProfile } from '@/store/types'
import { fileToAvatarDataUrl, ImageError } from '@/utils/image'

const genreSuggestions = [
  'Électro-pop',
  'Pop',
  'Rap / Hip-hop',
  'R&B',
  'Rock',
  'Indie',
  'House',
  'Techno',
  'Jazz',
  'Chanson française',
  'Metal',
  'Reggae',
]

const editMode = ref(false)
const draft = ref<ArtistProfile>({ ...store.artist })
const photoError = ref('')

/** Aperçu live pendant l'édition, données enregistrées sinon. */
const displayed = computed(() => (editMode.value ? draft.value : store.artist))

function startEdit() {
  draft.value = { ...store.artist }
  photoError.value = ''
  editMode.value = true
}
function cancelEdit() {
  photoError.value = ''
  editMode.value = false
}
function saveEdit() {
  if (!draft.value.stageName.trim()) return
  Object.assign(store.artist, draft.value)
  editMode.value = false
}

const fileInput = ref<HTMLInputElement | null>(null)
function pickPhoto() {
  photoError.value = ''
  fileInput.value?.click()
}

async function onPhotoSelected(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = '' // permet de re-sélectionner le même fichier
  if (!file) return

  photoError.value = ''
  try {
    draft.value.photo = await fileToAvatarDataUrl(file)
  } catch (err) {
    photoError.value =
      err instanceof ImageError ? err.message : "Impossible d'importer cette image."
  }
}

function externalUrl(site: string): string {
  return /^https?:\/\//i.test(site) ? site : `https://${site}`
}

const showLogout = ref(false)
async function doLogout() {
  showLogout.value = false
  // Attendu : la déconnexion enregistre d'abord ce qui n'était pas encore parti.
  await logout()
}
</script>

<style scoped>
.hero {
  display: flex;
  gap: 28px;
  padding: 26px;
  align-items: flex-start;
  flex-wrap: wrap;
}
.hero__left {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}
.hero__body {
  flex: 1;
  min-width: 280px;
}
.hero__name {
  font-size: 26px;
  font-weight: 800;
  letter-spacing: -0.025em;
}
.hero__real {
  color: var(--text-soft);
  font-size: 14.5px;
  margin-top: 2px;
}
.hero__tags {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-top: 14px;
}
.pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: var(--brand-gradient-soft);
  color: var(--violet-700);
  font-size: 13px;
  font-weight: 600;
  padding: 5px 12px;
  border-radius: 20px;
}
.pill svg {
  width: 14px;
  height: 14px;
}
.hero__bio {
  margin-top: 14px;
  color: var(--text-soft);
  font-size: 14px;
  line-height: 1.6;
  max-width: 60ch;
}

.photo-wrap {
  position: relative;
}
.photo-edit {
  position: absolute;
  right: -6px;
  bottom: -6px;
  width: 34px;
  height: 34px;
  border-radius: 50%;
  border: 3px solid var(--surface);
  background: var(--violet-600);
  color: #fff;
  display: grid;
  place-items: center;
  box-shadow: var(--shadow);
}
.photo-edit svg {
  width: 15px;
  height: 15px;
}
.photo-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: center;
}
.photo-error {
  color: var(--red);
  font-size: 12.5px;
  margin: 0;
  max-width: 180px;
  text-align: center;
}

.info {
  display: flex;
  align-items: center;
  gap: 13px;
}
.info__ico {
  width: 40px;
  height: 40px;
  border-radius: 11px;
  display: grid;
  place-items: center;
  flex-shrink: 0;
}
.info__ico svg {
  width: 18px;
  height: 18px;
}
.info__val {
  font-size: 14.5px;
  font-weight: 600;
  word-break: break-word;
}
.link:hover {
  color: var(--violet-700);
}
.micro {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  margin-bottom: 1px;
}

.account {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}
.account p {
  max-width: 52ch;
}
</style>
