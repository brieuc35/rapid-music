/* -------------------------------------------------------------------------- */
/*  Les deux courriels automatiques — contenu et décisions                     */
/*                                                                            */
/*  Ce fichier ne parle ni à Firebase ni au réseau : il ne fait que décider    */
/*  s'il faut écrire, et fabriquer ce qui sera écrit. C'est délibéré — c'est la */
/*  seule partie qui peut être vérifiée par des tests, et c'est là que vivent   */
/*  les erreurs qui se voient : un mail envoyé deux fois, un prénom mal         */
/*  échappé, un lien absent.                                                   */
/* -------------------------------------------------------------------------- */

/** Abonnement tel qu'il est rangé dans `abonnements/{uid}`. */
export interface Abonnement {
  plan?: string
  depuis?: string
  jusqua?: string
}

/**
 * Faut-il annoncer l'abonnement Pro ?
 *
 * Uniquement au **passage** à Pro. Une simple relecture du document, un
 * changement de date d'échéance ou un renouvellement ne doivent rien envoyer :
 * un déclencheur Firestore se réveille à chaque écriture, et sans cette
 * condition l'artiste recevrait le même message à chaque fois.
 *
 * Un aller-retour libre → pro → libre → pro renvoie bien un second message, et
 * c'est voulu : il s'est passé quelque chose de neuf.
 */
export function passeAPro(avant: Abonnement | null, apres: Abonnement | null): boolean {
  return estPro(apres) && !estPro(avant)
}

/**
 * Un abonnement ouvre-t-il les fonctions payantes ?
 *
 * Reprend mot pour mot la règle du navigateur (`subscriptionActive` dans
 * src/store/subscription.ts) : toute autre valeur que « pro » vaut non-abonné,
 * et une échéance dépassée aussi. Les deux doivent dire la même chose, sinon on
 * félicite quelqu'un que l'application laisse dehors.
 */
export function estPro(a: Abonnement | null, aujourdhui?: string): boolean {
  if (!a || a.plan !== 'pro') return false
  const jour = aujourdhui ?? new Date().toISOString().slice(0, 10)
  if (a.jusqua && a.jusqua < jour) return false
  return true
}

/* -------------------------------------------------------------------------- */
/*  Gabarits                                                                   */
/* -------------------------------------------------------------------------- */

/**
 * Neutralise le texte inséré dans le HTML.
 *
 * Une adresse e-mail ou un nom de scène arrive de l'artiste : sans échappement,
 * une apostrophe casse l'attribut le plus proche, et un chevron ouvre une balise
 * dans un message qui part chez quelqu'un d'autre.
 */
