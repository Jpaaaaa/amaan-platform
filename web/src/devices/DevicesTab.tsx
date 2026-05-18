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
import { alertBox } from '../lib/ui'
import {
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

export function DevicesTab({
  product,
  refreshNonce = 0,
  onLoadingChange,
  onUnauthorized,
}: {
  product: PlatformProductKey
  refreshNonce?: number
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

  const [detailRow, setDetailRow] = useState<DeviceRow | null>(null)

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
    setDetailRow(null)
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
    setError(null)
  }

  function closeEdit() {
    setEditOpen(false)
    setEditRow(null)
    setEditSaving(false)
  }

  async function saveEdit(e: React.FormEvent) {
    e.preventDefault()
    if (!editRow) return
    setError(null)
    const expiresAtMs = editTier === 'lifetime' ? null : parseDatetimeLocal(editExpires)
    if (editTier !== 'lifetime' && expiresAtMs == null) {
      setError('Set expiry date or choose Lifetime.')
      return
    }
    const lastSyncTrim = editLastSync.trim()
    const lastSyncAtMs = lastSyncTrim ? parseDatetimeLocal(lastSyncTrim) : null
    if (lastSyncTrim && lastSyncAtMs == null) {
      setError('Invalid last sync date.')
      return
    }
    const rollingParsed = parseOfflineGraceMs(editRollingDays, editRollingMinutes)
    if (rollingParsed === 'err') {
      setError('Offline grace: use whole numbers (days and minutes ≥ 0).')
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
        setError(result.error)
        return
      }
      closeEdit()
      await load(product)
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

  return (
    <>
      {error ? (
        <div className={alertBox} role="alert">
          <span className="shrink-0 text-red-600">{Ico.exclamation}</span>
          <span>{error}</span>
        </div>
      ) : null}

      <QuickActivationForm
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

      <RegisteredDevicesList devices={devices} loading={loading} onOpen={setDetailRow} />

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
          onEditLabel={setEditLabel}
          onEditNotes={setEditNotes}
          onEditTier={setEditTier}
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

