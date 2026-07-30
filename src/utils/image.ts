/** Taille maximale (en pixels) du côté le plus long de la photo enregistrée. */
const MAX_SIDE = 512

/** Taille de fichier acceptée en entrée (avant redimensionnement). */
export const MAX_INPUT_BYTES = 10 * 1024 * 1024 // 10 Mo

export class ImageError extends Error {}

/**
 * Convertit un fichier image en data URL carrée et compressée.
 *
 * Le redimensionnement est indispensable : le stockage local du navigateur est
 * limité (~5 Mo) et une photo d'appareil brute le saturerait à elle seule.
 * L'image est recadrée au centre en carré, puis réduite à MAX_SIDE au plus.
 */
export function fileToAvatarDataUrl(file: File): Promise<string> {
  if (!file.type.startsWith('image/')) {
    throw new ImageError("Ce fichier n'est pas une image.")
  }
  if (file.size > MAX_INPUT_BYTES) {
    throw new ImageError('Image trop volumineuse (10 Mo maximum).')
  }

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

    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new ImageError("Ce fichier image n'a pas pu être lu."))
    }

    img.src = url
  })
}
