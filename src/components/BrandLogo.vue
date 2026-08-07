<template>
  <span class="brand">
    <span class="brand-mark" aria-hidden="true">
      <svg viewBox="0 0 24 24"><path d="M12 3v10.55A4 4 0 1 0 14 17V7h4V3h-6z" /></svg>
    </span>
    <span class="brand-name">Rapid<b>Music</b></span>
  </span>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({ name: 'BrandLogo' });
</script>

<style scoped>
.brand {
  display: inline-flex;
  align-items: center;
  gap: 9px;
}
.brand-mark {
  width: 30px;
  height: 30px;
  border-radius: 9px;
  display: grid;
  place-items: center;
  background: var(--rm-gradient);
  box-shadow: 0 6px 16px -6px rgba(236, 72, 153, 0.55);
  flex-shrink: 0;
}
.brand-mark svg {
  width: 17px;
  height: 17px;
  fill: #fff;
}
.brand-name {
  font-weight: 800;
  font-size: 20px;
  letter-spacing: -0.02em;
  color: var(--ion-text-color);
}
.brand-name b {
  font-weight: 800;
  background: var(--rm-gradient);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}
</style>
