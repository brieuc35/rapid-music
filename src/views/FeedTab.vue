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

      <!-- Bouton flottant : créer un post -->
      <ion-fab slot="fixed" vertical="bottom" horizontal="end">
        <ion-fab-button aria-label="Créer un post" @click="openComposer">
          <ion-icon :icon="createOutline" />
        </ion-fab-button>
      </ion-fab>
    </ion-content>
  </ion-page>
</template>

<script lang="ts">
import { defineComponent, onMounted } from 'vue';
import {
  IonContent,
  IonFab,
  IonFabButton,
  IonHeader,
  IonIcon,
  IonInfiniteScroll,
  IonInfiniteScrollContent,
  IonPage,
  IonRefresher,
  IonRefresherContent,
  IonTitle,
  IonToolbar,
  modalController,
} from '@ionic/vue';
import { createOutline } from 'ionicons/icons';
import { Post } from '@/models';
import { useFeed } from '@/composables/useFeed';
import PostCard from '@/components/PostCard.vue';
import PostComposer from '@/components/PostComposer.vue';
import CommentSheet from '@/components/CommentSheet.vue';

export default defineComponent({
  name: 'FeedTab',
  components: {
    PostCard,
    IonContent,
    IonFab,
    IonFabButton,
    IonHeader,
    IonIcon,
    IonInfiniteScroll,
    IonInfiniteScrollContent,
    IonPage,
    IonRefresher,
    IonRefresherContent,
    IonTitle,
    IonToolbar,
  },
  setup() {
    const { posts, loading, hasMore, refresh, loadMore, prepend } = useFeed();

    onMounted(refresh);

    async function onRefresh(event: CustomEvent) {
      await refresh();
      (event.target as HTMLIonRefresherElement).complete();
    }

    async function onInfinite(event: CustomEvent) {
      await loadMore();
      (event.target as HTMLIonInfiniteScrollElement).complete();
    }

    async function openComposer() {
      const modal = await modalController.create({ component: PostComposer });
      await modal.present();
      const { data } = await modal.onWillDismiss();
      if (data) prepend(data as Post);
    }

    async function openComments(post: Post) {
      const modal = await modalController.create({
        component: CommentSheet,
        componentProps: {
          targetType: 'post',
          targetId: post.id,
          afterAdd: () => { post.commentCount += 1; },
        },
      });
      await modal.present();
    }

    return { posts, loading, hasMore, onRefresh, onInfinite, openComposer, openComments, createOutline };
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
