<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>Actus</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true">
      <NewsFilterBar
        v-model:filter="filter"
        :sources="sources"
        @change="search"
        @reset="resetFilters"
      />

      <div v-if="loading" class="state">Recherche…</div>
      <div v-else-if="!articles.length" class="state">Aucun article ne correspond à ces filtres.</div>

      <ArticleCard v-for="article in articles" :key="article.id" :article="article" />
    </ion-content>
  </ion-page>
</template>

<script lang="ts">
import { defineComponent, onMounted } from 'vue';
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
} from '@ionic/vue';
import { useNews } from '@/composables/useNews';
import ArticleCard from '@/components/ArticleCard.vue';
import NewsFilterBar from '@/components/NewsFilterBar.vue';

export default defineComponent({
  name: 'NewsTab',
  components: {
    ArticleCard,
    NewsFilterBar,
    IonContent,
    IonHeader,
    IonPage,
    IonTitle,
    IonToolbar,
  },
  setup() {
    const { articles, sources, loading, filter, init, search, resetFilters } = useNews();

    onMounted(init);

    return { articles, sources, loading, filter, search, resetFilters };
  },
});
</script>

<style scoped>
.state {
  text-align: center;
  color: var(--ion-color-medium, #92949c);
  padding: 32px 16px;
}
</style>
