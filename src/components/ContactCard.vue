<template>
  <div class="card card--pad contact">
    <div class="hstack" style="justify-content: space-between; align-items: flex-start">
      <div class="hstack" style="gap: 13px">
        <div class="avatar" :style="{ background: avatarBg }">{{ initials(contact.name) }}</div>
        <div>
          <div class="contact__name">{{ contact.name }}</div>
          <div class="soft" style="font-size: 13px">{{ contact.role }}</div>
        </div>
      </div>
      <button class="fav" :class="{ 'fav--on': contact.favorite }" @click="$emit('toggle', contact)" aria-label="Favori">
        <Icon name="star" />
      </button>
    </div>

    <div class="hstack" style="gap: 8px; margin: 14px 0 12px; flex-wrap: wrap">
      <span class="badge badge--gray badge--plain"><Icon name="building" style="width: 12px; height: 12px" /> {{ contact.company || '—' }}</span>
      <span class="badge badge--violet badge--plain">{{ contact.category }}</span>
    </div>

    <div class="vstack" style="gap: 7px; padding-top: 12px; border-top: 1px solid var(--border)">
      <a v-if="contact.email" :href="`mailto:${contact.email}`" class="contact__link">
        <Icon name="mail" /> {{ contact.email }}
      </a>
      <a v-if="contact.phone" :href="`tel:${contact.phone}`" class="contact__link">
        <Icon name="phone" /> {{ contact.phone }}
      </a>
      <p v-if="contact.notes" class="muted" style="font-size: 12.5px; margin-top: 4px; line-height: 1.5">{{ contact.notes }}</p>
    </div>

    <div class="contact__actions">
      <button class="btn btn--ghost btn--sm" @click="$emit('edit', contact)"><Icon name="edit" /> Modifier</button>
      <button class="btn btn--danger btn--sm" @click="$emit('delete', contact)"><Icon name="trash" /></button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import Icon from './Icon.vue'
import type { Contact } from '@/store/types'
import { initials } from '@/utils/format'

const props = defineProps<{ contact: Contact }>()
defineEmits<{
  (e: 'edit', c: Contact): void
  (e: 'delete', c: Contact): void
  (e: 'toggle', c: Contact): void
}>()

const gradients = [
  'linear-gradient(135deg,#8b5cf6,#ec4899)',
  'linear-gradient(135deg,#3b82f6,#06b6d4)',
  'linear-gradient(135deg,#f59e0b,#ef4444)',
  'linear-gradient(135deg,#10b981,#3b82f6)',
  'linear-gradient(135deg,#ec4899,#f43f5e)',
]
const avatarBg = computed(() => {
  let h = 0
  for (const ch of props.contact.name) h = (h + ch.charCodeAt(0)) % gradients.length
  return gradients[h]
})
</script>

<style scoped>
.contact {
  display: flex;
  flex-direction: column;
}
.avatar {
  width: 46px;
  height: 46px;
  border-radius: 14px;
  display: grid;
  place-items: center;
  color: #fff;
  font-weight: 700;
  font-size: 15px;
  flex-shrink: 0;
}
.contact__name {
  font-weight: 700;
  font-size: 15.5px;
}
.fav {
  border: none;
  background: transparent;
  color: var(--text-muted);
  width: 34px;
  height: 34px;
  border-radius: 9px;
  display: grid;
  place-items: center;
}
.fav svg {
  width: 18px;
  height: 18px;
  fill: none;
}
.fav:hover {
  background: var(--surface-2);
}
.fav--on {
  color: var(--amber);
}
.fav--on svg {
  fill: var(--amber);
}
.contact__link {
  display: flex;
  align-items: center;
  gap: 9px;
  font-size: 13.5px;
  color: var(--text-soft);
  transition: color 0.12s;
}
.contact__link svg {
  width: 15px;
  height: 15px;
  color: var(--violet-500);
  flex-shrink: 0;
}
.contact__link:hover {
  color: var(--violet-700);
}
.contact__actions {
  display: flex;
  gap: 8px;
  margin-top: 16px;
}
.contact__actions .btn:first-child {
  flex: 1;
}
</style>
