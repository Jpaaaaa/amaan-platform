import { useCallback, useEffect, useRef, useState } from 'react'
import type { PlatformProductKey } from '@shared/platform-product'
import {
  createDevice,
  deleteDevice,
  fetchDevices,
  patchDevice,
  toggleRevokeDevice,
} from '../api/platform'
import { Ico } from '../components/icons'
import { MetricCard } from '../components/ui/DeckPrimitives'
import { FilterBar } from '../components/ui/FilterBar'
import { Overlay } from '../components/ui/Overlay'
import { SearchField } from '../components/ui/SearchField'
import { alertBox, cn, m3BtnPrimary } from '../lib/ui'
import { deviceHealth, type DeviceHealth } from '../lib/device-display'
import { asLicenseFilter, type WorkspaceIntent } from '../lib/workspace-intent'
import { RequestsTab } from '../requests/RequestsTab'
import {
  computeExpiryFromTier,
  msToDatetimeLocal,
  msToOfflineDaysMinutes,
  parseDatetimeLocal,
  parseOfflineGraceMs,
} from '../lib/device-form'
import type { CustomUnit, DeviceRow } from '../types/device'
import { DeviceDetailSheet } from './DeviceDetailSheet'
import { DeviceEditModal } from './DeviceEditModal'
import { QuickActivationForm } from './QuickActivationForm'
import { RegisteredDevicesList } from './RegisteredDevicesList'

type FilterKey = 'all' | DeviceHealth

