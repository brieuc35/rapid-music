import { computed, nextTick, reactive, ref, watch } from 'vue'
import type {
  AppData,
  ArtistProfile,
  Contract,
  Concert,
  Release,
  RoyaltyEntry,
  StudioSession,
  Contact,
  Task,
  SocialAccount,
  Post,
  PostCategory,
  Opportunity,
  Plan,
} from './types'
import { seedData, starterData } from './seed'
import { Syncer, clearMirror, deleteRemote } from './sync'
import {
  abonnementDetail,
  abonnementPro,
  clearSubscription,
  readSubscription,
} from './subscription'
import { auth } from '@/firebase'
import {
  createUserWithEmailAndPassword,
  deleteUser,
  EmailAuthProvider,
  onAuthStateChanged,
  reauthenticateWithCredential,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  type User,
} from 'firebase/auth'

const STORAGE_KEY = 'rapidmusic:data:v1'
const MIGRATED_KEY = 'rapidmusic:reprise:v1'

/**
 * Vrai pour le contrat d'exemple livré aux comptes neufs des premières
 * versions, s'il n'a jamais été touché.
 *
 * Il comptait pour un contrat en attente sur le tableau de bord et dans le
 * badge du menu, alors que l'onglet Contrats est réservé à l'offre Pro : un
 * compte gratuit voyait un « 1 » qu'il ne pouvait pas ramener à zéro. Les
 * comptes neufs n'en reçoivent plus, et celui déjà enregistré est retiré.
 *
 * Tous les champs stables sont comparés, et pas seulement l'identifiant : un
 * seul d'entre eux modifié et le contrat est conservé, parce que ce n'est plus
 * notre exemple mais celui de l'artiste. Les deux dates sont écartées de la
 * comparaison — elles ont été calculées au jour de la création du compte, elles
 * ne valent donc pas la même chose d'un compte à l'autre.
 */
function exempleContratIntact(c: Contract): boolean {
  return (
    c.id === 'ex-contrat' &&
    c.title === 'Exemple — Contrat de cession' &&
    c.party === 'Nom du partenaire' &&
    c.type === 'Enregistrement' &&
    c.status === 'En attente' &&
    c.value === 0 &&
    c.royaltyRate === 50 &&
    c.notes === 'Exemple à modifier ou supprimer.'
  )
}

/**
 * Complète les données enregistrées avec les valeurs par défaut manquantes,
 * et reprend les valeurs dont le libellé a changé depuis leur enregistrement.
 *
 * Sans elle, les champs ajoutés après un enregistrement vaudraient `undefined`
 * et casseraient les formulaires.
 *
 * Exportée pour être vérifiable : toutes les données venant du serveur ou d'une
 * version antérieure passent ici, c'est donc l'endroit où une erreur se
 * traduirait par une perte silencieuse.
 */
