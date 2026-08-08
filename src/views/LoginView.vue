<template>
  <div class="login">
    <div class="login__card">
      <div class="login__brand">
        <div class="brand__mark">
          <BrandMark />
        </div>
        <div class="login__title">Rapid<b>Music</b></div>
      </div>

      <p class="login__lead">
        {{
          mode === 'signup'
            ? 'Créez votre compte : vos données vous suivront d’un appareil à l’autre.'
            : mode === 'reset'
              ? 'Indiquez votre adresse : vous recevrez un lien pour choisir un nouveau mot de passe.'
              : 'Connectez-vous pour retrouver votre carrière.'
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
          <!-- À l'inscription seulement : les règles s'affichent et se cochent
               à la saisie. À la connexion, aucune exigence n'est rappelée — un
               mot de passe créé avant cette règle doit continuer à fonctionner. -->
          <ul v-if="mode === 'signup'" class="rules">
            <li v-for="r in rules" :key="r.label" :class="{ 'rules--ok': r.ok }">
              <Icon :name="r.ok ? 'check' : 'close'" />
              {{ r.label }}
            </li>
          </ul>
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
        Elles restent consultables hors connexion et repartent dès que le réseau revient.
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import BrandMark from '@/components/BrandMark.vue'
import Icon from '@/components/Icon.vue'
import { login, signUp, resetPassword } from '@/store'

type Mode = 'login' | 'signup' | 'reset'

const mode = ref<Mode>('login')
const email = ref('')
const password = ref('')
const visible = ref(false)
const error = ref('')
const notice = ref('')
const busy = ref(false)

/*  Est « spécial » tout ce qui n'est ni une lettre ni un chiffre : ponctuation,
 *  symboles, tiret, espace. Les lettres accentuées restent des lettres, sans
 *  quoi « é » passerait pour un caractère spécial. */
const SPECIAL = /[^\p{L}\p{N}]/u

const rules = computed(() => [
  { label: 'Six caractères au minimum', ok: password.value.length >= 6 },
  {
    label: 'Au moins un caractère spécial (! ? # @ …)',
    ok: SPECIAL.test(password.value),
  },
])

const passwordOk = computed(() => rules.value.every((r) => r.ok))

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
  if (mode.value === 'signup' && !passwordOk.value) {
    error.value = 'Mot de passe trop simple : ' + rules.value.filter((r) => !r.ok).map((r) => r.label.toLowerCase()).join(', ') + '.'
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

.rules {
  list-style: none;
  margin: 9px 0 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 5px;
}
.rules li {
  display: flex;
  align-items: center;
  gap: 7px;
  font-size: 12.5px;
  line-height: 1.4;
  color: var(--text-muted);
}
.rules svg {
  width: 13px;
  height: 13px;
  flex-shrink: 0;
}
/* Sélecteur volontairement aussi spécifique que « .rules li » : avec la seule
   classe, la règle grise ci-dessus l'emporterait et la validation ne se
   verrait pas. */
.rules li.rules--ok {
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
</style>
