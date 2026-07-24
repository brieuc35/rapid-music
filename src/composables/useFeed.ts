/**
 * Store du Fil d'actualité principal (§2.2).
 *
 * État module-level (singleton) : le fil est partagé dans toute l'app afin
 * qu'un post créé (PostComposer) ou une republication (repost, depuis un
 * profil par ex.) apparaisse en tête, quel que soit l'endroit d'origine.
 */
import { ref } from 'vue';
import { Post } from '@/models';
import { fetchFeed } from '@/services/api';

const posts = ref<Post[]>([]);
const loading = ref(false);
const cursor = ref<string | null>(null);
const hasMore = ref(true);

export function useFeed() {
  async function refresh(): Promise<void> {
    loading.value = true;
    try {
      const page = await fetchFeed(null);
      posts.value = page.items;
      cursor.value = page.nextCursor;
      hasMore.value = page.nextCursor !== null;
    } finally {
      loading.value = false;
    }
  }

  /** Charge le fil seulement s'il est vide (préserve les ajouts entre navigations). */
  async function ensureLoaded(): Promise<void> {
    if (!posts.value.length) await refresh();
  }

  async function loadMore(): Promise<void> {
    if (!hasMore.value || loading.value) return;
    const page = await fetchFeed(cursor.value);
    posts.value = [...posts.value, ...page.items];
    cursor.value = page.nextCursor;
    hasMore.value = page.nextCursor !== null;
  }

  /** Ajoute un post (création ou repost) en tête du fil. */
  function prepend(post: Post): void {
    posts.value = [post, ...posts.value];
  }

  return { posts, loading, hasMore, refresh, ensureLoaded, loadMore, prepend };
}
