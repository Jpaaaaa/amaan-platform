import { useCallback, useEffect, useRef, useState } from 'react'
import type { PlatformProductKey } from '@shared/platform-product'
import {
  approveActivationRequest,
  declineActivationRequest,
  deleteActivationRequest,
  fetchActivationRequests,
} from '../api/activation-requests'
import { Ico } from '../components/icons'
import { alertBox, emptyState } from '../lib/ui'
import type { ActivationRequestRow, CustomUnit } from '../types/device'
import { RequestRow } from './RequestRow'

const POLL_MS = 30_000

export function RequestsTab({
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
  const [requests, setRequests] = useState<ActivationRequestRow[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [revokeBlockedFor, setRevokeBlockedFor] = useState<string | null>(null)
  const [revokeBlockedMessage, setRevokeBlockedMessage] = useState<string | null>(null)

  const [approveTier, setApproveTier] = useState('1m')
  const [approveLabel, setApproveLabel] = useState('')
  const [approveNotes, setApproveNotes] = useState('')
  const [customAmount, setCustomAmount] = useState('7')
  const [customUnit, setCustomUnit] = useState<CustomUnit>('days')
  const [rollingDays, setRollingDays] = useState('')
  const [rollingMinutes, setRollingMinutes] = useState('')

  const productRef = useRef(product)
  const onUnauthorizedRef = useRef(onUnauthorized)
  const onLoadingChangeRef = useRef(onLoadingChange)
  productRef.current = product
  onUnauthorizedRef.current = onUnauthorized
  onLoadingChangeRef.current = onLoadingChange

  const load = useCallback(async (forProduct: PlatformProductKey, silent = false) => {
    if (!silent) {
      setLoading(true)
      onLoadingChangeRef.current?.(true)
    }
    setError(null)
    try {
      const result = await fetchActivationRequests(forProduct)
      if (forProduct !== productRef.current) return
      if (!result.ok) {
        if (result.unauthorized) onUnauthorizedRef.current()
        setRequests([])
        setError(result.error)
        return
      }
      const visible = result.requests.filter((r) => r.status === 'pending' || r.status === 'declined')
      setRequests(visible)
    } catch (e) {
      if (forProduct !== productRef.current) return
      setError(e instanceof Error ? e.message : String(e))
      setRequests([])
    } finally {
      if (forProduct !== productRef.current) return
      if (!silent) {
        setLoading(false)
        onLoadingChangeRef.current?.(false)
      }
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    setRequests([])
    setExpandedId(null)
    setRevokeBlockedFor(null)
    setRevokeBlockedMessage(null)
    const forProduct = product
    void (async () => {
      await load(forProduct)
      if (cancelled) return
    })()
    const id = window.setInterval(() => {
      void load(productRef.current, true)
    }, POLL_MS)
    return () => {
      cancelled = true
      window.clearInterval(id)
    }
  }, [product, refreshNonce, load])

  function resetApproveForm(row: ActivationRequestRow) {
    setApproveTier('1m')
    setApproveLabel(row.store.storeName)
    setApproveNotes('')
    setCustomAmount('7')
    setCustomUnit('days')
    setRollingDays('')
    setRollingMinutes('')
    setRevokeBlockedFor(null)
    setRevokeBlockedMessage(null)
  }

  function toggleApprove(row: ActivationRequestRow) {
    if (expandedId === row.machineId) {
      setExpandedId(null)
      return
    }
    resetApproveForm(row)
    setExpandedId(row.machineId)
  }

  async function submitApprove(row: ActivationRequestRow, allowRevoked = false) {
    setError(null)
    const result = await approveActivationRequest({
      product,
      machineId: row.machineId,
      tier: approveTier,
      label: approveLabel.trim() || null,
      notes: approveNotes.trim() || null,
      customAmount,
      customUnit,
      rollingDays,
      rollingMinutes,
      allowRevoked,
    })
    if (!result.ok) {
      if (result.unauthorized) {
        onUnauthorized()
        return
      }
      if (result.errorCode === 'DEVICE_REVOKED') {
        setRevokeBlockedFor(row.machineId)
        setRevokeBlockedMessage(result.error)
        return
      }
      setError(result.error)
      return
    }
    setExpandedId(null)
    setRevokeBlockedFor(null)
    setRevokeBlockedMessage(null)
    await load(product)
  }

  async function handleDecline(row: ActivationRequestRow) {
    const reason = window.prompt('Decline reason (optional):') ?? ''
    setError(null)
    const result = await declineActivationRequest(product, row.machineId, reason.trim() || null)
    if (!result.ok) {
      if (result.unauthorized) onUnauthorized()
      else setError(result.error)
      return
    }
    if (expandedId === row.machineId) setExpandedId(null)
    await load(product)
  }

  async function handleDelete(row: ActivationRequestRow) {
    if (!window.confirm(`Delete activation request?\n${row.store.storeName}`)) return
    setError(null)
    const result = await deleteActivationRequest(product, row.machineId)
    if (!result.ok) {
      if (result.unauthorized) onUnauthorized()
      else setError(result.error)
      return
    }
    if (expandedId === row.machineId) setExpandedId(null)
    await load(product)
  }

  async function copyMachineId(machineId: string) {
    try {
      await navigator.clipboard.writeText(machineId)
    } catch {
      /* ignore */
    }
  }

  return (
    <>
      {error ? (
        <div className={alertBox} role="alert">
          <span className="shrink-0 text-red-600">{Ico.exclamation}</span>
          <span>{error}</span>
        </div>
      ) : null}

      {loading && requests.length === 0 ? (
        <p className="py-8 text-center text-sm text-label-3">Loading requests…</p>
      ) : null}

      {!loading && requests.length === 0 ? (
        <div className={emptyState}>
          {Ico.empty}
          <p className="text-sm font-medium text-label-2">No pending activation requests</p>
        </div>
      ) : null}

      {requests.map((row) => (
        <RequestRow
          key={row.machineId}
          row={row}
          loading={loading}
          expanded={expandedId === row.machineId}
          onToggleApprove={() => toggleApprove(row)}
          approveTier={approveTier}
          approveLabel={approveLabel}
          approveNotes={approveNotes}
          customAmount={customAmount}
          customUnit={customUnit}
          rollingDays={rollingDays}
          rollingMinutes={rollingMinutes}
          onApproveTier={setApproveTier}
          onApproveLabel={setApproveLabel}
          onApproveNotes={setApproveNotes}
          onCustomAmount={setCustomAmount}
          onCustomUnit={setCustomUnit}
          onRollingDays={setRollingDays}
          onRollingMinutes={setRollingMinutes}
          onApproveSubmit={(e) => {
            e.preventDefault()
            void submitApprove(row, false)
          }}
          revokeBlockedMessage={revokeBlockedFor === row.machineId ? revokeBlockedMessage : null}
          onRestoreAccess={() => void submitApprove(row, true)}
          onDecline={() => void handleDecline(row)}
          onDelete={() => void handleDelete(row)}
          onCopyMachineId={() => void copyMachineId(row.machineId)}
        />
      ))}
    </>
  )
}
