/** Installer extensions that can be published (match the server's allow-list). */
const PUBLISHABLE_EXT = new Set(['.exe', '.zip', '.dmg', '.appimage', '.deb', '.rpm'])

export function isPublishable(name: string): boolean {
  const lower = name.toLowerCase()
  if (lower.endsWith('.exe.blockmap')) return false
  const dot = lower.lastIndexOf('.')
  if (dot < 0) return false
  return PUBLISHABLE_EXT.has(lower.slice(dot))
}

export function fmtBytes(n: number): string {
  if (!Number.isFinite(n) || n < 0) return '—'
  if (n < 1024) return `${n} B`
  const u = ['KB', 'MB', 'GB', 'TB']
  let v = n / 1024
  let i = 0
  while (v >= 1024 && i < u.length - 1) { v /= 1024; i++ }
  return `${v >= 10 ? v.toFixed(0) : v.toFixed(1)} ${u[i]}`
}

export function fmtDateTime(ms: number | null): string {
  if (ms == null || !Number.isFinite(ms)) return '—'
  const d = new Date(ms)
  return d.toLocaleString(undefined, {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

export function fmtIso(iso: string | null | undefined): string {
  if (!iso) return '—'
  const ms = Date.parse(iso)
  return Number.isFinite(ms) ? fmtDateTime(ms) : iso
}

export function fileExtLabel(name: string): string {
  const lower = name.toLowerCase()
  if (lower.endsWith('.exe.blockmap')) return 'BLOCKMAP'
  const dot = lower.lastIndexOf('.')
  if (dot < 0) return 'FILE'
  return lower.slice(dot + 1).toUpperCase()
}

export function fileBadgeClass(name: string): string {
  const base = 'inline-flex items-center rounded-full px-2.5 py-1 text-[0.6875rem] font-bold'
  const lower = name.toLowerCase()
  if (lower.endsWith('.yml') || lower.endsWith('.yaml')) {
    return `${base} bg-indigo-500/10 text-indigo-600`
  }
  if (lower.endsWith('.exe')) {
    return `${base} bg-emerald-500/10 text-emerald-600`
  }
  return `${base} bg-slate-100 text-label-2`
}

export function productQuery(p: string): string {
  return `?product=${encodeURIComponent(p)}`
}
