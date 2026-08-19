/* -------------------------------------------------------------------------- */
/*  Génère public/icon-maskable-512.png — l'icône sous l'écran d'accueil        */
/*                                                                            */
/*  Pourquoi un script et pas un fichier retouché à la main : la proportion du  */
/*  dessin obéit à une règle (voir docs/play-store.md), et une règle décrite en  */
/*  prose se réapplique de travers. Ici elle est calculée, puis vérifiée sur    */
/*  l'image produite.                                                          */
/*                                                                            */
/*    node scripts/icone-maskable.mjs                                          */
/*                                                                            */
/*  Le fichier produit est un PNG RVB sans couche alpha : une icône maskable    */
/*  est opaque par construction, et la couche alpha ne ferait que l'alourdir.   */
/*                                                                            */
/*  Après changement : refabriquer le paquet Android. L'icône y est recopiée,   */
/*  elle ne suit pas les mises à jour du site.                                 */
/* -------------------------------------------------------------------------- */

import { writeFileSync } from 'node:fs'
import { deflateSync, crc32 } from 'node:zlib'
import pw from '/opt/node22/lib/node_modules/playwright/index.js'

const SORTIE = new URL('../public/icon-maskable-512.png', import.meta.url)
const TAILLE = 512

/*  Le gabarit d'une icône adaptative mesure 108 dp ; Bubblewrap y pose l'image
 *  avec 8,5 dp de marge de chaque côté (donc 91 dp), et le lanceur n'affiche que
 *  les 72 dp centraux. La part visible du fichier vaut donc 72/91. */
const PART_VISIBLE = 72 / 91
/*  Proportion du disque visible occupée par le dessin. À 66 % il touchait le
 *  bord ; 55 % le laisse respirer sans le rendre timide. */
const PART_LOGO = 0.55

/*  Fond : le dégradé de la marque. Le violet de départ est celui de
 *  `--brand-gradient` dans src/styles/main.css, pour que l'icône et l'intérieur
 *  de l'application parlent la même langue. L'arrivée est en fuchsia plutôt
 *  qu'en rose : le fond lit alors nettement plus violet, sans devenir plat. */
const DEBUT = [0x8b, 0x5c, 0xf6]
const FIN = [0xd9, 0x46, 0xef]

/*  Le dessin de la marque, dans le repère de 24 unités de public/favicon.svg :
 *  une note traversée d'un éclair. Recopié et non importé — le favicon a son
 *  propre cadrage, et les deux fichiers n'ont pas à bouger ensemble. */
const GLYPHE = `
  <path d="M9 16.5V5l8-1.5" stroke-width="2.3"/>
  <circle cx="6" cy="16.5" r="2.6" stroke-width="2.3"/>
  <path d="M17.5 7.5 14 12.5h3.2L14.5 18l6-7h-3.2z" stroke-width="2"/>`

/*  Le SVG ne porte que le dessin, sur fond transparent : le dégradé, lui, est
 *  calculé pixel par pixel (voir plus bas). Le laisser au rasteriseur le ferait
 *  tramer — un bruit de ±1 par canal, invisible à l'œil, mais qui empêche la
 *  compression d'exploiter la régularité du dégradé et alourdit le fichier de
 *  près de 40 %. */
const svgLogo = (echelle, dx, dy) => `<svg xmlns="http://www.w3.org/2000/svg" width="${TAILLE}" height="${TAILLE}" viewBox="0 0 ${TAILLE} ${TAILLE}">
  <g transform="translate(${dx} ${dy}) scale(${echelle})" fill="none" stroke="#fff"
     stroke-linecap="round" stroke-linejoin="round">${GLYPHE}</g>
</svg>`

/* -------------------------------------------------------------------------- */
/*  Rendu et mesure                                                            */
/* -------------------------------------------------------------------------- */

const nav = await pw.chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const page = await (await nav.newContext()).newPage()
await page.setContent(`<canvas id="c" width="${TAILLE}" height="${TAILLE}"></canvas>`)

/**
 * Compose l'icône complète et retourne ses pixels plus l'étendue réelle de
 * l'encre blanche.
 *
 * L'étendue est mesurée sur l'image, et non calculée : `getBBox()` ignore
 * l'épaisseur des traits, or le dessin n'est fait que de traits — s'y fier
 * sous-estimerait sa taille visible de plusieurs pixels de chaque côté.
 */
async function composer(echelle, dx, dy) {
  return page.evaluate(
    async ([source, taille, debut, fin]) => {
      const c = document.getElementById('c')
      const ctx = c.getContext('2d', { willReadFrequently: true })

      /*  Le dégradé, écrit octet par octet. Même géométrie que le dégradé SVG
       *  d'origine (du coin haut-gauche au coin bas-droit) : la position sur
       *  l'axe est la moyenne des deux coordonnées ramenées à [0, 1]. */
      const fond = ctx.createImageData(taille, taille)
      for (let y = 0; y < taille; y++) {
        for (let x = 0; x < taille; x++) {
          const t = (x / (taille - 1) + y / (taille - 1)) / 2
          const i = (y * taille + x) * 4
          for (let k = 0; k < 3; k++) {
            fond.data[i + k] = Math.round(debut[k] + (fin[k] - debut[k]) * t)
          }
          fond.data[i + 3] = 255
        }
      }
      ctx.putImageData(fond, 0, 0)

      /*  Le dessin par-dessus : ses bords adoucis se fondent dans le dégradé
       *  exact qu'on vient d'écrire. */
      const img = new Image()
      await new Promise((ok, ko) => {
        img.onload = ok
        img.onerror = ko
        img.src = 'data:image/svg+xml;base64,' + btoa(source)
      })
      ctx.drawImage(img, 0, 0, taille, taille)

      const d = ctx.getImageData(0, 0, taille, taille).data
      let minX = 1e9, minY = 1e9, maxX = -1, maxY = -1
      for (let y = 0; y < taille; y++) {
        for (let x = 0; x < taille; x++) {
          const i = (y * taille + x) * 4
          if (d[i] > 235 && d[i + 1] > 235 && d[i + 2] > 235) {
            if (x < minX) minX = x
            if (x > maxX) maxX = x
            if (y < minY) minY = y
            if (y > maxY) maxY = y
          }
        }
      }
      return {
        pixels: [...d],
        boite: { x: minX, y: minY, l: maxX - minX + 1, h: maxY - minY + 1 },
      }
    },
    [svgLogo(echelle, dx, dy), TAILLE, DEBUT, FIN],
  )
}