export function withDefaults(saved: Partial<AppData>): AppData {
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
  // « Hip-hop / Rap » a été renommé « Rap / Hip-hop » : sans cette reprise, le
  // style déjà enregistré ne figurerait plus dans la liste et basculerait en
  // « Autre… » dans le formulaire de profil.
  const renamedGenres: Record<string, string> = { 'Hip-hop / Rap': 'Rap / Hip-hop' }
  const savedArtist = saved.artist ?? {}
  const genre = savedArtist.genre
  const artistGenre = genre && renamedGenres[genre] ? { genre: renamedGenres[genre] } : {}

  // « En négociation » et « En attente signature » ont fusionné en
  // « En attente » : sans cette reprise, les contrats enregistrés avant le
  // changement garderaient un statut que plus aucun filtre ne reconnaît.
  const contracts = (saved.contracts ?? base.contracts)
    .map((c) => {
      const legacy = c.status as string
      return legacy === 'En négociation' || legacy === 'En attente signature'
        ? { ...c, status: 'En attente' as const }
        : c
    })
    .filter((c) => !exempleContratIntact(c))

  return {
    ...base,
    ...saved,
    // Des données déjà enregistrées valent pour un profil fait : l'écran
    // d'accueil est arrivé après elles, et le présenter à quelqu'un qui utilise
    // l'application depuis des mois serait absurde.
    onboarded: saved.onboarded ?? true,
    contracts,
    artist: { ...base.artist, ...addedFields, ...savedArtist, ...artistGenre },
    subscription: saved.subscription ?? base.subscription,
    label: { ...base.label, ...(saved.label ?? {}) },
    // Les tâches sont arrivées après coup. Une liste vide, et non celle de la
    // démonstration : voir surgir sept tâches qu'on n'a pas écrites, au nom
    // d'une autre artiste, serait pire qu'un onglet vide — l'écran d'accueil de
    // l'onglet explique quoi en faire.
    tasks: saved.tasks ?? [],
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

/**
 * Remplace les données par celles d'un fichier de sauvegarde.
 *
 * Passe par `withDefaults`, comme tout ce qui entre dans l'application : un
 * fichier exporté il y a six mois n'a pas les champs ajoutés depuis, et sans
 * cette reprise les formulaires afficheraient des cases vides non modifiables.
 *
 * Contrairement à `apply`, l'indicateur `applying` n'est pas levé : l'import est
 * une modification voulue par l'artiste, elle doit repartir vers le serveur.
 * Sans l'attente ci-dessous, l'envoi partirait avant que l'observateur ait vu le
 * changement, et le fichier importé ne vivrait que sur cet appareil.
 *
 * Le compteur de révision n'est pas concerné : il vit dans l'enveloppe du
 * document, pas dans les données. Un import est donc une modification comme une
 * autre du point de vue de la synchronisation.
 *
 * L'abonnement fait partie des données restaurées : quelqu'un qui réinstalle sa
 * sauvegarde doit retrouver son abonnement. Ce n'est pas une preuve de paiement
 * pour autant — elle ne pourra venir que d'une vérification côté serveur.
 */
export async function importData(data: Partial<AppData>): Promise<void> {
  Object.assign(store, withDefaults(data))
  await nextTick()
  await syncer?.flush()
}

/* -------------------------------------------------------------------------- */
/*  Tâches                                                                    */
/* -------------------------------------------------------------------------- */

/** Aujourd'hui au format ISO court, la forme utilisée par les échéances. */
function today(): string {
  return new Date().toISOString().slice(0, 10)
}

/**
 * Coche ou décoche une tâche, en retenant le moment où elle a été faite.
 *
 * Décocher effface cette date : une tâche remise en cours n'a pas de date
 * d'achèvement, et la garder ferait remonter une tâche à faire dans la liste des
 * tâches faites.
 */
export function toggleTask(t: Task): void {
  upsert('tasks', { ...t, done: !t.done, doneAt: t.done ? '' : today() })
}

/**
 * Tâches à faire dont l'échéance est passée. Le jour même n'est pas en retard :
 * on a jusqu'au soir.
 */
export const overdueTasks = computed(() =>
  store.tasks.filter((t) => !t.done && t.due && t.due < today()),
)

/** Tâches restant à faire, pour le compteur du menu. */
export const openTasks = computed(() => store.tasks.filter((t) => !t.done))

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
/*  Deux choses différentes, à ne surtout pas confondre :                      */
/*                                                                            */
/*  — l'abonnement payant, lu dans abonnements/{uid}, que l'application ne     */
/*    peut pas écrire (voir store/subscription.ts et firestore.rules). C'est   */
/*    la seule source qui pourra faire foi le jour où de l'argent circulera.   */
/*                                                                            */
/*  — la démonstration, gardée dans les données de l'artiste, donc modifiable  */
/*    par lui. Elle n'est pas une faille mais une porte ouverte volontairement : */
/*    tant qu'aucun paiement n'est encaissé, elle sert à juger l'offre. Elle    */
/*    disparaîtra en supprimant `demoPro` ci-dessous, le jour de la mise en    */
/*    service du paiement — et ce jour-là, rien d'autre ne bougera.            */
/* -------------------------------------------------------------------------- */

export const PRO_PRICE = 9.99

/** Démonstration locale, décidée par le navigateur. Sans valeur probante. */
const demoPro = computed(() => store.subscription.plan === 'pro')

/**
 * Abonnement payant constaté sur le serveur.
 *
 * Réexporté depuis store/subscription.ts pour que les écrans n'aient qu'un
 * endroit à interroger, et pour distinguer partout « il a payé » de « il essaie ».
 */
export const isPaidPro = abonnementPro

/** Détail de l'abonnement payant, à afficher. Nul en démonstration. */
export const paidSubscription = abonnementDetail

/** Accès aux fonctions payantes, par l'une ou l'autre voie. */
export const isPro = computed(() => abonnementPro.value || demoPro.value)

/**
 * Nombre de contacts que la formule gratuite permet d'enregistrer.
 *
 * Défini ici, et non dans la vue, pour que l'écran d'abonnement et l'écran
 * d'accueil annoncent le même chiffre que celui réellement appliqué : une offre
 * qui promet trois contacts et en accepte cinq est un mensonge dans un sens, et
 * une déception dans l'autre.
 */
export const FREE_CONTACTS = 3

/**
 * Peut-on enregistrer un contact de plus ?
 *
 * La limite porte sur l'ajout, jamais sur ce qui existe déjà : quelqu'un qui
 * arrive avec dix contacts — anciens, importés d'une sauvegarde, ou hérités
 * d'un abonnement résilié — les garde, les consulte et les modifie. Verrouiller
 * des données déjà saisies serait les confisquer.
 *
 * C'est une limite de produit, pas une barrière de sécurité : elle vit dans le
 * navigateur et suit `isPro`, qui reste modifiable tant que le paiement n'est
 * pas vérifié côté serveur.
 */
export const canAddContact = computed(
  () => isPro.value || store.contacts.length < FREE_CONTACTS,
)

/**
 * Ouvre la démonstration. Sans effet sur l'abonnement payant, qui ne se décide
 * pas ici : c'est justement ce qui change par rapport à la version précédente.
 */
export function activatePro(): void {
  store.subscription = { plan: 'pro', since: new Date().toISOString().slice(0, 10) }
}

/**
 * Ferme la démonstration. Ne résilie rien chez un prestataire de paiement — un
 * abonnement réellement payé ne s'arrête pas depuis le navigateur, et l'écran
 * d'abonnement le dit plutôt que de faire semblant.
 */
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

/* -------------------------------------------------------------------------- */
/*  Accueil d'un nouveau compte                                               */
/* -------------------------------------------------------------------------- */

/** Vrai quand l'artiste doit encore remplir son profil avant d'entrer. */
export const needsOnboarding = computed(() => isLoggedIn.value && !store.onboarded)

/**
 * Enregistre le profil saisi à l'accueil, retient la formule choisie et ouvre
 * l'application.
 *
 * Choisir Pro ici active la même bascule que la page Abonnement : aucun
 * paiement n'est encaissé, l'écran le dit explicitement.
 */
export function completeOnboarding(
  profile: Pick<ArtistProfile, 'stageName' | 'genre' | 'city' | 'photo' | 'bio'>,
  plan: Plan,
): void {
  Object.assign(store.artist, profile)
  if (plan === 'pro') activatePro()
  store.onboarded = true
}

onAuthStateChanged(auth, async (user) => {
  if (syncer) {
    void syncer.flush()
    syncer.stop()
    syncer = null
  }
  currentUser.value = user
  readVerified(user)

  if (user) {
    syncer = new Syncer(user.uid, apply)
    const legacy = readLegacy()
    /*  Les deux lectures en parallèle : l'abonnement ne dépend pas des données
     *  et rien ne l'attend, l'enchaîner ne ferait que retarder l'ouverture.
     *  `readSubscription` ne lève jamais — un compte sans abonnement est le cas
     *  normal, et un refus de droits ne doit pas empêcher d'entrer. */
    const [data] = await Promise.all([
      // Sans données locales à reprendre, un compte neuf démarre sur un espace
      // vierge : les concerts et contrats de la démonstration appartiennent à
      // une autre artiste, ils n'ont rien à faire dans le compte de celui-ci.
      syncer.start(legacy ? withDefaults(legacy) : starterData()),
      readSubscription(user.uid),
    ])
    apply(data)
    if (legacy) markLegacyTaken(user.uid)
  } else {
    // Ne pas laisser à l'écran les données du compte qui vient de partir.
    apply({})
    // Ni le statut d'abonnement du compte précédent, qui resterait sinon en
    // mémoire jusqu'au rechargement de la page.
    clearSubscription()
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
    const cred = await createUserWithEmailAndPassword(auth, email.trim(), password)
    // L'envoi ne conditionne pas la création du compte : une panne du service de
    // messagerie ne doit pas empêcher d'entrer. Le bandeau permettra de
    // redemander le lien.
    try {
      await sendEmailVerification(cred.user)
    } catch {
      /* silencieux : l'artiste pourra relancer l'envoi depuis le bandeau */
    }
  } catch (e) {
    throw new Error(toMessage(e))
  }
}

/* -------------------------------------------------------------------------- */
/*  Vérification de l'adresse e-mail                                          */
/*                                                                            */
/*  Sans elle, une adresse saisie de travers passe inaperçue — et le jour où   */
/*  le mot de passe est oublié, le lien de réinitialisation part chez          */
/*  personne : le compte devient définitivement inaccessible.                 */
/*                                                                            */
/*  L'application reste utilisable sans vérification. Exiger la confirmation   */
/*  pour entrer enfermerait dehors quiconque n'aurait pas reçu le message.     */
/* -------------------------------------------------------------------------- */

export const emailVerified = ref(true)

function readVerified(user: User | null): void {
  // Vrai par défaut hors session : le bandeau ne concerne que les connectés.
  emailVerified.value = user ? user.emailVerified : true
}

/** Renvoie le lien de confirmation. */
export async function resendVerification(): Promise<void> {
  const user = auth.currentUser
  if (!user) throw new Error('Aucun compte connecté.')
  try {
    await sendEmailVerification(user)
  } catch (e) {
    throw new Error(toMessage(e))
  }
}

/**
 * Redemande au serveur l'état de l'adresse. Le jeton local garde la valeur
 * qu'il avait à la connexion : sans ce rafraîchissement, le bandeau resterait
 * affiché après un clic sur le lien, jusqu'à la prochaine ouverture de session.
 *
 * Renvoie trois cas distincts plutôt qu'un booléen : l'absence de session ne
 * doit pas se confondre avec une adresse confirmée, sous peine d'annoncer une
 * confirmation qui n'a pas eu lieu.
 */
export type VerificationState = 'confirmee' | 'en-attente' | 'sans-session' | 'injoignable'

export async function refreshVerification(): Promise<VerificationState> {
  const user = auth.currentUser
  if (!user) return 'sans-session'
  try {
    await user.reload()
  } catch {
    return 'injoignable'
  }
  emailVerified.value = user.emailVerified
  return user.emailVerified ? 'confirmee' : 'en-attente'
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

/**
 * Supprime définitivement le compte et tout ce qu'il contient.
 *
 * Le mot de passe est redemandé pour deux raisons : Firebase exige une
 * authentification récente avant une suppression, et cette saisie vaut
 * confirmation qu'on a bien devant soi le propriétaire du compte.
 *
 * L'ordre importe. Les données partent en premier : une fois le compte
 * supprimé, plus aucun droit d'écriture ne permettrait de les effacer et elles
 * resteraient orphelines sur le serveur — le pire résultat possible pour une
 * demande de suppression.
 */
export async function deleteAccount(password: string): Promise<void> {
  const user = auth.currentUser
  if (!user?.email) throw new Error('Aucun compte connecté.')

  try {
    await reauthenticateWithCredential(
      user,
      EmailAuthProvider.credential(user.email, password),
    )
  } catch (e) {
    throw new Error(toMessage(e))
  }

  // Plus rien ne doit être réenregistré pendant la suppression.
  syncer?.stop()
  syncer = null

  try {
    await deleteRemote(user.uid)
  } catch {
    throw new Error(
      "Vos données n'ont pas pu être supprimées. Le compte est conservé, réessayez.",
    )
  }

  clearMirror(user.uid)
  try {
    await deleteUser(user)
  } catch (e) {
    throw new Error(toMessage(e))
  }
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
  tasks: Task
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
