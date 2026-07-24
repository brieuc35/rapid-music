import { addComment, createPost, fetchComments, fetchFeed, searchArticles } from '@/services/api';

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

describe('createPost', () => {
  it('crée un post au nom de l\'utilisateur courant avec des compteurs à zéro', async () => {
    const post = await createPost({
      body: '  Nouveau morceau en approche  ',
      tags: ['electro'],
      media: [],
      visibility: 'public',
    });
    expect(post.body).toBe('Nouveau morceau en approche'); // trimé
    expect(post.author.id).toBe('u-me');
    expect(post.likeCount).toBe(0);
    expect(post.commentCount).toBe(0);
    expect(post.shareCount).toBe(0);
    expect(post.likedByMe).toBe(false);
    expect(post.tags).toEqual(['electro']);
    expect(post.visibility).toBe('public');
  });

  it('génère des identifiants uniques', async () => {
    const a = await createPost({ body: 'a', tags: [], media: [], visibility: 'public' });
    const b = await createPost({ body: 'b', tags: [], media: [], visibility: 'followers' });
    expect(a.id).not.toBe(b.id);
    expect(b.visibility).toBe('followers');
  });
});

describe('commentaires', () => {
  it('renvoie les commentaires seed d\'une cible', async () => {
    const list = await fetchComments('post', 'p-1');
    expect(list.length).toBeGreaterThanOrEqual(2);
  });

  it('renvoie une liste vide pour une cible sans commentaire', async () => {
    const list = await fetchComments('post', 'p-3');
    expect(list).toEqual([]);
  });

  it('renvoie une copie indépendante du magasin (pas de fuite de référence)', async () => {
    const snapshot = await fetchComments('post', 'p-1');
    const lenBefore = snapshot.length;
    await addComment('post', 'p-1', 'nouveau');
    // Le tableau déjà récupéré ne doit pas avoir été muté par l'ajout.
    expect(snapshot.length).toBe(lenBefore);
  });

  it('ajoute un commentaire (trimé, auteur courant) et le persiste', async () => {
    const before = (await fetchComments('clip', 'c-3')).length;
    const comment = await addComment('clip', 'c-3', '  superbe reprise  ');
    expect(comment.body).toBe('superbe reprise');
    expect(comment.author.id).toBe('u-me');
    expect(comment.likeCount).toBe(0);

    const after = await fetchComments('clip', 'c-3');
    expect(after.length).toBe(before + 1);
    expect(after[after.length - 1].id).toBe(comment.id);
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
