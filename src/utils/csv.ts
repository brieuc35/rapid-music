/**
 * Lecture de relevés de royalties au format CSV.
 *
 * Les distributeurs (Believe, DistroKid, TuneCore…) fournissent des relevés
 * dont les intitulés de colonnes varient. Le parseur reste donc tolérant :
 * il détecte le séparateur et reconnaît les colonnes par mots-clés.
 */

export interface ParsedRow {
  period: string
  streams: number
  amount: number
  /** Présent si le fichier comporte une colonne de plateforme. */
  platform?: string
}

export interface ParseResult {
  rows: ParsedRow[]
  /** Messages destinés à l'utilisateur (lignes ignorées, colonne absente…). */
  problems: string[]
  /** Vrai si le fichier répartit ses lignes entre plusieurs plateformes. */
  hasPlatformColumn: boolean
}

/** Découpe une ligne CSV en tenant compte des champs entre guillemets. */
function splitLine(line: string, sep: string): string[] {
  const out: string[] = []
  let cur = ''
  let quoted = false

  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') {
      if (quoted && line[i + 1] === '"') {
        cur += '"'
        i++
      } else {
        quoted = !quoted
      }
    } else if (ch === sep && !quoted) {
      out.push(cur)
      cur = ''
    } else {
      cur += ch
    }
  }
  out.push(cur)
  return out.map((c) => c.trim().replace(/^"|"$/g, ''))
}

function detectSeparator(headerLine: string): string {
  const counts = [';', ',', '\t'].map((s) => [s, headerLine.split(s).length] as const)
  counts.sort((a, b) => b[1] - a[1])
  return counts[0][1] > 1 ? counts[0][0] : ','
}

/** Convertit « 1 234,56 » ou « 1,234.56 » ou « 2870 » en nombre. */
function toNumber(raw: string): number | null {
  if (!raw) return null
  let s = raw.replace(/[\s €$£]/g, '')
  const lastComma = s.lastIndexOf(',')
  const lastDot = s.lastIndexOf('.')

  if (lastComma > -1 && lastDot > -1) {
    // Le séparateur décimal est le dernier des deux
    if (lastComma > lastDot) s = s.replace(/\./g, '').replace(',', '.')
    else s = s.replace(/,/g, '')
  } else if (lastComma > -1) {
    // Virgule seule : décimale si elle isole 1 ou 2 chiffres, sinon milliers
    s = /,\d{1,2}$/.test(s) ? s.replace(',', '.') : s.replace(/,/g, '')
  }

  const n = Number(s)
  return Number.isFinite(n) ? n : null
}

function findIndex(headers: string[], keywords: string[]): number {
  return headers.findIndex((h) => keywords.some((k) => h.includes(k)))
}

/**
 * Ramène le nom de plateforme d'un relevé sur celui utilisé par l'application.
 * Les distributeurs écrivent « APPLE MUSIC », « Spotify FR », « iTunes »… ;
 * sans cela, chaque variante créerait une plateforme distincte.
 */
function normalizePlatform(raw: string): string {
  const s = raw.toLowerCase()
  const known: [string, string][] = [
    ['spotify', 'Spotify'],
    ['apple', 'Apple Music'],
    ['itunes', 'Apple Music'],
    ['deezer', 'Deezer'],
    ['youtube', 'YouTube Music'],
    ['amazon', 'Amazon Music'],
    ['tidal', 'Tidal'],
    ['bandcamp', 'Bandcamp'],
    ['soundcloud', 'SoundCloud'],
  ]
  for (const [needle, label] of known) {
    if (s.includes(needle)) return label
  }
  // Plateforme inconnue : on garde le libellé d'origine, proprement capitalisé.
  return raw.charAt(0).toUpperCase() + raw.slice(1)
}

export function parseRoyaltyCsv(text: string): ParseResult {
  const problems: string[] = []
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)

  if (lines.length < 2) {
    return {
      rows: [],
      problems: ['Le fichier doit contenir un en-tête et au moins une ligne.'],
      hasPlatformColumn: false,
    }
  }

  const sep = detectSeparator(lines[0])
  const headers = splitLine(lines[0], sep).map((h) => h.toLowerCase())

  const iPeriod = findIndex(headers, ['période', 'periode', 'period', 'mois', 'month', 'date'])
  const iStreams = findIndex(headers, ['stream', 'écoute', 'ecoute', 'play', 'quantit'])
  const iAmount = findIndex(headers, ['revenu', 'montant', 'amount', 'net', 'royalt', 'earning'])
  // Les relevés de distributeur regroupent toutes les plateformes dans un même
  // fichier, avec une colonne les distinguant.
  const iPlatform = findIndex(headers, ['plateforme', 'platform', 'store', 'dsp', 'boutique', 'service'])

  const missing: string[] = []
  if (iPeriod < 0) missing.push('période')
  if (iStreams < 0) missing.push('streams')
  if (iAmount < 0) missing.push('revenu')
  if (missing.length) {
    return {
      rows: [],
      problems: [
        `Colonnes introuvables : ${missing.join(', ')}. ` +
          `En-tête détecté : ${headers.join(' | ') || '(vide)'}`,
      ],
      hasPlatformColumn: false,
    }
  }

  const rows: ParsedRow[] = []
  lines.slice(1).forEach((line, idx) => {
    const cells = splitLine(line, sep)
    const period = (cells[iPeriod] ?? '').trim()
    const streams = toNumber(cells[iStreams] ?? '')
    const amount = toNumber(cells[iAmount] ?? '')

    if (!period) {
      problems.push(`Ligne ${idx + 2} ignorée : période vide.`)
      return
    }
    if (streams === null || amount === null) {
      problems.push(`Ligne ${idx + 2} ignorée : streams ou revenu illisible.`)
      return
    }

    const row: ParsedRow = { period, streams: Math.round(streams), amount }
    if (iPlatform >= 0) {
      const platform = (cells[iPlatform] ?? '').trim()
      if (!platform) {
        problems.push(`Ligne ${idx + 2} ignorée : plateforme vide.`)
        return
      }
      row.platform = normalizePlatform(platform)
    }
    rows.push(row)
  })

  if (!rows.length && !problems.length) problems.push('Aucune ligne exploitable.')
  return { rows, problems, hasPlatformColumn: iPlatform >= 0 }
}
