<template>
  <div class="page">
    <PageHeader title="Réseau" subtitle="L'actualité du monde de la musique, en un seul fil.">
      <template #actions>
        <button class="btn btn--primary" @click="showCompose = true">
          <Icon name="plus" /> Publier
        </button>
      </template>
    </PageHeader>

    <div class="notice">
      <Icon name="bell" />
      <div>
        <b>Ce fil est local à votre appareil.</b>
        RapidMusic fonctionne sans serveur : les publications ci-dessous sont un contenu
        de démonstration, et les vôtres ne sont visibles que par vous. Un véritable réseau
        entre musiciens demanderait un serveur pour relier les comptes.
      </div>
    </div>

    <div class="social">
      <!-- Fil -->
      <div>
        <div class="toolbar">
          <div class="search">
            <Icon name="search" />
            <input v-model="q" placeholder="Rechercher une publication, un compte…" />
          </div>
        </div>

        <div class="chips" style="margin-bottom: 18px">
          <button
            v-for="f in filters"
            :key="f"
            class="chip"
            :class="{ 'chip--active': activeFilter === f }"
            @click="activeFilter = f"
          >
            {{ f }}
          </button>
        </div>

        <div class="vstack" style="gap: 14px">
          <PostCard
            v-for="p in filtered"
            :key="p.id"
            :post="p"
            :account="accountById(p.accountId)"
            :following="isFollowing(p.accountId)"
            :mine="p.accountId === 'me'"
            @like="toggleLike"
            @save="toggleSave"
            @comment="openComments"
            @delete="askDelete"
            @follow="toggleFollow"
            @tag="onTag"
          />

          <EmptyState
            v-if="!filtered.length"
            icon="globe"
            title="Aucune publication"
            :text="
              activeFilter === 'Suivis'
                ? 'Suivez des comptes pour voir leurs publications ici.'
                : 'Aucun résultat pour cette recherche.'
            "
          />
        </div>
      </div>

      <!-- Colonne latérale -->
      <aside class="vstack" style="gap: 18px">
        <div class="card card--pad">
          <div class="section-head">
            <span class="section-head__title">Comptes à suivre</span>
          </div>
          <div class="vstack" style="gap: 11px">
            <div v-for="a in suggestions" :key="a.id" class="sugg">
              <div class="sugg__avatar" :style="{ background: a.color }">
                {{ initials(a.name) }}
              </div>
              <div class="row__main">
                <div class="hstack" style="gap: 4px">
                  <b style="font-size: 13.5px">{{ a.name }}</b>
                  <Icon v-if="a.verified" name="verified" class="sugg__check" />
                </div>
                <div class="muted" style="font-size: 12px">{{ a.role }}</div>
              </div>
              <button class="btn btn--ghost btn--sm" @click="toggleFollow(a.id)">
                <Icon name="plus" /> Suivre
              </button>
            </div>
            <p v-if="!suggestions.length" class="muted" style="font-size: 13px">
              Vous suivez tous les comptes disponibles.
            </p>
          </div>
        </div>

        <div class="card card--pad">
          <div class="section-head">
            <span class="section-head__title">Sujets du moment</span>
          </div>
          <div class="chips">
            <button
              v-for="t in trending"
              :key="t.tag"
              class="chip"
              :class="{ 'chip--active': q === '#' + t.tag }"
              @click="onTag(t.tag)"
            >
              #{{ t.tag }} <span class="muted" style="margin-left: 4px">{{ t.count }}</span>
            </button>
          </div>
        </div>

        <div class="card card--pad">
          <div class="section-head">
            <span class="section-head__title">Enregistrés</span>
          </div>
          <div class="vstack" style="gap: 10px">
            <button
              v-for="p in savedPosts"
              :key="p.id"
              class="saved-item"
              @click="q = p.content.slice(0, 24)"
            >
              <b style="font-size: 12.5px">{{ accountById(p.accountId)?.name }}</b>
              <span class="muted" style="font-size: 12.5px">{{ excerpt(p.content) }}</span>
            </button>
            <p v-if="!savedPosts.length" class="muted" style="font-size: 13px">
              Aucune publication mise de côté.
            </p>
          </div>
        </div>
      </aside>
    </div>

    <!-- Publier -->
    <Modal :open="showCompose" title="Publier sur le réseau" @close="closeCompose">
      <div class="field">
        <label>Votre message</label>
        <textarea
          v-model="draft"
          rows="5"
          placeholder="Une annonce, une recherche de collaboration, une actualité…"
        />
        <p class="field-help">{{ draft.length }} / 500 caractères</p>
      </div>
      <div class="field--row">
        <div class="field">
          <label>Catégorie</label>
          <select v-model="draftCategory">
            <option v-for="c in categories" :key="c">{{ c }}</option>
          </select>
        </div>
        <div class="field">
          <label>Mots-clés</label>
          <input v-model="draftTags" placeholder="tournée, featuring" />
          <p class="field-help">Séparés par des virgules</p>
        </div>
      </div>
      <template #footer>
        <button class="btn btn--subtle" @click="closeCompose">Annuler</button>
        <button
          class="btn btn--primary"
          :disabled="!draft.trim() || draft.length > 500"
          @click="publish"
        >
          <Icon name="check" /> Publier
        </button>
      </template>
    </Modal>

    <!-- Commentaires : non disponibles sans serveur -->
    <Modal :open="!!commentTarget" title="Commentaires" @close="commentTarget = null">
      <p style="margin: 0; color: var(--text-soft); line-height: 1.6">
        Les commentaires supposent des échanges entre plusieurs personnes, ce qu'un
        fil local ne permet pas : il faudrait un serveur pour relier les comptes.
        Cette publication en affiche
        <b style="color: var(--text)">{{ commentTarget?.comments }}</b> dans le contenu
        de démonstration.
      </p>
      <template #footer>
        <button class="btn btn--primary" @click="commentTarget = null">Fermer</button>
      </template>
    </Modal>

    <ConfirmDialog
      :open="!!toDelete"
      :label="toDelete ? excerpt(toDelete.content) : ''"
      @cancel="toDelete = null"
      @confirm="confirmDelete"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import PageHeader from '@/components/PageHeader.vue'
