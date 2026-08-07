<template>
  <ion-page>
    <ion-header class="ion-no-border">
      <ion-toolbar>
        <BrandLogo slot="start" class="ion-padding-start" />
        <ion-buttons slot="end">
          <ion-button aria-label="Notifications">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="var(--rm-text)"><path d="M12 22a2.5 2.5 0 0 0 2.45-2h-4.9A2.5 2.5 0 0 0 12 22zm7-6v-5a7 7 0 0 0-5-6.7V4a2 2 0 1 0-4 0v.3A7 7 0 0 0 5 11v5l-2 2v1h18v-1l-2-2z" /></svg>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true">
      <div class="page">
        <!-- Amis actifs -->
        <section class="stories">
          <div class="story me">
            <div class="ring add">
              <div class="cover c5">BD</div>
              <span class="plus">+</span>
            </div>
            <span class="rm-muted">Partager</span>
          </div>
          <div class="story" v-for="u in users" :key="u.id">
            <div class="ring">
              <div class="cover" :class="u.avatar">{{ u.initials }}</div>
            </div>
            <span class="rm-muted">{{ u.name.split(' ')[0] }}</span>
          </div>
        </section>

        <h2 class="section-title">Ton fil musical</h2>

        <div class="feed">
          <TrackPost v-for="post in feed" :key="post.id" :post="post" @like="toggleLike" />
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue';
import { IonPage, IonHeader, IonToolbar, IonContent, IonButtons, IonButton } from '@ionic/vue';
import BrandLogo from '@/components/BrandLogo.vue';
import TrackPost from '@/components/TrackPost.vue';
import { posts, users, Post } from '@/data/social';

export default defineComponent({
  name: 'Feed',
  components: { IonPage, IonHeader, IonToolbar, IonContent, IonButtons, IonButton, BrandLogo, TrackPost },
  setup() {
    const feed = ref<Post[]>(posts.map((p) => ({ ...p })));
    const toggleLike = (post: Post) => {
      const target = feed.value.find((p) => p.id === post.id);
      if (!target) return;
      target.liked = !target.liked;
      target.likes += target.liked ? 1 : -1;
    };
    return { feed, users, toggleLike };
  },
});
</script>

<style scoped>
.page { padding: 8px 16px 24px; max-width: 640px; margin: 0 auto; }

.stories { display: flex; gap: 16px; overflow-x: auto; padding: 8px 2px 16px; scrollbar-width: none; }
.stories::-webkit-scrollbar { display: none; }
.story { display: flex; flex-direction: column; align-items: center; gap: 7px; flex-shrink: 0; font-size: 0.72rem; }
.ring {
  padding: 2px; border-radius: 50%; position: relative;
  background: linear-gradient(135deg, var(--rm-primary), var(--rm-secondary));
}
.ring .cover { width: 58px; height: 58px; border-radius: 50%; color: #fff; font-weight: 700; font-size: 0.9rem; border: 3px solid var(--rm-bg); }
.ring.add { background: var(--rm-border); }
.ring.add .plus {
  position: absolute; bottom: -2px; right: -2px; width: 22px; height: 22px; border-radius: 50%;
  background: linear-gradient(135deg, var(--rm-primary), var(--rm-primary-tint)); color: #fff;
  display: grid; place-items: center; font-weight: 700; border: 2px solid var(--rm-bg);
}

.section-title { font-size: 1.05rem; font-weight: 800; letter-spacing: -0.01em; margin: 6px 0 14px; }
.feed { display: flex; flex-direction: column; gap: 14px; }
</style>
