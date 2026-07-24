<template>
  <section class="clip" :style="gradientStyle">
    <video
      ref="videoEl"
      class="clip-video"
      :src="clip.hlsUrl"
      :poster="clip.posterUrl || undefined"
      loop
      muted
      playsinline
      preload="metadata"
      @click="togglePlay"
    ></video>

    <!-- Indicateur son coupé -->
    <button v-if="muted" class="mute-hint" @click="toggleMute" aria-label="Activer le son">
      <ion-icon :icon="volumeMuteOutline" />
      <span>Toucher pour le son</span>
    </button>

    <!-- Rail d'actions latéral -->
    <div class="rail">
      <button class="rail-btn" :class="{ active: clip.likedByMe }" @click="onLike" :aria-pressed="clip.likedByMe">
        <ion-icon :icon="clip.likedByMe ? heart : heartOutline" />
        <span>{{ compactNumber(clip.likeCount) }}</span>
      </button>
      <button class="rail-btn" @click="$emit('comment', clip)">
        <ion-icon :icon="chatbubbleOutline" />
        <span>{{ compactNumber(clip.commentCount) }}</span>
      </button>
      <button class="rail-btn" @click="onShare">
        <ion-icon :icon="arrowRedoOutline" />
        <span>{{ compactNumber(clip.shareCount) }}</span>
      </button>
      <button class="rail-btn" @click="toggleMute" :aria-label="muted ? 'Activer le son' : 'Couper le son'">
        <ion-icon :icon="muted ? volumeMuteOutline : volumeHighOutline" />
      </button>
    </div>

    <!-- Infos créateur + légende -->
    <div class="overlay">
      <div class="creator-row">
        <div class="who" @click="goToProfile">
          <UserAvatar :user="clip.creator" :size="40" />
          <span class="creator-name">@{{ clip.creator.handle }}</span>
        </div>
        <ion-button
          size="small"
          :fill="following ? 'outline' : 'solid'"
          color="light"
          class="follow-btn"
          @click="onFollow"
        >
          {{ following ? 'Abonné' : 'Suivre' }}
        </ion-button>
      </div>
      <p v-if="clip.caption" class="caption">{{ clip.caption }}</p>
      <div v-if="clip.audioTitle" class="audio">
        <ion-icon :icon="musicalNotesOutline" />
        <span>{{ clip.audioTitle }}</span>
      </div>
    </div>
  </section>
</template>

<script lang="ts">
import { computed, defineComponent, onBeforeUnmount, onMounted, PropType, ref } from 'vue';
import { useRouter } from 'vue-router';
import { IonButton, IonIcon } from '@ionic/vue';
import {
  arrowRedoOutline,
  chatbubbleOutline,
  heart,
  heartOutline,
  musicalNotesOutline,
  volumeHighOutline,
  volumeMuteOutline,
} from 'ionicons/icons';
import { Clip } from '@/models';
import { compactNumber, colorFromString } from '@/utils/format';
import { useInteractions } from '@/composables/useInteractions';
import { useFollows } from '@/composables/useFollows';
import { useShare } from '@/composables/useShare';
import UserAvatar from './UserAvatar.vue';

export default defineComponent({
  name: 'ClipPlayer',
  components: { UserAvatar, IonButton, IonIcon },
  props: {
    clip: { type: Object as PropType<Clip>, required: true },
  },
  emits: ['comment'],
  setup(props) {
    const router = useRouter();
    const videoEl = ref<HTMLVideoElement | null>(null);
    const muted = ref(true);
    const { toggleLike, share } = useInteractions();
    const { isFollowing, toggleFollow } = useFollows();
    const { openShare } = useShare();
    let observer: IntersectionObserver | null = null;

    const following = computed(() => isFollowing(props.clip.creator.id));
    // Dégradé de secours affiché sous la vidéo (utile hors-ligne / avant chargement).
    const gradientStyle = computed(() => {
      const c = colorFromString(props.clip.id);
      return { background: `linear-gradient(160deg, ${c}, #111)` };
    });

    function play() {
      videoEl.value?.play().catch(() => undefined);
    }
    function pause() {
      videoEl.value?.pause();
    }
    function togglePlay() {
      if (!videoEl.value) return;
      videoEl.value.paused ? play() : pause();
    }
    function toggleMute() {
      muted.value = !muted.value;
      if (videoEl.value) videoEl.value.muted = muted.value;
    }

    onMounted(() => {
      if (!videoEl.value) return;
      // Autoplay : lecture quand le clip occupe >= 60 % du viewport, pause sinon.
      observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            entry.isIntersecting && entry.intersectionRatio >= 0.6 ? play() : pause();
          }
        },
        { threshold: [0, 0.6, 1] },
      );
      observer.observe(videoEl.value);
    });

    onBeforeUnmount(() => {
      observer?.disconnect();
      pause();
    });

    return {
      videoEl,
      muted,
      following,
      gradientStyle,
      togglePlay,
      toggleMute,
      onLike: () => toggleLike(props.clip),
      onShare: () => openShare({
        link: `https://rapidmusic.app/c/${props.clip.id}`,
        title: `@${props.clip.creator.handle} sur RapidMusic`,
        onShared: () => share(props.clip),
      }),
      onFollow: () => toggleFollow(props.clip.creator),
      goToProfile: () => router.push(`/profile/${props.clip.creator.handle}`),
      compactNumber,
      heart,
      heartOutline,
      chatbubbleOutline,
      arrowRedoOutline,
      musicalNotesOutline,
      volumeHighOutline,
      volumeMuteOutline,
    };
  },
});
</script>

<style scoped>
.clip {
  position: relative;
  width: 100%;
  height: 100%;
  scroll-snap-align: start;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}
.clip-video {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.mute-hint {
  position: absolute;
  top: 16px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 6px;
  background: rgba(0, 0, 0, 0.5);
  color: #fff;
  border: none;
  border-radius: 20px;
  padding: 6px 12px;
  font-size: 13px;
}
.rail {
  position: absolute;
  right: 10px;
  bottom: 96px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}
.rail-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  background: none;
  border: none;
  color: #fff;
  font-size: 13px;
  font-weight: 600;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.6);
  cursor: pointer;
}
.rail-btn ion-icon {
  font-size: 32px;
}
.rail-btn.active {
  color: var(--ion-color-danger, #eb445a);
}
.overlay {
  position: absolute;
  left: 12px;
  right: 76px;
  bottom: 20px;
  color: #fff;
  text-shadow: 0 1px 4px rgba(0, 0, 0, 0.7);
}
.creator-row {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
}
.who {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
}
.creator-name {
  font-weight: 700;
}
.follow-btn {
  --border-radius: 20px;
  margin: 0;
}
.caption {
  margin: 0 0 8px;
  line-height: 1.4;
}
.audio {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
}
</style>
