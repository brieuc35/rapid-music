<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>Fil</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true">
      <ion-refresher slot="fixed" @ionRefresh="onRefresh($event)">
        <ion-refresher-content></ion-refresher-content>
      </ion-refresher>

      <div v-if="loading && !posts.length" class="state">Chargement du fil…</div>

      <PostCard v-for="post in posts" :key="post.id" :post="post" @comment="openComments" />

      <ion-infinite-scroll v-if="hasMore" @ionInfinite="onInfinite($event)">
        <ion-infinite-scroll-content loading-text="Chargement…"></ion-infinite-scroll-content>
      </ion-infinite-scroll>

      <div v-if="!hasMore && posts.length" class="state end">Vous êtes à jour ✨</div>
    </ion-content>
  </ion-page>
</template>

<script lang="ts">
import { defineComponent, onMounted } from 'vue';
import {
  IonContent,
  IonHeader,
  IonInfiniteScroll,
  IonInfiniteScrollContent,
  IonPage,
  IonRefresher,
  IonRefresherContent,
  IonTitle,
  IonToolbar,
  toastController,
} from '@ionic/vue';
import { Post } from '@/models';
import { useFeed } from '@/composables/useFeed';
import PostCard from '@/components/PostCard.vue';

export default defineComponent({
  name: 'FeedTab',
  components: {
    PostCard,
    IonContent,
    IonHeader,
    IonInfiniteScroll,
    IonInfiniteScrollContent,
    IonPage,
    IonRefresher,
    IonRefresherContent,
    IonTitle,
    IonToolbar,
  },
  setup() {
    const { posts, loading, hasMore, refresh, loadMore } = useFeed();

    onMounted(refresh);

    async function onRefresh(event: CustomEvent) {
      await refresh();
      (event.target as HTMLIonRefresherElement).complete();
    }

    async function onInfinite(event: CustomEvent) {
      await loadMore();
      (event.target as HTMLIonInfiniteScrollElement).complete();
    }

    async function openComments(post: Post) {
      const toast = await toastController.create({
        message: `Commentaires de « ${post.author.displayName} » — à venir`,
        duration: 1500,
      });
      await toast.present();
    }

    return { posts, loading, hasMore, onRefresh, onInfinite, openComments };
  },
});
</script>

<style scoped>
.state {
  text-align: center;
  color: var(--ion-color-medium, #92949c);
  padding: 32px 16px;
}
.state.end {
  padding: 20px;
  font-size: 14px;
}
</style>
