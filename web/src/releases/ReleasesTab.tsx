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
import { alertBox, cn } from '../lib/ui'
import { ArtifactsPanel } from './ArtifactsPanel'
import { productQuery } from './format'
import { ReleaseLiveSummary } from './ReleaseLiveSummary'

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
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadPct, setUploadPct] = useState<number | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [publishing, setPublishing] = useState<string | null>(null)

  const productRef = useRef(product)
  const onUnauthorizedRef = useRef(onUnauthorized)
  productRef.current = product
  onUnauthorizedRef.current = onUnauthorized

  const feedUrl = useMemo(() => {
    if (typeof window === 'undefined') return ''
    const origin = window.location.origin.replace(/\/$/, '')
    return `${origin}/updates/${encodeURIComponent(product)}/`
  }, [product])

  const loadAll = useCallback(async (forProduct: PlatformProductKey) => {
    setLoading(true)
    setError(null)
    try {
      const pq = productQuery(forProduct)
      const [mRes, hRes, fRes] = await Promise.all([
        fetch(`/api/platform/update/latest${pq}`),
        fetch(`/api/platform/update/health${pq}`),
        fetch(`/api/platform/admin/updates/files${pq}`, { credentials: 'include' }),
      ])
      if (forProduct !== productRef.current) return
      if (!mRes.ok) throw new Error(`manifest: ${mRes.statusText}`)
      if (!hRes.ok) throw new Error(`health: ${hRes.statusText}`)
      if (fRes.status === 401) {
        onUnauthorizedRef.current?.()
        throw new Error('Sign in required.')
      }
      if (!fRes.ok) throw new Error(`files: ${fRes.statusText}`)
      const m = (await mRes.json()) as PlatformUpdateLatestResponse
      const h = (await hRes.json()) as PlatformUpdateHealthResponse
      const f = (await fRes.json()) as PlatformUpdateFilesResponse
      if (forProduct !== productRef.current) return
      setManifest(m)
      setHealth(h)
      setFiles(f.files)
    } catch (e) {
      if (forProduct !== productRef.current) return
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      if (forProduct === productRef.current) setLoading(false)
    }
  }, [])

  useEffect(() => {
    setManifest(null)
    setHealth(null)
    setFiles(null)
    void loadAll(product)
  }, [product, loadAll])

  async function copyFeedUrl() {
    try {
      await navigator.clipboard.writeText(feedUrl)
    } catch { /* ignore */ }
  }

  function uploadFiles(fileList: FileList | File[]) {
    const arr = Array.from(fileList)
    if (arr.length === 0) return
    setUploading(true)
    setUploadPct(0)
    setError(null)

    const form = new FormData()
    for (const f of arr) form.append('files', f, f.name)

    const xhr = new XMLHttpRequest()
    xhr.withCredentials = true
    xhr.open('POST', `/api/platform/admin/updates/upload${productQuery(product)}`)
    xhr.upload.onprogress = (ev) => {
      if (ev.lengthComputable) setUploadPct(Math.round((ev.loaded / ev.total) * 100))
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
            setError(`Rejected: ${body.rejected.map((r) => `${r.name} (${r.reason})`).join(', ')}`)
          }
          void loadAll(product)
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
      setUploading(false)
      setUploadPct(null)
      setError('Network error during upload')
    }
    xhr.send(form)
  }

  async function publishInstaller(name: string) {
    if (!window.confirm(`Publish ${name} to clients?`)) return
    setPublishing(name)
    setError(null)
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
      await r.json() as PlatformUpdatePublishResponse
      void loadAll(product)
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setPublishing(null)
    }
  }

  async function deleteFile(name: string) {
    if (!window.confirm(`Delete ${name}?`)) return
    setDeleting(name)
    setError(null)
    try {
      const r = await fetch(
        `/api/platform/admin/updates/files/${encodeURIComponent(name)}${productQuery(product)}`,
        { method: 'DELETE', credentials: 'include' },
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
      void loadAll(product)
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setDeleting(null)
    }
  }

  return (
    <>
      {error && <div className={cn(alertBox, 'mb-6 rounded-2xl')}>{error}</div>}
      <ReleaseLiveSummary manifest={manifest} health={health} />
      <ArtifactsPanel
        feedUrl={feedUrl}
        files={files}
        loading={loading}
        uploading={uploading}
        uploadPct={uploadPct}
        dragOver={dragOver}
        publishing={publishing}
        deleting={deleting}
        onRefresh={() => void loadAll(product)}
        onCopyFeedUrl={() => void copyFeedUrl()}
        onDrop={(e) => {
          e.preventDefault()
          setDragOver(false)
          if (!uploading && e.dataTransfer?.files?.length) uploadFiles(e.dataTransfer.files)
        }}
        onDragOver={(e) => { e.preventDefault(); if (!uploading) setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onUploadInput={uploadFiles}
        onPublish={(name) => void publishInstaller(name)}
        onDelete={(name) => void deleteFile(name)}
      />
    </>
  )
}
