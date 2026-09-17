/* -------------------------------------------------------------------------- */
/*  L'aperçu vidéo de la fiche App Store                                       */
/*                                                                            */
/*    node scripts/apercu-app-store.mjs                                        */
/*                                                                            */
/*  Produit app-store/apercu-iphone-886x1920.mp4 : l'application parcourue     */
/*  écran par écran, 24 secondes, une légende par écran.                       */
/*                                                                            */
/*  886 × 1920, et non la taille des captures. C'est le piège de cette fiche : */
/*  Apple demande 1320 × 2868 pour les images et 886 × 1920 pour la vidéo, au  */
/*  même emplacement et sous le même intitulé. Un aperçu à la taille des       */
/*  captures est refusé. Cette seule taille couvre en revanche toute la gamme  */
/*  récente — 6,9 / 6,5 / 6,3 / 6,1 pouces — d'où un fichier unique.           */
/*                                                                            */
/*  Ni cadre de téléphone ni photo d'appareil, contrairement aux captures :    */
/*  Apple veut voir l'application comme elle s'affiche, et refuse les aperçus  */
/*  qui montrent du matériel.                                                  */
/*                                                                            */
/*  Chaque image est prise une par une, le défilement étant posé à la main     */
/*  avant chaque prise. Filmer la fenêtre aurait été plus court à écrire, mais */
/*  aurait rendu un résultat différent à chaque fabrication, au rythme de la   */
/*  machine ; ici les 720 images sont les mêmes à chaque fois.                 */
/* -------------------------------------------------------------------------- */

import { execFileSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, readFileSync, rmSync, statSync } from 'node:fs'
import { createRequire } from 'node:module'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { DEBUT, FIN, marque } from './marque.mjs'
import {
  attendre,
  chargerPlaywright,
  demarrerApp,
  filtreAVenir,
  PAGE,
  poserLaScene,
  RACINE,
} from './sonde.mjs'

/*  443 × 960 à l'échelle 2 donne 886 × 1920 sans le moindre redimensionnement.
 *  Et 443 × 960 reste la taille logique d'un grand téléphone — l'application
 *  s'y dispose exactement comme sur un vrai appareil. Passer par la taille d'un
 *  iPhone au pixel près, 440 × 956, aurait obligé à réduire ensuite les images
 *  de 0,3 % en hauteur seulement : personne ne l'aurait vu, mais le texte y
 *  aurait perdu en netteté pour rien. */
const LARGEUR = 443
const HAUTEUR = 960
const ECHELLE = 2
const IPS = 30 // le maximum accepté par Apple

const SORTIE = join(RACINE, 'app-store')
const FICHIER = join(SORTIE, `apercu-iphone-${LARGEUR * ECHELLE}x${HAUTEUR * ECHELLE}.mp4`)

/*  Le fondu enchaîné entre deux écrans : la dernière image du précédent, posée
 *  par-dessus le suivant et effacée en douceur. Douze images, soit 0,4 s —
 *  assez pour que l'enchaînement se sente, trop court pour qu'on l'attende. */
const FONDU = 12

/*  Une légende par écran : ce que l'artiste y gagne, pas ce que l'écran
 *  contient. Ce sont les phrases des captures, pour que la fiche parle d'une
 *  seule voix.
 *
 *  `defile` est la part de la page réellement parcourue. Tout parcourir serait
 *  une course ; ne rien parcourir donnerait six photos.
 *
 *  Le profil d'artiste est le seul écran des captures qui ne soit pas ici : la
 *  démonstration le laisse à « Non renseigné » sur toutes ses lignes. Une image
 *  qu'on parcourt du regard s'en accommode ; trois secondes de vidéo dessus
 *  donneraient à voir une application vide. Les contacts le remplacent — même
 *  place dans le métier, et le carnet, lui, est rempli. */
const SCENES = [
  { route: '/tableau-de-bord', legende: 'Pilotez mieux votre carrière', duree: 4, defile: 0.6 },
  { route: '/concerts', legende: 'Vos dates, salle par salle', duree: 4, defile: 0.65, apres: filtreAVenir },
  { route: '/studio', legende: 'Séances studio, interviews, réunions', duree: 3.5, defile: 0.55 },
  { route: '/taches', legende: 'Ce qu’il reste à faire, et pour quand', duree: 3.5, defile: 0.6 },
  { route: '/sorties', legende: 'Votre catalogue musical', duree: 3.5, defile: 0.6 },
  { route: '/contacts', legende: 'Tout votre carnet d’adresses', duree: 3, defile: 0.55 },
]

const CARTE_FIN = 2.5

/*  La carte de fin. Reprend le fond de l'image de mise en avant du Play Store :
 *  les deux fiches doivent se reconnaître l'une l'autre. */
