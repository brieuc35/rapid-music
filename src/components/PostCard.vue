<template>
  <article class="post-card">
    <header class="post-header">
      <div class="who" @click="goToProfile">
        <UserAvatar :user="post.author" :size="44" />
        <div class="author">
          <div class="name-row">
            <span class="display-name">{{ post.author.displayName }}</span>
            <span class="handle">@{{ post.author.handle }}</span>
          </div>
          <span class="meta">{{ roleLabel(post.author.role) }} · {{ timeAgo(post.createdAt) }}</span>
        </div>
      </div>
      <ion-button
        v-if="showFollow && post.author.id !== 'u-me'"
        size="small"
        :fill="following ? 'outline' : 'solid'"
        class="follow-btn"
        @click="onFollow"
      >
        {{ following ? 'Abonné' : 'Suivre' }}
      </ion-button>
    </header>

    <p class="body">{{ post.body }}</p>

    <a
      v-for="media in post.media"
      :key="media.url"
      class="link-preview"
      :href="media.url"
      target="_blank"
      rel="noopener noreferrer"
    >
      <ion-icon :icon="linkOutline" />
      <span>{{ media.title || media.url }}</span>
    </a>

    <div v-if="post.tags.length" class="tags">
      <span v-for="tag in post.tags" :key="tag" class="tag">#{{ tag }}</span>
    </div>

    <footer class="actions">
      <button class="action" :class="{ active: post.likedByMe }" @click="onLike" :aria-pressed="post.likedByMe">
        <ion-icon :icon="post.likedByMe ? heart : heartOutline" />
        <span>{{ compactNumber(post.likeCount) }}</span>
      </button>
      <button class="action" @click="$emit('comment', post)">
        <ion-icon :icon="chatbubbleOutline" />
        <span>{{ compactNumber(post.commentCount) }}</span>
      </button>
      <button class="action" @click="onShare">
        <ion-icon :icon="arrowRedoOutline" />
        <span>{{ compactNumber(post.shareCount) }}</span>
      </button>
    </footer>
  </article>
</template>

<script lang="ts">
import { computed, defineComponent, PropType } from 'vue';
import { useRouter } from 'vue-router';
import { IonButton, IonIcon } from '@ionic/vue';
import {
  arrowRedoOutline,
  chatbubbleOutline,
  heart,
  heartOutline,
  linkOutline,
} from 'ionicons/icons';
import { Post, UserRole } from '@/models';
import { compactNumber, timeAgo } from '@/utils/format';
import { useInteractions } from '@/composables/useInteractions';
import { useFollows } from '@/composables/useFollows';
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

    const following = computed(() => isFollowing(props.post.author.id));

    return {
      following,
      onLike: () => toggleLike(props.post),
      onShare: () => share(props.post),
      onFollow: () => toggleFollow(props.post.author),
      goToProfile: () => router.push(`/profile/${props.post.author.handle}`),
      roleLabel: (r: UserRole) => ROLE_LABELS[r],
      compactNumber,
      timeAgo,
      heart,
      heartOutline,
      chatbubbleOutline,
      arrowRedoOutline,
      linkOutline,
    };
  },
});
</script>

<style scoped>
.post-card {
  padding: 16px;
  border-bottom: 8px solid var(--ion-color-light, #f4f5f8);
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
.link-preview {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px;
  border: 1px solid var(--ion-color-light-shade, #d7d8da);
  border-radius: 12px;
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
