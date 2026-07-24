/**
 * Couche d'accès aux données (simulée).
 *
 * Elle imite le contrat de l'API réelle décrite au §8 du plan : réponses
 * paginées par curseur et latence réseau. Pour brancher le vrai back-end,
 * il suffit de remplacer le corps de ces fonctions par des appels HTTP
 * (fetch / axios) en conservant les mêmes signatures.
 */
import {
  AppNotification,
  Article,
  ArticleFilter,
  Clip,
  Comment,
  CommentTargetType,
  CreatePostInput,
  Page,
  Post,
  Source,
  User,
} from '@/models';
import {
  articles,
  clips,
  currentUser,
  notifications,
  posts,
  seedComments,
  sources,
  users,
} from './mockData';

const PAGE_SIZE = 3;

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Découpe une collection déjà filtrée en une page « curseur ». */
function paginate<T>(all: T[], cursor: string | null): Page<T> {
  const start = cursor ? Number(cursor) : 0;
  const slice = all.slice(start, start + PAGE_SIZE);
  const next = start + PAGE_SIZE;
  return {
    items: slice,
    nextCursor: next < all.length ? String(next) : null,
  };
}

/** GET /api/v1/feed */
export async function fetchFeed(cursor: string | null = null): Promise<Page<Post>> {
  await delay(300);
  return paginate(posts, cursor);
}

/** GET /api/v1/clips */
export async function fetchClips(cursor: string | null = null): Promise<Page<Clip>> {
  await delay(300);
  return paginate(clips, cursor);
}

/** GET /api/v1/articles?q=&genre=&source=&from=&to= */
export async function searchArticles(
  filter: ArticleFilter = {},
  cursor: string | null = null,
): Promise<Page<Article>> {
  await delay(250);
  const q = filter.query?.trim().toLowerCase();
  const filtered = articles.filter((a) => {
    if (q) {
      const haystack = `${a.title} ${a.summary} ${a.artistName ?? ''} ${a.tags.join(' ')}`.toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    if (filter.genre && a.genre !== filter.genre) return false;
    if (filter.sourceId && a.source.id !== filter.sourceId) return false;
    if (filter.from && a.publishedAt < filter.from) return false;
    if (filter.to && a.publishedAt > filter.to) return false;
    return true;
  });
  // Tri anté-chronologique (plus récent en premier).
  filtered.sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
  return paginate(filtered, cursor);
}

/** GET /api/v1/sources */
export async function getSources(): Promise<Source[]> {
  await delay(100);
  return sources;
}

/** GET /api/v1/users/:handle — profil public par identifiant. */
export async function getUserByHandle(handle: string): Promise<User | null> {
  await delay(150);
  return [currentUser, ...users].find((u) => u.handle === handle) ?? null;
}

/** GET /api/v1/creators/:id/clips — clips publiés par un créateur. */
export async function fetchCreatorClips(creatorId: string): Promise<Clip[]> {
  await delay(200);
  return clips.filter((c) => c.creator.id === creatorId);
}

/** GET /api/v1/users/:id/posts — publications d'un utilisateur. */
export async function fetchUserPosts(userId: string): Promise<Post[]> {
  await delay(200);
  return posts.filter((p) => p.author.id === userId);
}

/** GET /api/v1/notifications — notifications in-app de l'utilisateur courant. */
export async function fetchNotifications(): Promise<AppNotification[]> {
  await delay(200);
  return [...notifications];
}

/** Nombre de notifications non lues (pour la pastille). */
export async function fetchUnreadCount(): Promise<number> {
  await delay(80);
  return notifications.filter((n) => !n.read).length;
}

/** POST /api/v1/notifications/read — marque tout comme lu. */
export async function markNotificationsRead(): Promise<void> {
  await delay(120);
  notifications.forEach((n) => { n.read = true; });
}

// Magasin de commentaires en mémoire (copie des données seed pour rester
// mutable sans altérer la source). Clé : « type:id » de la cible.
const commentStore = new Map<string, Comment[]>(
  Object.entries(seedComments).map(([key, list]) => [key, [...list]]),
);

function commentKey(type: CommentTargetType, id: string): string {
  return `${type}:${id}`;
}

/** GET /api/v1/:type/:id/comments — commentaires d'un post ou d'un clip. */
export async function fetchComments(type: CommentTargetType, id: string): Promise<Comment[]> {
  await delay(200);
  // Copie : ne pas exposer la référence interne du magasin (comme une vraie API).
  return [...(commentStore.get(commentKey(type, id)) ?? [])];
}

let commentSeq = 0;

/** POST /api/v1/:type/:id/comments — ajoute un commentaire au nom de l'utilisateur courant. */
export async function addComment(
  type: CommentTargetType,
  id: string,
  body: string,
): Promise<Comment> {
  await delay(200);
  const comment: Comment = {
    id: `cm-new-${Date.now()}-${commentSeq++}`,
    author: currentUser,
    body: body.trim(),
    createdAt: new Date().toISOString(),
    likeCount: 0,
    likedByMe: false,
  };
  const key = commentKey(type, id);
  const list = commentStore.get(key) ?? [];
  list.push(comment);
  commentStore.set(key, list);
  return comment;
}

let repostSeq = 0;

/**
 * POST /api/v1/posts/:id/repost — republie un post dans le fil de l'utilisateur.
 * Le nouveau post référence l'original via repostedFrom (compteurs propres à zéro).
 */
export async function repostPost(original: Post): Promise<Post> {
  await delay(250);
  // On republie l'original lui-même (pas un repost de repost).
  const source = original.repostedFrom ?? original;
  return {
    id: `p-repost-${Date.now()}-${repostSeq++}`,
    author: currentUser,
    body: '',
    media: [],
    tags: [],
    visibility: 'public',
    createdAt: new Date().toISOString(),
    likeCount: 0,
    commentCount: 0,
    shareCount: 0,
    likedByMe: false,
    repostedFrom: source,
  };
}

let postSeq = 0;

/**
 * POST /api/v1/posts — crée une publication au nom de l'utilisateur courant.
 * Renvoie le post créé (compteurs à zéro, horodaté maintenant). L'UI l'ajoute
 * en tête du fil ; le vrai back-end le persisterait et gérerait le fan-out.
 */
export async function createPost(input: CreatePostInput): Promise<Post> {
  await delay(400);
  return {
    id: `p-new-${Date.now()}-${postSeq++}`,
    author: currentUser,
    body: input.body.trim(),
    media: input.media,
    tags: input.tags,
    visibility: input.visibility,
    createdAt: new Date().toISOString(),
    likeCount: 0,
    commentCount: 0,
    shareCount: 0,
    likedByMe: false,
  };
}
