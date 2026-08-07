<template>
  <div class="page">
    <PageHeader
      :title="`Bonjour ${store.artist.stageName} 👋`"
      subtitle="Voici l'essentiel de votre carrière aujourd'hui."
    />

    <!-- Stats -->
    <div class="grid grid--stats" style="margin-bottom: 26px">
      <RouterLink to="/contrats" class="stat stat--link">
        <div class="stat__ico" style="background: var(--amber-bg); color: var(--amber)">
          <Icon name="contract" />
        </div>
        <div class="stat__val mono">{{ pendingContracts }}</div>
        <div class="stat__label">Contrats en attente</div>
        <div class="stat__delta stat__delta--up">
          <Icon name="check" style="width: 14px; height: 14px" />
          {{ activeContracts }} actifs
        </div>
      </RouterLink>

      <RouterLink to="/sorties" class="stat stat--link">
        <div class="stat__ico" style="background: var(--blue-bg); color: var(--blue)">
          <Icon name="release" />
        </div>
        <div class="stat__val mono">{{ compact(totalStreams) }}</div>
        <div class="stat__label">Streams cumulés (sorties)</div>
        <div class="stat__delta stat__delta--up">
          <Icon name="music" style="width: 14px; height: 14px" />
          {{ store.releases.length }} sorties au catalogue
        </div>
      </RouterLink>

      <RouterLink to="/concerts" class="stat stat--link">
        <div class="stat__ico" style="background: var(--violet-100); color: var(--violet-600)">
          <Icon name="concert" />
        </div>
        <div class="stat__val mono">{{ upcomingConcerts.length }}</div>
        <div class="stat__label">Concerts à venir</div>
        <div class="stat__delta stat__delta--up">
          <Icon name="ticket" style="width: 14px; height: 14px" />
          {{ number(totalTickets) }} billets vendus
        </div>
      </RouterLink>

      <RouterLink to="/reseau" class="stat stat--link">
        <div class="stat__ico" style="background: rgba(236, 72, 153, 0.12); color: var(--pink-500)">
          <Icon name="bell" />
        </div>
        <div class="stat__val mono">{{ unreadPosts.length }}</div>
        <div class="stat__label">Notifications réseau</div>
        <div class="stat__delta stat__delta--up">
          <!-- Le nombre reste visible : c'est le signal qu'il se passe quelque
               chose. Ce qui change, c'est la promesse d'y accéder. -->
          <template v-if="isPro">
            <Icon name="globe" style="width: 14px; height: 14px" />
            {{ unreadPosts.length ? 'Voir le fil' : 'Fil à jour' }}
          </template>
          <template v-else>
            <Icon name="star" style="width: 14px; height: 14px" />
            Réservé à Pro
          </template>
        </div>
      </RouterLink>
    </div>

    <div class="grid grid--2">
      <!-- Agenda -->
      <div class="card">
        <div class="section-head" style="padding: 18px 20px 0">
          <span class="section-head__title">Agenda</span>
          <RouterLink to="/studio" class="btn btn--subtle btn--sm">Calendrier</RouterLink>
        </div>
        <div class="list" style="margin-top: 8px">
          <div v-for="s in upcomingSessions.slice(0, 4)" :key="s.id" class="row">
            <div class="stat__ico" style="width: 38px; height: 38px; margin: 0; background: var(--brand-gradient-soft); color: var(--violet-600)">
              <Icon name="calendar" style="width: 18px; height: 18px" />
            </div>
            <div class="row__main">
              <div class="row__title">{{ s.title }}</div>
              <div class="row__sub">{{ s.studio }} · {{ formatDate(s.date) }} · {{ s.startTime }}</div>
            </div>
            <span class="badge badge--gray badge--plain">{{ relativeDay(s.date) }}</span>
          </div>
          <EmptyState
            v-if="!upcomingSessions.length"
            icon="calendar"
            title="Agenda libre"
            text="Aucun évènement planifié."
          />
        </div>
      </div>

      <!-- Revenus par plateforme -->
      <div class="card card--pad">
        <div class="section-head">
          <span class="section-head__title">Revenus par plateforme</span>
          <RouterLink v-if="isPro" to="/royalties" class="btn btn--subtle btn--sm">Détails</RouterLink>
          <RouterLink v-else to="/abonnement" class="btn btn--subtle btn--sm">
            <Icon name="star" /> Pro
          </RouterLink>
        </div>
        <div class="vstack" style="gap: 14px; margin-top: 6px">
          <div v-for="p in platformBreakdown" :key="p.platform" class="vstack" style="gap: 6px">
            <div class="hstack" style="justify-content: space-between; font-size: 13.5px">
              <span class="hstack" style="gap: 8px">
                <span class="dot" :style="{ background: p.color }" />
                <b>{{ p.platform }}</b>
              </span>
              <!-- Hors abonnement, le montant n'est pas rendu du tout : un
                   simple flou laisserait la valeur lisible dans la page. -->
              <span v-if="isPro" class="mono soft">{{ money(p.amount) }}</span>
              <span v-else class="mono masked">••• €</span>
            </div>
            <div class="bar">
              <div
                class="bar__fill"
                :style="{ width: p.pct + '%', background: p.color }"
              />
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="grid grid--2" style="margin-top: 18px">
      <!-- Prochains concerts -->
      <div class="card">
        <div class="section-head" style="padding: 18px 20px 0">
          <span class="section-head__title">Prochains concerts</span>
          <RouterLink to="/concerts" class="btn btn--subtle btn--sm">Tout voir</RouterLink>
        </div>
        <div class="list" style="margin-top: 8px">
          <div v-for="c in upcomingConcerts.slice(0, 4)" :key="c.id" class="row">
            <div class="datechip">
              <span class="datechip__d">{{ dayNum(c.date) }}</span>
              <span class="datechip__m">{{ monthShort(c.date) }}</span>
            </div>
            <div class="row__main">
              <div class="row__title">{{ c.venue }}</div>
              <div class="row__sub">{{ c.city }} · {{ c.country }} · {{ c.time }}</div>
            </div>
            <span class="badge" :class="concertBadge(c.status)">{{ c.status }}</span>
          </div>
          <EmptyState
            v-if="!upcomingConcerts.length"
            icon="concert"
            title="Aucun concert à venir"
            text="Planifiez votre prochaine date."
          />
        </div>
      </div>

      <!-- Dernières sorties -->
      <div class="card">
        <div class="section-head" style="padding: 18px 20px 0">
          <span class="section-head__title">Dernières sorties</span>
          <RouterLink to="/sorties" class="btn btn--subtle btn--sm">Catalogue</RouterLink>
        </div>
        <div class="list" style="margin-top: 8px">
          <div v-for="r in recentReleases" :key="r.id" class="row">
            <div class="cover" :style="{ background: coverGradient(r.cover) }">
              <Icon name="music" style="width: 16px; height: 16px; color: #fff" />
            </div>
            <div class="row__main">
              <div class="row__title">{{ r.title }}</div>
              <div class="row__sub">{{ r.type }} · {{ formatDate(r.date) }}</div>
            </div>
            <div class="vstack" style="align-items: flex-end">
              <b class="mono" style="font-size: 13.5px">{{ compact(r.streams) }}</b>
              <span class="muted" style="font-size: 12px">streams</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import PageHeader from '@/components/PageHeader.vue'
