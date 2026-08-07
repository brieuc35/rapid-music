<template>
  <article class="post">
    <div class="post__head">
      <div class="post__avatar" :style="{ background: gradient }">
        {{ initials(account?.name ?? '?') }}
      </div>
      <div class="post__ident">
        <div class="hstack" style="gap: 5px; flex-wrap: wrap">
          <b class="post__name">{{ account?.name ?? 'Compte inconnu' }}</b>
          <Icon v-if="account?.verified" name="verified" class="post__check" />
          <span class="muted post__handle">{{ account?.handle }}</span>
        </div>
        <div class="post__meta">
          {{ account?.role }} · {{ relativeTime(post.date) }}
        </div>
      </div>
      <span class="badge badge--plain" :class="categoryClass">{{ post.category }}</span>
    </div>

    <p class="post__body">{{ post.content }}</p>

    <div v-if="post.tags.length" class="post__tags">
      <button v-for="t in post.tags" :key="t" class="tag" @click="$emit('tag', t)">#{{ t }}</button>
    </div>

    <div class="post__actions">
      <button class="act" :class="{ 'act--liked': post.liked }" @click="$emit('like', post)">
        <Icon name="heart" /> {{ number(post.likes) }}
      </button>
      <button class="act" @click="$emit('comment', post)">
        <Icon name="comment" /> {{ number(post.comments) }}
      </button>
      <button class="act" :class="{ 'act--saved': post.saved }" @click="$emit('save', post)">
        <Icon name="bookmark" /> {{ post.saved ? 'Enregistré' : 'Enregistrer' }}
      </button>
      <button v-if="mine" class="act act--danger right" @click="$emit('delete', post)">
        <Icon name="trash" /> Supprimer
      </button>
      <button
        v-else
        class="act right"
        :class="{ 'act--following': following }"
        @click="$emit('follow', post.accountId)"
      >
        <Icon :name="following ? 'check' : 'plus'" />
        {{ following ? 'Suivi' : 'Suivre' }}
      </button>
    </div>
  </article>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import Icon from './Icon.vue'
import type { Post, SocialAccount } from '@/store/types'
import { initials, number, relativeTime } from '@/utils/format'

const props = defineProps<{
  post: Post
  account?: SocialAccount
  following: boolean
  mine: boolean
}>()

defineEmits<{
  (e: 'like', p: Post): void
  (e: 'save', p: Post): void
  (e: 'comment', p: Post): void
  (e: 'delete', p: Post): void
  (e: 'follow', accountId: string): void
  (e: 'tag', tag: string): void
}>()

const gradient = computed(() => {
  const c = props.account?.color ?? '#8b5cf6'
  return `linear-gradient(135deg, ${c}, ${c}aa)`
})

const categoryClass = computed(() => {
  const map: Record<string, string> = {
    Certification: 'badge--amber',
    Interview: 'badge--violet',
    Sortie: 'badge--blue',
    Industrie: 'badge--gray',
    Concert: 'badge--green',
    Autre: 'badge--gray',
  }
  return map[props.post.category] ?? 'badge--gray'
})
</script>

<style scoped>
.post {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 18px 20px;
  box-shadow: var(--shadow-sm);
}
.post__head {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}
.post__avatar {
  width: 42px;
  height: 42px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  color: #fff;
  font-weight: 700;
  font-size: 14px;
  flex-shrink: 0;
}
.post__ident {
  flex: 1;
  min-width: 0;
}
.post__name {
  font-size: 14.5px;
}
.post__check {
  width: 15px;
  height: 15px;
  color: var(--blue);
  flex-shrink: 0;
}
.post__handle {
  font-size: 13px;
}
.post__meta {
  color: var(--text-muted);
  font-size: 12.5px;
  margin-top: 1px;
}
.post__body {
  margin: 13px 0 0;
  font-size: 14.5px;
  line-height: 1.6;
  color: var(--text);
  white-space: pre-wrap;
}
.post__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 12px;
}
.tag {
  border: none;
  background: var(--brand-gradient-soft);
  color: var(--violet-700);
  font-size: 12px;
  font-weight: 600;
  padding: 3px 9px;
  border-radius: 20px;
}
.tag:hover {
  background: var(--violet-200);
}
.post__actions {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 14px;
  padding-top: 13px;
  border-top: 1px solid var(--border);
  flex-wrap: wrap;
}
.act {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border: none;
  background: transparent;
  color: var(--text-soft);
  font-size: 13px;
  font-weight: 600;
  padding: 6px 10px;
  border-radius: 9px;
  transition: background 0.12s, color 0.12s;
}
.act svg {
  width: 16px;
  height: 16px;
  fill: none;
}
.act:hover {
  background: var(--surface-2);
  color: var(--text);
}
.act--liked {
  color: var(--red);
}
.act--liked svg {
  fill: var(--red);
}
.act--saved {
  color: var(--violet-600);
}
.act--saved svg {
  fill: var(--violet-600);
}
.act--following {
  color: var(--green);
}
.act--danger:hover {
  background: var(--red-bg);
  color: var(--red);
}
</style>
