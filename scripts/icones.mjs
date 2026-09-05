/* -------------------------------------------------------------------------- */
/*  Génère toutes les icônes carrées                                           */
/*                                                                            */
/*    node scripts/icones.mjs                                                  */
/*                                                                            */
/*    public/icon-192.png          écran d'accueil, manifeste web              */
/*    public/icon-512.png          idem, et la fiche Play Store                */
/*    public/apple-touch-icon.png  écran d'accueil iOS, depuis Safari          */
/*    ios/…/AppIcon-512@2x.png     l'application de l'App Store                */
/*                                                                            */
/*  L'icône Android « maskable » a son propre script : sa géométrie obéit à    */
/*  une autre règle (voir icone-maskable.mjs).                                 */
/*                                                                            */
/*  Le dessin vient de marque.mjs. Trois de ces quatre fichiers n'avaient       */
/*  aucun script auparavant : ils étaient produits à la main, ailleurs, et un  */
/*  changement de logo les laissait en arrière sans que rien ne le signale.    */
/*                                                                            */
/*  Deux exigences d'Apple, que ce script vérifie plutôt que d'annoncer :      */
/*  l'icône de l'application doit être **opaque** et **sans coins arrondis** — */
/*  iOS applique son propre masque, et des coins déjà arrondis se verraient    */
/*  deux fois.                                                                */
/* -------------------------------------------------------------------------- */

import { writeFileSync } from 'node:fs'
import pw from '/opt/node22/lib/node_modules/playwright/index.js'
import { DEBUT, FIN, marque, PART_LOGO } from './marque.mjs'

const CIBLES = [
  { fichier: '../public/icon-192.png', taille: 192, coins: 0.22, opaque: false },
  { fichier: '../public/icon-512.png', taille: 512, coins: 0.22, opaque: false },
  /*  Coins carrés pour les deux suivantes : iOS pose son propre masque. */
  { fichier: '../public/apple-touch-icon.png', taille: 180, coins: 0, opaque: true },
  {
    fichier: '../ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png',
    taille: 1024,
    coins: 0,
    opaque: true,
  },
]

const nav = await pw.chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })

function page(c, echelle, dx, dy) {
  const fond = c.opaque
    ? `<rect width="${c.taille}" height="${c.taille}" fill="url(#f)"/>`
    : `<rect width="${c.taille}" height="${c.taille}" rx="${c.taille * c.coins}" fill="url(#f)"/>`
  return `<style>html,body{margin:0;padding:0;background:none}</style>
<svg xmlns="http://www.w3.org/2000/svg" width="${c.taille}" height="${c.taille}" viewBox="0 0 ${c.taille} ${c.taille}">
  <defs><linearGradient id="f" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="${DEBUT}"/><stop offset="1" stop-color="${FIN}"/>
  </linearGradient></defs>
  ${fond}
  <g transform="translate(${dx} ${dy}) scale(${echelle})" fill="none" stroke="#fff"
     stroke-linecap="round" stroke-linejoin="round">${marque()}</g>
</svg>`
}

/**
 * Mesure l'encre blanche réellement peinte.
 *
 * Mesurée et non calculée : `getBBox()` ignore l'épaisseur des traits, or la
 * note n'est faite que de traits. S'y fier sous-estimerait le dessin de
 * plusieurs pixels de chaque côté, et le décentrerait — l'éclair, lui, est
 * plein et ne perd rien.
 */
async function mesurer(p, taille) {
  return p.evaluate((t) => {
    const svg = document.querySelector('svg')
    const c = document.createElement('canvas')
    c.width = c.height = t
    const x = c.getContext('2d', { willReadFrequently: true })
    return new Promise((ok) => {
      const img = new Image()
      img.onload = () => {
        x.drawImage(img, 0, 0)
        const d = x.getImageData(0, 0, t, t).data
        let minX = 1e9, minY = 1e9, maxX = -1, maxY = -1
        for (let y = 0; y < t; y++) {
          for (let px = 0; px < t; px++) {
            const i = (y * t + px) * 4
            if (d[i] > 235 && d[i + 1] > 235 && d[i + 2] > 235 && d[i + 3] > 200) {
              if (px < minX) minX = px
              if (px > maxX) maxX = px
              if (y < minY) minY = y
              if (y > maxY) maxY = y
            }
          }
        }
        ok({ x: minX, y: minY, l: maxX - minX + 1, h: maxY - minY + 1 })
      }
      img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svg.outerHTML)))
    })
  }, taille)
}

for (const c of CIBLES) {
  const p = await nav.newPage({ viewport: { width: c.taille, height: c.taille } })

  const cible = c.taille * PART_LOGO
  const centre = c.taille / 2
  let echelle = cible / 18.5 // le dessin fait ~18,5 unités sur les 24 du repère
  let dx = 0
  let dy = 0
  let meilleur = null

  /*  On retient le MEILLEUR essai, pas le dernier : la mesure se fait en pixels
   *  entiers, l'écart n'y descend donc pas continûment vers zéro, il oscille
   *  autour. Sortir sur le dernier tour livrerait un cadrage au hasard. */
  for (let tour = 1; tour <= 8; tour++) {
    await p.setContent(page(c, echelle, dx, dy))
    const b = await mesurer(p, c.taille)
    const ecartX = b.x + b.l / 2 - centre
    const ecartY = b.y + b.h / 2 - centre
    //  Le centrage compte double : l'œil pardonne moins un décalage qu'un écart
    //  de taille d'un pixel.
    const score = Math.abs(b.l - cible) + 2 * (Math.abs(ecartX) + Math.abs(ecartY))
    if (!meilleur || score < meilleur.score) meilleur = { echelle, dx, dy, score, tour }
    if (score < 1) break
    const facteur = cible / b.l
    echelle *= facteur
    dx = (dx - ecartX) * facteur
    dy = (dy - ecartY) * facteur
  }

  await p.setContent(page(c, meilleur.echelle, meilleur.dx, meilleur.dy))
  const png = await p.screenshot({ omitBackground: !c.opaque })

  /*  Le type de couleur est à l'octet 25 de l'en-tête PNG : 2 vaut RVB, 6 RVBA.
   *  Une icône d'application translucide passe la fabrication et se fait
   *  rejeter à l'envoi, des heures plus tard. */
  if (c.opaque && (png[25] === 4 || png[25] === 6)) {
    throw new Error(`${c.fichier} : couche alpha présente alors que l'icône doit être opaque.`)
  }

  const sortie = new URL(c.fichier, import.meta.url)
  writeFileSync(sortie, png)
  console.log(
    `${c.fichier.split('/').pop().padEnd(22)} ${c.taille}×${c.taille}  ` +
      `tour ${meilleur.tour}, écart ${meilleur.score.toFixed(2)}, ${png.length} octets`,
  )
  await p.close()
}

await nav.close()
