<template>
  <Modal :open="!!account" :title="'Profil'" @close="$emit('close')">
    <template v-if="account">
      <div class="ph">
        <div class="ph__avatar" :style="{ background: account.color }">
          {{ initials(account.name) }}
        </div>
        <div class="row__main">
          <div class="hstack" style="gap: 6px; flex-wrap: wrap">
            <h3 class="ph__name">{{ account.name }}</h3>
            <Icon v-if="account.verified" name="verified" class="ph__check" />
          </div>
          <div class="ph__role">{{ account.role }}</div>
          <div class="muted" style="font-size: 13px; margin-top: 2px">
            {{ account.handle }}
          </div>
        </div>
      </div>

      <div class="ph__meta">
        <span v-if="account.company"><Icon name="building" /> {{ account.company }}</span>
        <span v-if="account.location"><Icon name="pin" /> {{ account.location }}</span>
        <span><Icon name="users" /> {{ number(account.connections) }} relations</span>
      </div>

      <p v-if="account.bio" class="ph__bio">{{ account.bio }}</p>

      <template v-if="account.specialties.length">
        <div class="ph__label">Compétences</div>
        <div class="ph__tags">
          <span v-for="s in account.specialties" :key="s" class="ph__tag">{{ s }}</span>
        </div>
      </template>

      <template v-if="posts.length">
        <div class="ph__label">Publications récentes</div>
        <div class="vstack" style="gap: 9px">
          <div v-for="p in posts" :key="p.id" class="ph__post">
            <div class="hstack" style="justify-content: space-between; gap: 8px">
              <span class="badge badge--gray badge--plain">{{ p.category }}</span>
              <span class="muted" style="font-size: 12px">{{ relativeTime(p.date) }}</span>
            </div>
            <p class="ph__post-body">{{ excerpt(p.content) }}</p>
          </div>
        </div>
      </template>

      <template v-if="opportunities.length">
        <div class="ph__label">Annonces en cours</div>
        <div class="vstack" style="gap: 7px">
          <div v-for="o in opportunities" :key="o.id" class="ph__opp">
            <b style="font-size: 13.5px">{{ o.title }}</b>
            <span class="muted" style="font-size: 12.5px">
              {{ o.role }} · {{ o.location }}
            </span>
          </div>
        </div>
      </template>
    </template>

    <template #footer>
      <button class="btn btn--subtle" @click="$emit('close')">Fermer</button>
      <button
        v-if="account && !mine"
        class="btn"
        :class="connected ? 'btn--ghost' : 'btn--primary'"
        @click="$emit('connect', account.id)"
      >
        <Icon :name="connected ? 'check' : 'plus'" />
        {{ connected ? 'En relation' : 'Se connecter' }}
      </button>
    </template>
  </Modal>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import Modal from './Modal.vue'
import Icon from './Icon.vue'
import type { SocialAccount } from '@/store/types'
import { store } from '@/store'
import { initials, number, relativeTime } from '@/utils/format'

const props = defineProps<{
  account: SocialAccount | null
  connected: boolean
  mine: boolean
}>()

defineEmits<{
  (e: 'close'): void
  (e: 'connect', id: string): void
}>()

const posts = computed(() =>
  props.account
    ? store.posts
        .filter((p) => p.accountId === props.account!.id)
        .sort((a, b) => b.date.localeCompare(a.date))
        .slice(0, 3)
    : [],
)

const opportunities = computed(() =>
  props.account
    ? store.opportunities.filter((o) => o.accountId === props.account!.id).slice(0, 3)
    : [],
)

function excerpt(text: string): string {
  return text.length > 150 ? text.slice(0, 150).trimEnd() + '…' : text
}
</script>

<style scoped>
.ph {
  display: flex;
  gap: 15px;
  align-items: flex-start;
}
.ph__avatar {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  color: #fff;
  font-weight: 700;
  font-size: 19px;
  flex-shrink: 0;
}
.ph__name {
  font-size: 19px;
  font-weight: 700;
  letter-spacing: -0.02em;
}
.ph__check {
  width: 16px;
  height: 16px;
  color: var(--blue);
}
.ph__role {
  font-size: 14px;
  font-weight: 600;
  color: var(--violet-600);
  margin-top: 1px;
}
.ph__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 7px 18px;
  margin: 16px 0 0;
  padding: 13px 0;
  border-top: 1px solid var(--border);
  border-bottom: 1px solid var(--border);
  font-size: 13px;
  color: var(--text-soft);
}
.ph__meta span {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
.ph__meta svg {
  width: 14px;
  height: 14px;
  color: var(--violet-500);
  flex-shrink: 0;
}
.ph__bio {
  margin: 14px 0 0;
  font-size: 14px;
  line-height: 1.6;
  color: var(--text-soft);
}
.ph__label {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--text-muted);
  margin: 18px 0 9px;
}
.ph__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 7px;
}
.ph__tag {
  background: var(--brand-gradient-soft);
  color: var(--violet-700);
  font-size: 12px;
  font-weight: 600;
  padding: 4px 11px;
  border-radius: 20px;
}
.ph__post,
.ph__opp {
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  padding: 10px 12px;
  background: var(--surface-2);
}
.ph__post-body {
  margin: 6px 0 0;
  font-size: 13px;
  line-height: 1.55;
  color: var(--text-soft);
}
.ph__opp {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
</style>
