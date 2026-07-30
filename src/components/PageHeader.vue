<template>
  <div class="page-head">
    <div>
      <h1 class="page-head__title">{{ title }}</h1>
      <p v-if="subtitle" class="page-head__sub">{{ subtitle }}</p>
    </div>
    <div class="hstack">
      <slot name="actions" />
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{ title: string; subtitle?: string }>()
</script>
