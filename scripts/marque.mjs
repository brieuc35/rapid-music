/* -------------------------------------------------------------------------- */
/*  Le dessin de la marque, à un seul endroit                                  */
/*                                                                            */
/*  Une note traversée d'un éclair : la rapidité de « Rapid ».                 */
/*                                                                            */
/*  Il vivait recopié dans six fichiers, et trois icônes n'avaient aucun       */
/*  script. Changer le logo demandait donc six modifications à la main plus    */
/*  trois images refaites ailleurs — avec la certitude qu'un oubli laisserait  */
/*  l'ancien dessin quelque part, sans que rien ne le signale.                 */
/*                                                                            */
/*  Les fichiers qui ne peuvent pas importer celui-ci, parce qu'ils ne sont    */
/*  pas exécutés par Node, portent un renvoi vers lui :                        */
/*                                                                            */
/*    src/components/BrandMark.vue   le logo dans l'application                */
/*    public/favicon.svg             l'onglet du navigateur                    */
/* -------------------------------------------------------------------------- */

/**
 * Le dessin, dans un repère de 24 unités.
 *
 * L'éclair est **plein**, et c'est tout le sujet. Dessiné au trait comme il
 * l'était, ses branches se rejoignent dès que l'icône est petite : le contour se
 * referme sur lui-même et laisse deux trous triangulaires au milieu d'un pâté.
 * Rempli, il garde ses angles à 16 px comme à 1024.
 *
 * @param trait épaisseur du trait de la note. L'éclair n'en a pas besoin.
 */
export function marque(trait = 2.1) {
  return `
  <path d="M9 16.5V5l8-1.5" stroke-width="${trait}"/>
  <circle cx="6" cy="16.5" r="2.6" stroke-width="${trait}"/>
  <path d="M18.4 6.2 13.6 12.9h3.6L14.4 19.8 20.8 11.4h-3.8z" fill="#fff" stroke="none"/>`
}

/**
 * Le dégradé de la marque.
 *
 * Une seule paire pour toutes les icônes. Elles divergeaient : le favicon et
 * les icônes web partaient d'un violet plus rose (#a855f7 → #ec4899) que
 * l'icône Android (#8b5cf6 → #d946ef). Personne ne les voit côte à côte, mais
 * c'est précisément pour ça que l'écart durait.
 */
export const DEBUT = '#8b5cf6'
export const FIN = '#d946ef'

/**
 * Part de la largeur qu'occupe le dessin dans une icône.
 *
 * 46 %, contre 55 % auparavant. Le logo touchait presque les bords ; à cette
 * taille il respire, et les icônes carrées des systèmes qui rognent les angles
 * ne lui mordent plus dessus.
 */
export const PART_LOGO = 0.46
