/* -------------------------------------------------------------------------- */
/*  L'assistant : ce qui se décide sans réseau                                 */
/*                                                                            */
/*  Les instructions données au modèle, le dossier qu'on lui confie, et le     */
/*  quota mensuel. L'appel à Claude est dans index.ts ; tout ce qui se vérifie */
/*  par un test est ici.                                                       */
/*                                                                            */
/*  Le dossier est la raison d'être de cet assistant. Un modèle de langage sait*/
/*  déjà parler du métier de la musique — l'artiste peut le lui demander       */
/*  ailleurs, gratuitement. Ce qu'il ne peut obtenir nulle part ailleurs, c'est*/
/*  une réponse qui tienne compte de ses dates, de ses contrats et de ses      */
/*  revenus à lui. D'où ce résumé, joint à chaque question.                    */
/* -------------------------------------------------------------------------- */

/*  La clef de l'API d'Anthropic. Le nom ici, la valeur dans le gestionnaire de
 *  secrets, jamais dans le dépôt — comme les trois secrets d'Apple.
 *
 *  Elle se facture à l'usage : qui l'obtient dépense l'argent de l'éditeur. */
export const ANTHROPIC_CLE = 'ANTHROPIC_CLE'

/**
 * La collection des compteurs mensuels, fermée au navigateur.
 *
 * Un compteur tenu dans le navigateur se remet à zéro en rechargeant la page ;
 * celui-ci est écrit par la fonction, avec les droits d'administration qui
 * passent au-dessus des règles de sécurité.
 */
export const ASSISTANT = 'assistant'

/*  Le modèle, et la profondeur de réflexion demandée.
 *
 *  `low` et non le réglage par défaut : une conversation d'assistance n'est pas
 *  un problème de raisonnement long, et les niveaux élevés y coûtent sans que la
 *  réponse s'améliore. Ils se justifieraient pour une analyse de contrat ligne
 *  à ligne — pas pour « à qui dois-je envoyer mon EP ».
 *
 *  Le plafond de réponse borne deux choses à la fois : la facture, et la
 *  longueur de ce qu'on lit sur un téléphone. */
export const MODELE = 'claude-opus-5-5'
export const EFFORT = 'low'
export const MAX_JETONS_REPONSE = 1500

/** Ce qu'on lit du document de l'artiste. Volontairement partiel. */
export interface DonneesArtiste {
  artist?: {
    stageName?: string
    realName?: string
    genre?: string
    city?: string
    bio?: string
  }
  label?: { name?: string; distribution?: string; publishing?: string }
  concerts?: Array<{
    venue?: string
    city?: string
    date?: string
    status?: string
    capacity?: number
    ticketsSold?: number
    fee?: number
    promoter?: string
  }>
  contracts?: Array<{
    title?: string
    party?: string
    type?: string
    status?: string
    startDate?: string
    endDate?: string
    value?: number
    royaltyRate?: number
  }>
  releases?: Array<{
    title?: string
    type?: string
    date?: string
    status?: string
    streams?: number
  }>
  royalties?: Array<{ platform?: string; period?: string; streams?: number; amount?: number }>
  studio?: Array<{ title?: string; studio?: string; date?: string; type?: string; cost?: number }>
  tasks?: Array<{ title?: string; done?: boolean; due?: string; priority?: string; category?: string }>
  contacts?: Array<{ name?: string; role?: string; company?: string; category?: string }>
}

/**
 * Ce que l'assistant est, et ce qu'il n'est pas.
 *
 * Trois exigences valent d'être expliquées, parce qu'elles ne sont pas des
 * préférences de style :
 *
 * **Ne rien inventer de chiffré.** Un assistant qui estime un cachet plausible
 * rend un service pire que l'absence de réponse : l'artiste le répétera à un
 * tourneur. Les chiffres viennent du dossier ou ne viennent pas.
 *
 * **Renvoyer vers un professionnel sur le droit et la fiscalité.** Ce sont les
 * deux domaines où une réponse approximative coûte cher et longtemps. Dire le
 * paysage est utile ; tenir lieu d'avocat ne l'est pas.
 *
 * **Le contexte est français.** SACEM, SPPF, intermittence, GUSO, Centre
 * national de la musique : un artiste qui demande comment déclarer ses titres
 * n'attend pas la réponse américaine, et elle serait fausse pour lui.
 */
