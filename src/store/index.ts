import { computed, reactive, ref, watch } from 'vue'
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
  Opportunity,
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
  // « En négociation » et « En attente signature » ont fusionné en
  // « En attente » : sans cette reprise, les contrats enregistrés avant le
  // changement garderaient un statut que plus aucun filtre ne reconnaît.
  const contracts = (saved.contracts ?? base.contracts).map((c) => {
    const legacy = c.status as string
    return legacy === 'En négociation' || legacy === 'En attente signature'
      ? { ...c, status: 'En attente' as const }
      : c
  })

  return {
    ...base,
    ...saved,
    contracts,
    artist: { ...base.artist, ...addedFields, ...(saved.artist ?? {}) },
    subscription: saved.subscription ?? base.subscription,
    label: { ...base.label, ...(saved.label ?? {}) },
    // Le réseau est arrivé après coup : les données déjà enregistrées reçoivent
    // le fil de démonstration plutôt qu'un onglet vide.
    // Les comptes se sont enrichis (métier, structure, compétences) : on reprend
    // ceux de la démonstration si les données enregistrées sont antérieures.
    accounts: saved.accounts?.[0]?.specialties ? saved.accounts : base.accounts,
    posts: saved.posts ?? base.posts,
    opportunities: saved.opportunities ?? base.opportunities,
    following: saved.following ?? base.following,
    networkLastSeen: saved.networkLastSeen ?? base.networkLastSeen,
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

/**
 * Publications parues depuis la dernière consultation du Réseau.
 * Celles de l'artiste sont exclues : on ne se notifie pas soi-même.
 */
export const unreadPosts = computed(() =>
  store.posts.filter((p) => p.accountId !== 'me' && p.date > store.networkLastSeen),
)

/** Marque le Réseau comme consulté : le compteur retombe à zéro. */
export function markNetworkSeen(): void {
  store.networkLastSeen = new Date().toISOString()
}

/* Annonces */

export function toggleSaveOpportunity(o: Opportunity): void {
  o.saved = !o.saved
}

export function addOpportunity(
  data: Omit<Opportunity, 'id' | 'accountId' | 'date' | 'saved'>,
): void {
  ensureOwnAccount()
  store.opportunities.unshift({
    ...data,
    id: uid(),
    accountId: 'me',
    date: new Date().toISOString(),
    saved: false,
  })
}

export function removeOpportunity(id: string): void {
  const idx = store.opportunities.findIndex((o) => o.id === id)
  if (idx >= 0) store.opportunities.splice(idx, 1)
}

export function removePost(id: string): void {
  const idx = store.posts.findIndex((p) => p.id === id)
  if (idx >= 0) store.posts.splice(idx, 1)
}

/**
 * Crée au besoin le compte représentant l'artiste, afin que ses publications et
 * ses annonces s'affichent comme celles des autres membres. Le profil reprend
 * les informations saisies dans « Mon profil ».
 */
export function ensureOwnAccount(): SocialAccount {
  const existing = accountById('me')
  if (existing) return existing

  const account: SocialAccount = {
    id: 'me',
    name: store.artist.stageName || 'Moi',
    handle: '@' + (store.artist.stageName || 'moi').toLowerCase().replace(/\s+/g, ''),
    role: 'Artiste',
    verified: false,
    color: '#8b5cf6',
    company: store.label.name,
    location: store.artist.city,
    bio: store.artist.bio,
    specialties: store.artist.genre ? [store.artist.genre] : [],
    connections: store.following.length,
  }
  store.accounts.unshift(account)
  return account
}

/** Publie au nom de l'artiste. */
export function addPost(content: string, category: PostCategory, tags: string[]): void {
  ensureOwnAccount()
  store.posts.unshift({
    id: uid(),
    accountId: 'me',
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
/*  Abonnement                                                                */
/*                                                                            */
/*  Aucun paiement n'est encaissé : sans serveur ni prestataire, l'activation  */
/*  reste une bascule locale servant à présenter l'offre. Une facturation      */
/*  réelle demanderait un back-end et un prestataire de paiement.              */
/* -------------------------------------------------------------------------- */

export const PRO_PRICE = 9.99

export const isPro = computed(() => store.subscription.plan === 'pro')

export function activatePro(): void {
  store.subscription = { plan: 'pro', since: new Date().toISOString().slice(0, 10) }
}

export function cancelPro(): void {
  store.subscription = { plan: 'free', since: '' }
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
