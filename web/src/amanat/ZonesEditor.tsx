import { useCallback, useEffect, useRef, useState } from 'react'
import {
  createNeighborhood,
  deleteNeighborhood,
  fetchNeighborhoods,
  updateNeighborhood,
  type GeoJsonPolygon,
  type Neighborhood,
} from '../api/neighborhoods'
import { Ico } from '../components/icons'
import { alertBox, cn, m3BtnText, spinner } from '../lib/ui'
import { ZoneMap } from './zones/ZoneMap'
import { ZoneSidebar } from './zones/ZoneSidebar'
import { DEFAULT_CITY } from './zones/zone-utils'

type PendingCreate = { boundary: GeoJsonPolygon }

export function ZonesEditor({
  refreshNonce = 0,
  onLoadingChange,
  onUnauthorized,
  onSignOut,
}: {
  refreshNonce?: number
  onLoadingChange?: (loading: boolean) => void
  onUnauthorized: () => void
  onSignOut: () => void
}) {
  const [zones, setZones] = useState<Neighborhood[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [actionId, setActionId] = useState<string | null>(null)
  const [pendingCreate, setPendingCreate] = useState<PendingCreate | null>(null)
  const [pendingEdit, setPendingEdit] = useState<Neighborhood | null>(null)

  const onUnauthorizedRef = useRef(onUnauthorized)
  const onLoadingChangeRef = useRef(onLoadingChange)
  onUnauthorizedRef.current = onUnauthorized
  onLoadingChangeRef.current = onLoadingChange

  const load = useCallback(async (opts?: { silent?: boolean }) => {
    const silent = opts?.silent ?? false
    if (!silent) {
      setLoading(true)
      onLoadingChangeRef.current?.(true)
    }
    if (!silent) setError(null)
    try {
      const result = await fetchNeighborhoods(DEFAULT_CITY)
      if (!result.ok) {
        if (result.unauthorized) onUnauthorizedRef.current()
        setZones([])
        setError(result.error)
        return
      }
      setZones(result.data)
    } finally {
      if (!silent) {
        setLoading(false)
        onLoadingChangeRef.current?.(false)
      }
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load, refreshNonce])

  const handleDrawComplete = useCallback((boundary: GeoJsonPolygon) => {
    setPendingEdit(null)
    setPendingCreate({ boundary })
    setSelectedId(null)
  }, [])

  async function handleCreate(name: string) {
    if (!pendingCreate) return
    setSaving(true)
    setError(null)
    try {
      const result = await createNeighborhood({
        name,
        city: DEFAULT_CITY,
        boundary: pendingCreate.boundary,
      })
      if (!result.ok) {
        if (result.unauthorized) onUnauthorizedRef.current()
        else setError(result.error)
        throw new Error(result.error)
      }
      setPendingCreate(null)
      await load({ silent: true })
    } finally {
      setSaving(false)
    }
  }

  async function handleRename(name: string) {
    if (!pendingEdit) return
    setSaving(true)
    setActionId(pendingEdit.id)
    setError(null)
    try {
      const result = await updateNeighborhood(pendingEdit.id, { name })
      if (!result.ok) {
        if (result.unauthorized) onUnauthorizedRef.current()
        else setError(result.error)
        throw new Error(result.error)
      }
      setPendingEdit(null)
      await load({ silent: true })
    } finally {
      setSaving(false)
      setActionId(null)
    }
  }

  async function handleDelete(zone: Neighborhood) {
    if (!window.confirm(`Delete zone "${zone.name}"? This cannot be undone.`)) return
    setActionId(zone.id)
    setError(null)
    try {
      const result = await deleteNeighborhood(zone.id)
      if (!result.ok) {
        if (result.unauthorized) onUnauthorizedRef.current()
        else setError(result.error)
        return
      }
      if (selectedId === zone.id) setSelectedId(null)
      await load({ silent: true })
    } finally {
      setActionId(null)
    }
  }

  return (
    <>
      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="text-sm text-on-surface-variant">
          Draw service areas for {DEFAULT_CITY}
        </p>
        <button type="button" className={cn(m3BtnText, 'h-10 shrink-0 px-3')} onClick={onSignOut}>
          Sign out
        </button>
      </div>

      <p className="mb-4 text-xs text-on-surface-variant">
        Use the polygon tool on the map, close the shape on the first point, then name it in the
        list below.
      </p>

      {error && (
        <div className={cn(alertBox, 'mb-4 rounded-2xl')}>
          <span className="shrink-0 text-red-600">{Ico.exclamation}</span>
          <span>{error}</span>
        </div>
      )}

      <div className="space-y-4">
        <ZoneMap
          zones={zones}
          draftBoundary={pendingCreate?.boundary ?? null}
          selectedId={selectedId}
          onSelect={setSelectedId}
          onDrawComplete={handleDrawComplete}
        />
        <ZoneSidebar
          zones={zones}
          selectedId={selectedId}
          loading={loading}
          saving={saving}
          actionId={actionId}
          pendingCreate={pendingCreate?.boundary ?? null}
          pendingEdit={pendingEdit}
          onSelect={setSelectedId}
          onEdit={(zone) => {
            setPendingCreate(null)
            setPendingEdit(zone)
          }}
          onDelete={(zone) => void handleDelete(zone)}
          onCreateSubmit={handleCreate}
          onCreateCancel={() => setPendingCreate(null)}
          onRenameSubmit={handleRename}
          onRenameCancel={() => setPendingEdit(null)}
        />
      </div>
    </>
  )
}
