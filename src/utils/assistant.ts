/* -------------------------------------------------------------------------- */
/*  Parler à l'assistant                                                       */
/*                                                                            */
/*  Un seul appel, et rien d'autre : la question part au serveur, la réponse   */
/*  revient. Tout le reste — la clef d'API, la vérification de l'abonnement,   */
/*  le quota, le dossier de l'artiste — se passe dans la fonction serveur.     */
/*                                                                            */
/*  Rien de cela ne pourrait vivre ici. Une clef d'API posée dans une page web */
/*  est publique : il suffit d'ouvrir les outils de développement pour la      */
/*  lire, et elle se facture à l'usage. Un quota tenu dans le navigateur se    */
/*  remet à zéro en rechargeant la page.                                      */
/* -------------------------------------------------------------------------- */

import { FirebaseError } from 'firebase/app'
import { httpsCallable } from 'firebase/functions'
import { functions } from '@/firebase'

/** Un tour de conversation. Le même vocabulaire que l'API des messages. */
export interface Tour {
  role: 'user' | 'assistant'
  content: string
}

/** Ce que le serveur rend : la réponse, et ce qui reste du quota du mois. */
export interface Reponse {
  reponse: string
  restantes: number
}

/**
 * Erreur portant un message affichable tel quel.
 *
 * `epuise` distingue le seul cas où réessayer ne sert à rien et où l'écran doit
 * dire autre chose que « réessayez » : le quota du mois est consommé.
 */
export class ErreurAssistant extends Error {
  constructor(
    message: string,
    readonly epuise = false,
  ) {
    super(message)
  }
}

/**
 * Pose une question, en rendant toute la conversation.
 *
 * L'historique repart en entier à chaque fois : l'API ne retient rien d'un
 * appel à l'autre, et c'est le serveur qui décide combien de tours il en garde.
 *
 * Les messages d'erreur viennent du serveur quand il en donne un — il sait, lui,
 * si c'est l'abonnement, le quota ou une panne. Le repli ne sert qu'aux pannes
 * qui n'arrivent jamais jusqu'à lui.
 */
export async function demander(conversation: Tour[]): Promise<Reponse> {
  const appel = httpsCallable<{ conversation: Tour[] }, Reponse>(functions, 'assistant')
  try {
    const { data } = await appel({ conversation })
    return data
  } catch (e) {
    if (e instanceof FirebaseError) {
      throw new ErreurAssistant(
        e.message || "L'assistant n'a pas répondu.",
        e.code === 'functions/resource-exhausted',
      )
    }
    throw new ErreurAssistant("L'assistant n'a pas répondu. Vérifiez votre connexion.")
  }
}
