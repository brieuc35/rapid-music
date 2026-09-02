/* -------------------------------------------------------------------------- */
/*  L'enveloppe native, pour l'App Store                                       */
/*                                                                            */
/*  Android n'a pas besoin de ce fichier : sa TWA ouvre rapidmusic.fr en plein */
/*  écran, sans rien embarquer. iOS n'a pas d'équivalent — Apple veut une      */
/*  vraie application, et Capacitor en fabrique une autour du site.            */
/*                                                                            */
/*  Après toute modification ici :                                            */
/*                                                                            */
/*    npm run build && npx cap sync ios                                        */
/*                                                                            */
/*  Les deux commandes vont ensemble : `sync` recopie ce que `build` a produit */
/*  dans le projet Xcode. Oublier la première fait envoyer à Apple la version  */
/*  précédente du site, sans qu'aucune erreur ne le signale.                   */
/* -------------------------------------------------------------------------- */

import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  /*  Le même identifiant que le paquet Android. Rien n'y oblige — les deux
   *  magasins ont leurs propres espaces de noms — mais deux identifiants
   *  différents pour une seule application se paient plus tard, dans chaque
   *  outil qui les rapproche. */
  appId: 'fr.rapidmusic.app',

  /*  Le nom sous l'icône, sur l'écran d'accueil. Court : au-delà d'une douzaine
   *  de caractères, iOS le coupe. Le nom complet de la fiche App Store se règle
   *  dans App Store Connect, il n'a rien à voir avec celui-ci. */
  appName: 'RapidMusic',

  /*  Ce que Vite produit. C'est ce dossier que `cap sync` recopie. */
  webDir: 'dist',

  ios: {
    /*  Le fond visible pendant le chargement et derrière les rebonds de
     *  défilement. Le sombre de la marque plutôt que le blanc par défaut : un
     *  éclair blanc au lancement d'une application sombre se remarque. */
    backgroundColor: '#14101f',

    /*  Le défilement élastique d'iOS est laissé actif : le désactiver donne une
     *  impression de page web figée, exactement ce qu'Apple reproche aux
     *  applications enveloppées. */
    scrollEnabled: true,
  },
}

/*  Volontairement absent : `server.url`.
 *
 *  Capacitor sait ne rien embarquer et charger un site distant. Ce serait plus
 *  commode — le site se met à jour sans repasser par l'App Store — mais c'est
 *  précisément ce qu'Apple refuse au titre de la règle 4.2, « application qui
 *  n'est qu'un site web reconditionné ». Et ce serait perdre le fonctionnement
 *  hors connexion, que l'application a déjà.
 *
 *  Les fichiers sont donc embarqués, et une mise à jour du site demande un
 *  nouvel envoi à Apple. C'est le prix de l'App Store. */

export default config
