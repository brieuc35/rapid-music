/**
 * État de l'onglet Actualités musicales (§2.4) : recherche + filtres.
 */
import { ref } from 'vue';
import { Article, ArticleFilter, Source } from '@/models';
import { getSources, searchArticles } from '@/services/api';

export function useNews() {
  const articles = ref<Article[]>([]);
  const sources = ref<Source[]>([]);
  const loading = ref(false);
  const filter = ref<ArticleFilter>({});

  async function search(): Promise<void> {
    loading.value = true;
    try {
      const page = await searchArticles(filter.value, null);
      articles.value = page.items;
    } finally {
      loading.value = false;
    }
  }

  async function init(): Promise<void> {
    sources.value = await getSources();
    await search();
  }

  function resetFilters(): void {
    filter.value = {};
    return void search();
  }

  return { articles, sources, loading, filter, init, search, resetFilters };
}
