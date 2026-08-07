<template>
  <article class="rm-card post">
    <!-- En-tête : auteur du partage -->
    <header class="post-head">
      <div class="cover avatar" :class="post.user.avatar">{{ post.user.initials }}</div>
      <div class="who">
        <div class="name">{{ post.user.name }}</div>
        <div class="rm-muted sub">{{ post.action }} · {{ post.time }}</div>
      </div>
      <div v-if="post.playing" class="bars" aria-label="en écoute">
        <span></span><span></span><span></span><span></span>
      </div>
    </header>

    <!-- Le titre partagé -->
    <div class="track">
      <div class="cover art" :class="post.track.cover">
        <svg viewBox="0 0 24 24" width="26" height="26"><path d="M12 3v10.55A4 4 0 1 0 14 17V7h4V3h-6z" /></svg>
      </div>
      <div class="track-meta">
        <div class="title">{{ post.track.title }}</div>
        <div class="rm-muted artist">{{ post.track.artist }}</div>
      </div>
      <button class="play" :aria-label="'Écouter ' + post.track.title">
        <svg viewBox="0 0 24 24" width="18" height="18"><path d="M8 5v14l11-7z" /></svg>
      </button>
    </div>

    <!-- Actions -->
    <footer class="post-actions">
      <button class="act" :class="{ liked: post.liked }" @click="$emit('like', post)">
        <svg viewBox="0 0 24 24" width="18" height="18"><path d="M12 21s-7.5-4.6-10-9.3C.5 8.4 2 5 5.2 5c2 0 3.3 1.2 4 2.3C9.8 6.2 11.2 5 13.2 5 16.4 5 18 8.4 16.5 11.7 14 16.4 12 21 12 21z" /></svg>
        <span>{{ post.likes }}</span>
      </button>
      <button class="act">
        <svg viewBox="0 0 24 24" width="18" height="18"><path d="M20 2H4a2 2 0 0 0-2 2v18l4-4h14a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2z" /></svg>
        <span>{{ post.comments }}</span>
      </button>
      <button class="act">
        <svg viewBox="0 0 24 24" width="18" height="18"><path d="M18 16a3 3 0 0 0-2.4 1.2l-7-4a3 3 0 0 0 0-2.4l7-4A3 3 0 1 0 15 5l-7 4a3 3 0 1 0 0 6l7 4A3 3 0 1 0 18 16z" /></svg>
        <span>Partager</span>
      </button>
    </footer>
  </article>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';
import { Post } from '@/data/social';

export default defineComponent({
  name: 'TrackPost',
  emits: ['like'],
  props: {
    post: { type: Object as PropType<Post>, required: true },
  },
});
</script>

<style scoped>
.post { padding: 16px; display: flex; flex-direction: column; gap: 14px; }
.post-head { display: flex; align-items: center; gap: 12px; }
.avatar { width: 42px; height: 42px; border-radius: 12px; color: #fff; font-weight: 700; font-size: 0.85rem; }
.who { flex: 1; min-width: 0; }
.name { font-weight: 700; font-size: 0.95rem; }
.sub { font-size: 0.8rem; }

.track { display: flex; align-items: center; gap: 14px; padding: 12px; border-radius: 14px; background: rgba(255, 255, 255, 0.04); }
.art { width: 60px; height: 60px; border-radius: 12px; }
.track-meta { flex: 1; min-width: 0; }
.title { font-weight: 700; font-size: 1rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.artist { font-size: 0.85rem; }
.play {
  width: 42px; height: 42px; border-radius: 50%; border: none; flex-shrink: 0; cursor: pointer;
  background: linear-gradient(135deg, var(--rm-primary), var(--rm-primary-tint));
  display: grid; place-items: center; box-shadow: 0 6px 18px rgba(235, 68, 90, 0.4);
}
.play svg { fill: #fff; }

.post-actions { display: flex; gap: 8px; }
.act {
  flex: 1; display: inline-flex; align-items: center; justify-content: center; gap: 6px;
  padding: 9px; border-radius: 10px; border: none; cursor: pointer;
  background: transparent; color: var(--rm-muted); font-size: 0.82rem; font-weight: 600;
  transition: background 0.15s, color 0.15s;
}
.act svg { fill: currentColor; }
.act:hover { background: rgba(255, 255, 255, 0.05); color: var(--rm-text); }
.act.liked { color: var(--rm-primary); }
</style>
