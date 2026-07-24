/** Petits utilitaires de présentation partagés par les composants. */

/** 14200 -> "14,2 k" ; 1800000 -> "1,8 M". */
export function compactNumber(n: number): string {
  const MILLION = 1000000;
  if (n < 1000) return String(n);
  if (n < MILLION) return `${(n / 1000).toFixed(n % 1000 === 0 ? 0 : 1).replace('.', ',')} k`;
  return `${(n / MILLION).toFixed(1).replace('.', ',')} M`;
}

/** Date ISO -> temps relatif court en français ("il y a 3 h"). */
export function timeAgo(iso: string, now: Date = new Date()): string {
  const diffSec = Math.max(0, Math.round((now.getTime() - new Date(iso).getTime()) / 1000));
  // Seuils du plus grand au plus petit ; chaque seuil porte l'unité qu'il représente.
  const units = [
    { threshold: 604800, unit: 'sem' },
    { threshold: 86400, unit: 'j' },
    { threshold: 3600, unit: 'h' },
    { threshold: 60, unit: 'min' },
  ];
  for (const { threshold, unit } of units) {
    if (diffSec >= threshold) {
      return `il y a ${Math.floor(diffSec / threshold)} ${unit}`;
    }
  }
  return "à l'instant";
}

/** Génère une couleur stable (HSL) à partir d'une chaîne, pour les avatars. */
export function colorFromString(input: string): string {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = input.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 65%, 45%)`;
}

/** Initiales d'un nom affiché ("Nova Beats" -> "NB"). */
export function initials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');
}
