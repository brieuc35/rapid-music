<template>
  <!-- Abonné : le contenu s'affiche normalement. -->
  <slot v-if="isPro" />

  <!-- Sinon : on montre ce que l'onglet contient, sans le donner. -->
  <div v-else class="gate">
    <div class="gate__panel">
      <span class="gate__tag"><Icon name="star" /> RapidMusic Pro</span>
      <h2 class="gate__title">{{ title }}</h2>
      <p class="gate__lead">{{ lead }}</p>

      <ul class="gate__list">
        <li v-for="f in features" :key="f"><Icon name="check" /> {{ f }}</li>
      </ul>

      <RouterLink to="/abonnement" class="btn btn--primary btn--block">
        <Icon name="star" /> Découvrir Pro — {{ price }} / mois
      </RouterLink>
      <p class="gate__note">Sans engagement. Vos données restent les vôtres.</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { RouterLink } from 'vue-router'
import Icon from './Icon.vue'
import { isPro, PRO_PRICE } from '@/store'
import { money } from '@/utils/format'

defineProps<{ title: string; lead: string; features: string[] }>()

const price = money(PRO_PRICE, true)
</script>

<style scoped>
.gate {
  display: flex;
  justify-content: center;
  padding: 10px 0 40px;
}
.gate__panel {
  background: var(--surface);
  border: 1px solid var(--violet-200);
  border-radius: var(--radius-lg);
  padding: 30px 30px 26px;
  max-width: 480px;
  width: 100%;
  box-shadow: var(--shadow);
  text-align: center;
}
.gate__tag {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  background: var(--brand-gradient);
  color: #fff;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.02em;
  padding: 5px 13px;
  border-radius: 20px;
}
.gate__tag svg {
  width: 14px;
  height: 14px;
  fill: #fff;
}
.gate__title {
  font-size: 21px;
  font-weight: 700;
  letter-spacing: -0.02em;
  margin: 16px 0 6px;
}
.gate__lead {
  color: var(--text-soft);
  font-size: 14.5px;
  line-height: 1.6;
}
.gate__list {
  list-style: none;
  margin: 20px 0 24px;
  padding: 0;
  text-align: left;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.gate__list li {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  font-size: 14px;
  line-height: 1.5;
  color: var(--text);
}
.gate__list svg {
  width: 16px;
  height: 16px;
  color: var(--green);
  flex-shrink: 0;
  margin-top: 2px;
}
.gate__note {
  color: var(--text-muted);
  font-size: 12.5px;
  margin-top: 12px;
}
</style>
