<template>
  <LoginView v-if="!isLoggedIn" />

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

        <!-- Mis en avant sous les deux catégories -->
        <RouterLink
          to="/reseau"
          class="nav__item nav__item--highlight"
          @click="menuOpen = false"
        >
          <Icon name="globe" />
          <span>Réseau</span>
          <span v-if="unreadPosts.length" class="nav__badge">{{ unreadPosts.length }}</span>
        </RouterLink>
      </nav>

      <div class="nav__foot">
        <RouterLink v-if="!isPro" to="/abonnement" class="upsell">
          <span class="upsell__ico"><Icon name="star" /></span>
          <div class="upsell__text">
            <b>Passer à Pro</b>
            <span>Revenus, contrats, annonces</span>
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

      <RouterView v-slot="{ Component }">
        <component :is="Component" />
      </RouterView>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { RouterLink, RouterView } from 'vue-router'
import Icon from './components/Icon.vue'
import Avatar from './components/Avatar.vue'
import BrandMark from './components/BrandMark.vue'
import LoginView from './views/LoginView.vue'
import { store, isLoggedIn, unreadPosts, isPro } from './store'
import { daysFromNow } from './utils/format'

const menuOpen = ref(false)

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
  { path: '/contrats', title: 'Contrats', icon: 'contract', badge: pendingContracts.value, pro: true },
  { path: '/contacts', title: 'Contacts', icon: 'contacts', badge: 0 },
  { path: '/label', title: 'Label', icon: 'label', badge: 0 },
])
</script>

