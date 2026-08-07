<template>
  <div class="page">
    <PageHeader title="Réseau" subtitle="Le réseau professionnel de l'univers musical.">
      <template #actions>
        <button v-if="tab === 'annonces' && isPro" class="btn btn--primary" @click="showOppForm = true">
          <Icon name="plus" /> Publier une annonce
        </button>
        <button v-else class="btn btn--primary" @click="showCompose = true">
          <Icon name="plus" /> Publier
        </button>
      </template>
    </PageHeader>

    <!-- Sous-navigation -->
    <div class="tabs">
      <button
        v-for="t in tabs"
        :key="t.id"
        class="tabs__item"
        :class="{ 'tabs__item--active': tab === t.id }"
        @click="tab = t.id"
      >
        <Icon :name="t.icon" />
        {{ t.label }}
        <span class="tabs__count">{{ t.count }}</span>
      </button>
    </div>

    <div class="notice">
      <Icon name="bell" />
      <div>
        <b>Ce réseau est local à votre appareil.</b>
        RapidMusic fonctionne sans serveur : les profils, publications et annonces sont un
        contenu de démonstration, et ce que vous publiez n'est visible que par vous.
        Relier réellement les musiciens entre eux demanderait un serveur.
      </div>
    </div>

    <!-- ================= FIL ================= -->
    <div v-if="tab === 'fil'" class="social">
      <div>
        <div class="toolbar">
          <div class="search">
            <Icon name="search" />
            <input v-model="q" placeholder="Rechercher une publication, un membre…" />
          </div>
        </div>

        <div class="vstack" style="gap: 14px">
          <PostCard
            v-for="p in filteredPosts"
            :key="p.id"
            :post="p"
            :account="accountById(p.accountId)"
            :following="isFollowing(p.accountId)"
            :mine="p.accountId === 'me'"
            @like="toggleLike"
            @save="toggleSave"
            @comment="openComments"
            @delete="askDeletePost"
            @follow="toggleFollow"
            @tag="onTag"
          />
          <EmptyState
            v-if="!filteredPosts.length"
            icon="globe"
            title="Aucune publication"
            text="Aucun résultat pour cette recherche."
          />
        </div>
      </div>

      <aside class="vstack" style="gap: 18px">
        <div class="card card--pad">
          <div class="section-head"><span class="section-head__title">Membres à connaître</span></div>
          <div class="vstack" style="gap: 11px">
            <div v-for="a in suggestions" :key="a.id" class="sugg">
              <button class="sugg__avatar" :style="{ background: a.color }" @click="profileTarget = a">
                {{ initials(a.name) }}
              </button>
              <div class="row__main">
                <div class="hstack" style="gap: 4px">
                  <b style="font-size: 13.5px">{{ a.name }}</b>
                  <Icon v-if="a.verified" name="verified" class="sugg__check" />
                </div>
                <div class="muted" style="font-size: 12px">{{ a.role }}</div>
              </div>
              <button class="btn btn--ghost btn--sm" @click="toggleFollow(a.id)">
                <Icon name="plus" /> Relier
              </button>
            </div>
            <p v-if="!suggestions.length" class="muted" style="font-size: 13px">
              Vous êtes en relation avec tous les membres.
            </p>
          </div>
        </div>

        <div class="card card--pad">
          <div class="section-head"><span class="section-head__title">Sujets du moment</span></div>
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
          <div class="section-head"><span class="section-head__title">Enregistrés</span></div>
          <div class="vstack" style="gap: 10px">
            <button
              v-for="p in savedPosts"
              :key="p.id"
              class="saved-item"
              @click="q = p.content.slice(0, 24)"
            >
              <b style="font-size: 12.5px">{{ accountById(p.accountId)?.name }}</b>
              <span class="muted" style="font-size: 12.5px">{{ excerpt(p.content, 60) }}</span>
            </button>
            <p v-if="!savedPosts.length" class="muted" style="font-size: 13px">
              Aucune publication mise de côté.
            </p>
          </div>
        </div>
      </aside>
    </div>

    <!-- ================= RELATIONS ================= -->
    <div v-else-if="tab === 'relations'">
      <div class="toolbar">
        <div class="search">
          <Icon name="search" />
          <input v-model="relQ" placeholder="Rechercher un nom, un métier, une compétence…" />
        </div>
        <span class="muted" style="font-size: 13px">
          {{ myConnections }} relation(s) sur {{ store.accounts.length }} membres
        </span>
      </div>

      <div class="chips" style="margin-bottom: 18px">
        <button
          v-for="r in roleFilters"
          :key="r"
          class="chip"
          :class="{ 'chip--active': relRole === r }"
          @click="relRole = r"
        >
          {{ r }}
        </button>
      </div>

      <div v-if="filteredAccounts.length" class="grid grid--cards">
        <AccountCard
          v-for="a in filteredAccounts"
          :key="a.id"
          :account="a"
          :connected="isFollowing(a.id)"
          :mine="a.id === 'me'"
          @connect="toggleFollow"
          @open="profileTarget = $event"
        />
      </div>
      <EmptyState
        v-else
        icon="users"
        title="Aucun membre"
        text="Aucun profil ne correspond à cette recherche."
      />
    </div>

    <!-- ================= ANNONCES ================= -->
    <ProGate
      v-else
      title="Les opportunités du milieu, au même endroit"
      lead="Premières parties, sessions studio, créneaux de mixage, programmations : les annonces réservées aux abonnés Pro."
      :features="[
        'Toutes les annonces du réseau, filtrables par nature et par métier',
        'Profil recherché, lieu et date limite pour chaque offre',
        'Mise de côté des annonces qui vous intéressent',
        'Publication de vos propres recherches de collaborateurs',
      ]"
    >
      <div class="toolbar">
        <div class="search">
          <Icon name="search" />
          <input v-model="oppQ" placeholder="Rechercher une annonce…" />
        </div>
      </div>

      <div class="chips" style="margin-bottom: 18px">
        <button
          v-for="k in kindFilters"
          :key="k"
          class="chip"
          :class="{ 'chip--active': oppKind === k }"
          @click="oppKind = k"
        >
          {{ k }}
        </button>
      </div>

      <div v-if="filteredOpportunities.length" class="vstack" style="gap: 14px">
        <OpportunityCard
          v-for="o in filteredOpportunities"
          :key="o.id"
          :opportunity="o"
          :account="accountById(o.accountId)"
          :mine="o.accountId === 'me'"
          @save="toggleSaveOpportunity"
          @delete="askDeleteOpp"
          @contact="contactTarget = $event"
        />
      </div>
      <EmptyState
        v-else
        icon="ticket"
        title="Aucune annonce"
        text="Aucune annonce ne correspond à cette recherche."
      >
        <button class="btn btn--primary" @click="showOppForm = true">
          <Icon name="plus" /> Publier une annonce
        </button>
      </EmptyState>
    </ProGate>

    <!-- Profil d'un membre -->
    <ProfileCard
      :account="profileTarget"
      :connected="profileTarget ? isFollowing(profileTarget.id) : false"
      :mine="profileTarget?.id === 'me'"
      @close="profileTarget = null"
      @connect="toggleFollow"
    />

    <!-- Publier dans le fil -->
    <Modal :open="showCompose" title="Publier sur le réseau" @close="closeCompose">
      <div class="field">
        <label>Votre message</label>
        <textarea v-model="draft" rows="5" placeholder="Une annonce, une actualité, une recherche…" />
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
        <button class="btn btn--primary" :disabled="!draft.trim() || draft.length > 500" @click="publish">
          <Icon name="check" /> Publier
        </button>
      </template>
    </Modal>

    <!-- Publier une annonce -->
    <Modal :open="showOppForm" title="Publier une annonce" @close="closeOppForm">
      <div class="field">
        <label>Intitulé</label>
        <input v-model="oppDraft.title" placeholder="Ex : Recherche bassiste pour session studio" />
      </div>
      <div class="field--row">
        <div class="field">
          <label>Profil recherché</label>
          <input v-model="oppDraft.role" list="oppRoles" placeholder="Ex : Musicien" />
          <datalist id="oppRoles">
            <option v-for="r in knownRoles" :key="r" :value="r" />
          </datalist>
        </div>
        <div class="field">
          <label>Nature</label>
          <select v-model="oppDraft.kind">
            <option v-for="k in kinds" :key="k">{{ k }}</option>
          </select>
        </div>
      </div>
      <div class="field--row">
        <div class="field">
          <label>Lieu</label>
          <input v-model="oppDraft.location" placeholder="Ex : Paris, ou à distance" />
        </div>
        <div class="field">
          <label>Date limite</label>
          <input v-model="oppDraft.deadline" type="date" />
        </div>
      </div>
      <div class="field">
        <label>Description</label>
        <textarea v-model="oppDraft.description" rows="4" placeholder="Conditions, dates, attentes…" />
      </div>
      <template #footer>
        <button class="btn btn--subtle" @click="closeOppForm">Annuler</button>
        <button
          class="btn btn--primary"
          :disabled="!oppDraft.title.trim() || !oppDraft.role.trim()"
          @click="publishOpportunity"
        >
          <Icon name="check" /> Publier
        </button>
      </template>
    </Modal>

    <!-- Répondre : la messagerie exige un serveur -->
    <Modal :open="!!contactTarget" title="Répondre à cette annonce" @close="contactTarget = null">
      <p style="margin: 0 0 12px; color: var(--text-soft); line-height: 1.6">
        La messagerie suppose des échanges entre plusieurs personnes, ce qu'un réseau local
        ne permet pas : il faudrait un serveur pour relier les comptes.
      </p>
      <p style="margin: 0; color: var(--text-soft); line-height: 1.6">
        Dans un réseau réel, votre réponse partirait vers
        <b style="color: var(--text)">
          {{ accountById(contactTarget?.accountId ?? '')?.name }}
          ({{ accountById(contactTarget?.accountId ?? '')?.handle }})
        </b>.
        En attendant, ce contact peut être noté dans l'onglet <b style="color: var(--text)">Contacts</b>.
      </p>
      <template #footer>
        <button class="btn btn--primary" @click="contactTarget = null">Fermer</button>
      </template>
    </Modal>

    <!-- Commentaires : ils exigent aussi un serveur -->
    <Modal :open="!!commentTarget" title="Commentaires" @close="commentTarget = null">
      <p style="margin: 0; color: var(--text-soft); line-height: 1.6">
        Les commentaires supposent des échanges entre plusieurs personnes, ce qu'un réseau
        local ne permet pas : il faudrait un serveur pour relier les comptes.
        Cette publication en affiche
        <b style="color: var(--text)">{{ commentTarget?.comments }}</b> dans le contenu de
        démonstration.
      </p>
      <template #footer>
        <button class="btn btn--primary" @click="commentTarget = null">Fermer</button>
      </template>
    </Modal>

    <ConfirmDialog
      :open="!!toDeletePost"
      :label="toDeletePost ? excerpt(toDeletePost.content, 60) : ''"
      @cancel="toDeletePost = null"
      @confirm="confirmDeletePost"
    />
    <ConfirmDialog
      :open="!!toDeleteOpp"
      :label="toDeleteOpp?.title"
      @cancel="toDeleteOpp = null"
      @confirm="confirmDeleteOpp"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive, onMounted } from 'vue'
