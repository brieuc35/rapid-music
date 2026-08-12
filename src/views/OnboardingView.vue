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
            <label for="onb-genre">Style de musique <span class="req">*</span></label>
            <select id="onb-genre" v-model="genre">
              <option value="">Choisissez un style</option>
              <option v-for="g in GENRES" :key="g" :value="g">{{ g }}</option>
              <option value="__autre">Autre…</option>
            </select>
          </div>
          <div class="field">
            <label for="onb-city">Ville</label>
            <input id="onb-city" v-model="city" maxlength="40" placeholder="Ex : Rennes, FR" />
          </div>
        </div>

        <!-- Aucune liste ne couvre tous les styles : « Autre » ouvre un champ
             libre plutôt que de contraindre à un choix approchant. -->
        <div v-if="genre === '__autre'" class="field">
          <label for="onb-genre-autre">Précisez votre style <span class="req">*</span></label>
          <input
            id="onb-genre-autre"
            v-model="genreAutre"
            maxlength="40"
            placeholder="Ex : Musique bretonne"
          />
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

        <!-- Formule -->
        <fieldset class="onb__start">
          <legend>Pour commencer <span class="req">*</span></legend>
          <label
            v-for="o in planOptions"
            :key="o.value"
            class="onb__opt"
            :class="{ 'onb__opt--on': plan === o.value }"
          >
            <input v-model="plan" type="radio" :value="o.value" name="formule" />
            <span>
              <b>
                {{ o.title }}
                <em class="onb__price">{{ o.price }}</em>
              </b>
              <small>{{ o.text }}</small>
              <!-- La mention porte sur le réseau, pas sur la formule : c'est lui
                   qui n'est pas encore ouvert, le reste de Pro l'est. Placée à
                   côté de sa phrase, elle ne peut pas se lire comme un doute sur
                   la formule entière. -->
              <small v-if="o.later" class="onb__later">
                <em class="onb__soon">Bientôt</em>
                {{ o.later }}
              </small>
            </span>
          </label>
          <p v-if="plan === 'pro'" class="onb__notice">
            <Icon name="bell" />
            Aucun paiement n'est encaissé et aucune coordonnée bancaire n'est demandée :
            l'accès Pro est activé en démonstration, et résiliable à tout moment depuis
            l'onglet Abonnement.
          </p>
        </fieldset>

        <button class="btn btn--primary btn--block" type="submit" :disabled="!complet">
          <Icon name="check" /> Entrer dans RapidMusic
        </button>
        <p v-if="!complet" class="onb__hint" style="text-align: center">
          {{ manquant }}
        </p>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import Avatar from '@/components/Avatar.vue'
import BrandMark from '@/components/BrandMark.vue'
import Icon from '@/components/Icon.vue'
import { completeOnboarding, PRO_PRICE } from '@/store'
import type { Plan } from '@/store/types'
import { money } from '@/utils/format'
import { fileToAvatarDataUrl, ImageError } from '@/utils/image'
import { GENRES } from '@/utils/genres'

const stageName = ref('')
const genre = ref('')
const genreAutre = ref('')
const city = ref('')
const bio = ref('')
const photo = ref('')
const photoError = ref('')
/*  Volontairement sans choix par défaut : la formule doit résulter d'un clic.
 *  Présélectionner le gratuit ferait passer pour un choix ce qui n'en est pas
 *  un, et présélectionner Pro serait pire. */
const plan = ref<Plan | ''>('')

const planOptions = [
  {
    value: 'free' as Plan,
    title: 'Version gratuite',
    price: '0 €',
    text: 'Tableau de bord, agenda, sorties, contacts, dates de concerts.',
  },
  {
    value: 'pro' as Plan,
    title: 'Version Pro',
    price: money(PRO_PRICE, true) + ' / mois',
    /*  Ce qui est disponible le jour même de la souscription : c'est ici qu'on
     *  choisit de payer, rien de ce qui figure sur cette ligne ne doit attendre. */
    text: 'Accès à vos revenus, à vos contrats et aux cachets de vos concerts.',
    /*  Ce qui viendra s'y ajouter, sur sa propre ligne et portant sa propre
     *  mention. Mélangé à la phrase ci-dessus, le réseau se lirait comme
     *  disponible ; annoncé à côté d'une pastille « Bientôt », il ne trompe
     *  personne — et la mention ne jette plus de doute sur la formule entière. */
    later: 'Le réseau des professionnels s’y ajoutera à son ouverture.',
  },
]

/*  Style retenu. « Autre… » n'est qu'un déclencheur de champ libre : choisi
 *  sans rien saisir, il ne vaut pas un style. */
const style = computed(() =>
  genre.value === '__autre' ? genreAutre.value.trim() : genre.value,
)

const complet = computed(
  () => !!stageName.value.trim() && !!style.value && plan.value !== '',
)

/** Ce qu'il reste à renseigner, nommé plutôt que laissé à deviner. */
const manquant = computed(() => {
  const reste: string[] = []
  if (!stageName.value.trim()) reste.push('le nom de scène')
  if (!style.value) {
    reste.push(genre.value === '__autre' ? 'le style à préciser' : 'le style de musique')
  }
  if (plan.value === '') reste.push('la formule')
  const liste =
    reste.length > 1 ? reste.slice(0, -1).join(', ') + ' et ' + reste[reste.length - 1] : reste[0]
  return `Il reste à renseigner ${liste}.`
})

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
  if (!complet.value || plan.value === '') return
  completeOnboarding(
    {
      stageName: stageName.value.trim(),
      genre: style.value,
      city: city.value.trim(),
      bio: bio.value.trim(),
      photo: photo.value,
    },
    plan.value,
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

/* Ce qui viendra s'ajouter à la formule, sur sa propre ligne et en retrait :
   plus discret que ce qui est disponible tout de suite, sans être caché. */
.onb__later {
  display: block;
  margin-top: 5px;
  color: var(--text-muted);
}
/* Petite mention, pas une pastille de premier plan : elle qualifie une ligne
   secondaire, elle ne doit pas peser plus que le prix juste au-dessus. */
.onb__soon {
  font-style: normal;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--text-soft);
  background: var(--surface-2);
  border: 1px solid var(--border);
  border-radius: 20px;
  padding: 1px 7px;
  margin-right: 3px;
  white-space: nowrap;
}
.onb__opt input {
  margin-top: 3px;
  accent-color: var(--violet-600);
  flex-shrink: 0;
}
.onb__opt b {
  display: flex;
  align-items: baseline;
  gap: 8px;
  flex-wrap: wrap;
  font-size: 14px;
}
.onb__price {
  font-style: normal;
  font-size: 12.5px;
  font-weight: 600;
  color: var(--violet-600);
  background: var(--brand-gradient-soft);
  border-radius: 20px;
  padding: 1px 9px;
}
.onb__notice {
  display: flex;
  gap: 9px;
  align-items: flex-start;
  background: var(--amber-bg);
  border-radius: var(--radius-sm);
  padding: 10px 12px;
  margin: 2px 0 0;
  font-size: 12.5px;
  line-height: 1.45;
  color: #7a5410;
}
.onb__notice svg {
  width: 15px;
  height: 15px;
  flex-shrink: 0;
  margin-top: 1px;
  color: var(--amber);
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
