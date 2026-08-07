<template>
  <div class="rm-logo">
    <span class="mark">
      <svg viewBox="0 0 24 24"><path d="M12 3v10.55A4 4 0 1 0 14 17V7h4V3h-6z" /></svg>
    </span>
    <span v-if="!markOnly">Rapid<span class="accent">Music</span></span>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'BrandLogo',
  props: {
    markOnly: { type: Boolean, default: false },
  },
});
</script>
