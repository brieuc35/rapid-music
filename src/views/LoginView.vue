<template>
  <div class="login">
    <div class="login__card">
      <div class="login__brand">
        <div class="brand__mark">
          <BrandMark />
        </div>
        <div class="login__title">Rapid<b>Music</b></div>
      </div>

      <!-- Une seule accroche pour la connexion et l'inscription. L'écran de mot
           de passe oublié garde sa phrase, qui explique ce qui va se passer :
           une accroche y remplacerait une information utile. -->
      <p class="login__lead">
        {{
          mode === 'reset'
            ? 'Indiquez votre adresse : vous recevrez un lien pour choisir un nouveau mot de passe.'
            : 'Tout votre univers, en une application.'
        }}
      </p>

      <form class="vstack" style="gap: 14px" @submit.prevent="submit">
        <div class="field">
          <label for="email">Adresse e-mail</label>
          <input
            id="email"
            v-model="email"
            type="email"
            autocomplete="email"
            placeholder="vous@exemple.fr"
            required
          />
        </div>

        <div v-if="mode !== 'reset'" class="field">
          <label for="password">Mot de passe</label>
          <div class="pwd">
            <input
              id="password"
              v-model="password"
              :type="visible ? 'text' : 'password'"
              :autocomplete="mode === 'signup' ? 'new-password' : 'current-password'"
              placeholder="••••••••"
              required
            />
            <!-- type="button" : sans lui, le bouton validerait le formulaire. -->
            <button
              type="button"
              class="pwd__eye"
              :aria-label="visible ? 'Masquer le mot de passe' : 'Afficher le mot de passe'"
              :aria-pressed="visible"
              :title="visible ? 'Masquer le mot de passe' : 'Afficher le mot de passe'"
              @click="visible = !visible"
            >
              <Icon :name="visible ? 'eye-off' : 'eye'" />
            </button>
          </div>
          <!-- À l'inscription seulement : à la connexion, aucune exigence n'est
               rappelée, puisqu'on saisit un mot de passe déjà existant. -->
          <p v-if="mode === 'signup'" class="rule" :class="{ 'rule--ok': longEnough }">
            <Icon :name="longEnough ? 'check' : 'close'" />
            Six caractères au minimum
          </p>
        </div>

        <p v-if="error" class="alert alert--error">{{ error }}</p>
        <p v-if="notice" class="alert alert--ok">{{ notice }}</p>

        <button class="btn btn--primary btn--block" type="submit" :disabled="busy">
          <Icon :name="busy ? 'clock' : 'check'" />
          {{
            busy
              ? 'Un instant…'
              : mode === 'signup'
                ? 'Créer mon compte'
                : mode === 'reset'
                  ? 'Envoyer le lien'
                  : 'Se connecter'
          }}
        </button>
      </form>

      <div class="login__links">
        <template v-if="mode === 'login'">
          <button class="link" @click="switchTo('signup')">Créer un compte</button>
          <button class="link" @click="switchTo('reset')">Mot de passe oublié</button>
        </template>
        <button v-else class="link" @click="switchTo('login')">
          Revenir à la connexion
        </button>
      </div>

      <p class="login__note">
        Vos données sont enregistrées sur votre compte, dans un centre de données européen.
      </p>

      <!--  Consultables avant de créer un compte : c'est tout l'intérêt. On ne
            peut pas demander d'accepter des conditions qu'il faudrait un compte
            pour lire. -->
      <nav class="login__legal" aria-label="Informations légales">
        <RouterLink v-for="p in PAGES_LEGALES" :key="p.to" :to="p.to">{{ p.libelle }}</RouterLink>
      </nav>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { RouterLink } from 'vue-router'
import BrandMark from '@/components/BrandMark.vue'
import Icon from '@/components/Icon.vue'
import { login, signUp, resetPassword } from '@/store'
import { PAGES_LEGALES } from '@/router/legal'

type Mode = 'login' | 'signup' | 'reset'

const mode = ref<Mode>('login')
const email = ref('')
const password = ref('')
const visible = ref(false)
const error = ref('')
const notice = ref('')
const busy = ref(false)

/*  Six caractères : c'est aussi le minimum imposé par Firebase, la règle
 *  affichée correspond donc exactement à ce que le serveur acceptera. */
const longEnough = computed(() => password.value.length >= 6)

function switchTo(m: Mode) {
  mode.value = m
  error.value = ''
  notice.value = ''
  // Ne pas laisser un mot de passe en clair d'un écran à l'autre.
  visible.value = false
}

