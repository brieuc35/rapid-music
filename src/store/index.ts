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
import { Syncer, clearMirror } from './sync'
import { auth } from '@/firebase'
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  type User,
} from 'firebase/auth'

const STORAGE_KEY = 'rapidmusic:data:v1'
const MIGRATED_KEY = 'rapidmusic:reprise:v1'

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

/**
 * Données laissées par les versions sans compte, quand tout vivait dans le
 * navigateur. Elles servent à garnir un compte tout neuf : personne ne doit
 * perdre ses contrats en créant son identifiant. Le fichier d'origine n'est
 * jamais supprimé — on note seulement qu'il a déjà été repris, pour ne pas
 * réinjecter les mêmes données dans un second compte.
 */
function readLegacy(): Partial<AppData> | null {
  try {
    if (localStorage.getItem(MIGRATED_KEY)) return null
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as Partial<AppData>) : null
  } catch {
    return null
  }
}

function markLegacyTaken(uid: string): void {
  try {
    localStorage.setItem(MIGRATED_KEY, uid)
  } catch {
    /* sans importance : au pire les données locales seront reprises deux fois */
  }
}

export const store = reactive<AppData>(seedData())

/*  Vrai le temps de recopier des données venues d'ailleurs (premier
 *  chargement, reprise d'une révision distante). La première notification du
 *  observateur est alors ignorée, sans quoi on renverrait aussitôt au serveur
 *  ce qu'on vient d'en recevoir. */
let applying = false
let syncer: Syncer | null = null

function apply(data: Partial<AppData>): void {
  applying = true
  Object.assign(store, withDefaults(data))
}

watch(
  () => store,
  (val) => {
    if (applying) {
      applying = false
      return
    }
    syncer?.schedule(val)
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
/*  Aucun paiement n'est encaissé : faute de prestataire, l'activation reste   */
/*  une bascule décidée par le navigateur, servant à présenter l'offre. Une    */
/*  facturation réelle demanderait Stripe, et surtout une écriture côté        */
/*  serveur — c'est précisément ce qu'un client ne doit pas pouvoir décider.    */
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
/*  Compte et session                                                         */
/*                                                                            */
/*  L'authentification est celle de Firebase : le mot de passe n'est ni stocké */
/*  ni vu par l'application. La session survit à la fermeture du navigateur,   */
/*  et c'est elle qui détermine quelles données sont chargées.                 */
/* -------------------------------------------------------------------------- */

export const currentUser = ref<User | null>(null)

/*  Faux jusqu'à ce que Firebase ait fini de rétablir la session enregistrée.
 *  Sans cette attente, l'écran de connexion s'afficherait une fraction de
 *  seconde à chaque ouverture, alors que l'artiste est déjà connecté. */
export const authReady = ref(false)

export const isLoggedIn = computed(() => currentUser.value !== null)

onAuthStateChanged(auth, async (user) => {
  if (syncer) {
    void syncer.flush()
    syncer.stop()
    syncer = null
  }
  currentUser.value = user

  if (user) {
    syncer = new Syncer(user.uid, apply)
    const legacy = readLegacy()
    const data = await syncer.start(withDefaults(legacy ?? {}))
    apply(data)
    if (legacy) markLegacyTaken(user.uid)
  } else {
    // Ne pas laisser à l'écran les données du compte qui vient de partir.
    apply({})
  }

  authReady.value = true
})

/*  Fermeture de l'onglet : la copie locale est déjà à jour, on tente en plus
 *  l'envoi immédiat de ce qui attendait encore. */
window.addEventListener('beforeunload', () => {
  void syncer?.flush()
})

/*  Retour de la connexion : on renvoie ce qui n'avait pas pu partir. */
window.addEventListener('online', () => {
  void syncer?.flush()
})

/** Messages en clair : les codes de Firebase ne sont pas montrables. */
function authMessage(code: string): string {
  switch (code) {
    case 'auth/invalid-email':
      return "Cette adresse e-mail n'est pas valide."
    case 'auth/missing-password':
      return 'Saisissez votre mot de passe.'
    case 'auth/weak-password':
      return 'Le mot de passe doit compter au moins 6 caractères.'
    case 'auth/email-already-in-use':
      return 'Un compte existe déjà avec cette adresse. Connectez-vous.'
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'Adresse e-mail ou mot de passe incorrect.'
    case 'auth/too-many-requests':
      return 'Trop de tentatives. Patientez quelques minutes.'
    case 'auth/network-request-failed':
      return 'Connexion impossible. Vérifiez votre accès à internet.'
    case 'auth/operation-not-allowed':
      return "La connexion par e-mail n'est pas activée sur le projet Firebase."
    default:
      return "La connexion a échoué. Réessayez dans un instant."
  }
}

function toMessage(e: unknown): string {
  const code = (e as { code?: string })?.code ?? ''
  return authMessage(code)
}

export async function signUp(email: string, password: string): Promise<void> {
  try {
    await createUserWithEmailAndPassword(auth, email.trim(), password)
  } catch (e) {
    throw new Error(toMessage(e))
  }
}

export async function login(email: string, password: string): Promise<void> {
  try {
    await signInWithEmailAndPassword(auth, email.trim(), password)
  } catch (e) {
    throw new Error(toMessage(e))
  }
}

export async function resetPassword(email: string): Promise<void> {
  try {
    await sendPasswordResetEmail(auth, email.trim())
  } catch (e) {
    throw new Error(toMessage(e))
  }
}

export async function logout(): Promise<void> {
  // Ce qui attendait encore doit partir avant de fermer la session, sinon la
  // transaction se ferait sans droits d'écriture.
  await syncer?.flush()
  const uid = currentUser.value?.uid
  await signOut(auth)
  // La copie locale n'a plus de raison d'être : elle ne servirait qu'à laisser
  // les données d'un compte sur un appareil dont on vient de se déconnecter.
  if (uid) clearMirror(uid)
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
