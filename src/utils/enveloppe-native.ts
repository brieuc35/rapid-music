/* -------------------------------------------------------------------------- */
/*  Sait-on qu'on tourne dans l'application de l'App Store ?                    */
/*                                                                            */
/*  Trois endroits de l'application se comportent autrement à l'intérieur de    */
/*  l'enveloppe iOS, et chacun le ferait de travers sans ce renseignement :     */
/*  la marge sous l'encoche, le bandeau de mise à jour, et l'abonnement.        */
/*                                                                            */
/*  Rien n'est importé de `@capacitor/core`. Le pont natif pose lui-même        */
/*  `window.Capacitor` au démarrage : l'interroger coûte zéro octet aux         */
/*  visiteurs du site, qui sont l'immense majorité et n'ont que faire de ce     */
/*  code. Une bibliothèque importée, elle, serait téléchargée par tout le monde */
/*  pour ne servir qu'aux utilisateurs d'iPhone.                               */
/* -------------------------------------------------------------------------- */

interface PontNatif {
  isNativePlatform?: () => boolean
  getPlatform?: () => string
}

function pont(): PontNatif | undefined {
  return typeof window === 'undefined'
    ? undefined
    : (window as Window & { Capacitor?: PontNatif }).Capacitor
}

/**
 * Vrai dans l'application installée depuis l'App Store, faux sur le site.
 *
 * Faux aussi dans l'application Android : celle-ci est une TWA, c'est-à-dire le
 * site lui-même ouvert en plein écran, sans pont natif. La distinction compte —
 * l'abonnement s'achète sur Android et pas sur iPhone.
 */
export function dansEnveloppeNative(): boolean {
  return pont()?.isNativePlatform?.() === true
}

/** Vrai dans l'enveloppe iOS précisément. */
export function surIOS(): boolean {
  return dansEnveloppeNative() && pont()?.getPlatform?.() === 'ios'
}
