<template>
  <div class="avatar" :style="style">
    <img v-if="photo" :src="photo" :alt="name" class="avatar__img" />
    <span v-else>{{ initials(name) }}</span>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { initials } from '@/utils/format'

const props = withDefaults(
  defineProps<{
    name: string
    photo?: string
    size?: number
    radius?: string
    font?: number
  }>(),
  { photo: '', size: 40, radius: '50%', font: 0 },
)

const style = computed(() => ({
  width: props.size + 'px',
  height: props.size + 'px',
  borderRadius: props.radius,
  fontSize: (props.font || Math.round(props.size * 0.36)) + 'px',
}))
</script>

<style scoped>
.avatar {
  background: var(--brand-gradient);
  display: grid;
  place-items: center;
  color: #fff;
  font-weight: 700;
  flex-shrink: 0;
  overflow: hidden;
  line-height: 1;
}
.avatar__img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
</style>
