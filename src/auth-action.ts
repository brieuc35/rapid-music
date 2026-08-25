/* -------------------------------------------------------------------------- */
/*  Les liens d'action envoyés par Firebase                                    */
/*                                                                            */
/*  Confirmation d'adresse, réinitialisation de mot de passe, annulation d'un  */
/*  changement d'adresse : Firebase envoie pour chacun un lien portant un code */
/*  à usage unique. Par défaut ces liens mènent à une page hébergée par Google, */
/*  en anglais et à ses couleurs. Un « URL d'action personnalisée » réglé dans  */
/*  la console les renvoie ici à la place.                                     */
/*                                                                            */
/*  Ce fichier ne parle ni à Firebase ni au DOM : il lit une adresse et traduit */
/*  des codes d'erreur. C'est la partie vérifiable par des tests, et c'est là   */
/*  que se logent les erreurs qui comptent — un code mal extrait renvoie un     */
/*  artiste sur un message d'échec alors que son lien était bon.               */
/* -------------------------------------------------------------------------- */

/** Ce que Firebase demande de faire, lu dans l'adresse. */
export interface ActionDemandee {
  /** `verifyEmail`, `resetPassword`, `recoverEmail`… ou nul si absent. */
  mode: string | null
  /** Le code à usage unique, sans lequel rien n'est possible. */
  code: string | null
  /** Où renvoyer l'artiste ensuite, si Firebase l'a transmis. */
  suite: string | null
}

/**
 * Extrait les paramètres d'un lien d'action.
 *
 * Ils sont cherchés **des deux côtés du dièse**, et ce n'est pas un excès de
 * prudence : l'application utilise un historique à dièse, son adresse d'action
 * est donc `…/#/action`. Selon la façon dont Firebase assemble le lien, les
 * paramètres peuvent se retrouver avant le dièse (`…/?mode=…#/action`) ou après
 * (`…/#/action?mode=…`). Ne regarder qu'un seul endroit, c'est accepter que la
 * moitié des cas échoue sans qu'on sache pourquoi.
 *
 * Le côté qui porte le code l'emporte : c'est lui qui compte.
 */
export function lireAction(adresse: string): ActionDemandee {
  const vide: ActionDemandee = { mode: null, code: null, suite: null }
  let url: URL
  try {
    url = new URL(adresse)
  } catch {
    return vide
  }

  const depuis = (params: URLSearchParams): ActionDemandee => ({
    mode: params.get('mode'),
    code: params.get('oobCode'),
    suite: params.get('continueUrl'),
  })

  const avant = depuis(url.searchParams)

  /*  Après le dièse : tout ce qui suit le premier « ? » du fragment. */
  const fragment = url.hash.startsWith('#') ? url.hash.slice(1) : url.hash
  const marque = fragment.indexOf('?')
  const apres = marque === -1 ? vide : depuis(new URLSearchParams(fragment.slice(marque + 1)))

  if (apres.code) return apres
  if (avant.code) return avant
  // Aucun code des deux côtés : on rend quand même le mode s'il existe, pour
  // pouvoir dire « lien incomplet » plutôt que « lien inconnu ».
  return apres.mode ? apres : avant
}

/**
 * Traduit un code d'erreur Firebase en phrase compréhensible.
 *
 * Les messages disent **quoi faire**, pas seulement ce qui ne va pas : quelqu'un
 * qui arrive ici a cliqué sur un lien reçu par courriel, il n'a pas de raison de
 * connaître le vocabulaire de Firebase.
 */
export function messageAction(code: string): string {
  switch (code) {
    case 'auth/expired-action-code':
      return "Ce lien a expiré. Demandez-en un nouveau depuis l'application."
    case 'auth/invalid-action-code':
      return 'Ce lien a déjà été utilisé, ou il n’est plus valide. Demandez-en un nouveau depuis l’application.'
    case 'auth/user-disabled':
      return 'Ce compte a été désactivé.'
    case 'auth/user-not-found':
      return 'Ce compte n’existe plus.'
    case 'auth/weak-password':
      return 'Le mot de passe doit compter au moins 6 caractères.'
    case 'auth/network-request-failed':
      return 'Connexion impossible. Vérifiez votre accès à internet.'
    default:
      return 'Une erreur est survenue. Réessayez dans un instant.'
  }
}

/** Intitulés des opérations que Firebase peut demander. */
export const TITRES: Record<string, string> = {
  verifyEmail: 'Confirmation de votre adresse',
  verifyAndChangeEmail: 'Confirmation de votre nouvelle adresse',
  resetPassword: 'Nouveau mot de passe',
  recoverEmail: 'Retour à votre ancienne adresse',
}

/**
 * L'adresse de retour est-elle chez nous ?
 *
 * Firebase transmet une adresse de continuation, et un bouton la propose. Elle
 * arrive par l'adresse de la page, donc modifiable par n'importe qui : sans ce
 * contrôle, un lien fabriqué renverrait l'artiste sur un site étranger depuis
 * une page à nos couleurs, ce qui est exactement la forme d'une escroquerie.
 */
export function retourSur(suite: string | null): string | null {
  if (!suite) return null
  try {
    const u = new URL(suite)
    return u.hostname === 'rapidmusic.fr' || u.hostname === 'www.rapidmusic.fr' ? u.toString() : null
  } catch {
    return null
  }
}
