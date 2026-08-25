<template>
  <div class="legal">
    <header class="legal__top">
      <span class="legal__brand">
        <span class="legal__mark"><BrandMark /></span>
        <span class="legal__name">Rapid<b>Music</b></span>
      </span>
    </header>

    <article class="legal__doc">
      <h1>{{ titre }}</h1>

      <!-- En cours : ni succès ni échec, pour ne rien annoncer qui puisse être
           démenti une seconde plus tard. -->
      <p v-if="etat === 'attente'" class="act__ligne">Un instant…</p>

      <!-- Réinitialisation : le seul cas qui demande quelque chose à l'artiste. -->
      <form v-else-if="etat === 'mot-de-passe'" class="act__form" @submit.prevent="enregistrerMotDePasse">
        <p class="act__ligne">
          Choisissez un nouveau mot de passe pour <b>{{ adresseConcernee }}</b>.
        </p>
        <label class="field">
          <span class="field__label">Nouveau mot de passe</span>
          <input
            v-model="motDePasse"
            type="password"
            class="input"
            autocomplete="new-password"
            minlength="6"
            required
          />
        </label>
        <p class="act__aide">6 caractères au minimum.</p>
        <button class="btn btn--primary" type="submit" :disabled="occupe">
          {{ occupe ? 'Enregistrement…' : 'Enregistrer' }}
        </button>
        <p v-if="erreur" class="act__erreur">{{ erreur }}</p>
      </form>

      <template v-else-if="etat === 'fait'">
        <p class="act__ligne act__ligne--ok">{{ message }}</p>
        <a class="btn btn--primary" :href="lienRetour">Ouvrir RapidMusic</a>
      </template>

      <template v-else>
        <p class="act__ligne act__ligne--ko">{{ message }}</p>
        <a class="btn btn--ghost" :href="lienRetour">Retour à RapidMusic</a>
      </template>
    </article>
  </div>
</template>

<script setup lang="ts">
/*  La page d'atterrissage des liens envoyés par Firebase.
 *
 *  Elle remplace celle de Google, qui s'affiche en anglais et à ses couleurs.
 *  Le réglage se fait dans la console : Authentication → Templates → Modifier →
 *  « Personnaliser l'URL d'action ». Il vaut pour TOUS les messages d'action,
 *  d'où la nécessité de traiter aussi la réinitialisation de mot de passe : ne
 *  gérer que la confirmation d'adresse casserait le mot de passe oublié.
 */
import { onMounted, ref } from 'vue'
import {
  applyActionCode,
  checkActionCode,
  confirmPasswordReset,
  verifyPasswordResetCode,
} from 'firebase/auth'
import { auth } from '@/firebase'
import BrandMark from '@/components/BrandMark.vue'
import { lireAction, messageAction, retourSur, TITRES } from '@/auth-action'

type Etat = 'attente' | 'fait' | 'echec' | 'mot-de-passe'

const etat = ref<Etat>('attente')
const titre = ref('Un instant…')
const message = ref('')
const erreur = ref('')
const motDePasse = ref('')
const occupe = ref(false)
const adresseConcernee = ref('')
const lienRetour = ref('https://rapidmusic.fr/')

let code = ''

function echouer(e: unknown): void {
  const c = (e as { code?: string })?.code ?? ''
  etat.value = 'echec'
  message.value = messageAction(c)
}

onMounted(async () => {
  const action = lireAction(window.location.href)
  /*  Le retour n'est suivi que s'il pointe chez nous : il arrive par l'adresse
   *  de la page, donc modifiable par quiconque. */
  lienRetour.value = retourSur(action.suite) ?? 'https://rapidmusic.fr/'
  titre.value = (action.mode && TITRES[action.mode]) || 'Lien RapidMusic'

  if (!action.code) {
    etat.value = 'echec'
    message.value = 'Ce lien est incomplet. Ouvrez-le directement depuis le message reçu.'
    return
  }
  code = action.code

  try {
    switch (action.mode) {
      case 'verifyEmail':
      case 'verifyAndChangeEmail':
        await applyActionCode(auth, code)
        /*  Le jeton local garde l'état qu'il avait : sans ce rafraîchissement,
         *  un artiste déjà connecté dans cet onglet continuerait de voir le
         *  bandeau « confirmez votre adresse » après l'avoir confirmée. */
        await auth.currentUser?.reload().catch(() => {})
        etat.value = 'fait'
        message.value = 'Votre adresse est confirmée. Vous pouvez revenir à l’application.'
        break

      case 'resetPassword':
        adresseConcernee.value = await verifyPasswordResetCode(auth, code)
        etat.value = 'mot-de-passe'
        break

      case 'recoverEmail': {
        const info = await checkActionCode(auth, code)
        await applyActionCode(auth, code)
        etat.value = 'fait'
        message.value = info.data.email
          ? `Votre adresse est revenue à ${info.data.email}.`
          : 'Votre ancienne adresse a été rétablie.'
        break
      }

      default:
        etat.value = 'echec'
        message.value = 'Ce lien ne correspond à aucune opération connue.'
    }
  } catch (e) {
    echouer(e)
  }
})

async function enregistrerMotDePasse(): Promise<void> {
  if (occupe.value) return
  occupe.value = true
  erreur.value = ''
  try {
    await confirmPasswordReset(auth, code, motDePasse.value)
    etat.value = 'fait'
    titre.value = 'Mot de passe modifié'
    message.value = 'Votre mot de passe est enregistré. Vous pouvez vous connecter avec.'
  } catch (e) {
    const c = (e as { code?: string })?.code ?? ''
    erreur.value = messageAction(c)
  } finally {
    occupe.value = false
  }
}
</script>

<style scoped>
.act__ligne {
  margin: 0 0 18px;
  font-size: 15px;
  line-height: 1.6;
  color: var(--text);
}
.act__ligne--ok {
  color: var(--green-700, #15803d);
  font-weight: 600;
}
.act__ligne--ko {
  color: var(--text-muted);
}
.act__form {
  display: flex;
  flex-direction: column;
  gap: 10px;
  align-items: flex-start;
}
.act__aide {
  margin: -4px 0 6px;
  font-size: 12.5px;
  color: var(--text-muted);
}
.act__erreur {
  margin: 4px 0 0;
  font-size: 13.5px;
  color: var(--red-600, #dc2626);
}
.act__form .field {
  width: 100%;
  max-width: 320px;
}
</style>
