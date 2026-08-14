<template>
  <div class="page">
    <PageHeader title="Mon profil" subtitle="Vos informations d'artiste et vos réglages de compte.">
      <template #actions>
        <button v-if="!editMode" class="btn btn--ghost" @click="startEdit">
          <Icon name="edit" /> Modifier
        </button>
        <template v-else>
          <button class="btn btn--subtle" @click="cancelEdit">Annuler</button>
          <button class="btn btn--primary" :disabled="!complet" @click="saveEdit">
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
              <label>Nom de scène <span class="req">*</span></label>
              <input v-model="draft.stageName" placeholder="Ex : NOVA" />
            </div>
            <div class="field">
              <label>Nom réel</label>
              <input v-model="draft.realName" placeholder="Prénom Nom" />
            </div>
          </div>
          <div class="field--row">
            <div class="field">
              <label>Style de musique <span class="req">*</span></label>
              <select v-model="genreChoice">
                <option value="">Choisissez un style</option>
                <option v-for="g in GENRES" :key="g" :value="g">{{ g }}</option>
                <option value="__autre">Autre…</option>
              </select>
            </div>
            <div class="field">
              <label>Ville</label>
              <input v-model="draft.city" placeholder="Ex : Paris, FR" />
            </div>
          </div>
          <!-- Champ libre pour tout style absent de la liste. Il apparaît aussi
               tout seul quand le style déjà enregistré n'y figure pas : sans
               cela, ouvrir la modification suffirait à le perdre. -->
          <div v-if="genreChoice === '__autre'" class="field">
            <label>Précisez votre style <span class="req">*</span></label>
            <input v-model="genreOther" maxlength="40" placeholder="Ex : Musique bretonne" />
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

    <!-- Mes données -->
    <div class="card card--pad" style="margin-top: 18px">
      <div class="section-head"><span class="section-head__title">Mes données</span></div>
      <div class="account">
        <div>
          <div style="font-weight: 600; font-size: 14.5px">Télécharger mes données</div>
          <p class="muted" style="font-size: 13.5px; margin-top: 3px; line-height: 1.5">
            Enregistre l'intégralité de votre espace — profil, label, contrats, concerts,
            sorties, revenus, agenda, contacts et tâches — dans un fichier sur cet appareil.
            Gardez-le de côté : il vous rendra tout, même si vous perdez l'accès à votre
            compte.
          </p>
        </div>
        <button class="btn btn--subtle" @click="doExport">
          <Icon name="download" /> Télécharger
        </button>
      </div>

      <div class="account account--sep">
        <div>
          <div style="font-weight: 600; font-size: 14.5px">Importer un fichier</div>
          <p class="muted" style="font-size: 13.5px; margin-top: 3px; line-height: 1.5">
            Restaure un fichier téléchargé précédemment. Le contenu du fichier vous sera
            présenté avant tout remplacement.
          </p>
        </div>
        <button class="btn btn--subtle" @click="pickBackup">
          <Icon name="upload" /> Importer
        </button>
        <!-- Hors du flux : le sélecteur de fichiers du navigateur ne se met pas en
             page, il s'ouvre depuis le bouton ci-dessus. -->
        <input
          ref="backupInput"
          type="file"
          accept="application/json,.json"
          hidden
          @change="onBackupSelected"
        />
      </div>

      <p v-if="exportedName" class="alert-ok">
        Fichier téléchargé : <b>{{ exportedName }}</b
        >. Vous le trouverez avec vos téléchargements.
      </p>
      <p v-if="importError" class="alert-err">{{ importError }}</p>
      <p v-if="importDone" class="alert-ok">Vos données ont été restaurées.</p>
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

      <div class="account account--danger">
        <div>
          <div style="font-weight: 600; font-size: 14.5px">Supprimer mon compte</div>
          <p class="muted" style="font-size: 13.5px; margin-top: 3px; line-height: 1.5">
            Efface définitivement votre compte et toutes vos données : contrats, concerts,
            sorties, revenus, agenda, contacts et tâches. Cette action est irréversible.
            <RouterLink to="/suppression-compte">Ce qui est effacé, en détail</RouterLink>.
          </p>
        </div>
        <button class="btn btn--danger" @click="openDelete">
          <Icon name="trash" /> Supprimer
        </button>
      </div>
    </div>

    <!--  Les documents légaux, au bas de la page où l'on vient déjà régler son
          compte. Ils étaient au bas du menu, qui n'avait plus de place à leur
          consacrer ; l'écran de connexion garde les siens, pour qu'on puisse
          les lire avant de s'inscrire. -->
    <nav class="legaux" aria-label="Informations légales">
      <RouterLink v-for="p in PAGES_LEGALES" :key="p.to" :to="p.to">{{ p.libelle }}</RouterLink>
    </nav>

    <Modal :open="!!pending" title="Importer ce fichier" @close="closeImport">
      <p style="margin: 0 0 14px; color: var(--text-soft); line-height: 1.6">
        Le fichier <b style="color: var(--text)">{{ pendingName }}</b> contient :
      </p>
      <ul class="recap">
        <li v-for="ligne in pendingRecap" :key="ligne.label">
          <b>{{ ligne.count }}</b> {{ ligne.label }}
        </li>
      </ul>
      <p style="margin: 14px 0 0; color: var(--text-soft); line-height: 1.6">
        Ce contenu va <b style="color: var(--red)">remplacer vos données actuelles</b>, sur
        cet appareil comme sur votre compte. Si vous n'êtes pas sûr, annulez et téléchargez
        d'abord vos données actuelles.
      </p>
      <template #footer>
        <button class="btn btn--subtle" :disabled="importing" @click="closeImport">
          Annuler
        </button>
        <button class="btn btn--primary" :disabled="importing" @click="confirmImport">
          <Icon :name="importing ? 'clock' : 'upload'" />
          {{ importing ? 'Restauration…' : 'Remplacer mes données' }}
        </button>
      </template>
    </Modal>

    <Modal :open="showLogout" title="Se déconnecter" @close="showLogout = false">
      <p style="margin: 0; color: var(--text-soft); line-height: 1.6">
        Vous allez être déconnecté de RapidMusic sur cet appareil.
        <b style="color: var(--text)">Aucune donnée ne sera perdue</b> : contrats, concerts,
        sorties et contacts sont enregistrés sur votre compte et vous seront rendus à la
        prochaine connexion, ici ou ailleurs.
      </p>
      <template #footer>
        <button class="btn btn--subtle" @click="showLogout = false">Annuler</button>
        <button class="btn btn--danger" @click="doLogout"><Icon name="external" /> Se déconnecter</button>
      </template>
    </Modal>

    <Modal :open="showDelete" title="Supprimer mon compte" @close="closeDelete">
      <p style="margin: 0 0 14px; color: var(--text-soft); line-height: 1.6">
        Vont être définitivement effacés : votre profil, votre fiche label, vos contrats,
        concerts, sorties, revenus, évènements d'agenda, contacts, tâches et publications.
        <b style="color: var(--red)">Rien ne pourra être récupéré</b>, ni par vous ni par
        personne.
      </p>
      <div class="field" style="margin-bottom: 0">
        <label for="del-pwd">Saisissez votre mot de passe pour confirmer</label>
        <input
          id="del-pwd"
          v-model="deletePassword"
          type="password"
          autocomplete="current-password"
          placeholder="••••••••"
          @keyup.enter="doDelete"
        />
      </div>
      <p v-if="deleteError" class="alert-err">{{ deleteError }}</p>
      <template #footer>
        <button class="btn btn--subtle" :disabled="deleting" @click="closeDelete">Annuler</button>
        <button
          class="btn btn--danger"
          :disabled="!deletePassword || deleting"
          @click="doDelete"
        >
          <Icon :name="deleting ? 'clock' : 'trash'" />
          {{ deleting ? 'Suppression…' : 'Supprimer définitivement' }}
        </button>
      </template>
    </Modal>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { RouterLink } from 'vue-router'
