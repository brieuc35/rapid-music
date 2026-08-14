import { ref } from 'vue'
import { registerSW } from 'virtual:pwa-register'

/* -------------------------------------------------------------------------- */
/*  Mise en cache du programme                                                */
/*                                                                            */
/*  Le service worker garde en cache les fichiers de l'application — le        */
/*  programme, pas les données. Deux conséquences : l'application s'ouvre sans  */
/*  réseau, et le navigateur peut l'installer sur l'écran d'accueil.            */
/*                                                                            */
/*  Rien de Firebase n'y passe : authentification et base de données vont       */
/*  toujours au réseau. Hors connexion, l'application lit sa copie locale des   */
/*  données, qui sait, elle, ce qui reste à envoyer.                            */
/* -------------------------------------------------------------------------- */

/**
 * Vrai quand une nouvelle version est téléchargée et attend d'être appliquée.
 *
 * Elle n'est jamais appliquée d'office : recharger la page au milieu d'une
 * saisie ferait perdre ce qui est en train d'être écrit. L'artiste choisit le
 * moment.
 */
export const majDisponible = ref(false)

/** Vrai le temps du rechargement, pour ne pas le déclencher deux fois. */
export const majEnCours = ref(false)

let appliquer: ((rechargerLaPage?: boolean) => Promise<void>) | null = null

export function inscrireServiceWorker(): void {
  appliquer = registerSW({
    onNeedRefresh() {
      majDisponible.value = true
    },
  })
}

/**
 * Active la version en attente et recharge la page.
 *
 * Le rechargement n'est pas déclenché ici : demander l'activation suffit
 * normalement, et c'est la prise de contrôle par la nouvelle version qui
 * recharge la page. Si cette prise de contrôle n'arrive pas — version déjà
 * activée entre-temps, message perdu —, personne ne rechargerait et le bouton
 * resterait à tourner. D'où le filet : au bout de trois secondes, on recharge
 * nous-mêmes. Le minuteur disparaît avec la page si le chemin normal a
 * fonctionné, il ne peut donc pas provoquer un second rechargement.
 */
export async function appliquerMaj(): Promise<void> {
  if (majEnCours.value) return
  majEnCours.value = true
  window.setTimeout(() => window.location.reload(), 3000)
  await appliquer?.()
}
