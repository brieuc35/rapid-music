/**
 * Couleurs de référence des plateformes de streaming.
 *
 * Ces couleurs font autorité à l'affichage : la couleur enregistrée dans un
 * relevé n'est utilisée qu'en dernier recours (plateforme personnalisée). Cela
 * garantit qu'un changement de couleur ici s'applique aussi aux données déjà
 * enregistrées dans le navigateur.
 */
export const platformColors: Record<string, string> = {
  Spotify: '#1db954',
  'Apple Music': '#000000',
  Deezer: '#8b5cf6',
  'YouTube Music': '#ff0000',
  'Amazon Music': '#25d1da',
  Tidal: '#0f172a',
  Bandcamp: '#629aa9',
  SoundCloud: '#ff5500',
}

/** Couleur par défaut d'une plateforme non répertoriée. */
export const FALLBACK_COLOR = '#8b5cf6'

/** Couleur à utiliser pour une plateforme, quelle que soit la valeur stockée. */
export function platformColor(platform: string, stored?: string): string {
  return platformColors[platform] ?? stored ?? FALLBACK_COLOR
}
