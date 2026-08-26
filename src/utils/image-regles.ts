/* -------------------------------------------------------------------------- */
/*  Ce qu'on accepte comme photo, et ce qu'on dit quand ça échoue              */
/*                                                                            */
/*  Séparé du reste : le redimensionnement a besoin d'un navigateur, ces       */
/*  décisions-là non. Elles peuvent donc être vérifiées par des tests, et      */
/*  c'est bien elles qui refusaient à tort des photos de téléphone.           */
/* -------------------------------------------------------------------------- */

/**
 * Poids maximal accepté en entrée, avant redimensionnement.
 *
 * 25 Mo et non 10 : l'image est de toute façon réduite à 512 px de côté, le
 * plafond ne protège que la mémoire du téléphone pendant le décodage. À 10 Mo
 * il refusait des photos que les appareils récents produisent couramment —
 * un capteur de 50 mégapixels dépasse ce seuil sans difficulté, et le message
 * « Image trop volumineuse » ne disait pas quoi faire.
 */
export const MAX_INPUT_BYTES = 25 * 1024 * 1024

/**
 * Types que certains sélecteurs de fichiers Android renvoient à la place du
 * vrai type, quand le fournisseur du fichier ne le connaît pas.
 *
 * Les refuser revenait à refuser des photos parfaitement valables : c'est
 * l'étiquette qui manque, pas l'image. Le décodage tranchera.
 */
const TYPES_GENERIQUES = new Set([
  '',
  'application/octet-stream',
  'application/binary',
  'binary/octet-stream',
  'application/download',
  'content/unknown',
])

/**
 * Dit pourquoi un fichier ne peut pas être tenté, ou `null` s'il peut l'être.
 *
 * Le principe a changé : on ne cherche plus à prouver que c'est une image
 * avant d'essayer, on écarte seulement ce qui est manifestement autre chose.
 * Un fichier sans type, ou marqué d'un type générique, part au décodage — s'il
 * n'est pas décodable, c'est là qu'on le saura, et le message le dira.
 */
export function refuserFichier(type: string, taille: number): string | null {
  if (taille > MAX_INPUT_BYTES) {
    const mo = Math.round(MAX_INPUT_BYTES / 1024 / 1024)
    return `Cette image est trop lourde (${mo} Mo maximum). Une capture d'écran de la photo, ou la même photo envoyée en « qualité moyenne », passera sans problème.`
  }
  const t = type.trim().toLowerCase()
  if (TYPES_GENERIQUES.has(t)) return null
  if (t.startsWith('image/')) return null
  return "Ce fichier n'est pas une image."
}

/** Vrai pour les noms de fichiers au format HEIC/HEIF des appareils récents. */
export function estHeic(nom: string): boolean {
  return /\.(heic|heif)$/i.test(nom.trim())
}

/**
 * Le message affiché quand l'image n'a pas pu être décodée.
 *
 * Le cas le plus fréquent a sa propre explication : les téléphones récents
 * photographient en HEIC, que les navigateurs ne savent pas ouvrir. Dire
 * « ce fichier n'a pas pu être lu » laissait devant un mur ; la sortie existe,
 * elle est dans les réglages de l'appareil photo.
 */
export function messageEchecDecodage(nom: string): string {
  if (estHeic(nom)) {
    return (
      'Cette photo est au format HEIC, que les navigateurs ne savent pas ouvrir. ' +
      'Dans les réglages de votre appareil photo, choisissez le format JPEG ' +
      '(souvent « Formats avancés » ou « Photos haute efficacité » à désactiver), ' +
      'ou faites une capture d\'écran de la photo et importez celle-ci.'
    )
  }
  return "Cette image n'a pas pu être ouverte. Essayez-en une autre, ou une capture d'écran de celle-ci."
}
