/**
 * Jeu de données mockées pour le développement de l'UI.
 *
 * Remplacé à terme par les appels à l'API réelle (§8 du plan). Les services
 * (feedService, clipsService, newsService) consomment ces données via une
 * couche qui simule la latence réseau et la pagination par curseur.
 */
import { Article, Clip, Post, Source, User } from '@/models';

export const currentUser: User = {
  id: 'u-me',
  handle: 'moi',
  displayName: 'Moi',
  role: 'fan',
  favoriteGenres: ['rap', 'electro', 'pop'],
  isVerified: false,
  followerCount: 42,
  followingCount: 128,
};

export const users: User[] = [
  {
    id: 'u-1',
    handle: 'nova.beats',
    displayName: 'Nova Beats',
    bio: 'Productrice electro · Paris',
    role: 'creator',
    favoriteGenres: ['electro', 'pop'],
    isVerified: true,
    followerCount: 18400,
    followingCount: 312,
  },
  {
    id: 'u-2',
    handle: 'lyor',
    displayName: 'LYOR',
    bio: 'Rappeur · nouveau projet bientôt',
    role: 'creator',
    favoriteGenres: ['rap', 'rnb'],
    isVerified: true,
    followerCount: 92300,
    followingCount: 88,
  },
  {
    id: 'u-3',
    handle: 'pitchfork.fr',
    displayName: 'Le Mag Musique',
    bio: 'Média · critiques & découvertes',
    role: 'media',
    favoriteGenres: ['rock', 'pop', 'jazz'],
    isVerified: true,
    followerCount: 45100,
    followingCount: 1200,
  },
  {
    id: 'u-4',
    handle: 'mila.keys',
    displayName: 'Mila Keys',
    bio: 'Pianiste · covers & impros',
    role: 'creator',
    favoriteGenres: ['classique', 'jazz'],
    isVerified: false,
    followerCount: 7600,
    followingCount: 540,
  },
];

const userById = (id: string) => users.find((u) => u.id === id) as User;

export const posts: Post[] = [
  {
    id: 'p-1',
    author: userById('u-2'),
    body:
      "Studio session terminée à 4h du mat 🎚️ Le prochain single arrive vendredi. " +
      'Première écoute réservée à mes abonnés ici. Prêts ?',
    media: [],
    tags: ['rap', 'rnb'],
    visibility: 'public',
    createdAt: '2026-07-24T02:14:00Z',
    likeCount: 3120,
    commentCount: 214,
    shareCount: 87,
    likedByMe: false,
  },
  {
    id: 'p-2',
    author: userById('u-1'),
    body:
      'Petit thread sur le sound design de mon dernier morceau : tout est parti ' +
      "d'un sample de machine à laver 🌀 Détails en commentaire.",
    media: [{ type: 'link', url: 'https://example.com/making-of', title: 'Making-of : du bruit au beat' }],
    tags: ['electro'],
    visibility: 'public',
    createdAt: '2026-07-23T18:40:00Z',
    likeCount: 980,
    commentCount: 63,
    shareCount: 41,
    likedByMe: true,
  },
  {
    id: 'p-3',
    author: userById('u-3'),
    body:
      'Notre sélection des 10 albums de l\'été est en ligne. Beaucoup de surprises ' +
      'côté scène émergente française cette année. Lien vers l\'article 👇',
    media: [{ type: 'link', url: 'https://example.com/albums-ete', title: 'Les 10 albums de l\'été' }],
    tags: ['pop', 'rock'],
    visibility: 'public',
    createdAt: '2026-07-23T09:05:00Z',
    likeCount: 542,
    commentCount: 38,
    shareCount: 120,
    likedByMe: false,
  },
  {
    id: 'p-4',
    author: userById('u-4'),
    body: 'Reprise de Clair de Lune postée dans les Clips 🌙 Dites-moi ce que vous en pensez !',
    media: [],
    tags: ['classique'],
    visibility: 'public',
    createdAt: '2026-07-22T20:20:00Z',
    likeCount: 411,
    commentCount: 29,
    shareCount: 12,
    likedByMe: false,
  },
];

