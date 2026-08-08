import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  // Racine en développement, /rapid-music/ sur GitHub Pages.
  // On se fonde sur le mode et non sur la commande : « vite preview » s'exécute
  // en commande « serve » alors qu'il sert le résultat de la compilation, et
  // servait donc les fichiers depuis la mauvaise racine.
  base: mode === 'production' ? '/rapid-music/' : '/',
  plugins: [vue()],
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
}))
