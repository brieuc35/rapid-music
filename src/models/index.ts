/**
 * Modèles de domaine RapidMusic.
 *
 * Ces interfaces reflètent le schéma logique décrit dans docs/plan-produit.md (§3).
 * Elles servent de contrat partagé entre la couche de données (services) et l'UI.
 */

export type UserRole = 'fan' | 'creator' | 'media' | 'moderator' | 'admin';

export type MusicGenre =
  | 'pop'
  | 'rap'
  | 'rock'
  | 'electro'
  | 'jazz'
  | 'rnb'
  | 'metal'
  | 'classique'
  | 'reggae'
  | 'kpop';

export interface User {
  id: string;
  handle: string;            // @nom_utilisateur
  displayName: string;
  avatarUrl?: string;
  bio?: string;
  role: UserRole;
  favoriteGenres: MusicGenre[];
  isVerified: boolean;
  followerCount: number;
  followingCount: number;
}

export interface MediaAttachment {
  type: 'image' | 'link';
  url: string;
  title?: string;
}

export type PostVisibility = 'public' | 'followers';

/** Publication du fil principal (style LinkedIn). */
export interface Post {
  id: string;
  author: User;
  body: string;
  media: MediaAttachment[];
  tags: string[];            // slugs de genres / hashtags
  visibility: PostVisibility;
  createdAt: string;         // ISO 8601
  likeCount: number;
  commentCount: number;
  shareCount: number;
  likedByMe: boolean;
  repostedFrom?: Post;       // partage / repost
}

/** Charge utile de POST /api/v1/posts (§8.4). */
export interface CreatePostInput {
  body: string;
  tags: string[];
  media: MediaAttachment[];
  visibility: PostVisibility;
}

export type VideoStatus = 'processing' | 'ready' | 'failed';

/** Clip vidéo vertical (style TikTok). */
export interface Clip {
  id: string;
  creator: User;
  caption?: string;
  hlsUrl: string;            // manifeste HLS (ou mp4 de secours en dev)
  posterUrl: string;
  durationMs: number;
  status: VideoStatus;
  audioTitle?: string;       // son associé
  tags: string[];
  createdAt: string;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  shareCount: number;
  likedByMe: boolean;
}

export type SourceTrust = 'high' | 'medium' | 'low';

export interface Source {
  id: string;
  name: string;
  domain: string;
  logoUrl?: string;
  trustLevel: SourceTrust;
}

/** Article d'actualité musicale (onglet News). */
export interface Article {
  id: string;
  title: string;
  summary: string;
  imageUrl?: string;
  externalUrl: string;
  source: Source;
  authorName?: string;
  genre?: MusicGenre;
  artistName?: string;
  tags: string[];
  publishedAt: string;
}

export type CommentTargetType = 'post' | 'clip';

export interface Comment {
  id: string;
  author: User;
  body: string;
  createdAt: string;
  likeCount: number;
}

/** Enveloppe de pagination par curseur (voir §8.1 du plan). */
export interface Page<T> {
  items: T[];
  nextCursor: string | null;
}

/** Filtres de recherche pour l'onglet News (§2.4). */
export interface ArticleFilter {
  query?: string;
  genre?: MusicGenre;
  sourceId?: string;
  from?: string; // ISO date
  to?: string;   // ISO date
}
