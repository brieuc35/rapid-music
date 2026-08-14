<template>
  <!-- Le temps que Firebase rétablisse la session : ni l'un ni l'autre écran,
       pour ne pas faire apparaître la connexion à quelqu'un de déjà connecté. -->
  <div v-if="!authReady" class="boot">
    <span class="boot__mark"><BrandMark /></span>
  </div>

  <!--  Les documents légaux passent avant tout test de session : ils doivent
        s'ouvrir sans compte. Ils portent leur propre mise en page, sans le menu
        de l'application, et valent aussi bien pour un visiteur que pour un
        artiste connecté. -->
  <RouterView v-else-if="pagePublique" />

  <LoginView v-else-if="!isLoggedIn" />

  <!-- Compte tout neuf : le profil se crée avant d'entrer dans l'application. -->
  <OnboardingView v-else-if="needsOnboarding" />

  <div v-else class="app-shell">
    <!-- Mobile scrim -->
    <div class="scrim" :class="{ 'scrim--show': menuOpen }" @click="menuOpen = false" />

    <!-- Sidebar -->
    <aside class="sidebar" :class="{ 'sidebar--open': menuOpen }">
      <div class="brand">
        <div class="brand__mark">
          <BrandMark />
        </div>
        <div>
          <div class="brand__name">Rapid<b>Music</b></div>
          <div class="brand__tag">Gestion de carrière</div>
        </div>
      </div>

      <nav class="nav">
        <span class="nav__label">Pilotage</span>
        <RouterLink
          v-for="item in topNav"
          :key="item.path"
          :to="item.path"
          class="nav__item"
          @click="menuOpen = false"
        >
          <Icon :name="item.icon" />
          <span>{{ item.title }}</span>
          <span v-if="item.pro && !isPro" class="nav__pro">Pro</span>
          <span v-else-if="item.badge" class="nav__badge">{{ item.badge }}</span>
        </RouterLink>

        <span class="nav__label">Organisation</span>
        <RouterLink
          v-for="item in bottomNav"
          :key="item.path"
          :to="item.path"
          class="nav__item"
          @click="menuOpen = false"
        >
          <Icon :name="item.icon" />
          <span>{{ item.title }}</span>
          <span v-if="item.pro && !isPro" class="nav__pro">Pro</span>
          <span v-else-if="item.badge" class="nav__badge">{{ item.badge }}</span>
        </RouterLink>

        <!-- Le Réseau garde sa place, mais n'ouvre rien : il n'est pas encore
             ouvert. Un lien qui mènerait à un fil de démonstration promettrait
             un service qui n'existe pas. L'entrée reste visible pour annoncer
             ce qui vient. -->
        <div class="nav__item nav__item--highlight nav__item--soon" aria-disabled="true">
          <Icon name="globe" />
          <span>Réseau</span>
          <span class="nav__soon">Bientôt</span>
        </div>
      </nav>

      <div class="nav__foot">
        <div class="sync" :class="`sync--${syncState}`" :title="syncMessage || undefined">
          <span class="sync__dot" />
          {{ syncLabel }}
        </div>

        <RouterLink v-if="!isPro" to="/abonnement" class="upsell">
          <span class="upsell__ico"><Icon name="star" /></span>
          <div class="upsell__text">
            <b>Passer à Pro</b>
            <span>Revenus, contrats, cachets</span>
          </div>
        </RouterLink>

        <RouterLink
          to="/mon-profil"
          class="artist-chip"
          title="Voir mon profil"
          @click="menuOpen = false"
        >
          <Avatar
            :name="store.artist.stageName"
            :photo="store.artist.photo"
            :size="36"
            radius="50%"
            :font="14"
          />
          <div class="artist-chip__text">
            <div class="artist-chip__name">{{ store.artist.stageName }}</div>
            <div class="artist-chip__role">{{ store.artist.genre }}</div>
          </div>
          <Icon name="up" class="artist-chip__chevron" />
        </RouterLink>

        <!--  Accessibles depuis l'application elle-même, et pas seulement de
              l'écran de connexion : on doit pouvoir retrouver comment supprimer
              son compte sans avoir à se déconnecter pour y arriver. -->
        <nav class="nav__legal" aria-label="Informations légales">
          <RouterLink v-for="p in PAGES_LEGALES" :key="p.to" :to="p.to" @click="menuOpen = false">
            {{ p.libelle }}
          </RouterLink>
        </nav>
      </div>
    </aside>

    <!-- Main -->
    <div class="main">
      <header class="topbar">
        <button class="icon-btn" @click="menuOpen = true" aria-label="Menu">
          <Icon name="menu" />
        </button>
        <RouterLink to="/tableau-de-bord" class="topbar__brand">
          <span class="topbar__mark"><BrandMark /></span>
          <span class="topbar__title">Rapid<b>Music</b></span>
        </RouterLink>
      </header>

      <!-- Adresse non confirmée : rappel visible mais qui ne bloque rien.
           Exiger la confirmation pour entrer enfermerait dehors quiconque
           n'aurait pas reçu le message. -->
      <div v-if="!emailVerified && !verifDismissed" class="verif">
        <Icon name="mail" />
        <div class="verif__text">
          <b>Confirmez votre adresse e-mail.</b>
          Un lien vous a été envoyé à {{ currentUser?.email }}. Sans confirmation, vous ne
          pourrez pas récupérer votre compte en cas de mot de passe oublié.
        </div>
        <div class="verif__actions">
          <button class="btn btn--sm btn--ghost" :disabled="verifBusy" @click="doResend">
            {{ verifBusy ? 'Envoi…' : 'Renvoyer le lien' }}
          </button>
          <button class="btn btn--sm btn--ghost" @click="doRefresh">C'est fait</button>
          <button class="verif__close" aria-label="Masquer" @click="verifDismissed = true">
            <Icon name="close" />
          </button>
        </div>
      </div>
      <p v-if="verifNote" class="verif__note">{{ verifNote }}</p>

      <RouterView v-slot="{ Component }">
        <component :is="Component" />
      </RouterView>
    </div>
  </div>

  <!--  Une nouvelle version est en cache et attend. Elle n'est pas appliquée
        d'office : recharger au milieu d'une saisie ferait perdre ce qui est en
        train d'être écrit. Le bandeau est en dehors de la mise en page, pour
        rester visible quel que soit le défilement. -->
  <div v-if="majDisponible" class="maj" role="status">
    <Icon name="check" />
    <span class="maj__texte">Une nouvelle version est prête.</span>
    <button class="btn btn--sm btn--primary" :disabled="majEnCours" @click="appliquerMaj">
      {{ majEnCours ? 'Chargement…' : 'Recharger' }}
    </button>
    <button class="maj__close" aria-label="Plus tard" @click="majDisponible = false">
      <Icon name="close" />
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { RouterLink, RouterView, useRoute } from 'vue-router'
import Icon from './components/Icon.vue'
import Avatar from './components/Avatar.vue'
import BrandMark from './components/BrandMark.vue'
import LoginView from './views/LoginView.vue'
import OnboardingView from './views/OnboardingView.vue'
import {
  store,
  isLoggedIn,
  authReady,
  needsOnboarding,
  isPro,
  openTasks,
  emailVerified,
  currentUser,
  resendVerification,
  refreshVerification,
} from './store'
import { majDisponible, majEnCours, appliquerMaj } from './pwa'
import { PAGES_LEGALES } from './router/legal'