export function DevicesTab({
  product,
  refreshNonce = 0,
  pendingCount = 0,
  intent,
  onLoadingChange,
  onUnauthorized,
}: {
  product: PlatformProductKey
  refreshNonce?: number
  pendingCount?: number
  intent?: WorkspaceIntent | null
  onLoadingChange?: (loading: boolean) => void
  onUnauthorized: () => void
}) {
  const [devices, setDevices] = useState<DeviceRow[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const productRef = useRef(product)
  const onUnauthorizedRef = useRef(onUnauthorized)
  const onLoadingChangeRef = useRef(onLoadingChange)
  productRef.current = product
  onUnauthorizedRef.current = onUnauthorized
  onLoadingChangeRef.current = onLoadingChange

  const [newMachineId, setNewMachineId] = useState('')
  const [newLabel, setNewLabel] = useState('')
  const [newTier, setNewTier] = useState('5d')
  const [newNotes, setNewNotes] = useState('')
  const [customAmount, setCustomAmount] = useState('7')
  const [customUnit, setCustomUnit] = useState<CustomUnit>('days')
  const [newRollingDays, setNewRollingDays] = useState('')
  const [newRollingMinutes, setNewRollingMinutes] = useState('')

  const [editOpen, setEditOpen] = useState(false)
  const [editRow, setEditRow] = useState<DeviceRow | null>(null)
  const [editLabel, setEditLabel] = useState('')
  const [editNotes, setEditNotes] = useState('')
  const [editTier, setEditTier] = useState('5d')
  const [editExpires, setEditExpires] = useState('')
  const [editLastSync, setEditLastSync] = useState('')
  const [editRollingDays, setEditRollingDays] = useState('')
  const [editRollingMinutes, setEditRollingMinutes] = useState('')
  const [editSaving, setEditSaving] = useState(false)
  const [editError, setEditError] = useState<string | null>(null)

  const [detailRow, setDetailRow] = useState<DeviceRow | null>(null)
  const [createOpen, setCreateOpen] = useState(() => Boolean(intent?.create))
  const [inboxOpen, setInboxOpen] = useState(() => Boolean(intent?.inbox))
  const [searchQuery, setSearchQuery] = useState('')
  const [filter, setFilter] = useState<FilterKey>(() => asLicenseFilter(intent?.filter) ?? 'all')

  const load = useCallback(async (forProduct: PlatformProductKey) => {
    setLoading(true)
    onLoadingChangeRef.current?.(true)
    setError(null)
    try {
      const result = await fetchDevices(forProduct)
      if (forProduct !== productRef.current) return
      if (!result.ok) {
        if (result.unauthorized) onUnauthorizedRef.current()
        setDevices([])
        setError(result.error)
        return
      }
      setDevices(result.devices)
    } catch (e) {
      if (forProduct !== productRef.current) return
      setError(e instanceof Error ? e.message : String(e))
      setDevices([])
    } finally {
      if (forProduct !== productRef.current) return
      setLoading(false)
      onLoadingChangeRef.current?.(false)
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    setDevices([])
    setEditOpen(false)
    setEditRow(null)
    setEditSaving(false)
    setEditError(null)
    setDetailRow(null)
    setSearchQuery('')
    if (!intent) {
      setCreateOpen(false)
      setInboxOpen(false)
      setFilter('all')
    }
    const forProduct = product
    setLoading(true)
    onLoadingChangeRef.current?.(true)
    setError(null)
    void (async () => {
      try {
        const result = await fetchDevices(forProduct)
        if (cancelled || forProduct !== productRef.current) return
        if (!result.ok) {
          if (result.unauthorized) onUnauthorizedRef.current()
          setDevices([])
          setError(result.error)
          return
        }
        setDevices(result.devices)
      } catch (e) {
        if (cancelled || forProduct !== productRef.current) return
        setError(e instanceof Error ? e.message : String(e))
        setDevices([])
      } finally {
        if (!cancelled && forProduct === productRef.current) {
          setLoading(false)
          onLoadingChangeRef.current?.(false)
        }
      }
    })()
    return () => { cancelled = true }
  }, [product, refreshNonce])

  useEffect(() => {
    if (!intent) return
    const nextFilter = asLicenseFilter(intent.filter)
    if (nextFilter) setFilter(nextFilter)
    if (intent.inbox) setInboxOpen(true)
    if (intent.create) setCreateOpen(true)
  }, [intent])

  async function addDevice(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    const result = await createDevice({
      product,
      machineId: newMachineId,
      label: newLabel.trim() || null,
      tier: newTier,
      renew: true,
      notes: newNotes.trim() || null,
      customAmount,
      customUnit,
      rollingDays: newRollingDays,
      rollingMinutes: newRollingMinutes,
    })
    if (!result.ok) {
      if (result.unauthorized) onUnauthorized()
      setError(result.error)
      return
    }
    setNewMachineId('')
    setNewRollingDays('')
    setNewRollingMinutes('')
    setCreateOpen(false)
    await load(product)
  }

  function openEdit(d: DeviceRow) {
    setDetailRow(null)
    setEditRow(d)
    setEditLabel(d.label ?? '')
    setEditNotes(d.notes ?? '')
    setEditTier(d.tier)
    setEditExpires(d.tier === 'lifetime' || d.expiresAtMs == null ? '' : msToDatetimeLocal(d.expiresAtMs))
    setEditLastSync(msToDatetimeLocal(d.lastSyncAtMs ?? d.createdAtMs))
    const { days, minutes } = msToOfflineDaysMinutes(d.rollingMaxMs)
    setEditRollingDays(days)
    setEditRollingMinutes(minutes)
    setEditOpen(true)
    setEditError(null)
    setError(null)
  }

  function closeEdit() {
    setEditOpen(false)
    setEditRow(null)
    setEditSaving(false)
    setEditError(null)
  }

  function applyEditTier(nextTier: string) {
    setEditTier(nextTier)
    if (nextTier === 'lifetime') {
      setEditExpires('')
      return
    }
    const ms = computeExpiryFromTier(Date.now(), nextTier)
    if (ms != null) setEditExpires(msToDatetimeLocal(ms))
  }

  async function saveEdit(e: React.FormEvent) {
    e.preventDefault()
    if (!editRow) return
    setEditError(null)
    const expiresAtMs = editTier === 'lifetime' ? null : parseDatetimeLocal(editExpires)
    if (editTier !== 'lifetime' && expiresAtMs == null) {
      setEditError('Set expiry date or choose Lifetime.')
      return
    }
    const lastSyncTrim = editLastSync.trim()
    const lastSyncAtMs = lastSyncTrim ? parseDatetimeLocal(lastSyncTrim) : null
    if (lastSyncTrim && lastSyncAtMs == null) {
      setEditError('Invalid last sync date.')
      return
    }
    const rollingParsed = parseOfflineGraceMs(editRollingDays, editRollingMinutes)
    if (rollingParsed === 'err') {
      setEditError('Offline grace: use whole numbers (days and minutes ≥ 0).')
      return
    }
    setEditSaving(true)
    try {
      const result = await patchDevice({
        product,
        machineId: editRow.machineId,
        label: editLabel.trim() || null,
        notes: editNotes.trim() || null,
        tier: editTier,
        expiresAtMs,
        lastSyncAtMs,
        rollingMaxMs: rollingParsed,
      })
      if (!result.ok) {
        if (result.unauthorized) onUnauthorized()
        setEditError(result.error)
        return
      }
      closeEdit()
      await load(product)
    } catch (err) {
      setEditError(err instanceof Error ? err.message : String(err))
    } finally {
      setEditSaving(false)
    }
  }

  async function removeDevice(machineId: string) {
    if (!window.confirm(`Delete device?\n${machineId}`)) return
    setError(null)
    const result = await deleteDevice(product, machineId)
    if (!result.ok) {
      if (result.unauthorized) onUnauthorized()
      setError(result.error)
      return
    }
    if (editRow?.machineId === machineId) closeEdit()
    setDetailRow((cur) => (cur?.machineId === machineId ? null : cur))
    await load(product)
  }

  const counts = {
    all: devices.length,
    active: 0,
    expiring: 0,
    expired: 0,
    sync: 0,
    revoked: 0,
    unknown: 0,
  } satisfies Record<FilterKey, number>
  for (const d of devices) counts[deviceHealth(d)] += 1

  const q = searchQuery.toLowerCase().trim()
  const filtered = devices.filter((d) => {
    if (filter !== 'all' && deviceHealth(d) !== filter) return false
    if (!q) return true
    return (
      (d.label ?? '').toLowerCase().includes(q) ||
      d.machineId.toLowerCase().includes(q) ||
      (d.storeName ?? '').toLowerCase().includes(q) ||
      (d.notes ?? '').toLowerCase().includes(q)
    )
  })

  return (
    <>
      <MetricCard
        className="mb-4"
        layout="row"
        kicker="Requests"
        value={pendingCount}
        caption={
          pendingCount === 0
            ? 'No pending activations'
            : pendingCount === 1
              ? '1 pending activation'
              : `${pendingCount} pending activations`
        }
        tone={pendingCount > 0 ? 'peach' : 'brand'}
        icon={Ico.requests}
        onClick={() => setInboxOpen(true)}
      />

      <div className="mb-3 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0 flex-1 lg:max-w-md">
          <SearchField
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search name or machine ID"
          />
        </div>
        <button
          type="button"
          className={cn(m3BtnPrimary, 'h-11 w-full shrink-0 px-4 lg:w-auto')}
          onClick={() => setCreateOpen(true)}
        >
          {Ico.plus} Activate device
        </button>
      </div>

      <div className="mb-4">
        <FilterBar
          value={filter}
          onChange={setFilter}
          options={[
            { key: 'all', label: 'All', count: counts.all },
            { key: 'active', label: 'Active', count: counts.active },
            { key: 'expiring', label: 'Expiring', count: counts.expiring },
            { key: 'expired', label: 'Expired', count: counts.expired },
            { key: 'sync', label: 'Sync', count: counts.sync },
            { key: 'revoked', label: 'Revoked', count: counts.revoked },
          ]}
        />
      </div>

      {error ? (
        <div className={alertBox} role="alert">
          <span className="shrink-0 text-red-600">{Ico.exclamation}</span>
          <span>{error}</span>
        </div>
      ) : null}

      <RegisteredDevicesList
        devices={filtered}
        loading={loading}
        onOpen={setDetailRow}
        emptyTitle={q || filter !== 'all' ? 'No matches' : 'No devices'}
        emptyBody={
          q
            ? `Nothing matches “${searchQuery}”.`
            : 'Activate a device to get started.'
        }
      />

      {detailRow && !editOpen ? (
        <DeviceDetailSheet
          row={detailRow}
          onClose={() => setDetailRow(null)}
          onEdit={() => openEdit(detailRow)}
          onRemove={() => void removeDevice(detailRow.machineId)}
          onToggleRevoke={() => {
            void (async () => {
              const result = await toggleRevokeDevice(product, detailRow.machineId, detailRow.revoked)
              if (!result.ok) {
                if (result.unauthorized) onUnauthorized()
                setError(result.error)
                return
              }
              setDetailRow(null)
              await load(product)
            })()
          }}
        />
      ) : null}

      <Overlay open={createOpen} title="Activate device" onClose={() => setCreateOpen(false)}>
        <QuickActivationForm
          embedded
          loading={loading}
          newMachineId={newMachineId}
          newLabel={newLabel}
          newTier={newTier}
          newNotes={newNotes}
          customAmount={customAmount}
          customUnit={customUnit}
          newRollingDays={newRollingDays}
          newRollingMinutes={newRollingMinutes}
          onMachineId={setNewMachineId}
          onLabel={setNewLabel}
          onTier={setNewTier}
          onNotes={setNewNotes}
          onCustomAmount={setCustomAmount}
          onCustomUnit={setCustomUnit}
          onRollingDays={setNewRollingDays}
          onRollingMinutes={setNewRollingMinutes}
          onSubmit={addDevice}
        />
      </Overlay>

      <Overlay open={inboxOpen} title="Requests" onClose={() => setInboxOpen(false)}>
        <RequestsTab
          product={product}
          refreshNonce={0}
          onLoadingChange={() => {}}
          onUnauthorized={onUnauthorized}
        />
      </Overlay>

      {editOpen && editRow ? (
        <DeviceEditModal
          editRow={editRow}
          editLabel={editLabel}
          editNotes={editNotes}
          editTier={editTier}
          editExpires={editExpires}
          editLastSync={editLastSync}
          editRollingDays={editRollingDays}
          editRollingMinutes={editRollingMinutes}
          editSaving={editSaving}
          editError={editError}
          onEditLabel={setEditLabel}
          onEditNotes={setEditNotes}
          onEditTier={applyEditTier}
          onEditExpires={setEditExpires}
          onEditLastSync={setEditLastSync}
          onEditRollingDays={setEditRollingDays}
          onEditRollingMinutes={setEditRollingMinutes}
          onClose={closeEdit}
          onSave={saveEdit}
        />
      ) : null}
    </>
  )
}

