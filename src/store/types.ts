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

/**
 * Compte de plateforme rattaché à RapidMusic.
 *
 * La synchronisation automatique des royalties n'est pas possible : aucune
 * plateforme de streaming n'expose d'API publique de revenus par artiste, et
 * une authentification OAuth demanderait un serveur. Ce lien sert donc à
 * conserver la référence du profil et la trace des relevés importés.
 */
export interface PlatformLink {
  platform: string
  /** Identifiant ou URL du profil artiste sur la plateforme. */
  account: string
  /** Date ISO du dernier relevé importé, vide si aucun. */
  lastImport: string
  /** Nombre de lignes ajoutées lors du dernier import. */
  lastImportCount: number
}

export interface AppData {
  artist: ArtistProfile
  label: LabelInfo
  links: PlatformLink[]
  contracts: Contract[]
  concerts: Concert[]
  releases: Release[]
  royalties: RoyaltyEntry[]
  studio: StudioSession[]
  contacts: Contact[]
}