export const INSTRUCTIONS = `Tu es l'assistant de RapidMusic, une application de gestion de carrière pour musiciens indépendants. Tu es un spécialiste du métier de la musique : contrats, droits d'auteur et droits voisins, royalties, distribution, booking et tournée, promotion, financement.

Le contexte est français et européen. Quand c'est pertinent, nomme les organismes réels — SACEM, SPPF, SCPP, Centre national de la musique, GUSO, statut d'intermittent du spectacle — plutôt que leurs équivalents américains, qui ne s'appliquent pas ici.

Tu reçois à chaque question le dossier de l'artiste : ses concerts, ses contrats, ses sorties, ses revenus, son agenda, ses tâches et ses contacts. Sers-t'en. Une réponse qui cite une date, une salle ou un montant réels vaut dix réponses générales.

Règles, dans cet ordre d'importance :

1. N'invente jamais un chiffre. Les montants, dates, taux et noms viennent du dossier. Si le dossier ne contient pas ce qu'il faut pour répondre, dis-le et demande la donnée manquante. Un ordre de grandeur du marché est admis, mais annonce-le comme tel — jamais comme la situation de l'artiste.
2. Sur le droit, les contrats et la fiscalité, explique le paysage, les points de vigilance et les questions à poser. Puis recommande de faire relire par un avocat ou un conseil spécialisé avant de signer. Tu éclaires une décision, tu ne la prends pas.
3. Sois concret et bref. Deux à cinq paragraphes courts, ou une liste quand il y a des étapes. Pas de préambule, pas de résumé de la question, pas de formule de politesse finale.
4. Tutoie l'artiste et réponds en français.
5. Si on te demande autre chose que de la musique ou de la gestion de carrière, réponds brièvement et ramène vers ce que tu sais faire.`

/** Une date ISO courte, ou undefined si elle est absente ou illisible. */
function jour(v: unknown): string | undefined {
  if (typeof v !== 'string' || !v) return undefined
  const d = new Date(v)
  return Number.isNaN(d.getTime()) ? undefined : v.slice(0, 10)
}

function euros(v: unknown): string {
  return typeof v === 'number' && Number.isFinite(v) ? `${Math.round(v)} €` : '—'
}

function texte(v: unknown): string {
  return typeof v === 'string' && v.trim() ? v.trim() : ''
}

/*  Combien d'éléments de chaque sorte partent dans le dossier.
 *
 *  Ce ne sont pas des nombres ronds choisis au hasard : chaque ligne coûte des
 *  jetons à chaque question, et un artiste qui aurait trois cents concerts
 *  enregistrés ferait exploser la facture sans que sa réponse s'améliore. Les
 *  plafonds retiennent ce qui sert à conseiller — ce qui vient, ce qui est
 *  ouvert, ce qui est récent. */
const MAX = {
  concerts: 12,
  contrats: 10,
  sorties: 12,
  royalties: 12,
  agenda: 10,
  taches: 15,
}

/**
 * Le dossier de l'artiste, en texte lisible.
 *
 * En texte et non en JSON, pour deux raisons : à contenu égal il coûte environ
 * un tiers de jetons en moins, et un modèle le lit mieux qu'une structure dont
 * il devrait deviner les conventions de nommage.
 *
 * Les concerts et l'agenda sont filtrés sur l'avenir, les tâches sur ce qui
 * reste à faire : conseiller porte sur ce qui vient. L'historique n'est gardé
 * que là où il éclaire le présent — les royalties, qui disent ce que les
 * sorties rapportent vraiment.
 */
