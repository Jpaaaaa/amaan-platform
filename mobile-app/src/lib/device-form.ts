export type CustomUnit = 'seconds' | 'minutes' | 'hours' | 'days'

export function unitToMs(amount: number, unit: CustomUnit): number {
  switch (unit) {
    case 'seconds':
      return amount * 1_000
    case 'minutes':
      return amount * 60_000
    case 'hours':
      return amount * 3_600_000
    case 'days':
      return amount * 86_400_000
    default:
      return amount * 1_000
  }
}

/** Same calendar-month overflow as date-fns `addMonths` (Jan 31 + 1m → Feb 28/29). */
function addCalendarMonths(issuedAtMs: number, months: number): number {
  const d = new Date(issuedAtMs)
  const day = d.getDate()
  d.setDate(1)
  d.setMonth(d.getMonth() + months)
  const last = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate()
  d.setDate(Math.min(day, last))
  return d.getTime()
}

/** Matches server `computeExpiryFromTier`: now + tier duration. `custom`/`lifetime` → null. */
export function computeExpiryFromTier(issuedAtMs: number, tier: string): number | null {
  if (tier === 'lifetime' || tier === 'custom') return null
  if (tier === '5d') return issuedAtMs + 5 * 86_400_000
  if (tier === '15d') return issuedAtMs + 15 * 86_400_000
  if (tier === '1m') return addCalendarMonths(issuedAtMs, 1)
  if (tier === '2m') return addCalendarMonths(issuedAtMs, 2)
  return null
}

export function formatDatetimeInput(ms: number): string {
  const d = new Date(ms)
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`
}

export function parseDatetimeInput(s: string): number | null {
  const t = s.trim()
  if (!t) return null
  const m = t.match(/^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})/)
  if (m) {
    return new Date(
      Number(m[1]),
      Number(m[2]) - 1,
      Number(m[3]),
      Number(m[4]),
      Number(m[5]),
    ).getTime()
  }
  const ms = new Date(t).getTime()
  return Number.isFinite(ms) ? ms : null
}