import Icon from '@/components/Icon.vue'
import EmptyState from '@/components/EmptyState.vue'
import { store, unreadPosts, isPro } from '@/store'
import {
  money,
  number,
  compact,
  formatDate,
  dayNum,
  monthShort,
  relativeDay,
  daysFromNow,
} from '@/utils/format'
import { platformColor } from '@/utils/platforms'

const periods = computed(() => {
  const set = Array.from(new Set(store.royalties.map((r) => r.period)))
  return set
})

const upcomingConcerts = computed(() =>
  store.concerts
    .filter((c) => c.status !== 'Terminé' && daysFromNow(c.date) >= 0)
    .sort((a, b) => a.date.localeCompare(b.date)),
)

const totalTickets = computed(() => upcomingConcerts.value.reduce((s, c) => s + c.ticketsSold, 0))
const totalStreams = computed(() => store.releases.reduce((s, r) => s + r.streams, 0))
const activeContracts = computed(() => store.contracts.filter((c) => c.status === 'Actif').length)
const pendingContracts = computed(
  () => store.contracts.filter((c) => c.status !== 'Actif' && c.status !== 'Expiré').length,
)

const upcomingSessions = computed(() =>
  store.studio
    .filter((s) => daysFromNow(s.date) >= 0)
    .sort((a, b) => a.date.localeCompare(b.date)),
)

const recentReleases = computed(() =>
  [...store.releases]
    .filter((r) => r.status === 'Publié')
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 4),
)

const platformBreakdown = computed(() => {
  const p = periods.value[0]
  const rows = store.royalties.filter((r) => r.period === p)
  const max = Math.max(1, ...rows.map((r) => r.amount))
  return rows
    .sort((a, b) => b.amount - a.amount)
    .map((r) => ({
      ...r,
      color: platformColor(r.platform, r.color),
      pct: Math.round((r.amount / max) * 100),
    }))
})

function concertBadge(status: string): string {
  return status === 'Confirmé'
    ? 'badge--green'
    : status === 'Option'
      ? 'badge--amber'
      : 'badge--blue'
}

function coverGradient(hex: string): string {
  return `linear-gradient(135deg, ${hex}, ${hex}bb)`
}
</script>

<style scoped>
/* La carte des notifications est cliquable, sans se distinguer des autres. */
.stat--link {
  display: block;
  transition: border-color 0.15s, box-shadow 0.15s, transform 0.08s;
}
.stat--link:hover {
  border-color: var(--violet-400);
  box-shadow: var(--shadow);
}
.stat--link:active {
  transform: translateY(1px);
}
.masked {
  color: var(--text-muted);
  letter-spacing: 0.06em;
}

.datechip {
  width: 46px;
  height: 46px;
  border-radius: 12px;
  background: var(--brand-gradient-soft);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.datechip__d {
  font-weight: 700;
  font-size: 17px;
  line-height: 1;
  color: var(--violet-700);
}
.datechip__m {
  font-size: 11px;
  color: var(--violet-600);
  text-transform: uppercase;
}
.dot {
  width: 9px;
  height: 9px;
  border-radius: 50%;
  flex-shrink: 0;
}
.cover {
  width: 42px;
  height: 42px;
  border-radius: 10px;
  display: grid;
  place-items: center;
  flex-shrink: 0;
  box-shadow: var(--shadow-sm);
}
</style>
