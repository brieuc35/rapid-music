/**
 * État du flux de Clips vidéo (§2.3).
 */
import { ref } from 'vue';
import { Clip } from '@/models';
import { fetchClips } from '@/services/api';

export function useClips() {
  const clips = ref<Clip[]>([]);
  const loading = ref(false);
  const cursor = ref<string | null>(null);
  const hasMore = ref(true);

  async function refresh(): Promise<void> {
    loading.value = true;
    try {
      const page = await fetchClips(null);
      clips.value = page.items;
      cursor.value = page.nextCursor;
      hasMore.value = page.nextCursor !== null;
    } finally {
      loading.value = false;
    }
  }

  async function loadMore(): Promise<void> {
    if (!hasMore.value || loading.value) return;
    const page = await fetchClips(cursor.value);
    clips.value = [...clips.value, ...page.items];
    cursor.value = page.nextCursor;
    hasMore.value = page.nextCursor !== null;
  }

  return { clips, loading, hasMore, refresh, loadMore };
}
