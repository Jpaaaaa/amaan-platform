import { useCallback, useEffect, useState } from 'react'
import type { PlatformProductKey } from '@shared/platform-product'
import { LoginPage } from './LoginPage'
import { ReleasesTab } from './ReleasesTab'
import './styles.css'

type SessionState = 'loading' | 'anon' | 'ok'

type TabId = 'devices' | 'releases' | 'settings'

function productQuery(p: PlatformProductKey): string {
  return `?product=${encodeURIComponent(p)}`
}

/* ─── Types ─── */
const JSON_HEADERS: HeadersInit = { 'Content-Type': 'application/json' }
type CustomUnit = 'seconds' | 'minutes' | 'hours' | 'days'
type DeviceRow = {
  machineId: string
  label: string | null
  tier: string
  expiresAtMs: number | null
  revoked: boolean
  lastSyncAtMs: number | null
  createdAtMs: number
  updatedAtMs: number
  notes: string | null
  rollingMaxMs: number | null
  /** Resolved offline window (ms): per-device or server default). */
  effectiveRollingMaxMs?: number
  computedStatus: string
  rollingDeadlineMs: number
}

/* ─── Utils ─── */
function unitToMs(amount: number, unit: CustomUnit): number {
  switch (unit) {
    case 'seconds': return amount * 1_000
    case 'minutes': return amount * 60_000
    case 'hours':   return amount * 3_600_000
    case 'days':    return amount * 86_400_000
    default:        return amount * 1_000
  }
}

