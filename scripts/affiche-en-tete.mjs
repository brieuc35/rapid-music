/* -------------------------------------------------------------------------- */
/*  L'affiche d'en-tête de la page produit App Store                           */
/*                                                                            */
/*    node scripts/affiche-en-tete.mjs                                        */
/*                                                                            */
/*  Deux fichiers, dans app-store/ :                                          */
/*                                                                            */
/*    en-tete-5244x2950.png   le format 16:9                                  */
/*    en-tete-3840x1646.png   le format 21:9                                  */
/*                                                                            */
/*  Ce sont les deux seules tailles qu'App Store Connect accepte dans          */
/*  « Informations de la page produit → En-tête et résultats de recherche ».   */
/*  Il en faut une, pas les deux ; les deux sont fabriquées pour qu'on ait le  */
/*  choix sans refaire un aller-retour, comme pour les captures d'examen.      */
/*                                                                            */
/*  AUCUN TEXTE, et c'est délibéré. L'App Store pose lui-même le nom de        */
/*  l'application, son sous-titre et le bouton d'installation par-dessus       */
/*  l'image : un titre dessiné ici se retrouverait sous un autre. Et l'affiche */
/*  est recadrée selon l'appareil, à des rapports qui ne sont pas celui du     */
/*  fichier d'origine — un mot placé près d'un bord disparaît.                 */
/*                                                                            */
/*  D'où une composition symétrique, tout ce qui compte au centre : un         */
/*  recadrage centré y retrouve la même image, quelle que soit sa largeur.     */
/*  C'est le même raisonnement que pour illustration-promo-4320x1080.png, dont */
/*  cette affiche reprend la facture — même nuit violette, mêmes lueurs, même  */
/*  spectre. Deux images de la même application ne doivent pas avoir l'air de  */
/*  venir de deux applications.                                               */
/* -------------------------------------------------------------------------- */

import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chargerPlaywright } from './sonde.mjs'
import { marque, DEBUT, FIN } from './marque.mjs'

const RACINE = join(dirname(fileURLToPath(import.meta.url)), '..')
const SORTIE = join(RACINE, 'app-store')

/*  Rendues à la moitié puis doublées par l'échelle : un navigateur sait
 *  afficher une page de 2622 points de large, il peine au-delà de 4000 — et le
 *  résultat est identique au pixel près, puisque tout est vectoriel. */
const FORMATS = [
  { nom: 'en-tete-5244x2950.png', l: 2622, h: 1475, echelle: 2 },
  { nom: 'en-tete-3840x1646.png', l: 1920, h: 823, echelle: 2 },
]

/**
 * Le profil du spectre : une montagne symétrique, dentelée.
 *
 * Calculé plutôt que tiré au sort : deux exécutions doivent rendre exactement
 * la même image, sans quoi refaire l'affiche après une retouche produirait un
 * second dessin et l'on ne saurait plus lequel est en ligne.
 *
 * Rendu en parts de la hauteur maximale (0 à 1), pour que les deux formats
 * portent le même relief à leur échelle.
 */
function spectre(nombre) {
  const demi = []
  const n = Math.round(nombre / 2)
  for (let i = 0; i < n; i++) {
    //  0 au bord de l'image, 1 au centre. La puissance creuse les extrémités :
    //  le spectre s'efface sur les côtés, qui sont ce qu'un recadrage perd.
    const montee = Math.pow(i / (n - 1), 1.7)
    //  Dentelure reproductible : une suite entière prise modulo, et non un
    //  tirage au sort. Deux barres voisines ne montent jamais pareil.
    const dent = ((i * 2654435761) % 997) / 997
    demi.push(montee * (0.5 + 0.5 * dent))
  }
  return [...demi, ...demi.slice().reverse()]
}

