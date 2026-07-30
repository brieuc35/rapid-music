<template>
  <div class="app-shell">
    <!-- Mobile scrim -->
    <div class="scrim" :class="{ 'scrim--show': menuOpen }" @click="menuOpen = false" />

    <!-- Sidebar -->
    <aside class="sidebar" :class="{ 'sidebar--open': menuOpen }">
      <div class="brand">
        <div class="brand__mark">
          <svg viewBox="0 0 24 24" fill="none">
            <path
              d="M9 17V4l11-2v13"
              stroke="#fff"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
            <circle cx="6" cy="17" r="3" stroke="#fff" stroke-width="2" />
            <circle cx="17" cy="15" r="3" stroke="#fff" stroke-width="2" />
          </svg>
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
          <span v-if="item.badge" class="nav__badge">{{ item.badge }}</span>
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
          <span v-if="item.badge" class="nav__badge">{{ item.badge }}</span>
        </RouterLink>
      </nav>

      <div class="nav__foot">
        <div class="artist-chip">
          <div class="artist-chip__avatar">{{ initials(store.artist.stageName) }}</div>
          <div>
            <div class="artist-chip__name">{{ store.artist.stageName }}</div>
            <div class="artist-chip__role">{{ store.artist.genre }}</div>
          </div>
        </div>
      </div>
    </aside>

    <!-- Main -->
    <div class="main">
      <header class="topbar">
        <button class="icon-btn" @click="menuOpen = true" aria-label="Menu">
          <Icon name="menu" />
        </button>
        <span class="topbar__title">Rapid<b style="color: var(--violet-400)">Music</b></span>
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
import { store } from './store'
import { initials, daysFromNow } from './utils/format'

const menuOpen = ref(false)

const upcomingConcerts = computed(
  () => store.concerts.filter((c) => c.status !== 'Terminé' && daysFromNow(c.date) >= 0).length,
)
const upcomingSessions = computed(
  () => store.studio.filter((s) => daysFromNow(s.date) >= 0).length,
)

const topNav = computed(() => [
  { path: '/tableau-de-bord', title: 'Tableau de bord', icon: 'dashboard', badge: 0 },
  { path: '/concerts', title: 'Concerts', icon: 'concert', badge: upcomingConcerts.value },
  { path: '/sorties', title: 'Sorties', icon: 'release', badge: store.releases.length },
  { path: '/royalties', title: 'Royalties', icon: 'money', badge: 0 },
])

const bottomNav = computed(() => [
  { path: '/studio', title: 'Agenda', icon: 'calendar', badge: upcomingSessions.value },
  { path: '/contrats', title: 'Contrats', icon: 'contract', badge: store.contracts.length },
  { path: '/contacts', title: 'Contacts', icon: 'contacts', badge: store.contacts.length },
  { path: '/label', title: 'Label', icon: 'label', badge: 0 },
])
</script>