/** null = server default; `err` = invalid input */
function parseOfflineGraceMs(daysStr: string, minutesStr: string): number | null | 'err' {
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

function msToOfflineDaysMinutes(ms: number | null): { days: string; minutes: string } {
  if (ms == null || !Number.isFinite(ms)) return { days: '', minutes: '' }
  const d = Math.floor(ms / 86_400_000)
  const m = Math.floor((ms % 86_400_000) / 60_000)
  return { days: String(d), minutes: String(m) }
}
function msToDatetimeLocal(ms: number): string {
  const d = new Date(ms)
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`
}
function parseDatetimeLocal(s: string): number | null {
  const t = s.trim()
  if (!t) return null
  const ms = new Date(t).getTime()
  return Number.isFinite(ms) ? ms : null
}
function fmtDate(ms: number | null) {
  if (ms == null) return '—'
  return new Date(ms).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

/* ─── SVG Icons (M3 Style) ─── */
const Ico = {
  plus: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19"></line>
      <line x1="5" y1="12" x2="19" y2="12"></line>
    </svg>
  ),
  devices: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
      <line x1="8" y1="21" x2="16" y2="21"></line>
      <line x1="12" y1="17" x2="12" y2="21"></line>
    </svg>
  ),
  releases: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
      <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
      <line x1="12" y1="22.08" x2="12" y2="12"></line>
    </svg>
  ),
  settings: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3"></circle>
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
    </svg>
  ),
  refresh: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 4 23 10 17 10"></polyline>
      <polyline points="1 20 1 14 7 14"></polyline>
      <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
    </svg>
  ),
  edit: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
    </svg>
  ),
  lock: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
      <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
    </svg>
  ),
  unlock: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
      <path d="M7 11V7a5 5 0 0 1 9.9-1"></path>
    </svg>
  ),
  trash: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6"></polyline>
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
    </svg>
  ),
  exclamation: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.4" />
      <path d="M8 5v4M8 11v.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  ),
  empty: (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
      <rect x="8" y="4" width="28" height="36" rx="4" stroke="currentColor" strokeWidth="1.6" />
      <path d="M16 16h16M16 22h16M16 28h10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <circle cx="36" cy="36" r="8" fill="var(--bg-secondary)" stroke="currentColor" strokeWidth="1.4" />
      <path d="M33 36h6M36 33v6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  ),
}


/* ─── Field component (iOS grouped list cell) ─── */
function Field({
  label, hint, children, first = false,
}: { label: string; hint?: string; children: React.ReactNode; first?: boolean }) {
  return (
    <div className="field" style={first ? { borderRadius: '0' } : {}}>
      <label className="field__label">{label}</label>
      {children}
      {hint ? <p style={{ fontSize: 12, color: 'var(--label-3)', lineHeight: 1.45, paddingBottom: 8 }}>{hint}</p> : null}
    </div>
  )
}

/* ─── Modern Device Card ─── */
function DeviceCard({ d, onOpen }: { d: DeviceRow; onOpen: (d: DeviceRow) => void }) {
  const name = d.label?.trim() ? d.label : 'Unnamed Device'
  const isRevoked = d.revoked
  return (
    <button
      type="button"
      className="device-card-modern"
      onClick={() => onOpen(d)}
    >
      <div className="device-card-modern__info">
        <span className="device-card-modern__name">{name}</span>
        <span className="device-card-modern__id">{d.machineId}</span>
      </div>
      <div className={`status-badge ${isRevoked ? 'status-badge--revoked' : 'status-badge--active'}`}>
        <span className="status-badge__dot" />
        {isRevoked ? 'Revoked' : 'Active'}
      </div>
    </button>
  )
}


/* ─── Main App ─── */
export function App() {
  const [session, setSession] = useState<SessionState>('loading')
  const [authEnabled, setAuthEnabled] = useState(false)

  const [devices, setDevices] = useState<DeviceRow[]>([])
  const [error, setError]     = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const [newMachineId, setNewMachineId] = useState('')
  const [newLabel,     setNewLabel]     = useState('')
  const [newTier,      setNewTier]      = useState('5d')
  const [newNotes,     setNewNotes]     = useState('')
  const [renew,        setRenew]        = useState(true)
  const [customAmount, setCustomAmount] = useState('7')
  const [customUnit,   setCustomUnit]   = useState<CustomUnit>('days')
  const [newRollingDays, setNewRollingDays] = useState('')
  const [newRollingMinutes, setNewRollingMinutes] = useState('')

  const [editOpen,     setEditOpen]     = useState(false)
  const [editRow,      setEditRow]      = useState<DeviceRow | null>(null)
  const [editLabel,    setEditLabel]    = useState('')
  const [editNotes,    setEditNotes]    = useState('')
  const [editTier,     setEditTier]     = useState('5d')
  const [editExpires,  setEditExpires]  = useState('')
  const [editLastSync, setEditLastSync] = useState('')
  const [editRollingDays, setEditRollingDays] = useState('')
  const [editRollingMinutes, setEditRollingMinutes] = useState('')
  const [editSaving,   setEditSaving]   = useState(false)

  /** Device quick-view sheet (tier, dates, actions) — separate from edit form */
  const [detailRow, setDetailRow] = useState<DeviceRow | null>(null)

  const [tab, setTab] = useState<TabId>('devices')
  const [product, setProduct] = useState<PlatformProductKey>('bazar_one')

  const load = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const r = await fetch(`/api/platform/admin/devices${productQuery(product)}`, { credentials: 'include' })
      if (r.status === 401) {
        setSession('anon')
        setDevices([])
        setError('Sign in required.')
        return
      }
      if (!r.ok) {
        const j = (await r.json().catch(() => ({}))) as { error?: string }
        throw new Error(j.error ?? r.statusText)
      }
      const j = (await r.json()) as { devices: DeviceRow[] }
      setDevices(j.devices ?? [])
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
      setDevices([])
    } finally { setLoading(false) }
  }, [product])

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch('/api/platform/auth/me', { credentials: 'include' })
        const j = (await res.json()) as { authEnabled?: boolean; ok?: boolean }
        const ae = Boolean(j.authEnabled)
        setAuthEnabled(ae)
        if (!ae) setSession('ok')
        else if (j.ok) setSession('ok')
        else setSession('anon')
      } catch {
        setAuthEnabled(false)
        setSession('ok')
      }
    })()
  }, [])

  useEffect(() => {
    setDevices([])
    setEditOpen(false)
    setEditRow(null)
    setEditSaving(false)
    setDetailRow(null)
  }, [product])

  useEffect(() => {
    if (session !== 'ok') return
    void load()
  }, [session, load, product])

  async function addDevice(e: React.FormEvent) {
    e.preventDefault(); setError(null)
    try {
      let customValidForMs: number | undefined
      if (newTier === 'custom') {
        const amt = Number(String(customAmount).trim().replace(',', '.'))
        if (!Number.isFinite(amt) || amt <= 0) { setError('Enter a positive number.'); return }
        customValidForMs = unitToMs(amt, customUnit)
      }
      const rollingParsed = parseOfflineGraceMs(newRollingDays, newRollingMinutes)
      if (rollingParsed === 'err') {
        setError('Offline grace: use whole numbers (days and minutes ≥ 0).')
        return
      }
      const r = await fetch('/api/platform/admin/devices', {
        method: 'POST', headers: JSON_HEADERS, credentials: 'include',
        body: JSON.stringify({
          product,
          machineId: newMachineId.trim(),
          label: newLabel.trim() || null,
          tier: newTier, renew,
          notes: newNotes.trim() || null,
          ...(customValidForMs != null ? { customValidForMs } : {}),
          ...(rollingParsed !== null ? { rollingMaxMs: rollingParsed } : {}),
        }),
      })
      if (r.status === 401) {
        setSession('anon')
        setError('Sign in required.')
        return
      }
      if (!r.ok) {
        const j = (await r.json().catch(() => ({}))) as { error?: string; message?: string }
        throw new Error(j.message ?? j.error ?? r.statusText)
      }
      setNewMachineId('')
      setNewRollingDays('')
      setNewRollingMinutes('')
      await load()
    } catch (e) { setError(e instanceof Error ? e.message : String(e)) }
  }

  async function toggleRevoke(machineId: string, revoked: boolean): Promise<boolean> {
    setError(null)
    try {
      const r = await fetch(
        `/api/platform/admin/devices/${encodeURIComponent(machineId)}/revoke${productQuery(product)}`,
        {
          method: 'PATCH', headers: JSON_HEADERS, credentials: 'include',
          body: JSON.stringify({ revoked: !revoked }),
        },
      )
      if (r.status === 401) {
        setSession('anon')
        setError('Sign in required.')
        return false
      }
      if (!r.ok) throw new Error(await r.text())
      await load()
      return true
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
      return false
    }
  }

  function openEdit(d: DeviceRow) {
    setDetailRow(null)
    setEditRow(d); setEditLabel(d.label ?? ''); setEditNotes(d.notes ?? '')
    setEditTier(d.tier)
    setEditExpires(d.tier === 'lifetime' || d.expiresAtMs == null ? '' : msToDatetimeLocal(d.expiresAtMs))
    setEditLastSync(msToDatetimeLocal(d.lastSyncAtMs ?? d.createdAtMs))
    {
      const { days, minutes } = msToOfflineDaysMinutes(d.rollingMaxMs)
      setEditRollingDays(days)
      setEditRollingMinutes(minutes)
    }
    setEditOpen(true); setError(null)
  }

  function closeEdit() { setEditOpen(false); setEditRow(null); setEditSaving(false) }

  async function saveEdit(e: React.FormEvent) {
    e.preventDefault(); if (!editRow) return; setError(null)
    const expiresAtMs = editTier === 'lifetime' ? null : parseDatetimeLocal(editExpires)
    if (editTier !== 'lifetime' && expiresAtMs == null) {
      setError('Set expiry date or choose Lifetime.'); return
    }
    const lastSyncTrim = editLastSync.trim()
    const lastSyncAtMs = lastSyncTrim ? parseDatetimeLocal(lastSyncTrim) : null
    if (lastSyncTrim && lastSyncAtMs == null) { setError('Invalid last sync date.'); return }
    const rollingParsed = parseOfflineGraceMs(editRollingDays, editRollingMinutes)
    if (rollingParsed === 'err') {
      setError('Offline grace: use whole numbers (days and minutes ≥ 0).')
      return
    }
    setEditSaving(true)
    try {
      const r = await fetch(
        `/api/platform/admin/devices/${encodeURIComponent(editRow.machineId)}${productQuery(product)}`,
        {
          method: 'PATCH', headers: JSON_HEADERS, credentials: 'include',
          body: JSON.stringify({
            label: editLabel.trim() || null,
            notes: editNotes.trim() || null,
            tier: editTier, expiresAtMs, lastSyncAtMs,
            rollingMaxMs: rollingParsed,
          }),
        },
      )
      if (r.status === 401) {
        setSession('anon')
        setError('Sign in required.')
        setEditSaving(false)
        return
      }
      if (!r.ok) {
        const j = (await r.json().catch(() => ({}))) as { error?: string; message?: string }
        throw new Error(j.message ?? j.error ?? r.statusText)
      }
      closeEdit(); await load()
    } catch (err) { setError(err instanceof Error ? err.message : String(err)) }
    finally { setEditSaving(false) }
  }

  async function logout() {
    try {
      await fetch('/api/platform/auth/logout', { method: 'POST', credentials: 'include' })
    } finally {
      setSession('anon')
    }
  }

  async function removeDevice(machineId: string) {
    if (!window.confirm(`Delete device?\n${machineId}`)) return
    setError(null)
    try {
      const r = await fetch(
        `/api/platform/admin/devices/${encodeURIComponent(machineId)}${productQuery(product)}`,
        {
          method: 'DELETE',
          credentials: 'include',
        },
      )
      if (r.status === 401) {
        setSession('anon')
        setError('Sign in required.')
        return
      }
      if (!r.ok) throw new Error((await r.text()) || r.statusText)
      if (editRow?.machineId === machineId) closeEdit()
      setDetailRow((cur) => (cur?.machineId === machineId ? null : cur))
      await load()
    } catch (err) { setError(err instanceof Error ? err.message : String(err)) }
  }

  /* ── Render ── */
  if (session === 'loading') {
    return (
      <div className="app-shell" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="spinner" style={{ width: 40, height: 40, borderColor: 'var(--md-primary)', borderTopColor: 'transparent' }} />
      </div>
    )
  }

  if (authEnabled && session === 'anon') {
    return (
      <LoginPage
        onLoggedIn={() => {
          setSession('ok')
          void load()
        }}
      />
    )
  }

  return (
    <div className="app-shell">
      <header className="native-app-header">
        <div className="native-app-header__inner">
          <div className="native-app-header__lead">
            <div className="native-app-header__logo-container">
              <img
                src="/amanlogo.png"
                alt="Amaan Logo"
                width={40}
                height={40}
                className="native-app-header__logo"
              />
            </div>
            <div className="header-product-switcher">
              {['sufra_lite', 'bazar_one'].map((p) => (
                <button
                  key={p}
                  type="button"
                  className={`header-product-switcher__item ${product === p ? 'header-product-switcher__item--active' : ''}`}
                  onClick={() => setProduct(p as PlatformProductKey)}
                >
                  {p.split('_')[0].toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          <div className="native-app-header__titles">
            <h1 className="native-app-header__title">
              {tab === 'devices' ? 'Devices' : tab === 'releases' ? 'Releases' : 'Settings'}
            </h1>
          </div>

          <div className="native-app-header__trailing">
            {tab === 'devices' && (
              <button 
                className="m3-btn m3-btn--text" 
                type="button" 
                onClick={() => void load()} 
                disabled={loading}
                aria-label="Refresh devices"
              >
                <div className={loading ? 'spinner' : ''}>{Ico.refresh}</div>
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="page page--bottom-nav">
        {/* Product selector moved to header */}


        {tab === 'releases' && (
          <ReleasesTab product={product} onUnauthorized={() => setSession('anon')} />
        )}

        {tab === 'devices' ? (
          <>
            {error ? (
              <div className="alert" role="alert">
                {Ico.exclamation}
                <span>{error}</span>
              </div>
            ) : null}

            <section className="bento-card">
              <h2 className="bento-card__title">Quick Activation</h2>
              <form onSubmit={(ev) => void addDevice(ev)}>
                <div className="ios-section">
                  <Field label="Machine ID" first>
                    <input
                      id="new-machine-id"
                      className="field__input"
                      required
                      value={newMachineId}
                      onChange={(e) => setNewMachineId(e.target.value)}
                      dir="ltr"
                      placeholder="WIN-ABC123-XYZ"
                      autoComplete="off"
                      spellCheck={false}
                    />
                  </Field>
                  <Field label="Label">
                    <input
                      id="new-label"
                      className="field__input"
                      value={newLabel}
                      onChange={(e) => setNewLabel(e.target.value)}
                      placeholder="Front desk"
                    />
                  </Field>
                  <Field label="Tier">
                    <select id="new-tier" className="field__select" value={newTier} onChange={(e) => setNewTier(e.target.value)}>
                      <option value="5d">5 days</option>
                      <option value="15d">15 days</option>
                      <option value="1m">1 month</option>
                      <option value="2m">2 months</option>
                      <option value="lifetime">Lifetime</option>
                      <option value="custom">Custom…</option>
                    </select>
                  </Field>
                  {newTier === 'custom' ? (
                    <>
                      <Field label="Amount">
                        <input
                          id="custom-amount"
                          className="field__input"
                          type="number"
                          min={0.001}
                          step="any"
                          required
                          dir="ltr"
                          value={customAmount}
                          onChange={(e) => setCustomAmount(e.target.value)}
                        />
                      </Field>
                      <Field label="Unit">
                        <select
                          id="custom-unit"
                          className="field__select"
                          value={customUnit}
                          onChange={(e) => setCustomUnit(e.target.value as CustomUnit)}
                        >
                          <option value="seconds">Seconds</option>
                          <option value="minutes">Minutes</option>
                          <option value="hours">Hours</option>
                          <option value="days">Days</option>
                        </select>
                      </Field>
                    </>
                  ) : null}
                  <Field label="Notes">
                    <textarea
                      id="new-notes"
                      className="field__textarea"
                      value={newNotes}
                      onChange={(e) => setNewNotes(e.target.value)}
                      rows={2}
                      placeholder="Optional"
                    />
                  </Field>
                  <Field
                    label="Offline grace"
                    hint="Max time without a sync before check-in."
                  >
                    <div className="field__inline">
                      <input
                        id="new-rolling-days"
                        className="field__input"
                        type="number"
                        min={0}
                        placeholder="Days"
                        value={newRollingDays}
                        onChange={(e) => setNewRollingDays(e.target.value)}
                      />
                      <span className="field__suffix">d</span>
                      <input
                        id="new-rolling-minutes"
                        className="field__input"
                        type="number"
                        min={0}
                        placeholder="Mins"
                        value={newRollingMinutes}
                        onChange={(e) => setNewRollingMinutes(e.target.value)}
                      />
                      <span className="field__suffix">m</span>
                    </div>
                  </Field>
                </div>

                <button
                  id="activate-btn"
                  type="submit"
                  className="m3-btn m3-btn--primary"
                  disabled={loading}
                  style={{ width: '100%', borderRadius: 16, height: 52 }}
                >
                  {loading ? <span className="spinner" /> : <>{Ico.plus} Activate Device</>}
                </button>
              </form>
            </section>

            <section className="bento-card">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                <h2 className="bento-card__title" style={{ margin: 0 }}>Registered Devices</h2>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--md-on-surface-variant)' }}>
                  {devices.length} Total
                </span>
              </div>

              {devices.length > 0 ? (
                <div className="devices-list">
                  {devices.map((d) => (
                    <DeviceCard key={d.machineId} d={d} onOpen={(row) => setDetailRow(row)} />
                  ))}
                </div>
              ) : !loading ? (
                <div className="empty-state">
                  {Ico.empty}
                  <p className="empty-state__title">No devices found</p>
                  <p className="empty-state__sub">Start by activating a machine ID above.</p>
                </div>
              ) : (
                <div className="empty-state">
                  <span className="spinner" style={{ width: 32, height: 32 }} />
                </div>
              )}
            </section>
          </>
        ) : null}

        {tab === 'settings' ? (
          <>
            <p className="section-label">Session</p>
            {authEnabled ? (
              <button
                type="button"
                className="m3-btn m3-btn--outline"
                style={{ width: '100%', minHeight: 48, marginBottom: 28 }}
                onClick={() => void logout()}
              >
                Sign out
              </button>
            ) : (
              <p style={{ fontSize: '0.9375rem', color: 'var(--md-on-surface-variant)', lineHeight: 1.5, marginBottom: 28 }}>
                Admin password is not enabled on this server.
              </p>
            )}
            <p className="section-label">About</p>
            <p style={{ fontSize: '0.875rem', color: 'var(--label-2)', lineHeight: 1.55 }}>
              LM App — manage device licenses and publish client updates for the selected product.
            </p>
          </>
        ) : null}
      </main>

      <nav className="bottom-nav" role="navigation" aria-label="Primary">
        <button
          type="button"
          className={`bottom-nav__item${tab === 'devices' ? ' bottom-nav__item--active' : ''}`}
          onClick={() => setTab('devices')}
          aria-current={tab === 'devices' ? 'page' : undefined}
        >
          <span className="bottom-nav__icon-wrapper" aria-hidden>{Ico.devices}</span>
          <span className="bottom-nav__label">Devices</span>
        </button>
        <button
          type="button"
          className={`bottom-nav__item${tab === 'releases' ? ' bottom-nav__item--active' : ''}`}
          onClick={() => setTab('releases')}
          aria-current={tab === 'releases' ? 'page' : undefined}
        >
          <span className="bottom-nav__icon-wrapper" aria-hidden>{Ico.releases}</span>
          <span className="bottom-nav__label">Releases</span>
        </button>
        <button
          type="button"
          className={`bottom-nav__item${tab === 'settings' ? ' bottom-nav__item--active' : ''}`}
          onClick={() => setTab('settings')}
          aria-current={tab === 'settings' ? 'page' : undefined}
        >
          <span className="bottom-nav__icon-wrapper" aria-hidden>{Ico.settings}</span>
          <span className="bottom-nav__label">Settings</span>
        </button>
      </nav>

      {/* ── Device detail sheet (tap compact card) ── */}
      {detailRow && !editOpen ? (
        <div
          role="presentation"
          className="sheet-backdrop"
          onClick={() => setDetailRow(null)}
          onKeyDown={(e) => { if (e.key === 'Escape') setDetailRow(null) }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="device-detail-title"
            className="sheet"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sheet__nav">
              <button type="button" className="sheet__nav-btn" onClick={() => setDetailRow(null)}>
                Close
              </button>
              <span id="device-detail-title" className="sheet__nav-title">Device</span>
              <span className="sheet__nav-spacer" aria-hidden />
            </div>

            <div className="sheet__content device-detail-sheet">
              <p className="device-detail-sheet__id">{detailRow.machineId}</p>
              <div className="m3-card__grid device-detail-sheet__grid">
                <div className="m3-meta">
                  <span className="m3-meta__label">Tier</span>
                  <span className="m3-meta__value">{detailRow.tier}</span>
                </div>
                <div className="m3-meta">
                  <span className="m3-meta__label">Expires</span>
                  <span className="m3-meta__value">{fmtDate(detailRow.expiresAtMs)}</span>
                </div>
                <div className="m3-meta">
                  <span className="m3-meta__label">Last sync</span>
                  <span className="m3-meta__value">{fmtDate(detailRow.lastSyncAtMs)}</span>
                </div>
                <div className="m3-meta">
                  <span className="m3-meta__label">Status</span>
                  <span className="m3-meta__value">{detailRow.computedStatus}</span>
                </div>
              </div>

              <div className="device-detail-sheet__actions">
                <button type="button" className="m3-btn m3-btn--text" onClick={() => void removeDevice(detailRow.machineId)}>
                  {Ico.trash}
                </button>
                <button
                  type="button"
                  className="m3-btn m3-btn--text"
                  onClick={() => {
                    void (async () => {
                      const ok = await toggleRevoke(detailRow.machineId, detailRow.revoked)
                      if (ok) setDetailRow(null)
                    })()
                  }}
                >
                  {detailRow.revoked ? Ico.unlock : Ico.lock}
                </button>
                <button
                  type="button"
                  className="m3-btn m3-btn--tonal"
                  onClick={() => {
                    openEdit(detailRow)
                  }}
                >
                  {Ico.edit} Edit
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {/* ── Edit sheet ── */}
      {editOpen && editRow ? (
        <div
          role="presentation"
          className="sheet-backdrop"
          onClick={closeEdit}
          onKeyDown={(e) => { if (e.key === 'Escape') closeEdit() }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-sheet-title"
            className="sheet"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Sheet nav bar */}
            <div className="sheet__nav">
              <button id="edit-cancel-btn" className="sheet__nav-btn" type="button" onClick={closeEdit} disabled={editSaving}>
                Cancel
              </button>
              <span id="edit-sheet-title" className="sheet__nav-title">Edit device</span>
              <button
                id="edit-save-btn"
                className="sheet__nav-btn sheet__nav-btn--bold"
                type="button"
                onClick={(e) => void saveEdit(e as unknown as React.FormEvent)}
                disabled={editSaving}
              >
                {editSaving ? <span className="spinner" style={{ width: 14, height: 14 }} /> : 'Save'}
              </button>
            </div>

            <div className="sheet__content">
              {/* Machine ID read-only */}
              <p style={{ fontSize: 12, color: 'var(--label-3)', padding: '0 16px 6px', fontFamily: 'SF Mono, Menlo, monospace', wordBreak: 'break-all', lineHeight: 1.5 }}>
                {editRow.machineId}
              </p>

              <form id="edit-form" onSubmit={(ev) => void saveEdit(ev)}>
                <div className="ios-section" style={{ marginBottom: 8, borderRadius: 0 }}>
                  <Field label="Label" first>
                    <input
                      id="edit-label"
                      className="field__input"
                      value={editLabel}
                      onChange={(e) => setEditLabel(e.target.value)}
                      placeholder="Front desk"
                    />
                  </Field>
                  <Field label="Tier">
                    <select
                      id="edit-tier"
                      className="field__select"
                      value={editTier}
                      onChange={(e) => { const v = e.target.value; setEditTier(v); if (v === 'lifetime') setEditExpires('') }}
                    >
                      <option value="5d">5 days</option>
                      <option value="15d">15 days</option>
                      <option value="1m">1 month</option>
                      <option value="2m">2 months</option>
                      <option value="lifetime">Lifetime</option>
                      <option value="custom">Custom</option>
                    </select>
                  </Field>
                  <Field label="Expires" hint={editTier === 'lifetime' ? 'Not applicable for lifetime tier.' : undefined}>
                    <input
                      id="edit-expires"
                      className="field__input"
                      type="datetime-local"
                      disabled={editTier === 'lifetime'}
                      value={editExpires}
                      onChange={(e) => setEditExpires(e.target.value)}
                    />
                  </Field>
                  <Field
                    label="Last sync"
                    hint="Rolling deadline uses last sync + offline grace (custom or server default)."
                  >
                    <input
                      id="edit-last-sync"
                      className="field__input"
                      type="datetime-local"
                      value={editLastSync}
                      onChange={(e) => setEditLastSync(e.target.value)}
                    />
                  </Field>
                  <Field
                    label="Offline grace"
                    hint="Blank days and minutes = server default window."
                  >
                    <div className="field__inline">
                      <input
                        id="edit-rolling-days"
                        className="field__input"
                        type="number"
                        min={0}
                        step={1}
                        dir="ltr"
                        placeholder="Days"
                        aria-label="Offline grace days"
                        value={editRollingDays}
                        onChange={(e) => setEditRollingDays(e.target.value)}
                      />
                      <span className="field__suffix">d</span>
                      <input
                        id="edit-rolling-minutes"
                        className="field__input"
                        type="number"
                        min={0}
                        step={1}
                        dir="ltr"
                        placeholder="Minutes"
                        aria-label="Offline grace minutes"
                        value={editRollingMinutes}
                        onChange={(e) => setEditRollingMinutes(e.target.value)}
                      />
                      <span className="field__suffix">m</span>
                    </div>
                  </Field>
                  <Field label="Notes">
                    <textarea
                      id="edit-notes"
                      className="field__textarea"
                      value={editNotes}
                      onChange={(e) => setEditNotes(e.target.value)}
                      rows={2}
                    />
                  </Field>
                </div>
              </form>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
