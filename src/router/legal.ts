/**
 * Les quatre documents légaux, en un seul endroit.
 *
 * Cette liste sert à trois choses à la fois : déclarer les adresses au routeur,
 * afficher les liens en pied de page de la connexion et du menu, et relier les
 * documents entre eux. Les recopier séparément finirait par en oublier un
 * quelque part.
 */
export const PAGES_LEGALES = [
  { to: '/mentions-legales', libelle: 'Mentions légales' },
  { to: '/confidentialite', libelle: 'Confidentialité' },
  { to: '/conditions', libelle: "Conditions d'utilisation" },
  { to: '/suppression-compte', libelle: 'Supprimer mon compte' },
] as const
