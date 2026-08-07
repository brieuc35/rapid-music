export type ID = string

export interface Contract {
  id: ID
  title: string
  party: string // co-contractant (label, éditeur, manager…)
  type: 'Enregistrement' | 'Édition' | 'Distribution' | 'Management' | 'Booking' | 'Licence' | 'Autre'
  status: 'Actif' | 'En négociation' | 'En attente signature' | 'Expiré'
  startDate: string
  endDate: string
  value: number // montant / avance en €
  royaltyRate: number // % artiste
  notes: string
}

export interface Concert {
  id: ID
  venue: string
  city: string
  country: string
  date: string // ISO date
  time: string
  status: 'Confirmé' | 'Option' | 'Annoncé' | 'Terminé'
  capacity: number
  ticketsSold: number
  fee: number // cachet en €
  promoter: string
  notes: string
}

export interface Release {
  id: ID
  title: string
  type: 'Single' | 'EP' | 'Album' | 'Remix' | 'Featuring'
  date: string
  status: 'Publié' | 'Planifié' | 'Master prêt' | 'En production'
  cover: string // couleur d'accent hex pour la pochette
  streams: number
  isrc: string
  featuring: string
  notes: string
}

export interface RoyaltyEntry {
  id: ID
  platform: string
  period: string // ex "Juin 2026"
  streams: number
  amount: number // € nets
  color: string
}

export interface StudioSession {
  id: ID
  title: string
  studio: string
  date: string
  startTime: string
  endTime: string
  type: 'Enregistrement' | 'Mix' | 'Mastering' | 'Répétition' | 'Écriture' | 'Réunion' | 'Autre'
  cost: number
  engineer: string
  notes: string
}

export interface Contact {
  id: ID
  name: string
  role: string
  company: string
  category: 'Label' | 'Booking' | 'Média' | 'Studio' | 'Management' | 'Juridique' | 'Autre'
  email: string
  phone: string
  favorite: boolean
  notes: string
}

export interface LabelInfo {
  name: string
  tagline: string
  founded: string
  location: string
  email: string
  website: string
  distribution: string
  publishing: string
  roster: { name: string; genre: string }[]
}

export interface ArtistProfile {
  stageName: string
  realName: string
  genre: string
  city: string
  /** Photo de profil encodée en data URL (vide = initiales affichées). */
  photo: string
  bio: string
  email: string
  phone: string
  instagram: string
  spotify: string
  website: string
}

/* -------------------------------------------------------------------------- */
/*  Réseau                                                                    */
/*                                                                            */
/*  Le fil est local : sans serveur, les publications ne circulent pas entre   */
/*  utilisateurs. Les comptes fournis servent de contenu de démonstration.     */
/* -------------------------------------------------------------------------- */

export type PostCategory =
  | 'Certification'
  | 'Interview'
  | 'Sortie'
  | 'Industrie'
  | 'Concert'
  | 'Autre'

export interface SocialAccount {
  id: ID
  name: string
  handle: string
  /** Métier exercé : Journaliste, Label, Ingénieur du son, Booker… */
  role: string
  verified: boolean
  /** Couleur d'accent de l'avatar. */
  color: string
  /** Structure de rattachement (label, média, salle…). */
  company: string
  location: string
  /** Présentation professionnelle. */
  bio: string
  /** Compétences et domaines mis en avant. */
  specialties: string[]
  /** Nombre de relations affiché sur le profil. */
  connections: number
}

/** Nature d'une annonce publiée sur le réseau. */
export type OpportunityKind = 'Rémunéré' | 'Collaboration' | 'Bénévole'

export interface Opportunity {
  id: ID
  accountId: ID
  title: string
  /** Métier ou profil recherché. */
  role: string
  kind: OpportunityKind
  location: string
  description: string
  /** Date ISO de publication. */
  date: string
  /** Date limite de candidature, vide si aucune. */
  deadline: string
  saved: boolean
}

export interface Post {
  id: ID
  accountId: ID
  category: PostCategory
  content: string
  /** Date et heure ISO de publication. */
  date: string
  likes: number
  comments: number
  /** Aimé par l'artiste (état local). */
  liked: boolean
  /** Mis de côté pour lecture ultérieure. */
  saved: boolean
  tags: string[]
}

export interface AppData {
  artist: ArtistProfile
  label: LabelInfo
  contracts: Contract[]
  concerts: Concert[]
  releases: Release[]
  royalties: RoyaltyEntry[]
  studio: StudioSession[]
  contacts: Contact[]
  accounts: SocialAccount[]
  posts: Post[]
  opportunities: Opportunity[]
  /** Identifiants des comptes avec lesquels l'artiste est en relation. */
  following: ID[]
  /**
   * Date ISO de la dernière consultation du Réseau. Les publications
   * postérieures sont comptées comme non lues.
   */
  networkLastSeen: string
}