export function dossier(d: DonneesArtiste, aujourdhui: string): string {
  const lignes: string[] = []
  const a = d.artist ?? {}

  const identite = [
    texte(a.stageName) && `Nom de scène : ${texte(a.stageName)}`,
    texte(a.genre) && `Style : ${texte(a.genre)}`,
    texte(a.city) && `Ville : ${texte(a.city)}`,
    texte(d.label?.name) && `Label : ${texte(d.label?.name)}`,
    texte(d.label?.distribution) && `Distribution : ${texte(d.label?.distribution)}`,
    texte(d.label?.publishing) && `Édition : ${texte(d.label?.publishing)}`,
  ].filter(Boolean)
  lignes.push(`ARTISTE\n${identite.length ? identite.join('\n') : 'Profil non renseigné.'}`)
  if (texte(a.bio)) lignes.push(`BIOGRAPHIE\n${texte(a.bio)}`)

  const concerts = (d.concerts ?? [])
    .filter((c) => (jour(c.date) ?? '') >= aujourdhui)
    .sort((x, y) => (jour(x.date) ?? '').localeCompare(jour(y.date) ?? ''))
    .slice(0, MAX.concerts)
    .map((c) => {
      const remplissage =
        typeof c.capacity === 'number' && c.capacity > 0 && typeof c.ticketsSold === 'number'
          ? `, ${c.ticketsSold}/${c.capacity} billets`
          : ''
      return `- ${jour(c.date) ?? '(sans date)'} · ${texte(c.venue) || '(salle inconnue)'}, ${texte(c.city) || '—'} · ${texte(c.status) || '—'} · cachet ${euros(c.fee)}${remplissage}${texte(c.promoter) ? ` · ${texte(c.promoter)}` : ''}`
    })
  lignes.push(
    `CONCERTS À VENIR\n${concerts.length ? concerts.join('\n') : 'Aucune date à venir.'}`,
  )

  const contrats = (d.contracts ?? [])
    .filter((c) => texte(c.status) !== 'Expiré')
    .slice(0, MAX.contrats)
    .map(
      (c) =>
        `- ${texte(c.title) || '(sans titre)'} · ${texte(c.type) || '—'} avec ${texte(c.party) || '—'} · ${texte(c.status) || '—'} · du ${jour(c.startDate) ?? '—'} au ${jour(c.endDate) ?? '—'} · ${euros(c.value)}${typeof c.royaltyRate === 'number' ? ` · ${c.royaltyRate} % artiste` : ''}`,
    )
  lignes.push(`CONTRATS EN COURS\n${contrats.length ? contrats.join('\n') : 'Aucun contrat.'}`)

  const sorties = (d.releases ?? [])
    .sort((x, y) => (jour(y.date) ?? '').localeCompare(jour(x.date) ?? ''))
    .slice(0, MAX.sorties)
    .map(
      (r) =>
        `- ${texte(r.title) || '(sans titre)'} · ${texte(r.type) || '—'} · ${jour(r.date) ?? '—'} · ${texte(r.status) || '—'}${typeof r.streams === 'number' ? ` · ${r.streams} écoutes` : ''}`,
    )
  lignes.push(`SORTIES\n${sorties.length ? sorties.join('\n') : 'Aucune sortie.'}`)

  const revenus = (d.royalties ?? [])
    .slice(-MAX.royalties)
    .map(
      (r) =>
        `- ${texte(r.platform) || '—'} · ${texte(r.period) || '—'} · ${euros(r.amount)}${typeof r.streams === 'number' ? ` · ${r.streams} écoutes` : ''}`,
    )
  lignes.push(
    `REVENUS DÉCLARÉS\n${revenus.length ? revenus.join('\n') : 'Aucun revenu enregistré.'}`,
  )

  const agenda = (d.studio ?? [])
    .filter((s) => (jour(s.date) ?? '') >= aujourdhui)
    .sort((x, y) => (jour(x.date) ?? '').localeCompare(jour(y.date) ?? ''))
    .slice(0, MAX.agenda)
    .map(
      (s) =>
        `- ${jour(s.date) ?? '—'} · ${texte(s.title) || '(sans titre)'} · ${texte(s.type) || '—'}${texte(s.studio) ? ` · ${texte(s.studio)}` : ''} · ${euros(s.cost)}`,
    )
  lignes.push(`AGENDA À VENIR\n${agenda.length ? agenda.join('\n') : 'Rien de prévu.'}`)

  const taches = (d.tasks ?? [])
    .filter((t) => t.done !== true)
    .slice(0, MAX.taches)
    .map(
      (t) =>
        `- ${texte(t.title) || '(sans titre)'}${jour(t.due) ? ` · échéance ${jour(t.due)}` : ''} · ${texte(t.priority) || '—'} · ${texte(t.category) || '—'}`,
    )
  lignes.push(`TÂCHES OUVERTES\n${taches.length ? taches.join('\n') : 'Aucune tâche ouverte.'}`)

  /*  Les contacts ne partent pas nommément : ce sont des données personnelles
   *  de tiers, qui n'ont pas consenti à ce qu'on les confie à un service
   *  d'analyse. Le compte par catégorie suffit à ce qu'un conseil s'y appuie
   *  — « tu n'as aucun contact presse » est utile, leurs adresses ne le sont
   *  pas. */
  const parCategorie = new Map<string, number>()
  for (const c of d.contacts ?? []) {
    const cle = texte(c.category) || 'Autre'
    parCategorie.set(cle, (parCategorie.get(cle) ?? 0) + 1)
  }
  const repartition = [...parCategorie.entries()].map(([k, n]) => `${k} : ${n}`).join(', ')
  lignes.push(`CARNET DE CONTACTS\n${repartition || 'Aucun contact.'}`)

  return `Nous sommes le ${aujourdhui}.\n\n${lignes.join('\n\n')}`
}