import PageHeader from '@/components/PageHeader.vue'
import Icon from '@/components/Icon.vue'
import Avatar from '@/components/Avatar.vue'
import Modal from '@/components/Modal.vue'
import { store, logout, deleteAccount, importData } from '@/store'
import type { AppData, ArtistProfile } from '@/store/types'
import { fileToAvatarDataUrl, ImageError } from '@/utils/image'
import { GENRES } from '@/utils/genres'
import { BackupError, describeBackup, downloadBackup, parseBackup } from '@/utils/backup'
import { PAGES_LEGALES } from '@/router/legal'

const editMode = ref(false)
const draft = ref<ArtistProfile>({ ...store.artist })
const photoError = ref('')

/*  Le style se choisit dans une liste, mais rien ne garantit que celui déjà
 *  enregistré y figure — il peut venir d'une version antérieure ou du champ
 *  libre. Deux variables séparées évitent de l'écraser : la liste retient
 *  « Autre… » et le champ libre reçoit la valeur existante. */
const genreChoice = ref('')
const genreOther = ref('')

function loadGenre(value: string) {
  if (!value) {
    genreChoice.value = ''
    genreOther.value = ''
  } else if ((GENRES as readonly string[]).includes(value)) {
    genreChoice.value = value
    genreOther.value = ''
  } else {
    genreChoice.value = '__autre'
    genreOther.value = value
  }
}

