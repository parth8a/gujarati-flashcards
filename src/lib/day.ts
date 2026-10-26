// A "study day" rolls over at 4am local time, so a late-night session still
// counts as the same day (same convention as Anki).
const ROLLOVER_HOUR = 4

function fmt(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function today(now = new Date()): string {
  const d = new Date(now)
  d.setHours(d.getHours() - ROLLOVER_HOUR)
  return fmt(d)
}

export function addDays(day: string, n: number): string {
  const [y, m, d] = day.split('-').map(Number)
  return fmt(new Date(y, m - 1, d + n))
}

export function daysBetween(from: string, to: string): number {
  const [y1, m1, d1] = from.split('-').map(Number)
  const [y2, m2, d2] = to.split('-').map(Number)
  return Math.round((Date.UTC(y2, m2 - 1, d2) - Date.UTC(y1, m1 - 1, d1)) / 86_400_000)
}
