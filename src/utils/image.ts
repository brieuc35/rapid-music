import { messageEchecDecodage, refuserFichier } from './image-regles.js'

/** Taille maximale (en pixels) du côté le plus long de la photo enregistrée. */
const MAX_SIDE = 512

export class ImageError extends Error {}

/**
 * Convertit un fichier image en data URL carrée et compressée.
 *
 * Le redimensionnement est indispensable : le stockage local du navigateur est
 * limité (~5 Mo) et une photo d'appareil brute le saturerait à elle seule.
 * L'image est recadrée au centre en carré, puis réduite à MAX_SIDE au plus.
 *
 * Ce qui est accepté en entrée est décidé dans `image-regles.ts`, à part et
 * sous tests : c'est là que se jouait le refus de photos valables.
 */
export function fileToAvatarDataUrl(file: File): Promise<string> {
  const refus = refuserFichier(file.type, file.size)
  if (refus) throw new ImageError(refus)

  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()

    img.onload = () => {
      URL.revokeObjectURL(url)
      try {
        // Recadrage carré centré
        const side = Math.min(img.naturalWidth, img.naturalHeight)
        const sx = (img.naturalWidth - side) / 2
        const sy = (img.naturalHeight - side) / 2
        const target = Math.min(side, MAX_SIDE)

        const canvas = document.createElement('canvas')
        canvas.width = target
        canvas.height = target
        const ctx = canvas.getContext('2d')
        if (!ctx) throw new ImageError("Impossible de traiter l'image.")

        ctx.drawImage(img, sx, sy, side, side, 0, 0, target, target)
        resolve(canvas.toDataURL('image/jpeg', 0.85))
      } catch (err) {
        reject(err instanceof Error ? err : new ImageError("Impossible de traiter l'image."))
      }
    }

    /*  Le décodage est le seul juge : un fichier a pu arriver sans type, ou
     *  avec un type générique, et c'est ici qu'on apprend s'il était vraiment
     *  une image. Le message tient compte de son nom — le HEIC des appareils
     *  récents est le cas courant, et il a une issue. */
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new ImageError(messageEchecDecodage(file.name)))
    }

    img.src = url
  })
}
