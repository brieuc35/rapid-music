import { createApp } from 'vue'
import { router } from './router'
import App from './App.vue'
import './styles/main.css'
import { inscrireServiceWorker } from './pwa'

createApp(App).use(router).mount('#app')

/*  Après le montage : la mise en cache du programme ne doit pas retarder le
 *  premier affichage. */
inscrireServiceWorker()
