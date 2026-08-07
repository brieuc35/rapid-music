// Données de démonstration du réseau social musical Rapid Music.
// Structure inspirée d'un gestionnaire de carrière : profil riche,
// parcours (timeline), compétences (genres) et objectifs (titres du moment).

export interface Track {
  id: string;
  title: string;
  artist: string;
  cover: string; // classe de dégradé (c1..c6)
  duration: string;
}

export interface Post {
  id: string;
  user: User;
  action: string; // "partage", "recommande", "en écoute"...
  track: Track;
  time: string;
  likes: number;
  comments: number;
  playing?: boolean;
  liked?: boolean;
}

export interface Milestone {
  year: string;
  title: string;
  detail: string;
}

export interface User {
  id: string;
  name: string;
  handle: string;
  initials: string;
  avatar: string; // classe de dégradé
}

export const covers = ['c1', 'c2', 'c3', 'c4', 'c5', 'c6'];

export const currentUser = {
  id: 'me',
  name: 'Brieuc Delorme',
  handle: '@brieuc',
  initials: 'BD',
  avatar: 'c5',
  bio: 'Digger invétéré · toujours à la recherche du prochain frisson sonore. Électro, soul et pépites oubliées.',
  location: 'Rennes, France',
  stats: { followers: 1240, following: 318, shares: 486 },
  genres: ['Électro', 'Soul', 'Hip-Hop', 'Jazz', 'Indie', 'House', 'Funk'],
};

// « Parcours musical » — inspiré des expériences d'un CV.
export const journey: Milestone[] = [
  { year: '2026', title: 'Curateur de la playlist « Nuit blanche »', detail: '12 400 abonnés · mise à jour chaque vendredi' },
  { year: '2025', title: '500e titre partagé', detail: 'Un an d\'écoute quotidienne avec la communauté' },
  { year: '2024', title: 'Top curateur Électro du mois', detail: 'Élu par la communauté Rapid Music' },
  { year: '2023', title: 'Premier partage', detail: 'Le début de l\'aventure : « Midnight City »' },
];

export const users: User[] = [
  { id: 'u1', name: 'Léa Moreau', handle: '@lea.m', initials: 'LM', avatar: 'c1' },
  { id: 'u2', name: 'Karim Benali', handle: '@karim', initials: 'KB', avatar: 'c2' },
  { id: 'u3', name: 'Nora Petit', handle: '@nora', initials: 'NP', avatar: 'c3' },
  { id: 'u4', name: 'Tom Girard', handle: '@tomg', initials: 'TG', avatar: 'c4' },
  { id: 'u5', name: 'Inès Roy', handle: '@ines', initials: 'IR', avatar: 'c6' },
];

export const posts: Post[] = [
  { id: 'p1', user: users[0], action: 'partage ce titre', time: 'il y a 8 min', playing: true,
    track: { id: 't1', title: 'Midnight City', artist: 'M83', cover: 'c1', duration: '4:03' }, likes: 128, comments: 24 },
  { id: 'p2', user: users[1], action: 'recommande', time: 'il y a 32 min',
    track: { id: 't2', title: 'Blinding Lights', artist: 'The Weeknd', cover: 'c2', duration: '3:20' }, likes: 342, comments: 51 },
  { id: 'p3', user: users[2], action: 'a ajouté à une playlist', time: 'il y a 1 h',
    track: { id: 't3', title: 'Redbone', artist: 'Childish Gambino', cover: 'c3', duration: '5:27' }, likes: 87, comments: 12 },
  { id: 'p4', user: users[3], action: 'partage ce titre', time: 'il y a 2 h',
    track: { id: 't4', title: 'Get Lucky', artist: 'Daft Punk', cover: 'c4', duration: '6:07' }, likes: 205, comments: 33 },
  { id: 'p5', user: users[4], action: 'écoute en boucle', time: 'il y a 3 h',
    track: { id: 't5', title: 'Nightcall', artist: 'Kavinsky', cover: 'c6', duration: '4:18' }, likes: 156, comments: 19 },
];

export const trending: Track[] = [
  { id: 'tr1', title: 'One More Time', artist: 'Daft Punk', cover: 'c1', duration: '5:20' },
  { id: 'tr2', title: 'Instant Crush', artist: 'Daft Punk', cover: 'c2', duration: '5:37' },
  { id: 'tr3', title: 'Sunset Lover', artist: 'Petit Biscuit', cover: 'c3', duration: '3:56' },
  { id: 'tr4', title: 'Innerbloom', artist: 'RÜFÜS DU SOL', cover: 'c4', duration: '9:38' },
  { id: 'tr5', title: 'Tadow', artist: 'Masego', cover: 'c5', duration: '5:04' },
  { id: 'tr6', title: 'Flashing Lights', artist: 'Kanye West', cover: 'c6', duration: '3:57' },
];

export const genres = ['Tous', 'Électro', 'Soul', 'Hip-Hop', 'Jazz', 'Indie', 'House', 'Funk', 'Pop'];

// « Titres du moment » — inspiré des objectifs d'un gestionnaire de carrière.
export const currentFavorites: Track[] = [
  { id: 'f1', title: 'Open Eye Signal', artist: 'Jon Hopkins', cover: 'c2', duration: '7:47' },
  { id: 'f2', title: 'Windowlicker', artist: 'Aphex Twin', cover: 'c3', duration: '6:07' },
  { id: 'f3', title: 'Xtal', artist: 'Aphex Twin', cover: 'c5', duration: '4:51' },
];

export const suggestions: User[] = [
  { id: 's1', name: 'Studio Kôan', handle: '@koan', initials: 'SK', avatar: 'c2' },
  { id: 's2', name: 'Maya Lefevre', handle: '@maya', initials: 'ML', avatar: 'c3' },
  { id: 's3', name: 'Le Digger', handle: '@digger', initials: 'LD', avatar: 'c1' },
];
