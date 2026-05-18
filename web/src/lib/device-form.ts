import type { CustomUnit } from '../types/device'

export function unitToMs(amount: number, unit: CustomUnit): number {
  switch (unit) {
    case 'seconds': return amount * 1_000
    case 'minutes': return amount * 60_000
    case 'hours':   return amount * 3_600_000
    case 'days':    return amount * 86_400_000
    default:        return amount * 1_000
  }
}

/** null = server default; `err` = invalid input */
export function parseOfflineGraceMs(daysStr: string, minutesStr: string): number | null | 'err' {
  const dTrim = daysStr.trim()
  const mTrim = minutesStr.trim()
  if (!dTrim && !mTrim) return null
  const d = dTrim === '' ? 0 : Number(dTrim)
  const m = mTrim === '' ? 0 : Number(mTrim)
  if (!Number.isInteger(d) || !Number.isInteger(m) || d < 0 || m < 0) return 'err'
  const total = d * 86_400_000 + m * 60_000
  if (total <= 0) return null
  return total
}

export function msToOfflineDaysMinutes(ms: number | null): { days: string; minutes: string } {
  if (ms == null || !Number.isFinite(ms)) return { days: '', minutes: '' }
  const d = Math.floor(ms / 86_400_000)
  const m = Math.floor((ms % 86_400_000) / 60_000)
  return { days: String(d), minutes: String(m) }
}

export function msToDatetimeLocal(ms: number): string {
  const d = new Date(ms)
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`
}

export function parseDatetimeLocal(s: string): number | null {
  const t = s.trim()
  if (!t) return null
  const ms = new Date(t).getTime()
  return Number.isFinite(ms) ? ms : null
}

export function fmtDate(ms: number | null) {
  if (ms == null) return '—'
  return new Date(ms).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}
