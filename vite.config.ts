import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'

// https://vite.dev/config/
export default defineConfig({
  // Le site est servi à la racine de rapidmusic.fr, et non plus depuis un
  // sous-dossier comme sur l'adresse en github.io. Une base erronée ne casse
  // pas la compilation : elle donne une page blanche, le navigateur cherchant
  // les fichiers à un emplacement qui n'existe pas.
  base: '/',
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
})
