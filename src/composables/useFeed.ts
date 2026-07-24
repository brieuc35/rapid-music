/**
 * État du Fil d'actualité principal (§2.2).
 * Chargement paginé par curseur + rafraîchissement (pull-to-refresh).
 */
import { ref } from 'vue';
import { Post } from '@/models';
import { fetchFeed } from '@/services/api';

export function useFeed() {
  const posts = ref<Post[]>([]);
  const loading = ref(false);
  const cursor = ref<string | null>(null);
  const hasMore = ref(true);

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

  async function loadMore(): Promise<void> {
    if (!hasMore.value || loading.value) return;
    const page = await fetchFeed(cursor.value);
    posts.value = [...posts.value, ...page.items];
    cursor.value = page.nextCursor;
    hasMore.value = page.nextCursor !== null;
  }

  /** Ajoute un post fraîchement créé en tête du fil (cf. PostComposer). */
  function prepend(post: Post): void {
    posts.value = [post, ...posts.value];
  }

  return { posts, loading, hasMore, refresh, loadMore, prepend };
}