const FIN_HTML = `<!doctype html>
<meta charset="utf-8" />
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@600;700;800&display=swap" rel="stylesheet" />
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { width: ${LARGEUR}px; height: ${HAUTEUR}px; overflow: hidden; }
  body { font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    background: linear-gradient(170deg, #1b1430 0%, #14101f 55%, #2a1140 100%); }
  .halo { position: absolute; border-radius: 50%; }
  .halo-a { width: 520px; height: 520px; right: -150px; top: 60px;
    background: radial-gradient(circle, rgba(139,92,246,.45) 0%, rgba(139,92,246,0) 62%); }
  .halo-b { width: 560px; height: 560px; left: -170px; bottom: 90px;
    background: radial-gradient(circle, rgba(236,72,153,.42) 0%, rgba(236,72,153,0) 62%); }
  .contenu { position: absolute; inset: 0; display: flex; flex-direction: column;
    align-items: center; justify-content: center; gap: 26px; padding: 0 44px;
    transform-origin: 50% 46%; }
  .marque { width: 132px; height: 132px; border-radius: 34px;
    background: linear-gradient(135deg, ${DEBUT} 0%, ${FIN} 100%);
    display: grid; place-items: center;
    box-shadow: 0 26px 60px rgba(236,72,153,.42), 0 0 0 1px rgba(255,255,255,.1) inset; }
  .marque svg { width: 74px; height: 74px; }
  .nom { font-size: 46px; font-weight: 800; letter-spacing: -.03em; color: #fff; line-height: 1; }
  .nom b { color: #e879f9; }
  .accroche { font-size: 21px; font-weight: 600; color: rgba(255,255,255,.84);
    line-height: 1.35; text-align: center; }
</style>
<div class="halo halo-a"></div><div class="halo halo-b"></div>
<div class="contenu" id="contenu">
  <div class="marque">
    <svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-linecap="round" stroke-linejoin="round">
      ${marque()}
    </svg>
  </div>
  <div class="nom">Rapid<b>Music</b></div>
  <div class="accroche">Tout votre univers,<br />au même endroit.</div>
</div>`

/* -------------------------------------------------------------------------- */
/*  ffmpeg                                                                     */
/* -------------------------------------------------------------------------- */

/*  Comme Playwright : hors des dépendances du projet, et cherché là où
 *  l'environnement l'a mis. */
function chargerFfmpeg() {
  if (process.env.FFMPEG) return process.env.FFMPEG
  const require = createRequire(import.meta.url)
  try {
    return require('@ffmpeg-installer/ffmpeg').path
  } catch {
    /* pas installé en paquet */
  }
  try {
    return execFileSync('which', ['ffmpeg'], { encoding: 'utf8' }).trim()
  } catch {
    console.error(
      'ffmpeg est introuvable. Installez-le :\n' +
        '  npm i -D @ffmpeg-installer/ffmpeg\n' +
        "ou indiquez son chemin dans la variable d'environnement FFMPEG.",
    )
    process.exit(1)
  }
}

/* -------------------------------------------------------------------------- */
/*  Les enveloppes de l'animation                                              */
/* -------------------------------------------------------------------------- */

const borne = (x) => Math.min(1, Math.max(0, x))

/*  Départ et arrivée immobiles : une page qui se met à défiler à pleine vitesse
 *  dès la première image donne l'impression d'un raté au montage. */
const adouci = (x) => x * x * (3 - 2 * x)

/**
 * Où en est le défilement à l'image `i` d'une scène de `total` images.
 *
 * Le mouvement ne commence qu'au cinquième de la scène et s'arrête avant la
 * fin : on arrive sur l'écran, on le lit, il défile, il s'immobilise — et c'est
 * sur cette image immobile que le fondu vers l'écran suivant s'enchaîne.
 */
function avancement(i, total) {
  return adouci(borne((i - total * 0.2) / (total * 0.65)))
}

/**
 * L'opacité de la légende à l'image `i`.
 *
 * Elle entre après le fondu — posée pendant, elle se lirait sur deux écrans à
 * la fois — et sort avant la fin, pour que le fondu suivant n'emporte pas un
 * texte à moitié effacé.
 */
function opaciteLegende(i, total) {
  const entree = borne((i - FONDU) / 10)
  const sortie = borne((i - (total - 15)) / 10)
  return entree * (1 - sortie)
}

/* -------------------------------------------------------------------------- */
/*  L'habillage posé dans la page                                              */
/* -------------------------------------------------------------------------- */

/*  Deux calques ajoutés à l'application, au-dessus de tout : l'image du fondu,
 *  et la légende. `z-index` très haut parce que la barre d'onglets est déjà à
 *  35 et le tiroir à 40. */
