import { reactive, ref, watch } from 'vue'
import type {
  AppData,
  Contract,
  Concert,
  Release,
  RoyaltyEntry,
  StudioSession,
  Contact,
  SocialAccount,
  Post,
  PostCategory,
} from './types'
import { seedData } from './seed'

const STORAGE_KEY = 'rapidmusic:data:v1'
const SESSION_KEY = 'rapidmusic:session:v1'

/**
 * Complète les données enregistrées avec les valeurs par défaut manquantes.
 * Nécessaire pour les données créées avant l'ajout de nouveaux champs
 * (profil artiste enrichi, etc.) : sans cela, les champs absents seraient
 * `undefined` et casseraient les formulaires.
 */
function withDefaults(saved: Partial<AppData>): AppData {
  const base = seedData()
  // Champs de profil ajoutés après la première version : on les laisse vides
  // plutôt que de reprendre les valeurs de démonstration, qui n'auraient aucun
  // sens dans le profil d'un artiste déjà enregistré.
  const addedFields = {
    photo: '',
    bio: '',
    email: '',
    phone: '',
    instagram: '',
    spotify: '',
    website: '',
  }
  return {
    ...base,
    ...saved,
    artist: { ...base.artist, ...addedFields, ...(saved.artist ?? {}) },
    label: { ...base.label, ...(saved.label ?? {}) },
    // Le réseau est arrivé après coup : les données déjà enregistrées reçoivent
    // le fil de démonstration plutôt qu'un onglet vide.
    accounts: saved.accounts ?? base.accounts,
    posts: saved.posts ?? base.posts,
    following: saved.following ?? base.following,
  }
}

function load(): AppData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return withDefaults(JSON.parse(raw) as Partial<AppData>)
  } catch {
    /* ignore corrupted storage */
  }
  return seedData()
}

export const store = reactive<AppData>(load())

watch(
  () => store,
  (val) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(val))
    } catch {
      /* storage full or unavailable */
    }
  },
  { deep: true },
)

export function uid(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4)
}

export function resetData(): void {
  const fresh = seedData()
  Object.assign(store, fresh)
}

/* -------------------------------------------------------------------------- */
/*  Réseau                                                                    */
/* -------------------------------------------------------------------------- */

export function accountById(id: string): SocialAccount | undefined {
  return store.accounts.find((a) => a.id === id)
}

export function isFollowing(id: string): boolean {
  return store.following.includes(id)
}

export function toggleFollow(id: string): void {
  const idx = store.following.indexOf(id)
  if (idx >= 0) store.following.splice(idx, 1)
  else store.following.push(id)
}

export function toggleLike(post: Post): void {
  post.liked = !post.liked
  post.likes += post.liked ? 1 : -1
}

export function toggleSave(post: Post): void {
  post.saved = !post.saved
}

export function removePost(id: string): void {
  const idx = store.posts.findIndex((p) => p.id === id)
  if (idx >= 0) store.posts.splice(idx, 1)
}

/**
 * Publie au nom de l'artiste. Un compte le représentant est créé au premier
 * message, afin que ses publications s'affichent comme celles des autres.
 */
export function addPost(content: string, category: PostCategory, tags: string[]): void {
  const me = 'me'
  if (!accountById(me)) {
    store.accounts.unshift({
      id: me,
      name: store.artist.stageName || 'Moi',
      handle: '@' + (store.artist.stageName || 'moi').toLowerCase().replace(/\s+/g, ''),
      role: 'Artiste',
      verified: false,
      color: '#8b5cf6',
    })
  }
  store.posts.unshift({
    id: uid(),
    accountId: me,
    category,
    content,
    date: new Date().toISOString(),
    likes: 0,
    comments: 0,
    liked: false,
    saved: false,
    tags,
  })
}

/* -------------------------------------------------------------------------- */
/*  Session locale                                                            */
/*                                                                            */
/*  L'application n'a pas de serveur ni d'authentification : la « session »    */
/*  est un simple indicateur local qui permet de verrouiller l'interface.      */
/*  Les données de l'artiste restent enregistrées après déconnexion.           */
/* -------------------------------------------------------------------------- */

function loadSession(): boolean {
  try {
    // Par défaut connecté, pour ne pas verrouiller les utilisateurs existants.
    return localStorage.getItem(SESSION_KEY) !== 'out'
  } catch {
    return true
  }
}

export const isLoggedIn = ref<boolean>(loadSession())

watch(isLoggedIn, (v) => {
  try {
    localStorage.setItem(SESSION_KEY, v ? 'in' : 'out')
  } catch {
    /* storage unavailable */
  }
})

export function logout(): void {
  isLoggedIn.value = false
}

export function login(): void {
  isLoggedIn.value = true
}

/* -------------------------------------------------------------------------- */
/*  Generic CRUD helpers                                                      */
/* -------------------------------------------------------------------------- */

type Collections = {
  contracts: Contract
  concerts: Concert
  releases: Release
  royalties: RoyaltyEntry
  studio: StudioSession
  contacts: Contact
}

export function upsert<K extends keyof Collections>(key: K, item: Collections[K]): void {
  const list = store[key] as unknown as { id: string }[]
  const idx = list.findIndex((x) => x.id === (item as { id: string }).id)
  if (idx >= 0) list.splice(idx, 1, item as never)
  else list.unshift(item as never)
}

export function remove<K extends keyof Collections>(key: K, id: string): void {
  const list = store[key] as unknown as { id: string }[]
  const idx = list.findIndex((x) => x.id === id)
  if (idx >= 0) list.splice(idx, 1)
}