const cible = TAILLE * PART_VISIBLE * PART_LOGO
const centre = TAILLE / 2

/*  Ajustement par approximations successives : on rend, on mesure, on corrige
 *  l'échelle et le décalage.
 *
 *  On retient le MEILLEUR essai, et non le dernier. La mesure se fait en pixels
 *  entiers : l'écart ne descend donc jamais continûment vers zéro, il oscille
 *  autour. Une boucle qui sortirait sur son dernier tour livrerait un cadrage
 *  au hasard parmi les bons et les moins bons. */
let echelle = cible / 18.1 // première estimation : le glyphe fait ~18 unités
let dx = 0
let dy = 0
let meilleur = null
for (let tour = 1; tour <= 8; tour++) {
  const essai = await composer(echelle, dx, dy)
  const { x, y, l, h } = essai.boite
  const ecartX = x + l / 2 - centre
  const ecartY = y + h / 2 - centre
  /*  Le centrage compte double : un logo d'un pixel trop large ne se voit pas,
   *  décalé d'un pixel non plus, mais l'œil pardonne moins le second. */
  const score = Math.abs(l - cible) + 2 * (Math.abs(ecartX) + Math.abs(ecartY))
  console.log(
    `tour ${tour} : largeur ${l} (cible ${cible.toFixed(1)}), ` +
      `centre ${(x + l / 2).toFixed(1)}/${(y + h / 2).toFixed(1)}, écart ${score.toFixed(2)}`,
  )
  if (!meilleur || score < meilleur.score) meilleur = { ...essai, score, tour }
  if (score < 1) break
  const facteur = cible / l
  echelle *= facteur
  dx = (dx - ecartX) * facteur
  dy = (dy - ecartY) * facteur
}
const r = meilleur
console.log(`retenu : tour ${r.tour}, écart ${r.score.toFixed(2)}`)

/* -------------------------------------------------------------------------- */
/*  Écriture du PNG                                                            */
/* -------------------------------------------------------------------------- */

/** Assemble un bloc PNG : longueur, type, données, somme de contrôle. */
function bloc(type, donnees) {
  const entete = Buffer.alloc(8)
  entete.writeUInt32BE(donnees.length, 0)
  entete.write(type, 4, 'ascii')
  const corps = Buffer.concat([entete.subarray(4), donnees])
  const somme = Buffer.alloc(4)
  somme.writeUInt32BE(crc32(corps) >>> 0, 0)
  return Buffer.concat([entete.subarray(0, 4), corps, somme])
}

const ihdr = Buffer.alloc(13)
ihdr.writeUInt32BE(TAILLE, 0)
ihdr.writeUInt32BE(TAILLE, 4)
ihdr[8] = 8 // 8 bits par canal
ihdr[9] = 2 // type 2 : RVB, sans couche alpha
// compression 0, filtrage 0, entrelacement 0 — déjà à zéro

/*  Chaque ligne est précédée de son octet de filtrage, laissé à 0 (aucun).
 *  Ce n'est pas une facilité : les cinq filtres du format ont été mesurés sur
 *  cette image, et tous l'alourdissent — de 4 % pour le meilleur à 27 % pour le
 *  pire. Un dégradé lisse se comprime déjà très bien tel quel.
 *
 *  L'alpha est écarté : l'image est opaque, et un pixel translucide ici serait
 *  un bogue — d'où le contrôle. */
const LARGEUR_LIGNE = TAILLE * 3
const brut = Buffer.alloc(TAILLE * (1 + LARGEUR_LIGNE))
for (let y = 0; y < TAILLE; y++) {
  const depart = y * (1 + LARGEUR_LIGNE)
  brut[depart] = 0
  for (let x = 0; x < TAILLE; x++) {
    const src = (y * TAILLE + x) * 4
    if (r.pixels[src + 3] !== 255) throw new Error(`pixel translucide en ${x},${y}`)
    const dst = depart + 1 + x * 3
    brut[dst] = r.pixels[src]
    brut[dst + 1] = r.pixels[src + 1]
    brut[dst + 2] = r.pixels[src + 2]
  }
}

writeFileSync(
  SORTIE,
  Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    bloc('IHDR', ihdr),
    bloc('IDAT', deflateSync(brut, { level: 9 })),
    bloc('IEND', Buffer.alloc(0)),
  ]),
)

await nav.close()
console.log(`écrit : ${SORTIE.pathname}`)
