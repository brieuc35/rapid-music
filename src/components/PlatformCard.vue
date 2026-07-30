<template>
  <div class="pcard" :class="{ 'pcard--on': !!link }">
    <div class="pcard__top">
      <span class="pcard__logo" :style="{ background: color }">
        <Icon name="music" />
      </span>
      <div class="row__main">
        <div class="pcard__name">{{ platform }}</div>
        <span class="badge" :class="link ? 'badge--green' : 'badge--gray'">
          {{ link ? 'Compte lié' : 'Non lié' }}
        </span>
      </div>
    </div>

    <div class="pcard__body">
      <template v-if="link">
        <div class="pcard__line">
          <span class="muted">Compte</span>
          <b class="pcard__val">{{ link.account || '—' }}</b>
        </div>
        <div class="pcard__line">
          <span class="muted">Dernier relevé</span>
          <b class="pcard__val">
            {{ link.lastImport ? formatDate(link.lastImport) : 'aucun' }}
          </b>
        </div>
        <div class="pcard__line">
          <span class="muted">Revenus enregistrés</span>
          <b class="pcard__val mono">{{ money(total) }}</b>
        </div>
      </template>
      <p v-else class="pcard__hint">
        Liez votre compte pour retrouver la référence de votre profil et importer
        vos relevés de revenus.
      </p>
    </div>

    <div class="pcard__actions">
      <button class="btn btn--ghost btn--sm" @click="$emit('link', platform)">
        <Icon :name="link ? 'edit' : 'plus'" /> {{ link ? 'Gérer' : 'Lier le compte' }}
      </button>
      <button class="btn btn--ghost btn--sm" @click="$emit('import', platform)">
        <Icon name="doc" /> Importer
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import Icon from './Icon.vue'
import type { PlatformLink } from '@/store/types'
import { money, formatDate } from '@/utils/format'

defineProps<{
  platform: string
  color: string
  link?: PlatformLink
  total: number
}>()

defineEmits<{
  (e: 'link', platform: string): void
  (e: 'import', platform: string): void
}>()
</script>

<style scoped>
.pcard {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 16px 18px 18px;
  box-shadow: var(--shadow-sm);
  display: flex;
  flex-direction: column;
}
.pcard--on {
  border-color: var(--violet-200);
}
.pcard__top {
  display: flex;
  align-items: center;
  gap: 12px;
}
.pcard__logo {
  width: 40px;
  height: 40px;
  border-radius: 11px;
  display: grid;
  place-items: center;
  flex-shrink: 0;
}
.pcard__logo svg {
  width: 19px;
  height: 19px;
  color: #fff;
}
.pcard__name {
  font-weight: 700;
  font-size: 15px;
  margin-bottom: 3px;
}
.pcard__body {
  margin: 14px 0 16px;
  padding-top: 13px;
  border-top: 1px solid var(--border);
  flex: 1;
}
.pcard__line {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  font-size: 13px;
  padding: 3px 0;
}
.pcard__val {
  text-align: right;
  word-break: break-all;
  max-width: 60%;
}
.pcard__hint {
  margin: 0;
  font-size: 13px;
  color: var(--text-muted);
  line-height: 1.5;
}
.pcard__actions {
  display: flex;
  gap: 8px;
}
.pcard__actions .btn {
  flex: 1;
  justify-content: center;
}
</style>
