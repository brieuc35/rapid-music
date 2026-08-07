<template>
  <div class="acc">
    <button class="acc__head" @click="$emit('open', account)">
      <div class="acc__avatar" :style="{ background: account.color }">
        {{ initials(account.name) }}
      </div>
      <div class="row__main">
        <div class="hstack" style="gap: 5px">
          <b class="acc__name">{{ account.name }}</b>
          <Icon v-if="account.verified" name="verified" class="acc__check" />
        </div>
        <div class="acc__role">{{ account.role }}</div>
        <div class="muted acc__meta">
          {{ account.company }}<template v-if="account.location"> · {{ account.location }}</template>
        </div>
      </div>
    </button>

    <p class="acc__bio">{{ excerpt(account.bio) }}</p>

    <div v-if="account.specialties.length" class="acc__tags">
      <span v-for="s in account.specialties.slice(0, 3)" :key="s" class="acc__tag">{{ s }}</span>
    </div>

    <div class="acc__foot">
      <span class="muted acc__conn">{{ number(account.connections) }} relations</span>
      <button
        v-if="!mine"
        class="btn btn--sm"
        :class="connected ? 'btn--ghost' : 'btn--primary'"
        @click="$emit('connect', account.id)"
      >
        <Icon :name="connected ? 'check' : 'plus'" />
        {{ connected ? 'En relation' : 'Se connecter' }}
      </button>
      <span v-else class="badge badge--violet badge--plain">Vous</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import Icon from './Icon.vue'
import type { SocialAccount } from '@/store/types'
import { initials, number } from '@/utils/format'

defineProps<{ account: SocialAccount; connected: boolean; mine: boolean }>()
defineEmits<{
  (e: 'connect', id: string): void
  (e: 'open', a: SocialAccount): void
}>()

function excerpt(text: string): string {
  return text.length > 110 ? text.slice(0, 110).trimEnd() + '…' : text
}
</script>

<style scoped>
.acc {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 16px 18px 15px;
  box-shadow: var(--shadow-sm);
  display: flex;
  flex-direction: column;
}
.acc__head {
  display: flex;
  gap: 12px;
  align-items: flex-start;
  border: none;
  background: transparent;
  padding: 0;
  text-align: left;
  width: 100%;
}
.acc__avatar {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  color: #fff;
  font-weight: 700;
  font-size: 14px;
  flex-shrink: 0;
}
.acc__name {
  font-size: 14.5px;
}
.acc__head:hover .acc__name {
  color: var(--violet-700);
}
.acc__check {
  width: 14px;
  height: 14px;
  color: var(--blue);
  flex-shrink: 0;
}
.acc__role {
  font-size: 13px;
  font-weight: 600;
  color: var(--violet-600);
}
.acc__meta {
  font-size: 12.5px;
  margin-top: 1px;
}
.acc__bio {
  margin: 12px 0 0;
  font-size: 13px;
  line-height: 1.55;
  color: var(--text-soft);
  flex: 1;
}
.acc__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 11px;
}
.acc__tag {
  background: var(--surface-2);
  border: 1px solid var(--border);
  color: var(--text-soft);
  font-size: 11.5px;
  font-weight: 600;
  padding: 3px 9px;
  border-radius: 20px;
}
.acc__foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-top: 14px;
  padding-top: 13px;
  border-top: 1px solid var(--border);
}
.acc__conn {
  font-size: 12.5px;
}
</style>
