<template>
  <article class="post-card">
    <!-- Bandeau de republication (le contenu affiché ci-dessous est l'original). -->
    <div v-if="post.repostedFrom" class="repost-banner">
      <ion-icon :icon="repeatOutline" />
      <span>{{ post.author.displayName }} a republié</span>
    </div>

    <header class="post-header">
      <div class="who" @click="goToProfile">
        <UserAvatar :user="shown.author" :size="44" />
        <div class="author">
          <div class="name-row">
            <span class="display-name">{{ shown.author.displayName }}</span>
            <span class="handle">@{{ shown.author.handle }}</span>
          </div>
          <span class="meta">{{ roleLabel(shown.author.role) }} · {{ timeAgo(shown.createdAt) }}</span>
        </div>
      </div>
      <ion-button
        v-if="showFollow && shown.author.id !== 'u-me'"
        size="small"
        :fill="following ? 'outline' : 'solid'"
        class="follow-btn"
        @click="onFollow"
      >
        {{ following ? 'Abonné' : 'Suivre' }}
      </ion-button>
    </header>

    <p v-if="shown.body" class="body">{{ shown.body }}</p>

    <template v-for="media in shown.media" :key="media.url">
      <img
        v-if="media.type === 'image'"
        class="post-image"
        :src="media.url"
        :alt="media.title || 'Photo du post'"
      />
      <a
        v-else
        class="link-preview"
        :href="media.url"
        target="_blank"
        rel="noopener noreferrer"
      >
        <ion-icon :icon="linkOutline" />
        <span>{{ media.title || media.url }}</span>
      </a>
    </template>

    <div v-if="shown.tags.length" class="tags">
      <span v-for="tag in shown.tags" :key="tag" class="tag">#{{ tag }}</span>
    </div>

    <footer class="actions">
      <button class="action" :class="{ active: shown.likedByMe }" @click="onLike" :aria-pressed="shown.likedByMe">
        <ion-icon :icon="shown.likedByMe ? heart : heartOutline" />
        <span>{{ compactNumber(shown.likeCount) }}</span>
      </button>
      <button class="action" @click="$emit('comment', shown)">
        <ion-icon :icon="chatbubbleOutline" />
        <span>{{ compactNumber(shown.commentCount) }}</span>
      </button>
      <button class="action" @click="onShare">
        <ion-icon :icon="arrowRedoOutline" />
        <span>{{ compactNumber(shown.shareCount) }}</span>
      </button>
    </footer>
  </article>
</template>

<script lang="ts">
import { computed, defineComponent, PropType } from 'vue';
import { useRouter } from 'vue-router';
import { IonButton, IonIcon, toastController } from '@ionic/vue';
import {
  arrowRedoOutline,
  chatbubbleOutline,
  heart,
  heartOutline,
  linkOutline,
  repeatOutline,
} from 'ionicons/icons';
import { Post, UserRole } from '@/models';
import { compactNumber, timeAgo } from '@/utils/format';
import { repostPost } from '@/services/api';
import { useInteractions } from '@/composables/useInteractions';
import { useFollows } from '@/composables/useFollows';
import { useFeed } from '@/composables/useFeed';
import { useShare } from '@/composables/useShare';
import UserAvatar from './UserAvatar.vue';

const ROLE_LABELS: Record<UserRole, string> = {
  fan: 'Fan',
  creator: 'Créateur',
  media: 'Média',
  moderator: 'Modérateur',
  admin: 'Admin',
};

export default defineComponent({
  name: 'PostCard',
  components: { UserAvatar, IonButton, IonIcon },
  props: {
    post: { type: Object as PropType<Post>, required: true },
    // Masqué sur le profil du créateur lui-même (bouton Suivre déjà en en-tête).
    showFollow: { type: Boolean, default: true },
  },
  emits: ['comment'],
  setup(props) {
    const router = useRouter();
    const { toggleLike, share } = useInteractions();
    const { isFollowing, toggleFollow } = useFollows();
    const { prepend } = useFeed();
    const { openShare } = useShare();

    // Contenu réellement affiché : l'original si c'est un repost, sinon le post.
    const shown = computed(() => props.post.repostedFrom ?? props.post);
    const following = computed(() => isFollowing(shown.value.author.id));

    async function repost() {
      const rp = await repostPost(shown.value);
      prepend(rp);
      const t = await toastController.create({ message: 'Republié dans ton fil 🔁', duration: 1400 });
      await t.present();
    }

    function onShare() {
      openShare({
        link: `https://rapidmusic.app/p/${shown.value.id}`,
        title: `${shown.value.author.displayName} sur RapidMusic`,
        onRepost: repost,
        onShared: () => share(shown.value),
      });
    }

    return {
      shown,
      following,
      onShare,
      onLike: () => toggleLike(shown.value),
      onFollow: () => toggleFollow(shown.value.author),
      goToProfile: () => router.push(`/profile/${shown.value.author.handle}`),
      roleLabel: (r: UserRole) => ROLE_LABELS[r],
      compactNumber,
      timeAgo,
      heart,
      heartOutline,
      chatbubbleOutline,
      arrowRedoOutline,
      linkOutline,
      repeatOutline,
    };
  },
});
</script>

<style scoped>
.post-card {
  padding: 16px;
  margin: 12px 12px 0;
  background: var(--rm-surface);
  border: 1px solid var(--rm-border);
  border-radius: var(--rm-radius);
  box-shadow: var(--rm-shadow-sm);
}
.post-card:last-of-type {
  margin-bottom: 12px;
}
.repost-banner {
  display: flex;
  align-items: center;
  gap: 6px;
  color: var(--ion-color-medium, #92949c);
  font-size: 13px;
  font-weight: 600;
  margin-bottom: 10px;
}
.repost-banner ion-icon {
  font-size: 16px;
}
.post-header {
  display: flex;
  align-items: center;
  gap: 12px;
}
.who {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
  min-width: 0;
  cursor: pointer;
}
.author {
  min-width: 0;
}
.name-row {
  display: flex;
  align-items: baseline;
  gap: 6px;
}
.display-name {
  font-weight: 700;
}
.handle {
  color: var(--ion-color-medium, #92949c);
  font-size: 13px;
}
.meta {
  display: block;
  color: var(--ion-color-medium, #92949c);
  font-size: 12px;
}
.follow-btn {
  --border-radius: 20px;
  margin: 0;
}
.body {
  margin: 12px 0;
  line-height: 1.5;
  white-space: pre-wrap;
}
.post-image {
  width: 100%;
  max-height: 420px;
  object-fit: cover;
  border-radius: 12px;
  margin-bottom: 12px;
  display: block;
}
.link-preview {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px;
  background: var(--rm-chip);
  border: 1px solid var(--rm-border);
  border-radius: var(--rm-radius-sm);
  text-decoration: none;
  color: inherit;
  margin-bottom: 12px;
}
.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 4px;
}
.tag {
  color: var(--ion-color-primary, #3880ff);
  font-size: 13px;
}
.actions {
  display: flex;
  gap: 24px;
  margin-top: 8px;
}
.action {
  display: flex;
  align-items: center;
  gap: 6px;
  background: none;
  border: none;
  padding: 6px 0;
  color: var(--ion-color-medium, #92949c);
  font-size: 14px;
  cursor: pointer;
}
.action ion-icon {
  font-size: 20px;
}
.action.active {
  color: var(--ion-color-danger, #eb445a);
}
</style>
