/* -------------------------------------------------------------------------- */
/*  La sonde : l'application démarrée avec une session simulée                 */
/*                                                                            */
/*  Deux scripts en ont besoin — celui des images de fiche et celui de         */
/*  l'aperçu vidéo. Sans session, l'application n'affiche que l'écran de       */
/*  connexion : il n'y a rien à photographier ni à filmer.                     */
/*                                                                            */
/*  Mis en commun, et non recopié : le jour où le démarrage de l'application   */
/*  change, une seule copie serait corrigée et l'autre tomberait en panne des  */
/*  mois plus tard, au pire moment — juste avant un envoi sur un magasin.      */
/*                                                                            */
/*  La page d'essai est écrite dans un fichier temporaire, à la racine parce   */
/*  que Vite ne sert que ce qui s'y trouve, puis effacée. Elle ne part jamais  */
/*  en ligne : `npm run build` ne la voit pas, elle n'existe que pendant les   */
/*  quelques minutes du script.                                               */
/* -------------------------------------------------------------------------- */

import { spawn } from 'node:child_process'
import { rmSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

export const RACINE = join(dirname(fileURLToPath(import.meta.url)), '..')

const PORT = 5177
export const BASE = `http://localhost:${PORT}`
export const PAGE = `${BASE}/_fiche.html`

export function attendre(ms) {
  return new Promise((r) => setTimeout(r, ms))
}

/*  Playwright n'est pas une dépendance du projet : il pèse plus lourd que
 *  l'application et ne sert qu'à fabriquer les images et l'aperçu. Il est pris
 *  là où l'environnement l'a installé. */
export function chargerPlaywright() {
  const require = createRequire(import.meta.url)
  for (const chemin of ['playwright', '/opt/node22/lib/node_modules/playwright/index.js']) {
    try {
      return require(chemin)
    } catch {
      /* essai suivant */
    }
  }
  console.error('Playwright est introuvable. Installez-le : npm i -D playwright')
  process.exit(1)
}

/* -------------------------------------------------------------------------- */
/*  La mise en scène                                                           */
/*                                                                            */
/*  La démonstration livrée avec l'application porte des dates écrites en dur, */
/*  en 2026. Elles étaient à venir le jour où elles ont été écrites ; elles    */
/*  reculent dans le passé à mesure que le temps passe. Aujourd'hui l'agenda   */
/*  affiche « aucun évènement à venir » et le filtre « À venir » des concerts  */
/*  ne garde presque rien — de quoi remplir une fiche de magasin d'écrans      */
/*  vides, ce qui est exactement ce qu'une fiche ne doit pas montrer.          */
/*                                                                            */
/*  D'où ces éléments-ci, tous datés par rapport au jour de fabrication : la   */
/*  fiche reste pleine dans un an comme aujourd'hui. Rien n'est inventé au     */
/*  sens où tout passe par les mêmes champs que les formulaires de             */
/*  l'application ; ce sont des données de démonstration, pas des résultats    */
/*  promis à qui que ce soit.                                                 */
/* -------------------------------------------------------------------------- */

/*  [titre, jours à partir d'aujourd'hui, priorité, catégorie] */
const TACHES = [
  ['Relancer le Trabendo pour le contrat', 2, 'Haute', 'Contrat'],
  ['Envoyer les visuels à la presse', 5, 'Haute', 'Promotion'],
  ['Réserver le studio pour le mix', 9, 'Normale', 'Studio'],
  ['Valider le plan de promo du single', 11, 'Normale', 'Promotion'],
  ['Déclarer les titres à la SACEM', 14, 'Normale', 'Administratif'],
  ['Rappeler le tourneur pour les dates d’été', 16, 'Normale', 'Concert'],
  ['Commander le merch de la tournée', 18, 'Normale', 'Concert'],
  ['Préparer la setlist de la tournée', 21, 'Basse', 'Concert'],
  ['Relire le contrat d’édition', 24, 'Normale', 'Contrat'],
  ['Mettre à jour la fiche technique', 28, 'Basse', 'Administratif'],
  ['Briefer le photographe du clip', 33, 'Basse', 'Promotion'],
  ['Renouveler l’adhésion à la SACEM', 45, 'Basse', 'Administratif'],
]

/*  [salle, ville, jours, heure, statut, capacité, billets vendus, cachet, tourneur] */
const CONCERTS = [
  ['Le Trabendo', 'Paris', 12, '20:00', 'Confirmé', 700, 540, 4500, 'Radical Production'],
  ['Stereolux', 'Nantes', 26, '20:30', 'Confirmé', 1200, 810, 5500, 'Stereolux'],
  ['L’Aéronef', 'Lille', 39, '20:30', 'Option', 1500, 0, 6000, 'Aéronef'],
  ['Le Bikini', 'Toulouse', 54, '21:00', 'Annoncé', 1400, 320, 6500, 'Bleu Citron'],
  ['Le Rockstore', 'Montpellier', 68, '20:30', 'Option', 900, 0, 4000, 'Uni-T'],
]

/*  Les coordonnées de l'artiste de démonstration.
 *
 *  Elles figurent déjà dans `src/store/seed.ts`, mais n'arrivent jamais à
 *  l'écran : `withDefaults()` remet à vide les champs apparus après coup — et
 *  c'est ce qu'il doit faire, personne ne doit hériter du courriel de la
 *  démonstration en créant son compte. Résultat, l'écran de profil affichait
 *  cinq « Non renseigné » sur la fiche des magasins.
 *
 *  Recopiées et non importées : `seed.ts` est du TypeScript, que Node ne lit
 *  pas sans outillage. Si elles changent là-bas, elles ne changent pas ici —
 *  ce ne sont que des coordonnées de démonstration, et l'écart se verrait au
 *  premier coup d'œil sur la capture. */
const ARTISTE = {
  bio: 'Artiste électro-pop basée à Paris. Premier album « Aurora » sorti en août 2026.',
  email: 'contact@nova-music.fr',
  phone: '+33 6 00 00 00 00',
  instagram: '@nova.music',
  spotify: 'NOVA',
  website: 'nova-music.fr',
}

/*  [titre, lieu, jours, début, fin, type, coût, ingénieur] */
const AGENDA = [
  ['Répétition — filage du set', 'HF Studios', 3, '13:00', '18:00', 'Répétition', 300, '—'],
  ['Mix — « Gravité »', 'La Frette Studios', 6, '14:00', '20:00', 'Mix', 900, 'Manon L.'],
  ['Point presse — sortie du single', 'Halo Records', 9, '11:00', '12:30', 'Réunion', 0, '—'],
  ['Enregistrement voix — « Solstice »', 'Studio Ferber', 16, '10:00', '17:00', 'Enregistrement', 700, 'Thomas R.'],
  ['Mastering — EP « Horizon »', 'Translab', 24, '11:00', '15:00', 'Mastering', 1100, 'Chab'],
]

/**
 * Pose la mise en scène, une fois pour toutes.
 *
 * À appeler juste après le chargement et avant la moindre prise de vue : le
 * tableau de bord compte les tâches ouvertes et les dates à venir, et il est le
 * premier écran montré. Appelée trop tard, il annoncerait zéro tâche pendant
 * que l'écran des tâches en affiche huit.
 *
 * Idempotente : l'aperçu traverse les écrans sans recharger la page, et
 * repasser par ici ne doit rien poser deux fois.
 */
export async function poserLaScene(page) {
  await page.evaluate(
    ({ taches, concerts, agenda, artiste }) => {
      const s = window.__store
      if (s.tasks.some((t) => String(t.id).startsWith('fiche-'))) return

      Object.assign(s.artist, artiste)

      const jour = (n) => {
        const d = new Date()
        d.setDate(d.getDate() + n)
        return d.toISOString().slice(0, 10)
      }

      s.tasks.push(
        ...taches.map(([title, j, priority, category], i) => ({
          id: 'fiche-t' + i,
          title,
          done: false,
          due: jour(j),
          priority,
          category,
          notes: '',
          doneAt: '',
        })),
      )

      s.concerts.push(
        ...concerts.map(([venue, city, j, time, status, capacity, ticketsSold, fee, promoter], i) => ({
          id: 'fiche-c' + i,
          venue,
          city,
          country: 'France',
          date: jour(j),
          time,
          status,
          capacity,
          ticketsSold,
          fee,
          promoter,
          notes: '',
        })),
      )

      s.studio.push(
        ...agenda.map(([title, studio, j, startTime, endTime, type, cost, engineer], i) => ({
          id: 'fiche-s' + i,
          title,
          studio,
          date: jour(j),
          startTime,
          endTime,
          type,
          cost,
          engineer,
          notes: '',
        })),
      )
    },
    { taches: TACHES, concerts: CONCERTS, agenda: AGENDA, artiste: ARTISTE },
  )
}

/*  Une date passée en tête de liste n'est pas ce qu'on montre d'une tournée. */
export async function filtreAVenir(page) {
  const filtre = page.locator('button:has-text("À venir")').first()
  if (await filtre.count()) await filtre.click()
}

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

/**
 * Démarre Vite sur la sonde et rend de quoi l'arrêter.
 *
 * `arreter()` est à appeler dans un `finally` : sans lui, le serveur survit au
 * script et le port reste pris jusqu'au prochain redémarrage de la machine.
 */
export async function demarrerApp() {
  const sondeTs = join(RACINE, '_fiche.ts')
  const sondeHtml = join(RACINE, '_fiche.html')
  writeFileSync(sondeTs, SONDE_TS)
  writeFileSync(sondeHtml, SONDE_HTML)

  /*  `detached` fait de `npx` le chef de son groupe de processus, ce qui permet
   *  de tuer le groupe entier à la fin — vite compris.
   *
   *  Sans cela, le script ne rendait pas la main : `vite.kill()` ne tue que
   *  l'enveloppe `npx`, qui ne transmet pas le signal, et le vrai serveur vite
   *  lui survivait. Ses tuyaux restant ouverts, Node gardait la boucle
   *  d'évènements en vie — les images étaient produites, puis le script
   *  attendait indéfiniment sans rien dire. */
  const vite = spawn('npx', ['vite', '--port', String(PORT), '--strictPort'], {
    cwd: RACINE,
    stdio: ['ignore', 'pipe', 'pipe'],
    detached: true,
  })

  /*  La sortie de Vite est gardée, pas jetée : quand le serveur ne démarre pas,
   *  c'est la seule chose qui dise pourquoi. La perdre transformait une panne
   *  explicite — port occupé, dépendance manquante — en un « n'a pas démarré »
   *  qui n'apprend rien. */
  let journal = ''
  vite.stdout.on('data', (d) => (journal += d))
  vite.stderr.on('data', (d) => (journal += d))

  const arreter = () => {
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
  }

  if (!(await serveurPret(PAGE))) {
    arreter()
    throw new Error(
      `Le serveur de développement n'a pas démarré sur ${BASE}.\n` +
        `Sortie de Vite :\n${journal.trim() || '(aucune)'}`,
    )
  }

  return { arreter }
}