const route = useRoute()

/** Vrai sur les documents légaux, consultables sans compte. */
const pagePublique = computed(() => route.meta.public === true)
import { syncState, syncMessage } from './store/sync'
import { daysFromNow } from './utils/format'

const menuOpen = ref(false)

/* Bandeau de confirmation d'adresse. Masquable pour la session en cours : il
 * informe, il n'a pas à s'imposer à chaque écran. */
const verifDismissed = ref(false)
const verifBusy = ref(false)
const verifNote = ref('')

async function doResend() {
  verifBusy.value = true
  verifNote.value = ''
  try {
    await resendVerification()
    verifNote.value = 'Lien renvoyé. Pensez à regarder dans les indésirables.'
  } catch (e) {
    verifNote.value = e instanceof Error ? e.message : "L'envoi a échoué."
  } finally {
    verifBusy.value = false
  }
}

async function doRefresh() {
  verifNote.value = ''
  switch (await refreshVerification()) {
    case 'confirmee':
      verifNote.value = 'Adresse confirmée, merci.'
      break
    case 'en-attente':
      verifNote.value =
        "L'adresse n'est pas encore confirmée. Ouvrez le lien reçu par e-mail, puis réessayez."
      break
    case 'injoignable':
      verifNote.value = 'Vérification impossible : contrôlez votre connexion.'
      break
    case 'sans-session':
      verifNote.value = 'Votre session a expiré. Reconnectez-vous.'
      break
  }
}

const syncLabel = computed(() => {
  switch (syncState.value) {
    case 'saving':
      return 'Enregistrement…'
    case 'saved':
      return 'Enregistré'
    case 'offline':
      return 'Hors connexion'
    case 'error':
      return "Échec de l'enregistrement"
    default:
      return 'Prêt'
  }
})

const upcomingConcerts = computed(
  () => store.concerts.filter((c) => c.status !== 'Terminé' && daysFromNow(c.date) >= 0).length,
)
const upcomingSessions = computed(
  () => store.studio.filter((s) => daysFromNow(s.date) >= 0).length,
)
const pendingContracts = computed(
  () => store.contracts.filter((c) => c.status === 'En attente').length,
)

const topNav = computed(() => [
  { path: '/tableau-de-bord', title: 'Tableau de bord', icon: 'dashboard', badge: 0 },
  { path: '/concerts', title: 'Concerts', icon: 'concert', badge: upcomingConcerts.value },
  { path: '/sorties', title: 'Sorties', icon: 'release', badge: store.releases.length },
  { path: '/royalties', title: 'Royalties', icon: 'money', badge: 0, pro: true },
])

const bottomNav = computed(() => [
  { path: '/studio', title: 'Agenda', icon: 'calendar', badge: upcomingSessions.value },
  /*  Juste après l'Agenda : les deux répondent à la même question, ce que j'ai à
   *  faire. Le compteur montre les tâches ouvertes, comme les autres entrées
   *  montrent ce qui attend. */
  { path: '/taches', title: 'Tâches', icon: 'check', badge: openTasks.value.length },
  { path: '/contrats', title: 'Contrats', icon: 'contract', badge: pendingContracts.value, pro: true },
  { path: '/contacts', title: 'Contacts', icon: 'contacts', badge: 0 },
  { path: '/label', title: 'Label', icon: 'label', badge: 0 },
])
</script>

