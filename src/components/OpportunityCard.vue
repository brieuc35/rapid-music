<template>
  <article class="opp">
    <div class="opp__head">
      <div class="opp__avatar" :style="{ background: account?.color ?? '#8b5cf6' }">
        {{ initials(account?.name ?? '?') }}
      </div>
      <div class="row__main">
        <h3 class="opp__title">{{ opportunity.title }}</h3>
        <div class="muted opp__by">
          {{ account?.name ?? 'Compte inconnu' }} · {{ account?.role }} ·
          {{ relativeTime(opportunity.date) }}
        </div>
      </div>
      <span class="badge badge--plain" :class="kindClass">{{ opportunity.kind }}</span>
    </div>

    <div class="opp__meta">
      <span><Icon name="users" /> Recherche : <b>{{ opportunity.role }}</b></span>
      <span><Icon name="pin" /> {{ opportunity.location }}</span>
      <span v-if="opportunity.deadline">
        <Icon name="clock" /> Avant le {{ formatDate(opportunity.deadline) }}
      </span>
    </div>

    <p class="opp__desc">{{ opportunity.description }}</p>

    <div class="opp__actions">
      <button
        class="act"
        :class="{ 'act--saved': opportunity.saved }"
        @click="$emit('save', opportunity)"
      >
        <Icon name="bookmark" />
        {{ opportunity.saved ? 'Enregistrée' : 'Enregistrer' }}
      </button>
      <button v-if="mine" class="act act--danger right" @click="$emit('delete', opportunity)">
        <Icon name="trash" /> Retirer
      </button>
      <button v-else class="btn btn--ghost btn--sm right" @click="$emit('contact', opportunity)">
        <Icon name="mail" /> Répondre
      </button>
    </div>
  </article>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import Icon from './Icon.vue'
import type { Opportunity, SocialAccount } from '@/store/types'
import { initials, relativeTime, formatDate } from '@/utils/format'

const props = defineProps<{
  opportunity: Opportunity
  account?: SocialAccount
  mine: boolean
}>()

defineEmits<{
  (e: 'save', o: Opportunity): void
  (e: 'delete', o: Opportunity): void
  (e: 'contact', o: Opportunity): void
}>()

const kindClass = computed(
  () =>
    ({
      Rémunéré: 'badge--green',
      Collaboration: 'badge--violet',
      Bénévole: 'badge--gray',
    })[props.opportunity.kind] ?? 'badge--gray',
)
</script>

<style scoped>
.opp {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 18px 20px;
  box-shadow: var(--shadow-sm);
}
.opp__head {
  display: flex;
  gap: 12px;
  align-items: flex-start;
}
.opp__avatar {
  width: 40px;
  height: 40px;
  border-radius: 11px;
  display: grid;
  place-items: center;
  color: #fff;
  font-weight: 700;
  font-size: 13.5px;
  flex-shrink: 0;
}
.opp__title {
  font-size: 15.5px;
  font-weight: 700;
  letter-spacing: -0.01em;
  line-height: 1.3;
}
.opp__by {
  font-size: 12.5px;
  margin-top: 2px;
}
.opp__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 18px;
  margin: 14px 0 0;
  padding: 12px 0;
  border-top: 1px solid var(--border);
  border-bottom: 1px solid var(--border);
  font-size: 13px;
  color: var(--text-soft);
}
.opp__meta span {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
.opp__meta svg {
  width: 14px;
  height: 14px;
  color: var(--violet-500);
  flex-shrink: 0;
}
.opp__desc {
  margin: 13px 0 0;
  font-size: 14px;
  line-height: 1.6;
  color: var(--text);
}
.opp__actions {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 15px;
}
.act {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border: none;
  background: transparent;
  color: var(--text-soft);
  font-size: 13px;
  font-weight: 600;
  padding: 6px 10px;
  border-radius: 9px;
}
.act svg {
  width: 16px;
  height: 16px;
  fill: none;
}
.act:hover {
  background: var(--surface-2);
  color: var(--text);
}
.act--saved {
  color: var(--violet-600);
}
.act--saved svg {
  fill: var(--violet-600);
}
.act--danger:hover {
  background: var(--red-bg);
  color: var(--red);
}
</style>
