/* -------------------------------------------------------------------------- */
/*  Informations publiées dans les documents légaux                           */
/*                                                                            */
/*  Rassemblées ici, et non recopiées dans chaque page : quatre documents qui  */
/*  annonceraient quatre adresses de contact ou quatre dates différentes       */
/*  seraient pires qu'un seul document imprécis.                              */
/* -------------------------------------------------------------------------- */

/** Nom sous lequel le service est publié. */
export const SERVICE = 'RapidMusic'

/** Adresse du service. */
export const DOMAINE = 'rapidmusic.fr'

/** Adresse de contact publiée, pour toute question et pour les droits RGPD. */
export const CONTACT = 'rapidmusic.rm@gmail.com'

/**
 * Date de la dernière révision des documents.
 *
 * À changer à chaque modification de fond : une politique de confidentialité
 * datée de deux ans en arrière alors qu'elle vient d'être réécrite fait douter
 * de tout le reste.
 */
export const DATE_MAJ = '14 août 2026'

/** Hébergeur du site : les fichiers de l'application. */
export const HEBERGEUR_SITE = {
  nom: 'GitHub, Inc. (GitHub Pages)',
  adresse: '88 Colin P. Kelly Jr. Street, San Francisco, CA 94107, États-Unis',
}

/**
 * Hébergeur des comptes et des données saisies.
 *
 * Google Ireland Limited est l'entité qui contracte pour Firebase dans
 * l'Espace économique européen ; c'est donc elle qu'il faut nommer, quelle que
 * soit la région d'enregistrement choisie pour la base.
 */
export const HEBERGEUR_DONNEES = {
  nom: 'Google Ireland Limited (Firebase, service de Google Cloud)',
  adresse: 'Gordon House, Barrow Street, Dublin 4, Irlande',
}

/** Délai annoncé pour les suppressions qui demandent une intervention. */
export const DELAI_SUPPRESSION_MANUELLE = '30 jours'