/** Style retenu, que la liste ou le champ libre le fournisse. */
const genreEffectif = computed(() =>
  genreChoice.value === '__autre' ? genreOther.value.trim() : genreChoice.value,
)

/*  Nom de scène et style sont tous deux nécessaires : ils identifient l'artiste
 *  partout dans l'application, du menu au Réseau. */
const complet = computed(() => !!draft.value.stageName.trim() && !!genreEffectif.value)

/** Aperçu live pendant l'édition, données enregistrées sinon. Le style vient du
 *  choix en cours et non de `draft`, où il n'est écrit qu'à l'enregistrement. */
const displayed = computed(() =>
  editMode.value ? { ...draft.value, genre: genreEffectif.value } : store.artist,
)

function startEdit() {
  draft.value = { ...store.artist }
  loadGenre(store.artist.genre)
  photoError.value = ''
  editMode.value = true
}
function cancelEdit() {
  photoError.value = ''
  editMode.value = false
}
function saveEdit() {
  if (!complet.value) return
  // « Autre… » n'est qu'un déclencheur, il ne doit pas devenir un style.
  draft.value.genre = genreEffectif.value
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

/* -------------------------------------------------------------------------- */
/*  Sauvegarde et restauration                                                */
/* -------------------------------------------------------------------------- */

const exportedName = ref('')
const importError = ref('')
const importDone = ref(false)

function doExport() {
  importError.value = ''
  importDone.value = false
  exportedName.value = downloadBackup(store)
}

const backupInput = ref<HTMLInputElement | null>(null)
/*  Données lues et validées, en attente de confirmation. Rien n'est écrit dans
 *  l'application tant que cet objet n'a pas été accepté explicitement. */
const pending = ref<AppData | null>(null)
const pendingName = ref('')
const importing = ref(false)

const pendingRecap = computed(() =>
  // Les catégories vides sont montrées elles aussi : « 0 contrats » est une
  // information, c'est ce que l'import va laisser à la place des contrats
  // existants.
  pending.value ? describeBackup(pending.value) : [],
)

function pickBackup() {
  importError.value = ''
  importDone.value = false
  exportedName.value = ''
  backupInput.value?.click()
}

async function onBackupSelected(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = '' // permet de re-sélectionner le même fichier
  if (!file) return

  // Le bouton nettoie déjà ces messages, mais un fichier peut arriver sans lui
  // (glisser-déposer d'un navigateur, outil d'accessibilité) : sans cela, la
  // confirmation d'un ancien téléchargement resterait affichée sous le résultat
  // de l'import.
  importError.value = ''
  importDone.value = false
  exportedName.value = ''
  try {
    pending.value = parseBackup(await file.text())
    pendingName.value = file.name
  } catch (e) {
    pending.value = null
    importError.value =
      e instanceof BackupError ? e.message : "Ce fichier n'a pas pu être lu."
  }
}

function closeImport() {
  if (importing.value) return
  pending.value = null
  pendingName.value = ''
}

async function confirmImport() {
  if (!pending.value || importing.value) return
  importing.value = true
  try {
    await importData(pending.value)
    pending.value = null
    pendingName.value = ''
    importDone.value = true
    // Le profil affiché vient de changer sous nos pieds : une édition en cours
    // porterait sur les anciennes valeurs.
    editMode.value = false
  } catch (e) {
    importError.value =
      e instanceof Error
        ? `Les données ont été restaurées sur cet appareil, mais leur envoi a échoué : ${e.message}`
        : 'La restauration a échoué.'
  } finally {
    importing.value = false
  }
}

const showLogout = ref(false)
async function doLogout() {
  showLogout.value = false
  // Attendu : la déconnexion enregistre d'abord ce qui n'était pas encore parti.
  await logout()
}

const showDelete = ref(false)
const deletePassword = ref('')
const deleteError = ref('')
const deleting = ref(false)

function openDelete() {
  deletePassword.value = ''
  deleteError.value = ''
  showDelete.value = true
}
function closeDelete() {
  if (deleting.value) return
  showDelete.value = false
  deletePassword.value = ''
  deleteError.value = ''
}
async function doDelete() {
  if (!deletePassword.value || deleting.value) return
  deleting.value = true
  deleteError.value = ''
  try {
    await deleteAccount(deletePassword.value)
    // La suppression du compte déclenche le retour à l'écran de connexion :
    // rien à faire de plus ici.
  } catch (e) {
    deleteError.value = e instanceof Error ? e.message : 'La suppression a échoué.'
  } finally {
    deleting.value = false
    deletePassword.value = ''
  }
}
</script>

<style scoped>
/* Pied de page des documents légaux. Discret : on vient ici pour son profil,
   pas pour lire des conditions — mais on doit pouvoir les trouver. Sans
   séparateur « · », qui resterait orphelin en fin de ligne quand les quatre
   libellés passent à la ligne. */
.legaux {
  display: flex;
  justify-content: center;
  align-items: center;
  flex-wrap: wrap;
  column-gap: 16px;
  row-gap: 6px;
  margin-top: 26px;
  font-size: 12.5px;
  color: var(--text-muted);
}
.legaux a {
  color: var(--text-soft);
}
.legaux a:hover {
  color: var(--violet-600);
  text-decoration: underline;
}

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
/* La largeur minimale sert à faire passer le corps sous la photo sur écran
   moyen. Elle doit céder quand l'écran est plus étroit qu'elle : sinon elle
   déborde au lieu de s'adapter. */
.hero__body {
  flex: 1;
  min-width: min(280px, 100%);
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
/* Un trait entre deux actions d'une même carte : la suppression du compte, ou
   l'import, n'est pas la suite de la ligne du dessus. */
.account--danger,
.account--sep {
  margin-top: 18px;
  padding-top: 18px;
  border-top: 1px solid var(--border);
}

/* Deux colonnes tant que la largeur le permet : les six catégories tiennent
   alors sous les yeux sans faire défiler la fenêtre. */
.recap {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 4px 18px;
  margin: 0;
  padding-left: 20px;
  color: var(--text-soft);
  font-size: 14px;
  line-height: 1.6;
}
.recap b {
  color: var(--text);
}

.alert-ok,
.alert-err {
  font-size: 13.5px;
  line-height: 1.5;
  border-radius: var(--radius-sm);
  padding: 10px 13px;
  margin: 14px 0 0;
  word-break: break-word;
}
.alert-err {
  background: var(--red-bg);
  color: var(--red);
}
.alert-ok {
  background: var(--green-bg);
  color: var(--green);
}
</style>
