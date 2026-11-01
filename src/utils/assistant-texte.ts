/* -------------------------------------------------------------------------- */
/*  Mettre en forme la réponse de l'assistant                                  */
/*                                                                            */
/*  Le modèle répond en Markdown : des paragraphes, des listes, des passages   */
/*  en gras. Affiché tel quel, cela donne des astérisques et des tirets au     */
/*  milieu du texte ; affiché sans précaution, cela donne une faille.          */
/*                                                                            */
/*  D'où ce convertisseur minuscule, qui ne traduit que ce que l'assistant     */
/*  produit réellement — et surtout, qui **échappe tout avant de traduire quoi */
/*  que ce soit**. C'est l'ordre qui compte : échapper d'abord, c'est garantir */
/*  qu'aucune balise ne peut naître du texte ; échapper ensuite reviendrait à  */
/*  effacer les balises qu'on vient de poser.                                  */
/*                                                                            */
/*  Pourquoi pas une bibliothèque Markdown : elles pèsent de trente à cent     */
/*  kilo-octets, traduisent des constructions que personne n'écrira ici        */
/*  (tableaux, images, HTML brut), et plusieurs acceptent du HTML en entrée    */
/*  par défaut. Trente lignes couvrent ce cas-ci et ne peuvent rien ouvrir.    */
/* -------------------------------------------------------------------------- */

/**
 * Neutralise ce qui donnerait du HTML.
 *
 * Les cinq caractères, et pas seulement les chevrons : une apostrophe ou un
 * guillemet suffit à sortir d'un attribut, et le texte traduit ici n'est pas
 * écrit par nous.
 */
function echapper(t: string): string {
  return t
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

/** Le gras de Markdown, une fois le texte rendu inoffensif. */
function gras(t: string): string {
  return t.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
}

/** Une ligne de liste : « - », « * » ou « 1. » en tête. */
function estPuce(ligne: string): boolean {
  return /^\s*([-*]|\d+\.)\s+/.test(ligne)
}

function sansPuce(ligne: string): string {
  return ligne.replace(/^\s*([-*]|\d+\.)\s+/, '')
}

/**
 * Traduit la réponse de l'assistant en HTML sûr.
 *
 * Trois constructions seulement, parce que l'assistant n'en produit pas
 * d'autres : les paragraphes, les listes à puces et le gras. Le reste du
 * Markdown traverse en texte — un titre `##` s'affichera avec ses dièses, ce
 * qui est laid mais honnête, et les instructions données au modèle lui
 * demandent de ne pas en écrire.
 */
export function enHtml(reponse: string): string {
  const lignes = echapper(reponse).split('\n')
  const sortie: string[] = []
  let puces: string[] = []

  const viderLaListe = () => {
    if (!puces.length) return
    sortie.push(`<ul>${puces.map((p) => `<li>${gras(p)}</li>`).join('')}</ul>`)
    puces = []
  }

  for (const ligne of lignes) {
    if (estPuce(ligne)) {
      puces.push(sansPuce(ligne).trim())
      continue
    }
    viderLaListe()
    if (ligne.trim()) sortie.push(`<p>${gras(ligne.trim())}</p>`)
  }
  viderLaListe()

  return sortie.join('')
}