import PageHeader from '@/components/PageHeader.vue'
import Icon from '@/components/Icon.vue'
import Modal from '@/components/Modal.vue'
import EmptyState from '@/components/EmptyState.vue'
import ConfirmDialog from '@/components/ConfirmDialog.vue'
import PostCard from '@/components/PostCard.vue'
import ProGate from '@/components/ProGate.vue'
import AccountCard from '@/components/AccountCard.vue'
import OpportunityCard from '@/components/OpportunityCard.vue'
import ProfileCard from '@/components/ProfileCard.vue'
import {
  store,
  isPro,
  accountById,
  isFollowing,
  toggleFollow,
  toggleLike,
  toggleSave,
  addPost,
  removePost,
  markNetworkSeen,
  toggleSaveOpportunity,
  addOpportunity,
  removeOpportunity,
} from '@/store'
import type { Post, PostCategory, Opportunity, OpportunityKind, SocialAccount } from '@/store/types'
import { initials } from '@/utils/format'

type Tab = 'fil' | 'relations' | 'annonces'
const tab = ref<Tab>('fil')

const myConnections = computed(() => store.following.length)

const tabs = computed(() => [
  { id: 'fil' as Tab, label: 'Fil', icon: 'globe', count: store.posts.length },
  { id: 'relations' as Tab, label: 'Relations', icon: 'users', count: store.accounts.length },
  { id: 'annonces' as Tab, label: 'Annonces', icon: 'ticket', count: store.opportunities.length },
])

