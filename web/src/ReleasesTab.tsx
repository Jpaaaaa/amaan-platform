import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type {
  PlatformUpdateFileEntry,
  PlatformUpdateFilesResponse,
  PlatformUpdateHealthResponse,
  PlatformUpdateLatestResponse,
  PlatformUpdatePublishResponse,
  PlatformUpdateUploadResponse,
} from '@shared/types/app-update'
import type { PlatformProductKey } from '@shared/platform-product'

/** Installer extensions that can be published (match the server's allow-list). */
const PUBLISHABLE_EXT = new Set(['.exe', '.zip', '.dmg', '.appimage', '.deb', '.rpm'])
function isPublishable(name: string): boolean {
  const lower = name.toLowerCase()
  if (lower.endsWith('.exe.blockmap')) return false
  const dot = lower.lastIndexOf('.')
  if (dot < 0) return false
  return PUBLISHABLE_EXT.has(lower.slice(dot))
}

/* ─── Helpers ─── */
function fmtBytes(n: number): string {
  if (!Number.isFinite(n) || n < 0) return '—'
  if (n < 1024) return `${n} B`
  const u = ['KB', 'MB', 'GB', 'TB']
  let v = n / 1024
  let i = 0
  while (v >= 1024 && i < u.length - 1) { v /= 1024; i++ }
  return `${v >= 10 ? v.toFixed(0) : v.toFixed(1)} ${u[i]}`
}

function fmtDateTime(ms: number | null): string {
  if (ms == null || !Number.isFinite(ms)) return '—'
  const d = new Date(ms)
  return d.toLocaleString(undefined, {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

function fmtIso(iso: string | null | undefined): string {
  if (!iso) return '—'
  const ms = Date.parse(iso)
  return Number.isFinite(ms) ? fmtDateTime(ms) : iso
}

function fileExtLabel(name: string): string {
  const lower = name.toLowerCase()
  if (lower.endsWith('.exe.blockmap')) return 'BLOCKMAP'
  const dot = lower.lastIndexOf('.')
  if (dot < 0) return 'FILE'
  return lower.slice(dot + 1).toUpperCase()
}

function fileBadgeClass(name: string): string {
  const lower = name.toLowerCase()
  if (lower.endsWith('.yml') || lower.endsWith('.yaml')) return 'rel-badge rel-badge--blue'
  if (lower.endsWith('.exe')) return 'rel-badge rel-badge--green'
  if (lower.endsWith('.blockmap')) return 'rel-badge rel-badge--neutral'
  return 'rel-badge rel-badge--neutral'
}

/* ─── Icons ─── */
/* ─── M3 Icons ─── */
const Ico = {
  refresh: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 4 23 10 17 10"></polyline>
      <polyline points="1 20 1 14 7 14"></polyline>
      <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
    </svg>
  ),
  upload: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
      <polyline points="17 8 12 3 7 8"></polyline>
      <line x1="12" y1="3" x2="12" y2="15"></line>
    </svg>
  ),
  trash: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6"></polyline>
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
    </svg>
  ),
  copy: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
    </svg>
  ),
  broadcast: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14"></path>
      <path d="M12 5l7 7-7 7"></path>
    </svg>
  ),
  exclamation: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"></circle>
      <line x1="12" y1="8" x2="12" y2="12"></line>
      <line x1="12" y1="16" x2="12.01" y2="16"></line>
    </svg>
  ),
}


function productQuery(p: PlatformProductKey): string {
  return `?product=${encodeURIComponent(p)}`
}