import Icon from '@/components/Icon.vue'
import Modal from '@/components/Modal.vue'
import EmptyState from '@/components/EmptyState.vue'
import ConfirmDialog from '@/components/ConfirmDialog.vue'
import PostCard from '@/components/PostCard.vue'
import {
  store,
  accountById,
  isFollowing,
  toggleFollow,
  toggleLike,
  toggleSave,
  addPost,
  removePost,
  markNetworkSeen,
} from '@/store'
import type { Post, PostCategory } from '@/store/types'
import { initials } from '@/utils/format'

const categories: PostCategory[] = [
  'Certification',
  'Interview',
  'Sortie',
  'Industrie',
  'Concert',
  'Autre',
]
const filters = ['Tout', 'Suivis', ...categories]

const q = ref('')
const activeFilter = ref('Tout')

// Ouvrir le fil vaut consultation : le compteur du tableau de bord se vide.
onMounted(markNetworkSeen)

const sorted = computed(() => [...store.posts].sort((a, b) => b.date.localeCompare(a.date)))

const filtered = computed(() =>
  sorted.value.filter((p) => {
    const account = accountById(p.accountId)
    const needle = q.value.trim().toLowerCase()
    const haystack = `${p.content} ${p.tags.join(' ')} ${account?.name ?? ''} ${account?.handle ?? ''}`
    // Une recherche « #tag » ne doit correspondre qu'aux mots-clés.
    const matchQ = !needle
      ? true
      : needle.startsWith('#')
        ? p.tags.some((t) => t.toLowerCase().includes(needle.slice(1)))
        : haystack.toLowerCase().includes(needle)

    let matchF = true
    if (activeFilter.value === 'Suivis') matchF = isFollowing(p.accountId) || p.accountId === 'me'
    else if (activeFilter.value !== 'Tout') matchF = p.category === activeFilter.value

    return matchQ && matchF
  }),
)

const suggestions = computed(() =>
  store.accounts.filter((a) => a.id !== 'me' && !isFollowing(a.id)).slice(0, 5),
)

const trending = computed(() => {
  const counts = new Map<string, number>()
  store.posts.forEach((p) => p.tags.forEach((t) => counts.set(t, (counts.get(t) ?? 0) + 1)))
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, 8)
    .map(([tag, count]) => ({ tag, count }))
})

const savedPosts = computed(() => sorted.value.filter((p) => p.saved).slice(0, 4))

function excerpt(text: string): string {
  return text.length > 60 ? text.slice(0, 60).trimEnd() + '…' : text
}

function onTag(tag: string) {
  q.value = '#' + tag
  activeFilter.value = 'Tout'
}

/* Publication */
const showCompose = ref(false)
const draft = ref('')
const draftCategory = ref<PostCategory>('Autre')
const draftTags = ref('')

function closeCompose() {
  showCompose.value = false
  draft.value = ''
  draftTags.value = ''
  draftCategory.value = 'Autre'
}

function publish() {
  const tags = draftTags.value
    .split(',')
    .map((t) => t.trim().replace(/^#/, ''))
    .filter(Boolean)
  addPost(draft.value.trim(), draftCategory.value, tags)
  closeCompose()
}

/* Commentaires et suppression */
const commentTarget = ref<Post | null>(null)
function openComments(p: Post) {
  commentTarget.value = p
}

const toDelete = ref<Post | null>(null)
function askDelete(p: Post) {
  toDelete.value = p
}
function confirmDelete() {
  if (toDelete.value) removePost(toDelete.value.id)
  toDelete.value = null
}
</script>

<style scoped>
.social {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 320px;
  gap: 22px;
  align-items: start;
}
@media (max-width: 1040px) {
  .social {
    grid-template-columns: 1fr;
  }
}

.notice {
  display: flex;
  gap: 13px;
  background: var(--amber-bg);
  border: 1px solid #f8e3bb;
  border-radius: var(--radius);
  padding: 15px 17px;
  margin-bottom: 20px;
  font-size: 13.5px;
  line-height: 1.6;
  color: #7a5410;
}
.notice svg {
  width: 19px;
  height: 19px;
  flex-shrink: 0;
  margin-top: 1px;
  color: var(--amber);
}

.sugg {
  display: flex;
  align-items: center;
  gap: 11px;
}
.sugg__avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  color: #fff;
  font-weight: 700;
  font-size: 12.5px;
  flex-shrink: 0;
}
.sugg__check {
  width: 13px;
  height: 13px;
  color: var(--blue);
  flex-shrink: 0;
}

.saved-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
  text-align: left;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  background: var(--surface);
  padding: 9px 11px;
  line-height: 1.45;
}
.saved-item:hover {
  border-color: var(--violet-400);
  background: var(--violet-50);
}

.field-help {
  font-size: 12.5px;
  color: var(--text-muted);
  margin: 6px 0 0;
}
</style>
