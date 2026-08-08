<template>
  <div class="onb">
    <div class="onb__card">
      <div class="onb__head">
        <span class="onb__mark"><BrandMark /></span>
        <div>
          <h1 class="onb__title">Bienvenue sur Rapid<b>Music</b></h1>
          <p class="onb__lead">
            Créons votre profil d'artiste. Tout reste modifiable ensuite.
          </p>
        </div>
      </div>

      <form class="vstack" style="gap: 16px" @submit.prevent="submit">
        <!-- Photo -->
        <div class="onb__photo">
          <Avatar :name="stageName || '?'" :photo="photo" :size="72" radius="20px" :font="26" />
          <div class="vstack" style="gap: 6px; align-items: flex-start">
            <label class="btn btn--ghost btn--sm" for="onb-photo">
              <Icon name="edit" /> {{ photo ? 'Changer la photo' : 'Ajouter une photo' }}
            </label>
            <input
              id="onb-photo"
              type="file"
              accept="image/*"
              class="onb__file"
              @change="pickPhoto"
            />
            <button v-if="photo" type="button" class="link link--muted" @click="photo = ''">
              Retirer
            </button>
            <p v-else class="onb__hint">Facultatif — vos initiales seront affichées.</p>
          </div>
        </div>
        <p v-if="photoError" class="alert alert--error">{{ photoError }}</p>

        <div class="field">
          <label for="onb-name">Nom de scène <span class="req">*</span></label>
          <input
            id="onb-name"
            v-model="stageName"
            maxlength="40"
            placeholder="Ex : NOVA"
            required
          />
        </div>

        <div class="field--row">
          <div class="field">
            <label for="onb-genre">Style de musique</label>
            <input id="onb-genre" v-model="genre" maxlength="40" placeholder="Ex : Rap, Électro" />
          </div>
          <div class="field">
            <label for="onb-city">Ville</label>
            <input id="onb-city" v-model="city" maxlength="40" placeholder="Ex : Rennes, FR" />
          </div>
        </div>

        <div class="field">
          <label for="onb-bio">Présentation</label>
          <textarea
            id="onb-bio"
            v-model="bio"
            rows="3"
            maxlength="300"
            placeholder="Quelques mots sur votre projet…"
          />
          <p class="onb__hint">{{ bio.length }} / 300 — facultatif</p>
        </div>

        <!-- Contenu de départ -->
        <fieldset class="onb__start">
          <legend>Pour commencer</legend>
          <label v-for="o in startOptions" :key="o.value" class="onb__opt" :class="{ 'onb__opt--on': withDemo === o.value }">
            <input v-model="withDemo" type="radio" :value="o.value" name="depart" />
            <span>
              <b>{{ o.title }}</b>
              <small>{{ o.text }}</small>
            </span>
          </label>
        </fieldset>

        <button class="btn btn--primary btn--block" type="submit" :disabled="!stageName.trim()">
          <Icon name="check" /> Entrer dans RapidMusic
        </button>
        <p v-if="!stageName.trim()" class="onb__hint" style="text-align: center">
          Le nom de scène est nécessaire pour continuer.
        </p>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import Avatar from '@/components/Avatar.vue'
import BrandMark from '@/components/BrandMark.vue'
import Icon from '@/components/Icon.vue'
import { completeOnboarding } from '@/store'
import { fileToAvatarDataUrl, ImageError } from '@/utils/image'

const stageName = ref('')
const genre = ref('')
const city = ref('')
const bio = ref('')
const photo = ref('')
const photoError = ref('')
const withDemo = ref(false)

const startOptions = [
  {
    value: false,
    title: 'Un espace vierge',
    text: 'Vous ajoutez vos concerts, contrats et sorties au fur et à mesure.',
  },
  {
    value: true,
    title: 'Avec des exemples',
    text: 'Un catalogue de démonstration, pour voir l’outil rempli. Supprimable ensuite.',
  },
]