/* ─── Main component ─── */
export function ReleasesTab({
  product,
  onUnauthorized,
}: {
  product: PlatformProductKey
  onUnauthorized?: () => void
}) {
  const [manifest, setManifest] = useState<PlatformUpdateLatestResponse | null>(null)
  const [health, setHealth] = useState<PlatformUpdateHealthResponse | null>(null)
  const [files, setFiles] = useState<PlatformUpdateFileEntry[] | null>(null)
  const [updatesDir, setUpdatesDir] = useState<string>('')
  const [error, setError] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadPct, setUploadPct] = useState<number | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [publishing, setPublishing] = useState<string | null>(null)

  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const feedUrl = useMemo(() => {
    if (typeof window === 'undefined') return ''
    const origin = window.location.origin.replace(/\/$/, '')
    return `${origin}/updates/${encodeURIComponent(product)}/`
  }, [product])

  const loadAll = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const pq = productQuery(product)
      const [mRes, hRes, fRes] = await Promise.all([
        fetch(`/api/platform/update/latest${pq}`),
        fetch(`/api/platform/update/health${pq}`),
        fetch(`/api/platform/admin/updates/files${pq}`, { credentials: 'include' }),
      ])
      if (!mRes.ok) throw new Error(`manifest: ${mRes.statusText}`)
      if (!hRes.ok) throw new Error(`health: ${hRes.statusText}`)
      if (fRes.status === 401) {
        onUnauthorized?.()
        throw new Error('Sign in required.')
      }
      if (!fRes.ok) throw new Error(`files: ${fRes.statusText}`)
      const m = (await mRes.json()) as PlatformUpdateLatestResponse
      const h = (await hRes.json()) as PlatformUpdateHealthResponse
      const f = (await fRes.json()) as PlatformUpdateFilesResponse
      setManifest(m)
      setHealth(h)
      setFiles(f.files)
      setUpdatesDir(f.updatesDir)
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setLoading(false)
    }
  }, [onUnauthorized, product])

  useEffect(() => { void loadAll() }, [loadAll])

  async function copyFeedUrl() {
    try {
      await navigator.clipboard.writeText(feedUrl)
      setToast('Feed URL copied')
      window.setTimeout(() => setToast(null), 1800)
    } catch {
      setToast('Could not copy')
      window.setTimeout(() => setToast(null), 1800)
    }
  }

  function pickFiles() { fileInputRef.current?.click() }

  function uploadFiles(fileList: FileList | File[]) {
    const arr = Array.from(fileList)
    if (arr.length === 0) return
    setUploading(true)
    setUploadPct(0)
    setError(null)
    setToast(null)

    const form = new FormData()
    for (const f of arr) form.append('files', f, f.name)

    const xhr = new XMLHttpRequest()
    xhr.withCredentials = true
    xhr.open('POST', `/api/platform/admin/updates/upload${productQuery(product)}`)
    xhr.upload.onprogress = (ev) => {
      if (ev.lengthComputable) {
        setUploadPct(Math.round((ev.loaded / ev.total) * 100))
      }
    }
    xhr.onload = () => {
      setUploading(false)
      setUploadPct(null)
      if (xhr.status === 401) {
        onUnauthorized?.()
        setError('Sign in required.')
        return
      }
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const body = JSON.parse(xhr.responseText) as PlatformUpdateUploadResponse
          setFiles(body.files)
          if (body.rejected.length > 0) {
            setError(
              `Rejected: ${body.rejected.map((r) => `${r.name} (${r.reason})`).join(', ')}`,
            )
          } else {
            setToast(`Uploaded ${body.accepted.length} file${body.accepted.length === 1 ? '' : 's'}`)
            window.setTimeout(() => setToast(null), 2400)
          }
          void loadAll()
        } catch {
          setError('Bad server response')
        }
      } else {
        let msg = `Upload failed (${xhr.status})`
        try {
          const j = JSON.parse(xhr.responseText) as { error?: string; message?: string }
          msg = j.message ?? j.error ?? msg
        } catch { /* ignore */ }
        setError(msg)
      }
    }
    xhr.onerror = () => {
      setUploading(false); setUploadPct(null); setError('Network error during upload')
    }
    xhr.send(form)
  }

  function onDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault()
    setDragOver(false)
    if (uploading) return
    if (!e.dataTransfer?.files || e.dataTransfer.files.length === 0) return
    uploadFiles(e.dataTransfer.files)
  }

  async function publishInstaller(name: string) {
    if (!window.confirm(
      `Publish ${name} to clients?\n\n` +
      `A new latest.yml will be written and every connected POS will see the update on its next check.`,
    )) return
    setPublishing(name); setError(null); setToast(null)
    try {
      const r = await fetch(`/api/platform/admin/updates/publish${productQuery(product)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ installer: name }),
      })
      if (r.status === 401) {
        onUnauthorized?.()
        throw new Error('Sign in required.')
      }
      if (!r.ok) {
        const j = (await r.json().catch(() => ({}))) as { error?: string; message?: string }
        throw new Error(j.message ?? j.error ?? r.statusText)
      }
      const body = (await r.json()) as PlatformUpdatePublishResponse
      setToast(`Published v${body.version} · clients will pick it up on their next check`)
      window.setTimeout(() => setToast(null), 3200)
      void loadAll()
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setPublishing(null)
    }
  }

  async function deleteFile(name: string) {
    if (!window.confirm(`Delete ${name}?`)) return
    setDeleting(name); setError(null)
    try {
      const r = await fetch(
        `/api/platform/admin/updates/files/${encodeURIComponent(name)}${productQuery(product)}`,
        {
          method: 'DELETE',
          credentials: 'include',
        },
      )
      if (r.status === 401) {
        onUnauthorized?.()
        throw new Error('Sign in required.')
      }
      if (!r.ok) {
        const j = (await r.json().catch(() => ({}))) as { error?: string; message?: string }
        throw new Error(j.message ?? j.error ?? r.statusText)
      }
      const body = (await r.json()) as PlatformUpdateFilesResponse
      setFiles(body.files)
      setToast(`Deleted ${name}`)
      window.setTimeout(() => setToast(null), 1800)
      void loadAll()
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setDeleting(null)
    }
  }

  const hasManifest = manifest && 'version' in manifest
  const healthy = Boolean(health?.directoryExists && health?.latestYmlExists)
  const publishedInstaller = hasManifest ? (manifest as { path: string }).path : null

  return (
    <>
      {error && <div className="alert" style={{ marginBottom: 24, borderRadius: 16 }}>{error}</div>}
      
      {/* Live Release Summary */}
      <section
        className="bento-card"
        style={{
          background: 'linear-gradient(135deg, #dbeafe 0%, #eff6ff 55%, #f0f9ff 100%)',
          border: '1px solid rgba(13, 146, 255, 0.18)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div className={`status-badge ${healthy ? 'status-badge--active' : 'status-badge--revoked'}`}>
            <span className="status-badge__dot" />
            {healthy ? 'Operational' : 'Issue Detected'}
          </div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--label)', letterSpacing: '-0.02em' }}>
            {hasManifest ? `v${(manifest as { version: string }).version} is Live` : 'No Active Release'}
          </h2>
        </div>
        <p style={{ fontSize: '0.8125rem', color: 'var(--label-2)', marginTop: 12, fontWeight: 500 }}>
          {health?.latestYmlExists ? `Manifest synchronized · Published ${fmtIso((manifest as { releaseDate?: string | null }).releaseDate ?? null)}` : 'System setup incomplete or pending first release.'}
        </p>
      </section>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
        {/* Feed URL */}
        <section className="bento-card" style={{ marginBottom: 0 }}>
          <h3 className="bento-card__title">Distribution Feed</h3>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <code
              style={{
                flex: 1,
                background: 'var(--bg-tertiary)',
                padding: '10px 14px',
                borderRadius: 12,
                fontSize: '0.6875rem',
                color: 'var(--md-on-surface-variant)',
                overflowX: 'auto',
                border: '1px solid var(--obsidian-border)',
              }}
            >
              {feedUrl}
            </code>
            <button className="m3-btn m3-btn--tonal" style={{ height: 40, width: 40, padding: 0, borderRadius: 12 }} onClick={() => void copyFeedUrl()} title="Copy URL">
              {Ico.copy}
            </button>
          </div>
        </section>

        {/* Upload Zone */}
        <section 
          className={`bento-card ${dragOver ? 'drag-over' : ''}`} 
          style={{ marginBottom: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', border: '2px dashed var(--sep-opaque)', background: dragOver ? 'rgba(13, 146, 255, 0.08)' : 'transparent' }}
          onClick={() => !uploading && pickFiles()}
          onDragOver={(e) => { e.preventDefault(); !uploading && setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
        >
          <div style={{ color: 'var(--brand-blue)', marginBottom: 8 }}>{Ico.upload}</div>
          <div style={{ fontSize: '0.8125rem', fontWeight: 800, color: 'var(--label)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {uploading ? `Uploading ${uploadPct}%` : 'Upload Artifact'}
          </div>
          <input ref={fileInputRef} type="file" multiple style={{ display: 'none' }} onChange={(e) => e.target.files && uploadFiles(e.target.files)} />
        </section>
      </div>

      {/* Artifacts List */}
      <section className="bento-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h3 className="bento-card__title" style={{ margin: 0 }}>Storage Artifacts</h3>
          <button className="m3-btn m3-btn--text" style={{ height: 32, width: 32, padding: 0 }} onClick={() => void loadAll()}>{Ico.refresh}</button>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {files?.map(f => (
            <div key={f.name} className="device-card-modern" style={{ cursor: 'default' }}>
              <div className="device-card-modern__info">
                <span className="device-card-modern__name">{f.name}</span>
                <span className="device-card-modern__id">
                  {fmtBytes(f.sizeBytes)} · {fmtDateTime(f.modifiedAtMs)}
                </span>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                {isPublishable(f.name) && (
                  <button className="m3-btn m3-btn--primary" style={{ height: 36, padding: '0 12px', borderRadius: 10, fontSize: '0.6875rem', fontWeight: 800 }} onClick={() => publishInstaller(f.name)}>
                    {Ico.broadcast} PUBLISH
                  </button>
                )}
                <button className="m3-btn m3-btn--text" style={{ height: 36, width: 36, padding: 0, color: '#ef4444' }} onClick={() => deleteFile(f.name)}>
                  {Ico.trash}
                </button>
              </div>
            </div>
          ))}
          {(!files || files.length === 0) && (
            <div className="empty-state" style={{ padding: '20px 0' }}>
              <p style={{ color: 'var(--md-on-surface-variant)', fontSize: '0.875rem' }}>No artifacts found in storage.</p>
            </div>
          )}
        </div>
      </section>
    </>
  )
}
