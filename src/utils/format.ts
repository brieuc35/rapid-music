const eur = new Intl.NumberFormat('fr-FR', {
  style: 'currency',
  currency: 'EUR',
  maximumFractionDigits: 0,
})

const eurCents = new Intl.NumberFormat('fr-FR', {
  style: 'currency',
  currency: 'EUR',
  maximumFractionDigits: 2,
})

const num = new Intl.NumberFormat('fr-FR')

export function money(v: number, cents = false): string {
  return (cents ? eurCents : eur).format(v || 0)
}

export function number(v: number): string {
  return num.format(v || 0)
}

/** 1 240 000 -> 1,24 M */
export function compact(v: number): string {
  if (v >= 1_000_000) return (v / 1_000_000).toFixed(2).replace('.', ',') + ' M'
  if (v >= 1_000) return (v / 1_000).toFixed(1).replace('.', ',') + ' k'
  return num.format(v || 0)
}

export function formatDate(iso: string, opts?: Intl.DateTimeFormatOptions): string {
  if (!iso) return '—'
  const d = new Date(iso + (iso.length === 10 ? 'T00:00:00' : ''))
  if (isNaN(d.getTime())) return iso
  return d.toLocaleDateString(
    'fr-FR',
    opts ?? { day: 'numeric', month: 'short', year: 'numeric' },
  )
}

export function dayNum(iso: string): string {
  if (!iso) return ''
  const d = new Date(iso + 'T00:00:00')
  return String(d.getDate())
}

export function monthShort(iso: string): string {
  if (!iso) return ''
  const d = new Date(iso + 'T00:00:00')
  return d.toLocaleDateString('fr-FR', { month: 'short' }).replace('.', '')
}

export function weekday(iso: string): string {
  if (!iso) return ''
  const d = new Date(iso + 'T00:00:00')
  return d.toLocaleDateString('fr-FR', { weekday: 'short' }).replace('.', '')
}

/** Days from today; negative = past */
export function daysFromNow(iso: string): number {
  if (!iso) return NaN
  const d = new Date(iso + 'T00:00:00')
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return Math.round((d.getTime() - today.getTime()) / 86_400_000)
}

export function relativeDay(iso: string): string {
  const n = daysFromNow(iso)
  if (isNaN(n)) return ''
  if (n === 0) return "Aujourd'hui"
  if (n === 1) return 'Demain'
  if (n === -1) return 'Hier'
  if (n > 0) return `Dans ${n} j`
  return `Il y a ${-n} j`
}

/** « à l'instant », « il y a 3 h », « il y a 2 j », puis la date. */
export function relativeTime(iso: string): string {
  if (!iso) return ''
  const then = new Date(iso).getTime()
  if (isNaN(then)) return ''
  const mins = Math.round((Date.now() - then) / 60_000)

  if (mins < 1) return "à l'instant"
  if (mins < 60) return `il y a ${mins} min`
  const hours = Math.round(mins / 60)
  if (hours < 24) return `il y a ${hours} h`
  const days = Math.round(hours / 24)
  if (days < 7) return `il y a ${days} j`
  return formatDate(iso.slice(0, 10))
}

export function initials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('')
}
