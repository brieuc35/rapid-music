/* -------------------------------------------------------------------------- */
/*  Sauvegarde et restauration d'un fichier de données                        */
/*                                                                            */
/*  Deux usages qui n'ont rien à voir :                                       */
/*                                                                            */
/*  — se prémunir. Un compte tient à un service en ligne ; un fichier sur son */
/*    disque ne dépend de personne.                                           */
/*  — le droit à la portabilité. Le RGPD prévoit qu'on puisse récupérer ses    */
/*    données dans un format lisible et réutilisable, et le JSON en est un.    */
/* -------------------------------------------------------------------------- */

import type { AppData } from '@/store/types'

/** Erreur destinée à être montrée telle quelle à l'artiste. */
export class BackupError extends Error {}

/** Marqueur permettant de reconnaître un fichier de l'application. */
const MARQUEUR = 'RapidMusic'

/** Numéro de format, distinct de la version de l'application. */
const FORMAT = 1

export interface Backup {
  application: string
  format: number
  exporteLe: string
  donnees: AppData
}

export function buildBackup(data: AppData): Backup {
  return {
    application: MARQUEUR,
    format: FORMAT,
    exporteLe: new Date().toISOString(),
    // Détaché de l'objet réactif, et débarrassé des valeurs indéfinies.
    donnees: JSON.parse(JSON.stringify(data)) as AppData,
  }
}

/**
 * Nom de fichier reconnaissable des mois plus tard : l'artiste et la date.
 * Tout ce qui n'est ni lettre ni chiffre est remplacé, un nom de scène pouvant
 * contenir des caractères qu'un système de fichiers refuse.
 */
export function backupFileName(stageName: string): string {
  const nom = (stageName || 'artiste')
    .normalize('NFD')
    // Les accents détachés par NFD. Écrits en échappement : ces caractères sont
    // invisibles dans un éditeur, un copier-coller les perdrait sans prévenir.
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase()
    .slice(0, 40)
  const jour = new Date().toISOString().slice(0, 10)
  return `rapidmusic-${nom || 'artiste'}-${jour}.json`
}

/** Déclenche le téléchargement du fichier. */
export function downloadBackup(data: AppData): string {
  const contenu = JSON.stringify(buildBackup(data), null, 2)
  const blob = new Blob([contenu], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const nom = backupFileName(data.artist.stageName)
  const lien = document.createElement('a')
  lien.href = url
  lien.download = nom
  document.body.appendChild(lien)
  lien.click()
  lien.remove()
  // Sans révocation, le navigateur garde le fichier en mémoire pour la durée
  // de la page.
  setTimeout(() => URL.revokeObjectURL(url), 1000)
  return nom
}

/**
 * Lit un fichier et en extrait les données, ou explique pourquoi il n'est pas
 * exploitable. Rien n'est appliqué ici : l'appelant montre d'abord ce que le
 * fichier contient, et n'écrase les données existantes qu'après confirmation.
 */
export function parseBackup(texte: string): AppData {
  let brut: unknown
  try {
    brut = JSON.parse(texte)
  } catch {
    throw new BackupError(
      "Ce fichier n'est pas lisible. Choisissez un fichier de sauvegarde RapidMusic.",
    )
  }

  if (!brut || typeof brut !== 'object' || Array.isArray(brut)) {
    throw new BackupError("Ce fichier ne contient pas de données d'application.")
  }

  const objet = brut as Record<string, unknown>

  // Fichier issu de l'export : les données sont dans « donnees ».
  const enveloppe =
    objet.application === MARQUEUR && objet.donnees && typeof objet.donnees === 'object'
  const donnees = (enveloppe ? objet.donnees : objet) as Record<string, unknown>

  if (enveloppe && typeof objet.format === 'number' && objet.format > FORMAT) {
    throw new BackupError(
      'Ce fichier a été créé par une version plus récente de RapidMusic. Mettez à jour la page, puis réessayez.',
    )
  }

  // Un objet quelconque n'est pas une sauvegarde. On exige les deux repères
  // présents depuis la toute première version, ce qui accepte aussi les données
  // laissées par les versions sans compte.
  const plausible =
    donnees.artist !== undefined &&
    typeof donnees.artist === 'object' &&
    donnees.artist !== null &&
    Array.isArray(donnees.concerts)

  if (!plausible) {
    throw new BackupError(
      "Ce fichier ne ressemble pas à une sauvegarde RapidMusic. Vérifiez qu'il s'agit bien du fichier téléchargé depuis l'application.",
    )
  }

  return donnees as unknown as AppData
}

/** Ce que le fichier contient, à montrer avant d'écraser quoi que ce soit. */
export function describeBackup(data: AppData): { label: string; count: number }[] {
  return [
    { label: 'contrats', count: data.contracts?.length ?? 0 },
    { label: 'concerts', count: data.concerts?.length ?? 0 },
    { label: 'sorties', count: data.releases?.length ?? 0 },
    { label: 'relevés de revenus', count: data.royalties?.length ?? 0 },
    { label: "évènements d'agenda", count: data.studio?.length ?? 0 },
    { label: 'contacts', count: data.contacts?.length ?? 0 },
    { label: 'tâches', count: data.tasks?.length ?? 0 },
  ]
}
