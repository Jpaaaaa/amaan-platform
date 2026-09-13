/** null = server default; `err` = invalid input */
export function parseOfflineGraceMs(
  daysStr: string,
  minutesStr: string,
): number | null | 'err' {
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

export function formatOfflineGraceMs(ms: number | null): string {
  if (ms == null || !Number.isFinite(ms)) return 'Server default'
  const d = Math.floor(ms / 86_400_000)
  const m = Math.floor((ms % 86_400_000) / 60_000)
  const parts: string[] = []
  if (d > 0) parts.push(`${d}d`)
  if (m > 0) parts.push(`${m}m`)
  return parts.length > 0 ? parts.join(' ') : '0m'
}
