/* -------------------------------------------------------------------------- */
/*  Les images de la fiche Play Store                                          */
/*                                                                            */
/*    node scripts/fiche-play-store.mjs                                        */
/*                                                                            */
/*  Produit dans play-store/ :                                                 */
/*    — l'image de mise en avant, 1024 × 500 exactement ;                      */
/*    — six captures d'écran de téléphone, 1080 × 2160.                        */
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
import { mkdirSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

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
        <path d="M9 16.5V5l8-1.5" stroke-width="2" />
        <circle cx="6" cy="16.5" r="2.6" stroke-width="2" />
        <path d="M17.5 7.5 14 12.5h3.2L14.5 18l6-7h-3.2z" stroke-width="1.8" />
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

async function serveurPret(url, essais = 40) {
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

  const vite = spawn('npx', ['vite', '--port', String(PORT), '--strictPort'], {
    cwd: RACINE,
    stdio: 'ignore',
  })

  try {
    if (!(await serveurPret(`${BASE}/_fiche.html`))) {
      throw new Error(`Le serveur de développement n'a pas démarré sur ${BASE}.`)
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
  } finally {
    vite.kill()
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
