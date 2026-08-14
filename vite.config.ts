import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'
import { fileURLToPath, URL } from 'node:url'

/*  Couleur de la barre de navigation et de l'écran de démarrage : la même que
 *  `--nav-bg`. L'écran d'attente que le système affiche au lancement enchaîne
 *  alors sans rupture sur celui de l'application, qui a ce fond et le même
 *  logo. */
const FOND = '#14101f'

// https://vite.dev/config/
export default defineConfig({
  // Le site est servi à la racine de rapidmusic.fr, et non plus depuis un
  // sous-dossier comme sur l'adresse en github.io. Une base erronée ne casse
  // pas la compilation : elle donne une page blanche, le navigateur cherchant
  // les fichiers à un emplacement qui n'existe pas.
  base: '/',
  plugins: [
    vue(),
    /*  Rend le site installable — sur l'écran d'accueil d'un téléphone, et
     *  comme point de départ d'une application Android. Deux choses en
     *  découlent : un manifeste, qui décrit l'application au système, et un
     *  service worker, qui garde le programme en cache pour qu'il s'ouvre sans
     *  réseau. Les données, elles, étaient déjà conservées localement. */
    VitePWA({
      /*  « prompt » et non « autoUpdate » : une nouvelle version ne se
       *  substitue pas d'autorité à celle qui est ouverte. Recharger la page au
       *  milieu d'une saisie ferait perdre ce qui est en train d'être écrit —
       *  l'artiste décide du moment, par le bandeau qui le lui propose. */
      registerType: 'prompt',
      // L'inscription est faite à la main dans `main.ts`, pour pouvoir montrer
      // ce bandeau au lieu d'une mise à jour silencieuse.
      injectRegister: null,
      manifest: {
        id: '/',
        name: 'RapidMusic — gestion de carrière',
        short_name: 'RapidMusic',
        description:
          'Le gestionnaire de carrière tout-en-un pour les artistes : concerts, sorties, contrats, agenda, tâches et contacts.',
        lang: 'fr',
        dir: 'ltr',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        background_color: FOND,
        theme_color: FOND,
        categories: ['music', 'productivity', 'business'],
        icons: [
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          /*  Android découpe l'icône à sa façon, parfois en cercle. Celle-ci a
           *  un fond débordant et un glyphe réduit, pour rester entière quelle
           *  que soit la découpe. */
          {
            src: '/icon-maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        // Tout ce qu'il faut pour afficher l'application sans réseau.
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        /*  Les adresses de l'application sont toutes derrière un `#`, donc une
         *  seule page est réellement demandée au serveur. Ce repli couvre le
         *  cas où elle est ouverte hors connexion. */
        navigateFallback: 'index.html',
        /*  Rien de Firebase n'est mis en cache, volontairement : une réponse
         *  d'authentification ou de base de données rejouée depuis un cache
         *  serait un piège. Hors connexion, l'application s'appuie sur sa
         *  copie locale des données, qui a ses propres règles de fraîcheur. */
        navigateFallbackDenylist: [/^\/__/, /\/api\//],
        cleanupOutdatedCaches: true,
      },
    }),
  ],
  build: {
    rollupOptions: {
      output: {
        // Firebase et Vue changent rarement, le code de l'appli souvent.
        // Les séparer évite de faire retélécharger 100 Ko de bibliothèques à
        // chaque correction d'un écran, et permet de les charger en parallèle.
        manualChunks(id) {
          if (id.includes('node_modules/firebase') || id.includes('node_modules/@firebase')) {
            return 'firebase'
          }
          if (id.includes('node_modules/@vue') || id.includes('node_modules/vue')) {
            return 'vue'
          }
        },
      },
    },
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    host: true,
    port: 5173,
  },
})
