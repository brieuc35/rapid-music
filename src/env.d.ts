/// <reference types="vite/client" />
/*  Déclare le module « virtual:pwa-register », fabriqué à la compilation par
 *  vite-plugin-pwa : sans cette ligne, `src/pwa.ts` ne compile pas. */
/// <reference types="vite-plugin-pwa/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<Record<string, unknown>, Record<string, unknown>, unknown>
  export default component
}