function affiche(l, h) {
  /*  Une barre tous les 48 points, comme sur l'illustration promotionnelle :
   *  c'est ce qui donne au spectre sa densité reconnaissable. Le premier jet en
   *  mettait quatre fois plus — réduites à des cheveux, elles ne formaient plus
   *  un spectre mais un grain. */
  const barres = spectre(Math.round(l / 96) * 2)
  const hautSpectre = h * 0.46
  const cote = Math.round(h * 0.3) // le côté de la marque
  //  1,4 fois la hauteur : la proportion de l'illustration promotionnelle.
  const lueur = Math.round(h * 1.4)

  return `<!doctype html>
<meta charset="utf-8" />
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { width: ${l}px; height: ${h}px; overflow: hidden; }
  .toile { position: relative; width: ${l}px; height: ${h}px; overflow: hidden;
    background: linear-gradient(180deg, #1b1430 0%, #14101f 58%, #0d0a16 100%); }

  /*  Les deux lueurs sont centrées horizontalement, l'une débordant par le
      haut, l'autre par le bas. C'est la disposition de l'illustration
      promotionnelle, et elle n'est pas décorative : une lueur décalée sur un
      côté vide l'autre, et le recadrage que fait l'App Store tombe alors sur
      une image bancale. Centrées, elles résistent à n'importe quelle coupe. */
  .lueur { position: absolute; border-radius: 50%; width: ${lueur}px; height: ${lueur}px;
    left: ${(l - lueur) / 2}px; }
  .lueur-v { top: ${-lueur * 0.47}px;
    background: radial-gradient(circle, rgba(139,92,246,.52) 0%, rgba(139,92,246,0) 62%); }
  .lueur-r { top: ${h - lueur * 0.53}px;
    background: radial-gradient(circle, rgba(236,72,153,.46) 0%, rgba(236,72,153,0) 62%); }

  .spectre { position: absolute; inset: auto 0 0 0; height: ${hautSpectre}px;
    display: flex; align-items: flex-end; gap: ${(l / 190).toFixed(1)}px;
    padding: 0 ${(l / 140).toFixed(1)}px; opacity: .17; }
  .spectre i { flex: 1; border-radius: ${(l / 260).toFixed(1)}px ${(l / 260).toFixed(1)}px 0 0;
    background: linear-gradient(180deg, #ec4899 0%, rgba(139,92,246,0) 100%); }

  /*  Un halo derrière la marque : sans lui, elle flotte seule au milieu d'une
      grande surface sombre, et le format 16:9 en laisse beaucoup. */
  .halo { position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%);
    width: ${cote * 3.1}px; height: ${cote * 3.1}px; border-radius: 50%;
    background: radial-gradient(circle, rgba(236,72,153,.26) 0%, rgba(139,92,246,.10) 42%, rgba(139,92,246,0) 68%); }

  .marque { position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%);
    width: ${cote}px; height: ${cote}px; border-radius: ${cote * 0.26}px;
    background: linear-gradient(135deg, ${DEBUT} 0%, ${FIN} 100%);
    display: grid; place-items: center;
    box-shadow: 0 ${cote * 0.15}px ${cote * 0.4}px rgba(236,72,153,.5),
                0 0 0 ${Math.max(2, cote / 130)}px rgba(255,255,255,.1) inset; }
  .marque svg { width: ${cote * 0.57}px; height: ${cote * 0.57}px; }
</style>
<div class="toile">
  <div class="lueur lueur-v"></div><div class="lueur lueur-r"></div>
  <div class="spectre">${barres
    .map((p) => `<i style="height:${(p * hautSpectre).toFixed(1)}px"></i>`)
    .join('')}</div>
  <div class="halo"></div>
  <div class="marque">
    <svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-linecap="round" stroke-linejoin="round">
      ${marque()}
    </svg>
  </div>
</div>`
}

const { chromium } = chargerPlaywright()
const navigateur = await chromium.launch()

try {
  mkdirSync(SORTIE, { recursive: true })

  for (const f of FORMATS) {
    const page = await navigateur.newPage({
      viewport: { width: f.l, height: f.h },
      deviceScaleFactor: f.echelle,
    })
    await page.setContent(affiche(f.l, f.h))
    const image = await page.screenshot({ type: 'png' })
    writeFileSync(join(SORTIE, f.nom), image)
    await page.close()
    console.log(`${f.nom}  ${f.l * f.echelle} × ${f.h * f.echelle}`)
  }
} finally {
  await navigateur.close()
}