async function poserHabillage(page, avecLegende) {
  await page.evaluate((avecLeg) => {
    const css = document.createElement('style')
    css.textContent = `
      #__fondu { position: fixed; inset: 0; z-index: 2147483000; pointer-events: none;
        background: #14101f; opacity: 0; }
      #__fondu img { width: 100%; height: 100%; display: block; object-fit: fill; }
      #__legende { position: fixed; left: 18px; right: 18px; z-index: 2147482000;
        pointer-events: none; background: rgba(20,16,31,.86);
        -webkit-backdrop-filter: blur(14px); backdrop-filter: blur(14px);
        border: 1px solid rgba(255,255,255,.14); border-radius: 20px;
        padding: 15px 18px; color: #fff; font-size: 19px; font-weight: 700;
        line-height: 1.3; letter-spacing: -.01em; text-align: center;
        box-shadow: 0 18px 40px rgba(0,0,0,.4); opacity: 0; }`
    document.head.appendChild(css)

    const fondu = document.createElement('div')
    fondu.id = '__fondu'
    fondu.appendChild(document.createElement('img'))
    document.body.appendChild(fondu)

    if (!avecLeg) return
    const leg = document.createElement('div')
    leg.id = '__legende'
    /*  Juste au-dessus de la barre d'onglets, mesurée et non devinée : elle
     *  réserve en plus la zone des téléphones sans bouton, qui ne vaut pas la
     *  même chose partout. */
    const barre = document.querySelector('.tabbar')
    leg.style.bottom = `${(barre ? barre.getBoundingClientRect().height : 60) + 18}px`
    document.body.appendChild(leg)
  }, avecLegende)
}

/**  Charge l'image du fondu, ou l'efface s'il n'y en a pas (première scène). */
async function chargerFondu(page, jpegBase64) {
  await page.evaluate(async (b64) => {
    const img = document.querySelector('#__fondu img')
    if (!b64) {
      img.removeAttribute('src')
      img.style.display = 'none'
      return
    }
    img.style.display = 'block'
    img.src = 'data:image/jpeg;base64,' + b64
    /*  Sans l'attente, la première image du fondu est prise avant que celle du
     *  décodage soit prête : l'enchaînement s'ouvre sur un trou noir. */
    await img.decode()
  }, jpegBase64)
}

/* -------------------------------------------------------------------------- */

