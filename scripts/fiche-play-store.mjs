/* -------------------------------------------------------------------------- */
/*  Les images de la fiche Play Store                                          */
/*                                                                            */
/*    node scripts/fiche-play-store.mjs                                        */
/*                                                                            */
/*  Produit dans play-store/ :                                                 */
/*    — l'image de mise en avant, 1024 × 500 exactement ;                      */
/*    — six captures d'écran de téléphone, 1080 × 2160 ;                       */
/*    — six visuels : la capture posée dans un cadre de téléphone, sur le      */
/*      violet de la marque et sous une phrase, 1080 × 1920.                   */
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

import { spawn } from 'node:child_process'
import { mkdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { marque } from './marque.mjs'

const RACINE = join(dirname(fileURLToPath(import.meta.url)), '..')
const SORTIE = join(RACINE, 'play-store')
const PORT = 5177
const BASE = `http://localhost:${PORT}`

/*  Playwright n'est pas une dépendance du projet : il pèse plus lourd que
 *  l'application et ne sert qu'ici. Il est pris là où l'environnement l'a
 *  installé. */
const require = createRequire(import.meta.url)
let pw
for (const chemin of ['playwright', '/opt/node22/lib/node_modules/playwright/index.js']) {
  try {
    pw = require(chemin)
    break
  } catch {
    /* essai suivant */
  }
}
if (!pw) {
  console.error("Playwright est introuvable. Installez-le : npm i -D playwright")
  process.exit(1)
}

/* -------------------------------------------------------------------------- */
/*  L'image de mise en avant                                                   */
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
        ${marque(2)}
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
/*  Les captures d'écran                                                       */
/* -------------------------------------------------------------------------- */

/*  360 × 720 à l'échelle 3 → 1080 × 2160, soit exactement 2:1. Google refuse
 *  au-delà : le format réel d'un téléphone, 1080 × 2340, est à 2,17. */
const LARGEUR = 360
const HAUTEUR = 720
const ECHELLE = 3

/*  Des tâches réalistes : la démonstration livre un écran vide, qui ne montre
 *  rien de ce que fait l'application. Rien n'est inventé — ce sont des tâches
 *  que le formulaire de l'application produit telles quelles. */
const TACHES = [
  ['Relancer le Trabendo pour le contrat', 2, 'Haute', 'Contrat'],
  ['Envoyer les visuels à la presse', 5, 'Haute', 'Promotion'],
  ['Réserver le studio pour le mix', 9, 'Normale', 'Studio'],
  ['Déclarer les titres à la SACEM', 14, 'Normale', 'Administratif'],
  ['Préparer la setlist de la tournée', 21, 'Basse', 'Concert'],
]

const ECRANS = [
  { route: '/tableau-de-bord', nom: '1-tableau-de-bord' },
  {
    route: '/concerts',
    nom: '2-concerts',
    // Une date passée en tête de liste n'est pas ce qu'on montre d'une tournée.
    async apres(page) {
      const filtre = page.locator('button:has-text("À venir")').first()
      if (await filtre.count()) await filtre.click()
    },
  },
  { route: '/studio', nom: '3-agenda' },
  {
    route: '/taches',
    nom: '4-taches',
    async apres(page) {
      await page.evaluate((taches) => {
        const jour = (n) => {
          const d = new Date()
          d.setDate(d.getDate() + n)
          return d.toISOString().slice(0, 10)
        }
        window.__store.tasks.push(
          ...taches.map(([title, j, priority, category], i) => ({
            id: 'fiche-' + i, title, done: false, due: jour(j),
            priority, category, notes: '', doneAt: '',
          })),
        )
      }, TACHES)
    },
  },
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

const VISUEL_L = 540
const VISUEL_H = 960

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
/*  Le cadre du téléphone.
 *
 *  L'écran doit garder le rapport exact de la capture, sinon \`cover\` remplit le
 *  cadre en rognant les bords — et il le fait sans bruit : l'image produite a
 *  l'air correcte, elle a simplement perdu la marge de l'application. C'est
 *  arrivé, d'où le contrôle plus bas plutôt qu'une note dans un commentaire. */
const TEL = { largeur: 300, hauteur: 576, cadre: 12, haut: 252 }
const ECRAN_L = TEL.largeur - 2 * TEL.cadre
const ECRAN_H = TEL.hauteur - 2 * TEL.cadre

if (ECRAN_L * HAUTEUR !== ECRAN_H * LARGEUR) {
  const rogne = Math.abs(ECRAN_L - (ECRAN_H * LARGEUR) / HAUTEUR) / 2
  throw new Error(
    `Le cadre du téléphone (${ECRAN_L} × ${ECRAN_H}) n'a pas le rapport de la ` +
      `capture (${LARGEUR} × ${HAUTEUR}) : « cover » rognerait ${rogne.toFixed(1)} px ` +
      `de chaque côté, et avec eux la marge des pages de l'application.`,
  )
}

const VISUELS = [
  ['1-tableau-de-bord', 'Pilotez mieux<br />votre carrière'],
  ['2-concerts', 'Vos dates,<br />salle par salle'],
  ['3-agenda', 'Séances studio,<br />interviews, réunions'],
  ['4-taches', 'Ce qu’il reste à faire,<br />et pour quand'],
  ['5-sorties', 'Votre catalogue<br />musical'],
  ['6-profil', 'Votre profil<br />d’artiste'],
]

function pageVisuel(titre, imageBase64, fond) {
  return `<!doctype html>
<meta charset="utf-8" />
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@600;700;800&display=swap" rel="stylesheet" />
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { width: ${VISUEL_L}px; height: ${VISUEL_H}px; overflow: hidden; }
  body { font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
  .scene { position: relative; width: ${VISUEL_L}px; height: ${VISUEL_H}px; overflow: hidden; background: ${fond.base}; }
  .halo { position: absolute; }
  .titre {
    position: absolute; top: 62px; left: 0; right: 0; text-align: center; padding: 0 44px;
    font-size: 42px; font-weight: 800; line-height: 1.12; letter-spacing: -.02em; color: #fff;
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
    position: absolute; left: 50%; top: ${TEL.haut}px;
    width: ${TEL.largeur}px; height: ${TEL.hauteur}px;
    transform: translateX(-50%);
    border-radius: 38px; background: #0b0812; padding: ${TEL.cadre}px;
    box-shadow: 0 60px 90px rgba(0,0,0,.55), 0 0 0 1.5px rgba(255,255,255,.14), 0 0 0 8px rgba(255,255,255,.05);
  }
  .ecran { width: 100%; height: 100%; border-radius: 26px; overflow: hidden; background: #fff; position: relative; }
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

const SONDE_TS = `import { createApp, watch } from 'vue'
import { router } from './src/router'
import App from './src/App.vue'
import './src/styles/main.css'
import { currentUser, store, authReady } from './src/store'

// Firebase annonce d'abord \`null\` : poser la session avant qu'il ait répondu
// la ferait effacer aussitôt.
watch(authReady, (pret) => {
  if (!pret) return
  currentUser.value = { uid: 'fiche', email: 'fiche@exemple.fr', emailVerified: true }
  store.onboarded = true
})
window.__store = store
createApp(App).use(router).mount('#app')
`

const SONDE_HTML = `<!doctype html>
<html lang="fr"><head><meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" /><title>fiche</title></head>
<body><div id="app"></div><script type="module" src="/_fiche.ts"></script></body></html>
`

function attendre(ms) {
  return new Promise((r) => setTimeout(r, ms))
}

async function serveurPret(url, essais = 90) {
  for (let i = 0; i < essais; i++) {
    try {
      const r = await fetch(url)
      if (r.ok) return true
    } catch {
      /* pas encore là */
    }
    await attendre(500)
  }
  return false
}

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

  // ---- les captures : il faut l'application, donc le serveur
  const sondeTs = join(RACINE, '_fiche.ts')
  const sondeHtml = join(RACINE, '_fiche.html')
  writeFileSync(sondeTs, SONDE_TS)
  writeFileSync(sondeHtml, SONDE_HTML)

  /*  La sortie de Vite est gardée, pas jetée : quand le serveur ne démarre pas,
   *  c'est la seule chose qui dise pourquoi. La perdre transformait une panne
   *  explicite — port occupé, dépendance manquante — en un « n'a pas démarré »
   *  qui n'apprend rien. */
  /*  `detached` fait de `npx` le chef de son groupe de processus, ce qui permet
   *  de tuer le groupe entier à la fin — vite compris.
   *
   *  Sans cela, le script ne rendait pas la main : `vite.kill()` ne tue que
   *  l'enveloppe `npx`, qui ne transmet pas le signal, et le vrai serveur vite
   *  lui survivait. Ses tuyaux restant ouverts, Node gardait la boucle
   *  d'évènements en vie — les treize images étaient produites, puis le script
   *  attendait indéfiniment sans rien dire. */
  const vite = spawn('npx', ['vite', '--port', String(PORT), '--strictPort'], {
    cwd: RACINE,
    stdio: ['ignore', 'pipe', 'pipe'],
    detached: true,
  })
  let journalVite = ''
  vite.stdout.on('data', (d) => (journalVite += d))
  vite.stderr.on('data', (d) => (journalVite += d))

  try {
    if (!(await serveurPret(`${BASE}/_fiche.html`))) {
      throw new Error(
        `Le serveur de développement n'a pas démarré sur ${BASE}.\n` +
          `Sortie de Vite :\n${journalVite.trim() || '(aucune)'}`,
      )
    }

    for (const ecran of ECRANS) {
      const page = await navigateur.newPage({
        viewport: { width: LARGEUR, height: HAUTEUR },
        deviceScaleFactor: ECHELLE,
      })
      page.on('pageerror', (e) => console.error(`  ${ecran.nom} :`, e.message))
      await page.goto(`${BASE}/_fiche.html#${ecran.route}`)
      await page.waitForSelector('.tabbar', { timeout: 20000 })
      await attendre(1000)
      if (ecran.apres) await ecran.apres(page)
      await attendre(600)
      const fichier = join(SORTIE, `capture-${ecran.nom}.png`)
      await page.screenshot({ path: fichier })
      console.log(`capture-${ecran.nom}.png`.padEnd(30), statSync(fichier).size, 'octets')
      await page.close()
    }
    // ---- les visuels : les captures qu'on vient de produire, mises en scène
    for (const [i, [nom, titre]] of VISUELS.entries()) {
      const capture = readFileSync(join(SORTIE, `capture-${nom}.png`)).toString('base64')
      const page = await navigateur.newPage({
        viewport: { width: VISUEL_L, height: VISUEL_H },
        deviceScaleFactor: 2,
      })
      await page.setContent(pageVisuel(titre, capture, FONDS[i % FONDS.length]))
      await page.waitForFunction(() => document.fonts.ready.then(() => true))
      await attendre(500)
      const fichier = join(SORTIE, `visuel-${nom}.png`)
      await page.screenshot({ path: fichier })
      console.log(`visuel-${nom}.png`.padEnd(30), statSync(fichier).size, 'octets')
      await page.close()
    }
  } finally {
    /*  Le signe moins vise le groupe et non le seul `npx` : c'est ce qui atteint
     *  vite. Enveloppé, parce que le groupe a pu disparaître de lui-même si le
     *  serveur n'a jamais démarré — et une erreur ici masquerait la vraie. */
    try {
      process.kill(-vite.pid, 'SIGTERM')
    } catch {
      /* déjà parti */
    }
    rmSync(sondeTs, { force: true })
    rmSync(sondeHtml, { force: true })
    await navigateur.close()
  }

  console.log(`\nÀ envoyer depuis ${SORTIE}`)
}

principal().catch((e) => {
  console.error(e)
  process.exit(1)
})