/* -------------------------------------------------------------------------- */
/*  Le quota                                                                   */
/* -------------------------------------------------------------------------- */

/**
 * Nombre de questions par mois et par compte.
 *
 * Il ne protège pas contre l'abus — l'assistant est réservé aux abonnés, et
 * personne ne paie 9,99 € pour nuire. Il protège contre l'accident : une boucle
 * dans une version future, un script d'essai oublié, un compte partagé. Sans
 * plafond, une seule nuit suffirait à transformer un abonnement en perte.
 *
 * Cinquante, parce que c'est bien au-delà d'un usage normal — une question par
 * semaine serait déjà beaucoup — et bien en deçà de ce qui coûterait cher.
 */
export const LIMITE_MENSUELLE = 50

/** Le mois d'une date ISO, sous la forme AAAA-MM. */
export function moisDe(iso: string): string {
  return iso.slice(0, 7)
}

/**
 * Combien de questions restent à ce compte ce mois-ci.
 *
 * Le compteur est remis à zéro par le changement de mois et non par une tâche
 * planifiée : un compteur daté se réinitialise tout seul, et il n'y a rien à
 * faire tourner la nuit du 1er. Un mois qui ne correspond pas est un mois neuf.
 */
export function questionsRestantes(
  compteur: { mois?: string; nombre?: number } | undefined,
  mois: string,
  limite = LIMITE_MENSUELLE,
): number {
  if (!compteur || compteur.mois !== mois) return limite
  const faites = typeof compteur.nombre === 'number' ? compteur.nombre : 0
  return Math.max(0, limite - faites)
}

/* -------------------------------------------------------------------------- */
/*  Ce que le navigateur a le droit d'envoyer                                  */
/* -------------------------------------------------------------------------- */

/** Un tour de conversation, tel que l'API des messages l'attend. */
export interface Tour {
  role: 'user' | 'assistant'
  content: string
}

/*  Ce qui borne une conversation.
 *
 *  L'historique est renvoyé en entier à chaque question — l'API ne retient
 *  rien — et il est donc refacturé à chaque fois. Sans plafond, une
 *  conversation d'une heure coûterait à la fin dix fois ce qu'elle coûtait au
 *  début, pour une réponse qui ne s'améliore plus.
 *
 *  Seize tours valent environ huit questions et leurs réponses : au-delà, le
 *  début de la conversation ne sert plus de rien. Le navigateur affiche tout,
 *  mais n'envoie que la fin. */
const MAX_TOURS = 16
const MAX_CARACTERES = 4000

/**
 * Trie ce qui arrive du navigateur, qui peut envoyer n'importe quoi.
 *
 * Rien de ce qui vient de là n'est digne de confiance : la fonction est
 * appelable par qui sait ouvrir une console, et un tableau de dix mille tours
 * passerait sans broncher jusqu'à la facture. Les tours mal formés sont
 * écartés, la longueur est coupée, et seuls les derniers sont retenus.
 *
 * Rend un tableau vide quand il n'y a rien d'exploitable — l'appelant refuse
 * alors, plutôt que d'interroger le modèle sur du vide.
 */
export function conversationPropre(brut: unknown): Tour[] {
  if (!Array.isArray(brut)) return []

  const tours: Tour[] = []
  for (const t of brut) {
    const role = (t as Tour)?.role
    const contenu = (t as Tour)?.content
    if (role !== 'user' && role !== 'assistant') continue
    if (typeof contenu !== 'string' || !contenu.trim()) continue
    tours.push({ role, content: contenu.trim().slice(0, MAX_CARACTERES) })
  }

  /*  La conversation doit commencer par une question : l'API refuse un
   *  historique qui s'ouvre sur une réponse, et la coupe aux derniers tours
   *  peut tomber juste après une question. */
  const derniers = tours.slice(-MAX_TOURS)
  while (derniers.length && derniers[0].role !== 'user') derniers.shift()

  /*  Et finir par une question, sans quoi on demanderait au modèle de commenter
   *  sa propre réponse. */
  if (derniers.length && derniers[derniers.length - 1].role !== 'user') return []
  return derniers
}