async function pickPhoto(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  photoError.value = ''
  try {
    photo.value = await fileToAvatarDataUrl(file)
  } catch (err) {
    photoError.value =
      err instanceof ImageError ? err.message : "Cette image n'a pas pu être chargée."
  } finally {
    // Remis à zéro pour qu'un second choix du même fichier déclenche l'évènement.
    input.value = ''
  }
}

function submit() {
  const name = stageName.value.trim()
  if (!name) return
  completeOnboarding(
    {
      stageName: name,
      genre: genre.value.trim(),
      city: city.value.trim(),
      bio: bio.value.trim(),
      photo: photo.value,
    },
    withDemo.value,
  )
}
</script>

<style scoped>
.onb {
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 24px;
  background: var(--nav-bg);
  background-image: radial-gradient(90% 70% at 15% 0%, rgba(139, 92, 246, 0.35), transparent 60%),
    radial-gradient(80% 70% at 100% 100%, rgba(236, 72, 153, 0.3), transparent 60%);
}
.onb__card {
  background: var(--surface);
  border-radius: var(--radius-lg);
  padding: 30px 30px 26px;
  width: 100%;
  max-width: 520px;
  box-shadow: var(--shadow-lg);
}
.onb__head {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  margin-bottom: 22px;
}
.onb__mark {
  width: 46px;
  height: 46px;
  border-radius: 14px;
  background: var(--brand-gradient);
  background-clip: padding-box;
  display: grid;
  place-items: center;
  flex-shrink: 0;
  box-shadow: 0 6px 16px -5px rgba(236, 72, 153, 0.6);
}
.onb__mark svg {
  width: 24px;
  height: 24px;
}
.onb__title {
  font-size: 20px;
  font-weight: 700;
  letter-spacing: -0.02em;
}
.onb__title b {
  background: var(--brand-gradient);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}
.onb__lead {
  color: var(--text-soft);
  font-size: 14px;
  line-height: 1.5;
  margin-top: 4px;
}

/* Le bouton « Ajouter une photo » ne se coupe pas (règle de .btn) : sans
   passage à la ligne, l'avatar et lui imposaient à la carte une largeur
   minimale de 311 px, qui débordait d'un écran de 320 px. */
.onb__photo {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}
/* Le fichier est choisi par le bouton associé au label, pas par ce champ. */
.onb__file {
  position: absolute;
  width: 1px;
  height: 1px;
  opacity: 0;
  pointer-events: none;
}
.onb__hint {
  color: var(--text-muted);
  font-size: 12px;
  line-height: 1.4;
}
.req {
  color: var(--pink-500);
}

.onb__start {
  border: 0;
  padding: 0;
  margin: 2px 0 0;
}
.onb__start legend {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-soft);
  padding: 0 0 8px;
}
.onb__opt {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 11px 13px;
  border: 1px solid var(--border-strong);
  border-radius: var(--radius-sm);
  margin-bottom: 8px;
  transition: border-color 0.15s, background 0.15s;
}
.onb__opt:hover {
  border-color: var(--violet-400);
}
.onb__opt--on {
  border-color: var(--violet-500);
  background: var(--violet-50);
}
.onb__opt input {
  margin-top: 3px;
  accent-color: var(--violet-600);
  flex-shrink: 0;
}
.onb__opt b {
  display: block;
  font-size: 14px;
}
.onb__opt small {
  color: var(--text-muted);
  font-size: 12.5px;
  line-height: 1.45;
}

.alert {
  font-size: 13.5px;
  border-radius: var(--radius-sm);
  padding: 10px 13px;
  margin: 0;
}
.alert--error {
  background: var(--red-bg);
  color: var(--red);
}
.link {
  background: none;
  border: 0;
  padding: 0;
  font-size: 13px;
  font-weight: 600;
  color: var(--violet-600);
}
.link--muted {
  color: var(--text-muted);
  font-weight: 500;
}
.link:hover {
  text-decoration: underline;
}
</style>
