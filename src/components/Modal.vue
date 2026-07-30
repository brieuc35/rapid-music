<template>
  <Teleport to="body">
    <div v-if="open" class="modal-backdrop" @mousedown.self="$emit('close')">
      <div class="modal" role="dialog" aria-modal="true">
        <div class="modal__head">
          <h3 class="modal__title">{{ title }}</h3>
          <button class="icon-btn" style="background: var(--surface-2); color: var(--text-soft)" @click="$emit('close')" aria-label="Fermer">
            <Icon name="close" />
          </button>
        </div>
        <div class="modal__body">
          <slot />
        </div>
        <div class="modal__foot">
          <slot name="footer" />
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { watch } from 'vue'
import Icon from './Icon.vue'

const props = defineProps<{ open: boolean; title: string }>()
defineEmits<{ (e: 'close'): void }>()

watch(
  () => props.open,
  (v) => {
    document.body.style.overflow = v ? 'hidden' : ''
  },
)
</script>