async function submit() {
  error.value = ''
  notice.value = ''
  // Vérifié avant d'appeler Firebase : inutile d'envoyer une demande vouée à
  // l'échec, et le message reste le nôtre plutôt qu'un code traduit.
  if (mode.value === 'signup' && !longEnough.value) {
    error.value = 'Le mot de passe doit compter au moins six caractères.'
    return
  }
  busy.value = true
  try {
    if (mode.value === 'signup') {
      await signUp(email.value, password.value)
    } else if (mode.value === 'reset') {
      await resetPassword(email.value)
      notice.value = 'Message envoyé. Consultez votre boîte de réception.'
      mode.value = 'login'
    } else {
      await login(email.value, password.value)
    }
    password.value = ''
    visible.value = false
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Une erreur est survenue.'
  } finally {
    busy.value = false
  }
}
</script>

<style scoped>
.login {
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 24px;
  background: var(--nav-bg);
  background-image: radial-gradient(90% 70% at 15% 0%, rgba(139, 92, 246, 0.35), transparent 60%),
    radial-gradient(80% 70% at 100% 100%, rgba(236, 72, 153, 0.3), transparent 60%);
}
.login__card {
  background: var(--surface);
  border-radius: var(--radius-lg);
  padding: 34px 30px 28px;
  width: 100%;
  max-width: 400px;
  box-shadow: var(--shadow-lg);
  text-align: center;
}
.login__brand {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  margin-bottom: 18px;
}
.brand__mark {
  width: 42px;
  height: 42px;
  border-radius: 13px;
  background: var(--brand-gradient);
  display: grid;
  place-items: center;
  box-shadow: 0 8px 20px rgba(236, 72, 153, 0.35);
}
.brand__mark svg {
  width: 23px;
  height: 23px;
}
.login__title {
  font-size: 21px;
  font-weight: 700;
  letter-spacing: -0.02em;
}
.login__title b {
  background: var(--brand-gradient);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}
.login__lead {
  color: var(--text-soft);
  font-size: 14.5px;
  line-height: 1.55;
  margin-bottom: 22px;
}
.login__card .field {
  text-align: left;
}

.rule {
  display: flex;
  align-items: center;
  gap: 7px;
  margin-top: 9px;
  font-size: 12.5px;
  line-height: 1.4;
  color: var(--text-soft);
}
.rule svg {
  width: 13px;
  height: 13px;
  flex-shrink: 0;
}
/* Même nombre de classes que la règle ci-dessus, sinon l'ordre de déclaration
   suffirait mais toute réorganisation du fichier casserait la couleur. */
.rule.rule--ok {
  color: var(--green);
}

.pwd {
  position: relative;
}
/* Le texte saisi ne doit pas passer sous le bouton. */
.pwd input {
  padding-right: 44px;
}
.pwd__eye {
  position: absolute;
  top: 50%;
  right: 4px;
  transform: translateY(-50%);
  width: 34px;
  height: 34px;
  border: 0;
  border-radius: 9px;
  background: none;
  color: var(--text-muted);
  display: grid;
  place-items: center;
  transition: color 0.15s, background 0.15s;
}
.pwd__eye svg {
  width: 18px;
  height: 18px;
}
.pwd__eye:hover {
  color: var(--violet-600);
  background: var(--violet-50);
}
.pwd__eye:focus-visible {
  outline: 2px solid var(--violet-400);
  outline-offset: 1px;
}
.alert {
  font-size: 13.5px;
  line-height: 1.5;
  border-radius: var(--radius-sm);
  padding: 10px 13px;
  margin: 0;
  text-align: left;
}
.alert--error {
  background: var(--red-bg);
  color: var(--red);
}
.alert--ok {
  background: var(--green-bg);
  color: var(--green);
}
.login__links {
  display: flex;
  justify-content: center;
  gap: 18px;
  margin-top: 16px;
  flex-wrap: wrap;
}
.link {
  background: none;
  border: 0;
  padding: 0;
  font-size: 13.5px;
  font-weight: 600;
  color: var(--violet-600);
}
.link:hover {
  text-decoration: underline;
}
.login__note {
  color: var(--text-muted);
  font-size: 12.5px;
  line-height: 1.5;
  margin-top: 18px;
}
/* Discret mais atteignable : on doit pouvoir lire les conditions avant de
   créer un compte, sans que ces liens concurrencent le formulaire.

   Aucun séparateur entre les liens : à cette largeur ils passent à la ligne, et
   un « · » se retrouverait orphelin en fin de ligne. L'espacement suffit. */
.login__legal {
  display: flex;
  justify-content: center;
  align-items: center;
  flex-wrap: wrap;
  column-gap: 14px;
  row-gap: 5px;
  margin-top: 14px;
  font-size: 12px;
  color: var(--text-muted);
}
.login__legal a {
  color: var(--text-soft);
}
.login__legal a:hover {
  color: var(--violet-600);
  text-decoration: underline;
}
</style>
