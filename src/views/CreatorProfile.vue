<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button default-href="/tabs/feed"></ion-back-button>
        </ion-buttons>
        <ion-title>{{ user ? '@' + user.handle : 'Profil' }}</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true">
      <div v-if="loading" class="state">Chargement du profil…</div>
      <div v-else-if="notFound" class="state">Profil introuvable.</div>

      <template v-else-if="user">
        <!-- En-tête de profil -->
        <section class="profile-head">
          <UserAvatar :user="user" :size="88" />
          <h1 class="name">{{ user.displayName }}</h1>
          <span class="role">{{ roleLabel(user.role) }}</span>
          <p v-if="user.bio" class="bio">{{ user.bio }}</p>

          <div class="stats">
            <div class="stat">
              <strong>{{ compactNumber(posts.length + clips.length) }}</strong>
              <span>publications</span>
            </div>
            <div class="stat">
              <strong>{{ compactNumber(user.followerCount) }}</strong>
              <span>abonnés</span>
            </div>
            <div class="stat">
              <strong>{{ compactNumber(user.followingCount) }}</strong>
              <span>abonnements</span>
            </div>
          </div>

          <ion-button
            v-if="user.id !== 'u-me'"
            expand="block"
            :fill="following ? 'outline' : 'solid'"
            class="follow-btn"
            @click="onFollow"
          >
            {{ following ? 'Abonné' : 'Suivre' }}
          </ion-button>
        </section>

        <!-- Onglets internes -->
        <ion-segment :value="tab" @ionChange="onTab($event)">
          <ion-segment-button value="clips">
            <ion-icon :icon="playCircleOutline" />
            <ion-label>Clips ({{ clips.length }})</ion-label>
          </ion-segment-button>
          <ion-segment-button value="posts">
            <ion-icon :icon="listOutline" />
            <ion-label>Posts ({{ posts.length }})</ion-label>
          </ion-segment-button>
        </ion-segment>

        <!-- Grille de clips -->
        <div v-if="tab === 'clips'">
          <div v-if="!clips.length" class="state">Aucun clip pour le moment.</div>
          <div v-else class="clips-grid">
            <div v-for="clip in clips" :key="clip.id" class="clip-thumb" :style="thumbStyle(clip)">
              <ion-icon :icon="play" class="play" />
              <span class="views">
                <ion-icon :icon="eyeOutline" />
                {{ compactNumber(clip.viewCount) }}
              </span>
            </div>
          </div>
        </div>

        <!-- Liste de posts -->
        <div v-else>
          <div v-if="!posts.length" class="state">Aucune publication pour le moment.</div>
          <PostCard
            v-for="post in posts"
            :key="post.id"
            :post="post"
            :show-follow="false"
            @comment="openComments"
          />
        </div>
      </template>
    </ion-content>
  </ion-page>
</template>

<script lang="ts">
import { computed, defineComponent, onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import {
  IonBackButton,
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonLabel,
  IonPage,
  IonSegment,
  IonSegmentButton,
  IonTitle,
  IonToolbar,
  modalController,
} from '@ionic/vue';
import { eyeOutline, listOutline, play, playCircleOutline } from 'ionicons/icons';
import { Clip, Post, UserRole } from '@/models';
import { compactNumber, colorFromString } from '@/utils/format';
import { useProfile } from '@/composables/useProfile';
import { useFollows } from '@/composables/useFollows';
import UserAvatar from '@/components/UserAvatar.vue';
import PostCard from '@/components/PostCard.vue';
import CommentSheet from '@/components/CommentSheet.vue';

const ROLE_LABELS: Record<UserRole, string> = {
  fan: 'Fan',
  creator: 'Créateur',
  media: 'Média',
  moderator: 'Modérateur',
  admin: 'Admin',
};

export default defineComponent({
  name: 'CreatorProfile',
  components: {
    UserAvatar,
    PostCard,
    IonBackButton,
    IonButton,
    IonButtons,
    IonContent,
    IonHeader,
    IonIcon,
    IonLabel,
    IonPage,
    IonSegment,
    IonSegmentButton,
    IonTitle,
    IonToolbar,
  },
  setup() {
    const route = useRoute();
    const handle = route.params.handle as string;
    const { user, clips, posts, loading, notFound, load } = useProfile(handle);
    const { isFollowing, toggleFollow } = useFollows();
    const tab = ref<'clips' | 'posts'>('clips');

    const following = computed(() => (user.value ? isFollowing(user.value.id) : false));

    onMounted(load);

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

    return {
      user,
      clips,
      posts,
      loading,
      notFound,
      tab,
      following,
      onFollow: () => user.value && toggleFollow(user.value),
      onTab: (e: CustomEvent) => (tab.value = e.detail.value as 'clips' | 'posts'),
      openComments,
      roleLabel: (r: UserRole) => ROLE_LABELS[r],
      thumbStyle: (clip: Clip) => ({
        background: `linear-gradient(160deg, ${colorFromString(clip.id)}, #111)`,
      }),
      compactNumber,
      playCircleOutline,
      listOutline,
      play,
      eyeOutline,
    };
  },
});
</script>

<style scoped>
.state {
  text-align: center;
  color: var(--ion-color-medium, #92949c);
  padding: 40px 16px;
}
.profile-head {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 24px 16px 8px;
}
.name {
  font-size: 22px;
  font-weight: 800;
  margin: 12px 0 2px;
}
.role {
  color: var(--ion-color-primary, #3880ff);
  font-size: 13px;
  font-weight: 600;
}
.bio {
  margin: 10px 0 0;
  color: var(--ion-color-medium-shade, #6b6d72);
  max-width: 320px;
}
.stats {
  display: flex;
  gap: 28px;
  margin: 18px 0 4px;
}
.stat {
  display: flex;
  flex-direction: column;
}
.stat strong {
  font-size: 18px;
}
.stat span {
  font-size: 12px;
  color: var(--ion-color-medium, #92949c);
}
.follow-btn {
  width: 100%;
  max-width: 320px;
  margin-top: 12px;
  --border-radius: 22px;
}
.clips-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 2px;
}
.clip-thumb {
  position: relative;
  aspect-ratio: 9 / 16;
  display: flex;
  align-items: center;
  justify-content: center;
}
.clip-thumb .play {
  color: rgba(255, 255, 255, 0.85);
  font-size: 34px;
}
.clip-thumb .views {
  position: absolute;
  left: 6px;
  bottom: 6px;
  display: flex;
  align-items: center;
  gap: 3px;
  color: #fff;
  font-size: 12px;
  font-weight: 600;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.7);
}
.clip-thumb .views ion-icon {
  font-size: 14px;
}
</style>
