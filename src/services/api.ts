/**
 * Couche d'accès aux données (simulée).
 *
 * Elle imite le contrat de l'API réelle décrite au §8 du plan : réponses
 * paginées par curseur et latence réseau. Pour brancher le vrai back-end,
 * il suffit de remplacer le corps de ces fonctions par des appels HTTP
 * (fetch / axios) en conservant les mêmes signatures.
 */
import { Article, ArticleFilter, Clip, Page, Post, Source } from '@/models';
import { articles, clips, posts, sources } from './mockData';

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
