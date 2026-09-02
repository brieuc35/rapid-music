/* -------------------------------------------------------------------------- */
/*  Génère functions/src/logo.ts — le logo embarqué dans les courriels          */
/*                                                                            */
/*    node scripts/logo-courriel.mjs                                           */
/*                                                                            */
/*  Le glyphe blanc seul, sur fond transparent : il se pose ainsi sur le       */
/*  dégradé de l'en-tête sans y découper un rectangle.                        */
/*                                                                            */
/*  Pourquoi embarqué dans le message, et non chargé depuis rapidmusic.fr :    */
/*  une image liée est bloquée par défaut dans une partie des messageries, et  */
/*  son chargement signale au serveur que le message a été ouvert. Embarquée,  */
/*  elle voyage avec la lettre et ne demande rien à personne.                  */
/*                                                                            */
/*  Écrit en base64 dans un fichier TypeScript plutôt qu'en PNG à côté : la    */
/*  fonction déployée n'a alors aucun fichier à retrouver sur son disque.      */
/* -------------------------------------------------------------------------- */

import { writeFileSync } from 'node:fs'
import { deflateSync, crc32 } from 'node:zlib'
import pw from '/opt/node22/lib/node_modules/playwright/index.js'
import { marque } from './marque.mjs'

const SORTIE = new URL('../functions/src/logo.ts', import.meta.url)
/*  96 px pour un affichage à 24 : les écrans à forte densité y gagnent, et le
 *  fichier reste sous les 4 Ko. */
const TAILLE = 96

/*  Le dessin de la marque, dans le repère de 24 unités de public/favicon.svg. */
const SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="${TAILLE}" height="${TAILLE}" viewBox="0 0 24 24">
  <g fill="none" stroke="#fff" stroke-linecap="round" stroke-linejoin="round">
    ${marque(2.3)}
  </g>
</svg>`

const nav = await pw.chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const page = await (await nav.newContext()).newPage()
await page.setContent(`<canvas id="c" width="${TAILLE}" height="${TAILLE}"></canvas>`)
const pixels = await page.evaluate(
  async ([source, taille]) => {
    const img = new Image()
    await new Promise((ok, ko) => {
      img.onload = ok
      img.onerror = ko
      img.src = 'data:image/svg+xml;base64,' + btoa(source)
    })
    const c = document.getElementById('c')
    const ctx = c.getContext('2d', { willReadFrequently: true })
    ctx.clearRect(0, 0, taille, taille)
    ctx.drawImage(img, 0, 0, taille, taille)
    return [...ctx.getImageData(0, 0, taille, taille).data]
  },
  [SVG, TAILLE],
)
await nav.close()

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
ihdr[9] = 6 // type 6 : RVB + alpha — la transparence est ici indispensable

const LARGEUR_LIGNE = TAILLE * 4
const brut = Buffer.alloc(TAILLE * (1 + LARGEUR_LIGNE))
for (let y = 0; y < TAILLE; y++) {
  const depart = y * (1 + LARGEUR_LIGNE)
  brut[depart] = 0 // aucun filtrage
  for (let i = 0; i < LARGEUR_LIGNE; i++) {
    brut[depart + 1 + i] = pixels[y * LARGEUR_LIGNE + i]
  }
}

const png = Buffer.concat([
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  bloc('IHDR', ihdr),
  bloc('IDAT', deflateSync(brut, { level: 9 })),
  bloc('IEND', Buffer.alloc(0)),
])

writeFileSync(
  SORTIE,
  `/*  Le logo embarqué dans les courriels — glyphe blanc, fond transparent.
 *
 *  NE PAS MODIFIER À LA MAIN : ce fichier est produit par
 *  \`node scripts/logo-courriel.mjs\`, qui explique aussi pourquoi le logo est
 *  embarqué plutôt que chargé depuis le site.
 *
 *  ${TAILLE}×${TAILLE} px, ${png.length} octets avant encodage.  */
export const LOGO_BASE64 =
  '${png.toString('base64')}'
`,
)
console.log(`écrit : ${SORTIE.pathname} — PNG de ${png.length} octets`)