async function principal() {
  const ffmpeg = chargerFfmpeg()
  mkdirSync(SORTIE, { recursive: true })
  const images = mkdtempSync(join(tmpdir(), 'apercu-'))

  const pw = chargerPlaywright()
  const navigateur = await pw.chromium.launch({
    executablePath: process.env.PLAYWRIGHT_CHROMIUM || undefined,
  })
  const app = await demarrerApp()

  let numero = 0
  let derniere = null // la dernière image écrite, pour le fondu suivant

  /*  Toutes les images portent le même nom numéroté : c'est ce que ffmpeg sait
   *  lire d'un bloc, et cela garde l'ordre quel que soit le système. */
  async function prendre(page) {
    numero += 1
    derniere = join(images, `f-${String(numero).padStart(5, '0')}.jpg`)
    await page.screenshot({ path: derniere, type: 'jpeg', quality: 92 })
  }

  const depart = Date.now()
  try {
    const page = await navigateur.newPage({
      viewport: { width: LARGEUR, height: HAUTEUR },
      deviceScaleFactor: ECHELLE,
    })
    page.on('pageerror', (e) => console.error('  erreur de page :', e.message))

    await page.goto(`${PAGE}#${SCENES[0].route}`)
    await page.waitForSelector('.tabbar', { timeout: 20000 })
    await attendre(1200)
    /*  Avant la première image : le tableau de bord ouvre l'aperçu et compte ce
     *  que les autres écrans contiennent. */
    await poserLaScene(page)
    await attendre(600)
    await poserHabillage(page, true)

    for (const [i, s] of SCENES.entries()) {
      const total = Math.round(s.duree * IPS)

      if (i > 0) {
        await page.evaluate((r) => {
          location.hash = r
          window.scrollTo(0, 0)
        }, s.route)
        await attendre(900) // la page entre en fondu sur 350 ms
      }
      if (s.apres) await s.apres(page)
      await attendre(500)

      /*  Ce que la page a à offrir sous la ligne de flottaison. Mesuré ici et
       *  non deviné : il dépend des données de démonstration, qui bougent. */
      const course = await page.evaluate(
        () => document.scrollingElement.scrollHeight - window.innerHeight,
      )

      /*  Un écran qui tient dans la hauteur du téléphone ne défile pas, et la
       *  scène devient une photographie tenue plusieurs secondes. Rien dans la
       *  vidéo produite ne le dirait : elle s'assemble, elle dure ce qu'il faut,
       *  elle passe tous les contrôles d'Apple — elle est simplement figée. La
       *  première version de cet aperçu l'était sur trois scènes sur six.
       *
       *  Soixante pixels : en deçà, le mouvement n'est plus perceptible. Un
       *  écran volontairement immobile se déclare avec `defile: 0`. */
      if (s.defile > 0 && course * s.defile < 60) {
        throw new Error(
          `${s.route} : rien à faire défiler (${course} px de course, ${s.defile} demandé).\n` +
            `La scène durerait ${s.duree} s sur une image fixe. Enrichissez la mise en ` +
            `scène dans scripts/sonde.mjs, ou posez \`defile: 0\` si l'écran doit rester immobile.`,
        )
      }

      await chargerFondu(page, derniere ? readFileSync(derniere).toString('base64') : null)
      await page.evaluate((t) => {
        document.querySelector('#__legende').innerHTML = t
      }, s.legende)

      for (let f = 0; f < total; f++) {
        await page.evaluate(
          ({ y, fondu, leg }) => {
            window.scrollTo(0, y)
            document.querySelector('#__fondu').style.opacity = String(fondu)
            document.querySelector('#__legende').style.opacity = String(leg)
          },
          {
            y: Math.round(avancement(f, total) * course * s.defile),
            fondu: f < FONDU ? 1 - f / FONDU : 0,
            leg: opaciteLegende(f, total),
          },
        )
        await prendre(page)
      }
      console.log(
        `${s.route.padEnd(18)} ${String(total).padStart(3)} images` +
          `   défilement ${Math.round(course * s.defile)} / ${course} px`,
      )
    }
    await page.close()

    // ---- la carte de fin, sur une page à elle, avec le même fondu d'entrée
    {
      const total = Math.round(CARTE_FIN * IPS)
      const page = await navigateur.newPage({
        viewport: { width: LARGEUR, height: HAUTEUR },
        deviceScaleFactor: ECHELLE,
      })
      await page.setContent(FIN_HTML)
      await page.waitForFunction(() => document.fonts.ready.then(() => true))
      await poserHabillage(page, false)
      await chargerFondu(page, readFileSync(derniere).toString('base64'))

      for (let f = 0; f < total; f++) {
        /*  Un grandissement de 2 % sur toute la carte. Une image vraiment fixe
         *  en fin de vidéo se lit comme une lecture qui s'est arrêtée. */
        await page.evaluate(
          ({ fondu, echelle }) => {
            document.querySelector('#__fondu').style.opacity = String(fondu)
            document.querySelector('#contenu').style.transform = `scale(${echelle})`
          },
          { fondu: f < FONDU ? 1 - f / FONDU : 0, echelle: 1 + 0.02 * (f / (total - 1)) },
        )
        await prendre(page)
      }
      console.log(`carte de fin       ${String(total).padStart(3)} images`)
      await page.close()
    }
  } finally {
    app.arreter()
    await navigateur.close()
  }

  const secondes = numero / IPS
  console.log(`\n${numero} images, ${secondes.toFixed(1)} s — assemblage…`)
  if (secondes < 15 || secondes > 30) {
    throw new Error(
      `L'aperçu dure ${secondes.toFixed(1)} s. App Store Connect refuse en dehors de 15 à 30 s.`,
    )
  }

  execFileSync(
    ffmpeg,
    [
      '-y',
      '-framerate', String(IPS),
      '-i', join(images, 'f-%05d.jpg'),
      /*  Une piste muette plutôt que pas de piste du tout : l'aperçu n'a pas de
       *  son — aucune musique n'est libre de droits ici — mais un fichier sans
       *  piste audio se fait refuser au transcodage par App Store Connect. */
      '-f', 'lavfi',
      '-i', 'anullsrc=channel_layout=stereo:sample_rate=44100',
      '-shortest',
      '-c:v', 'libx264',
      '-profile:v', 'high',
      '-level', '4.0',
      '-pix_fmt', 'yuv420p',
      '-crf', '20',
      '-preset', 'slow',
      '-c:a', 'aac',
      '-b:a', '128k',
      '-movflags', '+faststart',
      FICHIER,
    ],
    { stdio: ['ignore', 'ignore', 'pipe'] },
  )
  rmSync(images, { recursive: true, force: true })

  console.log(
    `\n${FICHIER}\n` +
      `${(statSync(FICHIER).size / 1e6).toFixed(1)} Mo — ` +
      `fabriqué en ${Math.round((Date.now() - depart) / 1000)} s`,
  )
}

principal().catch((e) => {
  console.error(e)
  process.exit(1)
})