export function echapper(texte: string): string {
  return texte
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

export interface Courriel {
  subject: string
  html: string
  text: string
}

const SITE = 'https://rapidmusic.fr'
const VIOLET = '#8b5cf6'
const FUCHSIA = '#d946ef'

/**
 * Enveloppe commune aux deux messages.
 *
 * Tout est en styles rangés dans les balises : les logiciels de messagerie
 * ignorent les feuilles de style, et beaucoup suppriment le `<style>` du
 * `<head>`. Aucune image non plus — la plupart des clients les bloquent par
 * défaut, un message qui en dépend arrive donc vide de sens.
 */
function enveloppe(titre: string, corps: string): string {
  return `<!doctype html>
<html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"></head>
<body style="margin:0;padding:0;background:#f5f3ff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#1f2937">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f5f3ff">
    <tr><td align="center" style="padding:24px 12px">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:520px;background:#ffffff;border-radius:14px;overflow:hidden">
        <tr><td style="background:linear-gradient(135deg,${VIOLET},${FUCHSIA});background-color:${VIOLET};padding:22px 26px">
          <span style="font-size:19px;font-weight:700;color:#ffffff">RapidMusic</span>
        </td></tr>
        <tr><td style="padding:26px">
          <h1 style="margin:0 0 14px;font-size:20px;line-height:1.3;color:#1f2937">${titre}</h1>
          ${corps}
        </td></tr>
        <tr><td style="padding:0 26px 24px">
          <p style="margin:0;font-size:12px;line-height:1.6;color:#6b7280">
            Ce message vous est envoyé parce qu'un compte RapidMusic a été ouvert avec cette adresse.<br>
            <a href="${SITE}/#/confidentialite" style="color:#7c3aed">Confidentialité</a> &middot;
            <a href="${SITE}/#/conditions" style="color:#7c3aed">Conditions d'utilisation</a>
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`
}

/** Bouton d'action. Une table et non un `<a>` mis en forme : Outlook ignore le padding d'un lien. */
function bouton(lien: string, texte: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:20px 0">
    <tr><td style="border-radius:9px;background:${VIOLET}">
      <a href="${lien}" style="display:inline-block;padding:12px 22px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none">${texte}</a>
    </td></tr></table>`
}

/**
 * Mail d'ouverture de compte : il accueille **et** porte le lien de
 * confirmation.
 *
 * Le but est un seul message et non deux : Firebase sait envoyer sa propre
 * demande de confirmation, mais elle arrive à la même seconde que celui-ci, et
 * deux messages simultanés pour un seul évènement font mauvais effet. Le lien
 * étant fabriqué côté serveur, il n'y a rien à perdre à le porter ici.
 *
 * L'envoi par le navigateur subsiste tant que ces fonctions ne sont pas
 * déployées et vérifiées — le retirer avant laisserait une période sans aucun
 * message. La marche à suivre est dans docs/courriels.md.
 */
export function mailBienvenue(lienConfirmation: string): Courriel {
  const html = enveloppe(
    'Bienvenue sur RapidMusic',
    `<p style="margin:0 0 14px;font-size:15px;line-height:1.6">Votre compte est ouvert. Il ne reste qu'à confirmer votre adresse, pour que vous puissiez récupérer votre mot de passe en cas d'oubli.</p>
     ${bouton(echapper(lienConfirmation), 'Confirmer mon adresse')}
     <p style="margin:0 0 6px;font-size:15px;line-height:1.6;font-weight:600">Pour démarrer</p>
     <ul style="margin:0 0 14px;padding-left:20px;font-size:15px;line-height:1.7">
       <li>Ajoutez votre premier concert : dates, cachet, billets vendus.</li>
       <li>Notez vos sorties et suivez leurs écoutes.</li>
       <li>Rangez vos contrats et vos contacts au même endroit.</li>
     </ul>
     <p style="margin:0;font-size:15px;line-height:1.6">Une question ? Répondez simplement à ce message.</p>`,
  )
  const text = `Bienvenue sur RapidMusic

Votre compte est ouvert. Il ne reste qu'à confirmer votre adresse, pour que vous
puissiez récupérer votre mot de passe en cas d'oubli :

${lienConfirmation}

Pour démarrer :
- Ajoutez votre premier concert : dates, cachet, billets vendus.
- Notez vos sorties et suivez leurs écoutes.
- Rangez vos contrats et vos contacts au même endroit.

Une question ? Répondez simplement à ce message.`
  return { subject: 'Bienvenue sur RapidMusic — confirmez votre adresse', html, text }
}

/**
 * Mail de confirmation de l'abonnement Pro.
 *
 * Ce n'est pas un reçu : le prestataire de paiement envoie le sien, et c'est le
 * seul qui fasse foi comptablement. Celui-ci confirme que le compte est bien
 * passé en Pro — la question que se pose l'artiste après avoir payé.
 */
export function mailPro(depuis?: string): Courriel {
  const leJour = depuis ? ` depuis le ${formaterDate(depuis)}` : ''
  const html = enveloppe(
    'Votre compte Pro est actif',
    `<p style="margin:0 0 14px;font-size:15px;line-height:1.6">C'est confirmé : votre abonnement Pro est en cours${leJour}. Toutes les fonctions sont ouvertes, sans limite de contacts.</p>
     ${bouton(`${SITE}/#/tableau-de-bord`, 'Ouvrir RapidMusic')}
     <p style="margin:0 0 14px;font-size:15px;line-height:1.6">Merci de votre confiance. Le reçu de votre paiement vous est envoyé séparément par notre prestataire.</p>
     <p style="margin:0;font-size:15px;line-height:1.6">Une question ? Répondez simplement à ce message.</p>`,
  )
  const text = `Votre compte Pro est actif

C'est confirmé : votre abonnement Pro est en cours${leJour}. Toutes les fonctions
sont ouvertes, sans limite de contacts.

${SITE}/#/tableau-de-bord

Merci de votre confiance. Le reçu de votre paiement vous est envoyé séparément
par notre prestataire.

Une question ? Répondez simplement à ce message.`
  return { subject: 'Votre compte RapidMusic Pro est actif', html, text }
}

/**
 * Date ISO en français lisible. Retourne la valeur d'origine si elle n'est pas
 * une date : mieux vaut une phrase un peu sèche qu'un « Invalid Date » dans un
 * message qui part chez un client.
 */
export function formaterDate(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
}
