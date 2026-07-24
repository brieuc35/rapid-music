import { fetchFeed, searchArticles } from '@/services/api';

describe('searchArticles', () => {
  it('filtre par mot-clé (titre/résumé/artiste/tags)', async () => {
    const page = await searchArticles({ query: 'LYOR' });
    expect(page.items.length).toBeGreaterThan(0);
    expect(page.items.every((a) => `${a.title} ${a.artistName ?? ''}`.includes('LYOR'))).toBe(true);
  });

  it('filtre par genre', async () => {
    const page = await searchArticles({ genre: 'jazz' });
    expect(page.items.every((a) => a.genre === 'jazz')).toBe(true);
  });

  it('trie du plus récent au plus ancien', async () => {
    const page = await searchArticles({});
    const dates = page.items.map((a) => a.publishedAt);
    const sorted = [...dates].sort((x, y) => y.localeCompare(x));
    expect(dates).toEqual(sorted);
  });

  it('renvoie une liste vide quand rien ne correspond', async () => {
    const page = await searchArticles({ query: 'zzz-introuvable-zzz' });
    expect(page.items).toHaveLength(0);
  });
});

describe('fetchFeed', () => {
  it('pagine par curseur', async () => {
    const first = await fetchFeed(null);
    expect(first.items.length).toBeGreaterThan(0);
    if (first.nextCursor) {
      const second = await fetchFeed(first.nextCursor);
      const firstIds = first.items.map((p) => p.id);
      // Aucune superposition entre deux pages consécutives.
      expect(second.items.every((p) => !firstIds.includes(p.id))).toBe(true);
    }
  });
});
