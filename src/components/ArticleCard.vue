<template>
  <a class="article-card" :href="article.externalUrl" target="_blank" rel="noopener noreferrer">
    <div class="thumb" :style="thumbStyle">
      <ion-icon v-if="!article.imageUrl" :icon="newspaperOutline" />
    </div>
    <div class="content">
      <div class="source-row">
        <span class="source" :class="`trust-${article.source.trustLevel}`">
          {{ article.source.name }}
        </span>
        <ion-icon
          v-if="article.source.trustLevel === 'high'"
          :icon="shieldCheckmarkOutline"
          class="trust-icon"
          aria-label="Source fiable"
        />
        <span class="date">{{ timeAgo(article.publishedAt) }}</span>
      </div>
      <h2 class="title">{{ article.title }}</h2>
      <p class="summary">{{ article.summary }}</p>
      <div class="footer-row">
        <span v-if="article.genre" class="genre">{{ article.genre }}</span>
        <span v-if="article.artistName" class="artist">· {{ article.artistName }}</span>
        <span class="read-more">Lire sur {{ article.source.domain }} →</span>
      </div>
    </div>
  </a>
</template>

<script lang="ts">
import { computed, defineComponent, PropType } from 'vue';
import { IonIcon } from '@ionic/vue';
import { newspaperOutline, shieldCheckmarkOutline } from 'ionicons/icons';
import { Article } from '@/models';
import { colorFromString, timeAgo } from '@/utils/format';

export default defineComponent({
  name: 'ArticleCard',
  components: { IonIcon },
  props: {
    article: { type: Object as PropType<Article>, required: true },
  },
  setup(props) {
    const thumbStyle = computed(() =>
      props.article.imageUrl
        ? { backgroundImage: `url(${props.article.imageUrl})` }
        : { background: `linear-gradient(135deg, ${colorFromString(props.article.id)}, #222)` },
    );
    return { thumbStyle, timeAgo, newspaperOutline, shieldCheckmarkOutline };
  },
});
</script>

<style scoped>
.article-card {
  display: flex;
  gap: 12px;
  padding: 14px 16px;
  background: var(--rm-surface);
  border-bottom: 1px solid var(--rm-border);
  text-decoration: none;
  color: inherit;
}
.thumb {
  width: 88px;
  height: 88px;
  border-radius: 12px;
  flex-shrink: 0;
  background-size: cover;
  background-position: center;
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(255, 255, 255, 0.85);
  font-size: 28px;
}
.content {
  min-width: 0;
  flex: 1;
}
.source-row {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  margin-bottom: 4px;
}
.source {
  font-weight: 700;
}
.trust-high {
  color: var(--ion-color-success, #2dd36f);
}
.trust-medium {
  color: var(--ion-color-warning, #ffc409);
}
.trust-low {
  color: var(--ion-color-medium, #92949c);
}
.trust-icon {
  color: var(--ion-color-success, #2dd36f);
  font-size: 14px;
}
.date {
  color: var(--ion-color-medium, #92949c);
  margin-left: auto;
}
.title {
  font-size: 15px;
  font-weight: 700;
  margin: 0 0 4px;
  line-height: 1.3;
}
.summary {
  font-size: 13px;
  color: var(--ion-color-medium-shade, #6b6d72);
  margin: 0 0 6px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.footer-row {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
}
.genre {
  text-transform: capitalize;
  color: var(--ion-color-primary, #3880ff);
  font-weight: 600;
}
.artist {
  color: var(--ion-color-medium, #92949c);
}
.read-more {
  margin-left: auto;
  color: var(--ion-color-primary, #3880ff);
  white-space: nowrap;
}
</style>
