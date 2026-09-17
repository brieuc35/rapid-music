/* -------------------------------------------------------------------------- */
/*  Les images des fiches de magasin                                           */
/*                                                                            */
/*    node scripts/fiche-play-store.mjs                                        */
/*                                                                            */
/*  Produit dans play-store/ :                                                 */
/*    — l'image de mise en avant, 1024 × 500 exactement ;                      */
/*    — six captures d'écran de téléphone, 1080 × 2160 ;                       */
/*    — six visuels : la capture posée dans un cadre de téléphone, sur le      */
/*      violet de la marque et sous une phrase, 1080 × 1920.                   */
/*                                                                            */
/*  Et dans app-store/ : les six mêmes écrans aux deux tailles qu'Apple        */
/*  accepte, 1320 × 2868 et 1290 × 2796.                                       */
/*                                                                            */
/*  Le nom du fichier est resté celui du seul magasin qu'il servait au départ. */
/*  Le renommer casserait la commande écrite dans trois documents, pour un      */
/*  gain de rangement.                                                        */
/*                                                                            */
/*  Pourquoi un script et non des captures faites à la main : l'interface      */
/*  change souvent, et une fiche montrant une version d'il y a trois mois se   */
/*  remarque. Ici, une seule commande refait la série entière, identique à     */
/*  chaque fois.                                                              */
/*                                                                            */
/*  Le serveur de développement est démarré puis arrêté par le script. Il sert */
/*  une page d'essai qui simule une session : sans elle, l'application         */
/*  n'afficherait que l'écran de connexion. Cette page est écrite dans un      */
/*  fichier temporaire et effacée à la fin — elle ne part jamais en ligne.     */
/* -------------------------------------------------------------------------- */

import { mkdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { marque } from './marque.mjs'
import {
  attendre,
  chargerPlaywright,
  demarrerApp,
  filtreAVenir,
  PAGE,
  poserLaScene,
  RACINE,
} from './sonde.mjs'

const SORTIE = join(RACINE, 'play-store')
const pw = chargerPlaywright()

/* -------------------------------------------------------------------------- */
/*  L'image de mise en avant du Play Store                                     */
/* -------------------------------------------------------------------------- */

/*  Hauteurs du spectre sonore, figées : une image tirée au hasard changerait à
 *  chaque fabrication, et on ne saurait plus laquelle a été envoyée. */
const SPECTRE = [
  22, 46, 30, 68, 40, 96, 54, 120, 74, 150, 88, 176, 104, 200, 118,
  168, 96, 138, 76, 112, 58, 92, 44, 70, 34, 54, 26, 42, 20, 34,
]

const MISE_EN_AVANT = `<!doctype html>
<meta charset="utf-8" />
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap" rel="stylesheet" />
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { width: 1024px; height: 500px; overflow: hidden; }
  body { font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #14101f; }
  .toile { position: relative; width: 1024px; height: 500px; background: #14101f; overflow: hidden; }
  .lueur-a, .lueur-b { position: absolute; border-radius: 50%; }
  .lueur-a { width: 900px; height: 900px; left: -260px; top: -420px;
    background: radial-gradient(circle, rgba(139,92,246,.55) 0%, rgba(139,92,246,0) 62%); }
  .lueur-b { width: 820px; height: 820px; right: -240px; bottom: -400px;
    background: radial-gradient(circle, rgba(236,72,153,.5) 0%, rgba(236,72,153,0) 62%); }
  .spectre { position: absolute; inset: auto 0 0 0; height: 250px; display: flex;
    align-items: flex-end; gap: 9px; padding: 0 40px; opacity: .14; }
  .spectre i { flex: 1; border-radius: 6px 6px 0 0;
    background: linear-gradient(180deg, #ec4899 0%, rgba(139,92,246,0) 100%); }
  /*  Centré : Google recadre parfois cette image en 16/9, ce qui rogne 67 px de
      chaque côté. Un logo posé près du bord y perdrait la tête. */
  .contenu { position: absolute; inset: 0; display: flex; align-items: center;
    justify-content: center; gap: 38px; padding: 0 78px; }
  .marque { width: 132px; height: 132px; flex: none; border-radius: 34px;
    background: linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%);
    display: grid; place-items: center;
    box-shadow: 0 26px 60px rgba(236,72,153,.42), 0 0 0 1px rgba(255,255,255,.1) inset; }
  .marque svg { width: 74px; height: 74px; }
  .nom { font-size: 66px; font-weight: 800; letter-spacing: -.03em; color: #fff; line-height: 1; }
  .nom b { color: #e879f9; }
  .accroche { margin-top: 14px; font-size: 25px; font-weight: 600;
    letter-spacing: -.01em; color: rgba(255,255,255,.86); line-height: 1.28; }
  .puces { margin-top: 24px; display: flex; gap: 10px; }
  .puce { font-size: 17px; font-weight: 600; color: rgba(255,255,255,.92);
    background: rgba(255,255,255,.1); border: 1px solid rgba(255,255,255,.16);
    border-radius: 100px; padding: 8px 17px; }
</style>
<div class="toile">
  <div class="lueur-a"></div><div class="lueur-b"></div>
  <div class="spectre">${SPECTRE.map((h) => `<i style="height:${h}px"></i>`).join('')}</div>
  <div class="contenu">
    <div class="marque">
      <svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-linecap="round" stroke-linejoin="round">
        ${marque()}
      </svg>
    </div>
    <div>
      <div class="nom">Rapid<b>Music</b></div>
      <div class="accroche">Tout votre univers, au même endroit.</div>
      <div class="puces">
        <span class="puce">Concerts</span><span class="puce">Sorties</span>
        <span class="puce">Contrats</span><span class="puce">Contacts</span>
      </div>
    </div>
  </div>
</div>`

/* -------------------------------------------------------------------------- */
/*  L'illustration promotionnelle de l'App Store                               */
/*                                                                            */
/*  Le pendant Apple de l'image de mise en avant, à trois différences près.    */
/*                                                                            */
/*  Elle ne se téléverse pas quand on veut : l'emplacement n'apparaît dans     */
/*  App Store Connect que si l'équipe éditoriale d'Apple retient l'application */
/*  pour l'onglet Aujourd'hui. Elle est donc fabriquée d'avance, pour le jour  */
/*  où — et elle sert en attendant partout ailleurs qu'un bandeau large sert.  */
/*                                                                            */
/*  Aucun texte : Apple l'interdit ici, et pose lui-même le nom de             */
/*  l'application par-dessus. D'où l'absence de la signature et des mots-clés  */
/*  qui portent l'image du Play Store — ce qui reste doit tenir tout seul.     */
/*                                                                            */
/*  Recadrée sans qu'on le demande, et pas toujours au même rapport : la même  */
/*  illustration sert de bandeau très large sur une fiche et de vignette       */
/*  presque carrée dans l'onglet Aujourd'hui. Tout ce qui compte tient donc    */
/*  dans le carré central, et la composition est symétrique — un recadrage     */
/*  centré y trouve la même image, quelle que soit sa largeur.                 */
/* -------------------------------------------------------------------------- */

const PROMO_L = 4320
const PROMO_H = 1080

/*  Quarante-cinq hauteurs, du bord vers le centre, puis leur miroir : le
 *  spectre est ainsi symétrique, et le carré central en attrape le sommet. */
const SPECTRE_DEMI = [
  22, 48, 30, 66, 42, 88, 56, 112, 70, 138, 84, 166, 100, 194, 118, 224,
  136, 252, 120, 208, 104, 176, 92, 204, 116, 240, 142, 276, 168, 310,
  196, 342, 224, 368, 250, 390, 272, 406, 290, 418, 304, 426, 314, 430, 320,
]
const SPECTRE_LARGE = [...SPECTRE_DEMI, ...[...SPECTRE_DEMI].reverse()]

const PROMO_APPLE = `<!doctype html>
<meta charset="utf-8" />
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { width: ${PROMO_L}px; height: ${PROMO_H}px; overflow: hidden; }
  .toile { position: relative; width: ${PROMO_L}px; height: ${PROMO_H}px; overflow: hidden;
    background: linear-gradient(180deg, #1b1430 0%, #14101f 58%, #0d0a16 100%); }
  .lueur { position: absolute; border-radius: 50%; }
  /*  Deux lueurs de part et d'autre, à distance égale du centre : c'est ce qui
      garde l'image équilibrée quand elle est recadrée en carré. */
  .lueur-g { width: 1500px; height: 1500px; left: 1410px; top: -700px;
    background: radial-gradient(circle, rgba(139,92,246,.50) 0%, rgba(139,92,246,0) 62%); }
  .lueur-d { width: 1500px; height: 1500px; right: 1410px; bottom: -700px;
    background: radial-gradient(circle, rgba(236,72,153,.46) 0%, rgba(236,72,153,0) 62%); }
  .spectre { position: absolute; inset: auto 0 0 0; height: ${PROMO_H}px;
    display: flex; align-items: flex-end; gap: 14px; padding: 0 30px; opacity: .17; }
  .spectre i { flex: 1; border-radius: 10px 10px 0 0;
    background: linear-gradient(180deg, #ec4899 0%, rgba(139,92,246,0) 100%); }
  /*  La marque, seule au centre, et rien d'autre : c'est tout ce qui doit
      survivre au recadrage le plus serré. */
  .marque { position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%);
    width: 400px; height: 400px; border-radius: 104px;
    background: linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%);
    display: grid; place-items: center;
    box-shadow: 0 60px 160px rgba(236,72,153,.5), 0 0 0 3px rgba(255,255,255,.1) inset; }
  .marque svg { width: 228px; height: 228px; }
</style>
<div class="toile">
  <div class="lueur lueur-g"></div><div class="lueur lueur-d"></div>
  <div class="spectre">${SPECTRE_LARGE.map((h) => `<i style="height:${h}px"></i>`).join('')}</div>
  <div class="marque">
    <svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-linecap="round" stroke-linejoin="round">
      ${marque()}
    </svg>
  </div>
</div>`

/* -------------------------------------------------------------------------- */
/*  Les captures d'écran                                                       */
/* -------------------------------------------------------------------------- */

/*  360 × 720 à l'échelle 3 → 1080 × 2160, soit exactement 2:1. Google refuse
 *  au-delà : le format réel d'un téléphone, 1080 × 2340, est à 2,17. */
const LARGEUR = 360
const HAUTEUR = 720
const ECHELLE = 3

/*  La mise en scène vient de la sonde : l'aperçu vidéo montre les mêmes écrans
 *  et doit les montrer pareil. Seul le filtre des concerts est propre à cet
 *  écran-là. */
const ECRANS = [
  { route: '/tableau-de-bord', nom: '1-tableau-de-bord' },
  { route: '/concerts', nom: '2-concerts', apres: filtreAVenir },
  { route: '/studio', nom: '3-agenda' },
  { route: '/taches', nom: '4-taches' },
  { route: '/sorties', nom: '5-sorties' },
  { route: '/mon-profil', nom: '6-profil' },
]

/* -------------------------------------------------------------------------- */
/*  Les visuels : la capture posée dans un téléphone, sur fond de marque       */
/*                                                                            */
/*  Une capture brute montre l'application ; elle ne dit pas à quoi elle sert. */
/*  Ces visuels-là portent une phrase, et c'est elle qu'on lit en faisant      */
/*  défiler la fiche — l'écran vient l'appuyer, pas l'inverse.                 */
/*                                                                            */
/*  1080 × 1920, soit 9:16. Le rapport reste sous la limite de 2:1, et c'est   */
/*  le format des fiches soignées du Store.                                    */
/* -------------------------------------------------------------------------- */

/*  Les formats produits. Un par emplacement de magasin, et le dessin est le
 *  même partout — seule la toile change.
 *
 *  Google veut du 1080 × 1920. Apple veut les dimensions exactes d'un appareil,
 *  et range les siennes par classe d'écran : le 6,9 pouces couvre aujourd'hui
 *  1320 × 2868, et 1290 × 2796 sert aux Pro Max plus anciens. Les deux sont
 *  produites, parce que l'emplacement réclamé dépend de la version d'App Store
 *  Connect qu'on a sous les yeux, et qu'une image refusée se découvre après
 *  avoir rempli tout le reste du formulaire.
 *
 *  Les toiles sont décrites à l'échelle 2 : c'est le rendu qui double. */
const FORMATS = [
  {
    magasin: 'play-store',
    prefixe: 'visuel',
    l: 540,
    h: 960,
    /*  Figé, et non calculé comme les suivants : ces images sont déjà en ligne
     *  sur la fiche Google. Les recalculer les changerait sans raison. */
    tel: { largeur: 300, hauteur: 576, cadre: 12, haut: 252 },
    titre: { haut: 62, taille: 42, marge: 44 },
  },
  cadreApple('iphone-6.9', 660, 1434),
  cadreApple('iphone-6.7', 645, 1398),
]

/**
 * Compose un format Apple à partir de sa seule toile.
 *
 * Les toiles d'Apple sont bien plus élancées que celle de Google — 1:2,17
 * contre 1:1,78 — et y reporter les nombres du Play Store laisserait le
 * téléphone perdu au milieu du vide. Tout est donc tiré de la toile : le
 * téléphone occupe la même part de la largeur, et se centre dans ce qui reste
 * sous le titre.
 *
 * L'écran fait exactement le double en hauteur de sa largeur, comme la capture.
 * C'est cette égalité que le contrôle plus bas vérifie, pour tous les formats.
 */
function cadreApple(prefixe, l, h) {
  const largeur = Math.round(l * 0.72)
  const cadre = Math.round(largeur * 0.03)
  const ecranL = largeur - 2 * cadre
  const hauteur = 2 * ecranL + 2 * cadre

  const titre = { haut: Math.round(h * 0.055), taille: Math.round(l * 0.078), marge: Math.round(l * 0.09) }
  //  Deux lignes de titre, plus un peu d'air avant le téléphone.
  const basDuTitre = titre.haut + Math.round(titre.taille * 1.12 * 2)

  return {
    magasin: 'app-store',
    prefixe,
    l,
    h,
    tel: { largeur, hauteur, cadre, haut: Math.round(basDuTitre + (h - basDuTitre - hauteur) / 2) },
    titre,
  }
}

/*  Le rognage se ferait sans bruit : `cover` remplit toujours le cadre, et rien
 *  dans l'image produite ne dirait que les bords ont sauté. D'où ce contrôle,
 *  plutôt qu'une note dans un commentaire.
 *
 *  Il ne peut pas échouer sur les formats Apple : `cadreApple` y dérive la
 *  hauteur de l'écran de sa largeur, le rapport y est donc vrai par
 *  construction — ce qui vaut mieux qu'une vérification. Il protège l'entrée
 *  figée du Play Store, dont les quatre nombres sont indépendants, et il
 *  protégera de la même façon tout format qu'on écrirait à la main plus tard. */
for (const f of FORMATS) {
  const ecranL = f.tel.largeur - 2 * f.tel.cadre
  const ecranH = f.tel.hauteur - 2 * f.tel.cadre
  if (ecranL * HAUTEUR !== ecranH * LARGEUR) {
    const rogne = Math.abs(ecranL - (ecranH * LARGEUR) / HAUTEUR) / 2
    throw new Error(
      `${f.prefixe} : le cadre du téléphone (${ecranL} × ${ecranH}) n'a pas le rapport ` +
        `de la capture (${LARGEUR} × ${HAUTEUR}) : « cover » rognerait ${rogne.toFixed(1)} px ` +
        `de chaque côté, et avec eux la marge des pages de l'application.`,
    )
  }
  if (f.tel.hauteur + f.tel.haut > f.h) {
    throw new Error(`${f.prefixe} : le téléphone dépasse le bas de la toile.`)
  }
}

/*  Deux fonds, alternés. Le même violet de bout en bout donnerait un carrousel
 *  monotone ; six fonds différents feraient six applications. Deux suffisent à
 *  donner du rythme sans casser l'unité. */
const FONDS = [
  {
    base: 'linear-gradient(160deg, #1b1430 0%, #14101f 55%, #2a1140 100%)',
    halos: [
      'width:640px;height:640px;right:-180px;top:-180px;background:radial-gradient(circle,rgba(139,92,246,.42) 0%,rgba(139,92,246,0) 62%)',
      'width:720px;height:720px;left:-140px;top:300px;background:radial-gradient(circle,rgba(236,72,153,.38) 0%,rgba(236,72,153,0) 62%)',
    ],
  },
  {
    base: 'linear-gradient(200deg, #2a1140 0%, #14101f 50%, #1b1430 100%)',
    halos: [
      'width:680px;height:680px;left:-200px;top:-160px;background:radial-gradient(circle,rgba(236,72,153,.40) 0%,rgba(236,72,153,0) 62%)',
      'width:700px;height:700px;right:-160px;top:340px;background:radial-gradient(circle,rgba(139,92,246,.40) 0%,rgba(139,92,246,0) 62%)',
    ],
  },
]

/*  Une phrase par écran : ce que l'artiste y gagne, pas ce que l'écran
 *  contient. « Vos dates, salle par salle » dit mieux le métier que
 *  « Liste des concerts ». */
const VISUELS = [
  ['1-tableau-de-bord', 'Pilotez mieux<br />votre carrière'],
  ['2-concerts', 'Vos dates,<br />salle par salle'],
  ['3-agenda', 'Séances studio,<br />interviews, réunions'],
  ['4-taches', 'Ce qu’il reste à faire,<br />et pour quand'],
  ['5-sorties', 'Votre catalogue<br />musical'],
  ['6-profil', 'Votre profil<br />d’artiste'],
]

function pageVisuel(f, titre, imageBase64, fond) {
  return `<!doctype html>
<meta charset="utf-8" />
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@600;700;800&display=swap" rel="stylesheet" />
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { width: ${f.l}px; height: ${f.h}px; overflow: hidden; }
  body { font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
  .scene { position: relative; width: ${f.l}px; height: ${f.h}px; overflow: hidden; background: ${fond.base}; }
  .halo { position: absolute; }
  .titre {
    position: absolute; top: ${f.titre.haut}px; left: 0; right: 0; text-align: center;
    padding: 0 ${f.titre.marge}px; font-size: ${f.titre.taille}px; font-weight: 800; line-height: 1.12; letter-spacing: -.02em; color: #fff;
  }
  /*  Le téléphone est droit, sans rotation : incliné, l'écran se lit de biais et
      les copies d'écran perdent en netteté sur les bords. L'ombre portée suffit
      à le détacher du fond.

      Les dimensions viennent de TEL, et le rapport de l'écran y est contrôlé :
      tant qu'il différait de celui de la capture, \`cover\` rognait 14,3 px de
      chaque bord. La marge intérieure des pages de l'application étant de 18 px,
      il n'en restait que 3,7 et le contenu touchait le cadre.

      Le corps est donc un peu moins élancé qu'un vrai téléphone (1,92 contre
      2,1). C'est la conséquence d'un écran en 1:2, imposé lui-même par Google,
      qui refuse une capture dont le grand côté dépasse le double du petit. */
  .socle { position: absolute; inset: 0; }
  .tel {
    position: absolute; left: 50%; top: ${f.tel.haut}px;
    width: ${f.tel.largeur}px; height: ${f.tel.hauteur}px;
    transform: translateX(-50%);
    border-radius: ${Math.round(f.tel.cadre * 3.2)}px; background: #0b0812; padding: ${f.tel.cadre}px;
    box-shadow: 0 60px 90px rgba(0,0,0,.55), 0 0 0 1.5px rgba(255,255,255,.14), 0 0 0 8px rgba(255,255,255,.05);
  }
  .ecran { width: 100%; height: 100%; border-radius: ${Math.round(f.tel.cadre * 2.2)}px; overflow: hidden; background: #fff; position: relative; }
  /*  \`height: 100%\` autant que \`width\` : sans elle l'image garde ses
      proportions, ne remplit pas le cadre, et laisse une bande blanche sous la
      barre d'onglets. \`cover\` ne recadre que si les deux sont contraints. */
  .ecran img { width: 100%; height: 100%; display: block; object-fit: cover; object-position: top center; }
  /*  Un reflet oblique, pour que le verre se lise comme du verre. */
  .ecran::after {
    content: ''; position: absolute; inset: 0;
    background: linear-gradient(115deg, rgba(255,255,255,.20) 0%, rgba(255,255,255,0) 38%);
  }
</style>
<div class="scene">
  ${fond.halos.map((h) => `<div class="halo" style="${h}"></div>`).join('')}
  <div class="titre">${titre}</div>
  <div class="socle">
    <div class="tel"><div class="ecran"><img src="data:image/png;base64,${imageBase64}" /></div></div>
  </div>
</div>`
}

/* -------------------------------------------------------------------------- */

async function principal() {
  mkdirSync(SORTIE, { recursive: true })
  const navigateur = await pw.chromium.launch({
    executablePath: process.env.PLAYWRIGHT_CHROMIUM || undefined,
  })

  // ---- l'image de mise en avant : aucun serveur nécessaire
  {
    const page = await navigateur.newPage({
      viewport: { width: 1024, height: 500 },
      deviceScaleFactor: 1,
    })
    await page.setContent(MISE_EN_AVANT)
    await page.waitForFunction(() => document.fonts.ready.then(() => true))
    await attendre(500)
    const fichier = join(SORTIE, 'mise-en-avant-1024x500.png')
    await page.screenshot({ path: fichier })
    console.log('mise-en-avant-1024x500.png'.padEnd(30), statSync(fichier).size, 'octets')
    await page.close()
  }

  // ---- l'illustration promotionnelle d'Apple : pas de serveur non plus
  {
    mkdirSync(join(RACINE, 'app-store'), { recursive: true })
    const page = await navigateur.newPage({
      viewport: { width: PROMO_L, height: PROMO_H },
      deviceScaleFactor: 1,
    })
    await page.setContent(PROMO_APPLE)
    await attendre(500)
    const bref = `illustration-promo-${PROMO_L}x${PROMO_H}.png`
    const fichier = join(RACINE, 'app-store', bref)
    await page.screenshot({ path: fichier })
    console.log(bref.padEnd(30), statSync(fichier).size, 'octets')
    await page.close()
  }

  // ---- les captures : il faut l'application, donc le serveur
  const app = await demarrerApp()

  try {
    for (const ecran of ECRANS) {
      const page = await navigateur.newPage({
        viewport: { width: LARGEUR, height: HAUTEUR },
        deviceScaleFactor: ECHELLE,
      })
      page.on('pageerror', (e) => console.error(`  ${ecran.nom} :`, e.message))
      await page.goto(`${PAGE}#${ecran.route}`)
      await page.waitForSelector('.tabbar', { timeout: 20000 })
      await attendre(1000)
      await poserLaScene(page)
      if (ecran.apres) await ecran.apres(page)
      await attendre(600)
      const fichier = join(SORTIE, `capture-${ecran.nom}.png`)
      await page.screenshot({ path: fichier })
      console.log(`capture-${ecran.nom}.png`.padEnd(30), statSync(fichier).size, 'octets')
      await page.close()
    }
    // ---- les visuels : les captures qu'on vient de produire, mises en scène.
    //      Les mêmes six écrans, habillés une fois par emplacement de magasin.
    for (const f of FORMATS) {
      const dossier = join(RACINE, f.magasin)
      mkdirSync(dossier, { recursive: true })

      for (const [i, [nom, titre]] of VISUELS.entries()) {
        const capture = readFileSync(join(SORTIE, `capture-${nom}.png`)).toString('base64')
        const page = await navigateur.newPage({
          viewport: { width: f.l, height: f.h },
          deviceScaleFactor: 2,
        })
        await page.setContent(pageVisuel(f, titre, capture, FONDS[i % FONDS.length]))
        await page.waitForFunction(() => document.fonts.ready.then(() => true))
        await attendre(500)
        const bref = `${f.prefixe}-${nom}.png`
        const fichier = join(dossier, bref)
        await page.screenshot({ path: fichier })
        console.log(bref.padEnd(34), `${f.l * 2}×${f.h * 2}`.padEnd(11), statSync(fichier).size, 'octets')
        await page.close()
      }
    }
  } finally {
    app.arreter()
    await navigateur.close()
  }

  console.log(`\nÀ envoyer depuis ${SORTIE}`)
}

principal().catch((e) => {
  console.error(e)
  process.exit(1)
})