// Vidéos d'exemple publiques (Google sample bucket). En prod : manifestes HLS
// générés par le pipeline de transcodage (§4.4). Le lecteur affiche un dégradé
// de secours quand la vidéo n'est pas disponible (hors-ligne).
export const clips: Clip[] = [
  {
    id: 'c-1',
    creator: userById('u-1'),
    caption: 'Drop en avant-première 🔊 monte le son',
    hlsUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4',
    posterUrl: '',
    durationMs: 15000,
    status: 'ready',
    audioTitle: 'Nova Beats — Untitled Drop',
    tags: ['electro'],
    createdAt: '2026-07-24T08:00:00Z',
    viewCount: 128000,
    likeCount: 14200,
    commentCount: 320,
    shareCount: 890,
    likedByMe: false,
  },
  {
    id: 'c-2',
    creator: userById('u-2'),
    caption: 'Freestyle improvisé en backstage 🎤',
    hlsUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    posterUrl: '',
    durationMs: 22000,
    status: 'ready',
    audioTitle: 'LYOR — Freestyle #4',
    tags: ['rap'],
    createdAt: '2026-07-23T21:30:00Z',
    viewCount: 402000,
    likeCount: 51200,
    commentCount: 1800,
    shareCount: 3400,
    likedByMe: true,
  },
  {
    id: 'c-3',
    creator: userById('u-4'),
    caption: 'Clair de Lune — Debussy 🌙 (reprise)',
    hlsUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4',
    posterUrl: '',
    durationMs: 30000,
    status: 'ready',
    audioTitle: 'Mila Keys — Clair de Lune',
    tags: ['classique'],
    createdAt: '2026-07-22T20:10:00Z',
    viewCount: 26000,
    likeCount: 4100,
    commentCount: 210,
    shareCount: 140,
    likedByMe: false,
  },
];

export const sources: Source[] = [
  { id: 's-1', name: 'Le Mag Musique', domain: 'lemagmusique.fr', trustLevel: 'high' },
  { id: 's-2', name: 'Beat Weekly', domain: 'beatweekly.com', trustLevel: 'medium' },
  { id: 's-3', name: 'Scène Émergente', domain: 'scene-emergente.fr', trustLevel: 'high' },
];

const sourceById = (id: string) => sources.find((s) => s.id === id) as Source;

export const articles: Article[] = [
  {
    id: 'a-1',
    title: 'Les 10 albums incontournables de l\'été 2026',
    summary:
      'De la pop solaire au rap introspectif, notre rédaction a écouté (beaucoup) ' +
      'pour vous livrer sa sélection estivale.',
    externalUrl: 'https://lemagmusique.fr/albums-ete-2026',
    source: sourceById('s-1'),
    authorName: 'Camille R.',
    genre: 'pop',
    artistName: undefined,
    tags: ['pop', 'rap', 'selection'],
    publishedAt: '2026-07-23T09:00:00Z',
  },
  {
    id: 'a-2',
    title: 'LYOR annonce son deuxième album pour la rentrée',
    summary:
      'Le rappeur confirme la sortie de "Signal" en septembre, précédé d\'un single vendredi.',
    externalUrl: 'https://beatweekly.com/lyor-signal',
    source: sourceById('s-2'),
    authorName: 'T. Mbeki',
    genre: 'rap',
    artistName: 'LYOR',
    tags: ['rap', 'sortie'],
    publishedAt: '2026-07-24T07:30:00Z',
  },
  {
    id: 'a-3',
    title: 'La scène electro française rayonne dans les festivals européens',
    summary:
      'Portrait d\'une génération de productrices et producteurs qui exportent le son français.',
    externalUrl: 'https://scene-emergente.fr/electro-fr',
    source: sourceById('s-3'),
    authorName: 'L. Fontaine',
    genre: 'electro',
    tags: ['electro', 'festival'],
    publishedAt: '2026-07-21T14:15:00Z',
  },
  {
    id: 'a-4',
    title: 'Comment le jazz revient dans les playlists des 20 ans',
    summary:
      'Streaming, samples et reprises : enquête sur le retour en grâce du jazz auprès du jeune public.',
    externalUrl: 'https://lemagmusique.fr/jazz-jeunes',
    source: sourceById('s-1'),
    authorName: 'Camille R.',
    genre: 'jazz',
    tags: ['jazz', 'tendance'],
    publishedAt: '2026-07-20T11:00:00Z',
  },
  {
    id: 'a-5',
    title: 'K-pop : trois groupes à suivre cette saison',
    summary: 'Debuts remarqués et comebacks attendus, notre radar K-pop pour les mois à venir.',
    externalUrl: 'https://beatweekly.com/kpop-radar',
    source: sourceById('s-2'),
    genre: 'kpop',
    tags: ['kpop', 'decouverte'],
    publishedAt: '2026-07-19T16:45:00Z',
  },
];
