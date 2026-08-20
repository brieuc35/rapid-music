/* -------------------------------------------------------------------------- */
/*  La remise des messages au service d'envoi                                  */
/*                                                                            */
/*  Envoi direct en SMTP, et non par l'extension « Trigger Email » : celle-ci   */
/*  s'arrête le 31 mars 2027, et surtout ses réglages deviennent alors          */
/*  immodifiables — impossible d'y renouveler une clé qui aurait fuité. Cloud   */
/*  Functions, lui, n'est pas concerné par cet arrêt.                          */
/*                                                                            */
/*  Le service d'envoi est décrit par trois secrets, rangés dans Secret         */
/*  Manager. Ils ne sont donc ni dans ce dépôt, ni dans la configuration d'une  */
/*  extension : ils restent lisibles et modifiables à tout moment, sans         */
/*  redéployer.                                                                */
/*                                                                            */
/*  Rien ici n'est propre à Brevo. Changer de service se fait en changeant les  */
/*  secrets, pas le code.                                                      */
/* -------------------------------------------------------------------------- */

import { createTransport, type Transporter } from 'nodemailer'
import { getFirestore, FieldValue } from 'firebase-admin/firestore'
import { logger } from 'firebase-functions/v1'
import type { Courriel } from './courriels.js'

/** Serveur SMTP, port inclus s'il diffère de 465 : `smtp-relay.brevo.com`. */
export const SMTP_HOTE = 'SMTP_HOTE'
/** Identifiant de connexion au service d'envoi. */
export const SMTP_IDENTIFIANT = 'SMTP_IDENTIFIANT'
/** Clé SMTP. Un mot de passe : jamais dans le dépôt, jamais dans les DNS. */
export const SMTP_CLE = 'SMTP_CLE'

/** Ce que voit l'artiste comme expéditeur, et où partent ses réponses. */
const EXPEDITEUR = 'RapidMusic <bonjour@rapidmusic.fr>'
const REPONDRE_A = 'rapidmusic.rm@gmail.com'

/** Collection qui garde la trace des envois. Fermée au navigateur. */
const JOURNAL = 'courriels'

export interface OptionsSmtp {
  host: string
  port: number
  secure: boolean
  auth: { user: string; pass: string }
}

/**
 * Traduit les trois secrets en réglages de connexion.
 *
 * Séparée du reste pour être vérifiable : c'est ici que se loge l'erreur qui ne
 * se voit pas. Un port 587 ouvert en « secure » attend un chiffrement que le
 * serveur ne propose qu'après négociation — la connexion reste alors suspendue
 * jusqu'à expiration, sans message d'erreur utile.
 *
 * L'hôte accepte un port optionnel, séparé par deux-points. Sans port, 465.
 */
export function optionsSmtp(hote: string, identifiant: string, cle: string): OptionsSmtp {
  if (!hote || !identifiant || !cle) {
    /*  Message explicite plutôt qu'un échec d'authentification obscur trois
     *  étapes plus loin : c'est l'erreur la plus probable d'une première mise
     *  en service. */
    throw new Error(
      `Secrets d'envoi absents ou incomplets (${SMTP_HOTE}, ${SMTP_IDENTIFIANT}, ${SMTP_CLE}). Voir docs/courriels.md.`,
    )
  }
  const sep = hote.lastIndexOf(':')
  const nom = sep === -1 ? hote : hote.slice(0, sep)
  const port = sep === -1 ? 465 : Number(hote.slice(sep + 1))
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error(`Port SMTP invalide dans ${SMTP_HOTE} : « ${hote.slice(sep + 1)} »`)
  }
  return {
    host: nom,
    port,
    // Le port décide du chiffrement, et non un réglage à part : 465 est chiffré
    // d'emblée, 587 et les autres le deviennent après négociation.
    secure: port === 465,
    auth: { user: identifiant, pass: cle },
  }
}

/*  Le transport est gardé d'un appel à l'autre : une instance de fonction en
 *  sert souvent plusieurs à la suite, et rouvrir une connexion TLS à chaque
 *  message coûte plus cher que tout le reste réuni. */
let transport: Transporter | null = null

function obtenirTransport(): Transporter {
  if (transport) return transport
  transport = createTransport(
    optionsSmtp(process.env[SMTP_HOTE] ?? '', process.env[SMTP_IDENTIFIANT] ?? '', process.env[SMTP_CLE] ?? ''),
  )
  return transport
}

/**
 * Envoie un message et garde une trace de ce qui s'est passé.
 *
 * La trace remplace ce que l'extension écrivait dans le document qu'elle
 * ramassait : sans elle, un envoi manqué ne laisserait qu'une ligne dans un
 * journal technique que personne ne lit. Ici, la collection `courriels` dit qui
 * a reçu quoi, et pourquoi un message n'est pas parti.
 *
 * L'écriture de la trace ne peut pas faire échouer l'envoi : le message est
 * déjà parti, et perdre la trace vaut mieux que de laisser croire à un échec.
 */
export async function envoyer(destinataire: string, courriel: Courriel, sujet: Record<string, string>): Promise<void> {
  let erreur: string | null = null
  try {
    await obtenirTransport().sendMail({
      from: EXPEDITEUR,
      replyTo: REPONDRE_A,
      to: destinataire,
      subject: courriel.subject,
      text: courriel.text,
      html: courriel.html,
    })
  } catch (e) {
    erreur = e instanceof Error ? e.message : String(e)
  }

  try {
    await getFirestore()
      .collection(JOURNAL)
      .add({
        ...sujet,
        destinataire,
        objet: courriel.subject,
        etat: erreur ? 'echec' : 'envoye',
        ...(erreur ? { erreur } : {}),
        le: FieldValue.serverTimestamp(),
      })
  } catch (e) {
    logger.error('Trace impossible', { erreur: String(e) })
  }

  if (erreur) throw new Error(erreur)
}