// Ouvrir le réseau vaut consultation : le compteur du tableau de bord se vide.
onMounted(markNetworkSeen)

function excerpt(text: string, max: number): string {
  return text.length > max ? text.slice(0, max).trimEnd() + '…' : text
}

/* ------------------------------- Fil ------------------------------- */
const categories: PostCategory[] = [
  'Certification',
  'Interview',
  'Sortie',
  'Industrie',
  'Concert',
  'Autre',
]
const q = ref('')

const sortedPosts = computed(() => [...store.posts].sort((a, b) => b.date.localeCompare(a.date)))

const filteredPosts = computed(() =>
  sortedPosts.value.filter((p) => {
    const account = accountById(p.accountId)
    const needle = q.value.trim().toLowerCase()
    const haystack = `${p.content} ${p.tags.join(' ')} ${account?.name ?? ''} ${account?.handle ?? ''}`
    // Une recherche « #tag » ne doit correspondre qu'aux mots-clés.
    if (!needle) return true
    return needle.startsWith('#')
      ? p.tags.some((t) => t.toLowerCase().includes(needle.slice(1)))
      : haystack.toLowerCase().includes(needle)
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

const savedPosts = computed(() => sortedPosts.value.filter((p) => p.saved).slice(0, 4))

function onTag(tag: string) {
  tab.value = 'fil'
  q.value = '#' + tag
}

/* ---------------------------- Relations ---------------------------- */
const relQ = ref('')
const relRole = ref('Tous')

const knownRoles = computed(() =>
  [...new Set(store.accounts.map((a) => a.role))].filter(Boolean).sort((a, b) => a.localeCompare(b)),
)
const roleFilters = computed(() => ['Tous', 'Mes relations', ...knownRoles.value])

const filteredAccounts = computed(() =>
  store.accounts
    .filter((a) => {
      const needle = relQ.value.trim().toLowerCase()
      const haystack = `${a.name} ${a.role} ${a.company} ${a.location} ${a.specialties.join(' ')}`
      const matchQ = !needle || haystack.toLowerCase().includes(needle)

      let matchR = true
      if (relRole.value === 'Mes relations') matchR = isFollowing(a.id)
      else if (relRole.value !== 'Tous') matchR = a.role === relRole.value

      return matchQ && matchR
    })
    .sort((a, b) => a.name.localeCompare(b.name)),
)

const profileTarget = ref<SocialAccount | null>(null)

/* ---------------------------- Annonces ----------------------------- */
const kinds: OpportunityKind[] = ['Rémunéré', 'Collaboration', 'Bénévole']
const kindFilters = ['Toutes', 'Enregistrées', ...kinds]
const oppQ = ref('')
const oppKind = ref('Toutes')

const filteredOpportunities = computed(() =>
  [...store.opportunities]
    .sort((a, b) => b.date.localeCompare(a.date))
    .filter((o) => {
      const needle = oppQ.value.trim().toLowerCase()
      const account = accountById(o.accountId)
      const haystack = `${o.title} ${o.role} ${o.location} ${o.description} ${account?.name ?? ''}`
      const matchQ = !needle || haystack.toLowerCase().includes(needle)

      let matchK = true
      if (oppKind.value === 'Enregistrées') matchK = o.saved
      else if (oppKind.value !== 'Toutes') matchK = o.kind === oppKind.value

      return matchQ && matchK
    }),
)

const showOppForm = ref(false)
const emptyOpp = () => ({
  title: '',
  role: '',
  kind: 'Rémunéré' as OpportunityKind,
  location: '',
  description: '',
  deadline: '',
})
const oppDraft = reactive(emptyOpp())

function closeOppForm() {
  Object.assign(oppDraft, emptyOpp())
  showOppForm.value = false
}
function publishOpportunity() {
  addOpportunity({ ...oppDraft })
  closeOppForm()
}

const contactTarget = ref<Opportunity | null>(null)

/* --------------------------- Publication --------------------------- */
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

/* ------------------------- Commentaires ---------------------------- */
const commentTarget = ref<Post | null>(null)
function openComments(p: Post) {
  commentTarget.value = p
}

/* -------------------------- Suppressions --------------------------- */
const toDeletePost = ref<Post | null>(null)
function askDeletePost(p: Post) {
  toDeletePost.value = p
}
function confirmDeletePost() {
  if (toDeletePost.value) removePost(toDeletePost.value.id)
  toDeletePost.value = null
}

const toDeleteOpp = ref<Opportunity | null>(null)
function askDeleteOpp(o: Opportunity) {
  toDeleteOpp.value = o
}
function confirmDeleteOpp() {
  if (toDeleteOpp.value) removeOpportunity(toDeleteOpp.value.id)
  toDeleteOpp.value = null
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

/* Sous-navigation */
.tabs {
  display: flex;
  gap: 6px;
  margin-bottom: 18px;
  border-bottom: 1px solid var(--border);
  overflow-x: auto;
}
.tabs__item {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  border: none;
  background: transparent;
  color: var(--text-soft);
  font-size: 14.5px;
  font-weight: 600;
  padding: 10px 14px 12px;
  border-bottom: 2px solid transparent;
  margin-bottom: -1px;
  white-space: nowrap;
}
.tabs__item svg {
  width: 17px;
  height: 17px;
}
.tabs__item:hover {
  color: var(--text);
}
.tabs__item--active {
  color: var(--violet-700);
  border-bottom-color: var(--violet-600);
}
.tabs__count {
  background: var(--surface-2);
  border: 1px solid var(--border);
  color: var(--text-muted);
  font-size: 11.5px;
  font-weight: 700;
  border-radius: 20px;
  padding: 1px 8px;
}
.tabs__item--active .tabs__count {
  background: var(--violet-100);
  border-color: var(--violet-200);
  color: var(--violet-700);
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
  border: none;
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
