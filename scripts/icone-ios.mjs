/* -------------------------------------------------------------------------- */
/*  Génère l'icône de l'application iOS                                        */
/*                                                                            */
/*    node scripts/icone-ios.mjs                                               */
/*                                                                            */
/*  Écrit ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png,   */
/*  soit 1024 × 1024 — le seul format qu'Xcode demande désormais, les autres    */
/*  tailles étant dérivées à la compilation.                                    */
/*                                                                            */
/*  Trois règles d'Apple, qu'un fichier retouché à la main enfreint vite :      */
/*                                                                            */
/*   — aucune transparence. Une icône translucide fait rejeter l'envoi ;        */
/*   — aucun coin arrondi. iOS applique son propre masque, et des coins déjà    */
/*     arrondis se verraient deux fois ;                                        */
/*   — le dessin ne va pas jusqu'au bord : le masque d'iOS rogne les angles.    */
/*                                                                            */
/*  À relancer après tout changement du dessin de la marque.                    */
/* -------------------------------------------------------------------------- */

import { writeFileSync } from 'node:fs'
import pw from '/opt/node22/lib/node_modules/playwright/index.js'

const SORTIE = new URL(
  '../ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png',
  import.meta.url,
)
const TAILLE = 1024

/*  Part de la largeur occupée par le dessin.
 *
 *  Plus généreuse que pour l'icône Android (55 % d'un disque déjà réduit) :
 *  le masque d'iOS est un carré à peine adouci, il ne rogne presque rien. À
 *  55 % le dessin y paraîtrait perdu au milieu d'un aplat. */
const PART_LOGO = 0.58

/*  Le dégradé de la marque, identique à celui de l'icône Android — c'est la
 *  même application dans deux magasins. */
const DEBUT = '#8b5cf6'
const FIN = '#d946ef'

/*  Le dessin, dans le repère de 24 unités de src/components/BrandMark.vue.
 *  Recopié plutôt qu'importé : ce script ne passe pas par Vite et ne sait pas
 *  lire un composant Vue. */
const GLYPHE = `
  <path d="M9 16.5V5l8-1.5" stroke-width="2.3"/>
  <circle cx="6" cy="16.5" r="2.6" stroke-width="2.3"/>
  <path d="M17.5 7.5 14 12.5h3.2L14.5 18l6-7h-3.2z" stroke-width="2"/>`

/*  Le glyphe mesure environ 18 unités de large sur les 24 du repère. */
const ECHELLE = (PART_LOGO * TAILLE) / 18
const DECALAGE = (TAILLE - 24 * ECHELLE) / 2

const html = `<style>html,body{margin:0;padding:0}</style>
<svg xmlns="http://www.w3.org/2000/svg" width="${TAILLE}" height="${TAILLE}" viewBox="0 0 ${TAILLE} ${TAILLE}">
  <defs><linearGradient id="f" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="${DEBUT}"/><stop offset="1" stop-color="${FIN}"/>
  </linearGradient></defs>
  <rect width="${TAILLE}" height="${TAILLE}" fill="url(#f)"/>
  <g transform="translate(${DECALAGE} ${DECALAGE}) scale(${ECHELLE})"
     fill="none" stroke="#fff" stroke-linecap="round" stroke-linejoin="round">${GLYPHE}</g>
</svg>`

const nav = await pw.chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const page = await nav.newPage({ viewport: { width: TAILLE, height: TAILLE } })
await page.setContent(html)
const png = await page.screenshot({ omitBackground: false })

/*  Contrôle plutôt que confiance : une icône translucide passe la fabrication
 *  et se fait rejeter à l'envoi, des heures plus tard. Le type de couleur du
 *  PNG est à l'octet 25 de l'en-tête ; 6 vaut RVBA, 4 gris + alpha. */
const typeCouleur = png[25]
if (typeCouleur === 4 || typeCouleur === 6) {
  const opaque = await page.evaluate(async (src) => {
    const img = new Image()
    await new Promise((ok) => { img.onload = ok; img.src = src })
    const c = document.createElement('canvas')
    c.width = c.height = img.width
    const x = c.getContext('2d')
    x.drawImage(img, 0, 0)
    const d = x.getImageData(0, 0, c.width, c.height).data
    for (let i = 3; i < d.length; i += 4) if (d[i] !== 255) return false
    return true
  }, 'data:image/png;base64,' + png.toString('base64'))
  if (!opaque) throw new Error("L'icône contient des pixels translucides : Apple la refuserait.")
}

writeFileSync(SORTIE, png)
await nav.close()
console.log(`écrit : ${SORTIE.pathname} (${TAILLE} × ${TAILLE}, ${png.length} octets)`)
