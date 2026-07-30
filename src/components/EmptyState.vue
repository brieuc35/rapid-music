<template>
  <div class="empty">
    <div class="empty__ico"><Icon :name="icon" /></div>
    <div class="empty__title">{{ title }}</div>
    <div class="empty__text">{{ text }}</div>
    <div v-if="$slots.default" style="margin-top: 18px">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
import Icon from './Icon.vue'
defineProps<{ icon: string; title: string; text: string }>()
</script>
