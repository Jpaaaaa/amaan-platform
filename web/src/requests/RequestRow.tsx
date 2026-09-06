import { formatRelativeAge, formatStoreType, truncateMachineId } from '../lib/request-utils'
import { cn, m3BtnOutline, m3BtnPrimary, m3BtnText, statusBadge } from '../lib/ui'
import type { ActivationRequestRow } from '../types/device'
import { QuickActivationForm } from '../devices/QuickActivationForm'
import type { CustomUnit } from '../types/device'

export function RequestRow({
  row,
  loading,
  expanded,
  onToggleApprove,
  approveTier,
  approveLabel,
  approveNotes,
  customAmount,
  customUnit,
  rollingDays,
  rollingMinutes,
  onApproveTier,
  onApproveLabel,
  onApproveNotes,
  onCustomAmount,
  onCustomUnit,
  onRollingDays,
  onRollingMinutes,
  onApproveSubmit,
  revokeBlockedMessage,
  onRestoreAccess,
  onDecline,
  onDelete,
  onCopyMachineId,
}: {
  row: ActivationRequestRow
  loading: boolean
  expanded: boolean
  onToggleApprove: () => void
  approveTier: string
  approveLabel: string
  approveNotes: string
  customAmount: string
  customUnit: CustomUnit
  rollingDays: string
  rollingMinutes: string
  onApproveTier: (v: string) => void
  onApproveLabel: (v: string) => void
  onApproveNotes: (v: string) => void
  onCustomAmount: (v: string) => void
  onCustomUnit: (v: CustomUnit) => void
  onRollingDays: (v: string) => void
  onRollingMinutes: (v: string) => void
  onApproveSubmit: (e: React.FormEvent) => void
  revokeBlockedMessage: string | null
  onRestoreAccess: () => void
  onDecline: () => void
  onDelete: () => void
  onCopyMachineId: () => void
}) {
  const { store } = row
  const metaParts: string[] = []
  if (store.phone?.trim()) metaParts.push(store.phone.trim())
  if (store.city?.trim()) metaParts.push(store.city.trim())
  const typeLabel = formatStoreType(store.storeType, store.storeTypeOther)
  if (typeLabel) metaParts.push(typeLabel)

  return (
    <article className="mb-4 rounded-2xl border border-obsidian-border bg-white p-4 shadow-sm">
      <div className="mb-2 flex items-start justify-between gap-2">
        <h3 className="min-w-0 flex-1 text-lg font-bold leading-snug text-label">{store.storeName}</h3>
        {row.status === 'declined' ? (
          <span className={cn(statusBadge(false), 'shrink-0 normal-case tracking-normal')}>Declined</span>
        ) : null}
      </div>

      {metaParts.length > 0 ? (
        <p className="mb-1 text-sm text-on-surface-variant">{metaParts.join(' · ')}</p>
      ) : null}

      {store.ownerContactName?.trim() ? (
        <p className="mb-2 text-sm text-on-surface-variant">{store.ownerContactName.trim()}</p>
      ) : null}

      <button
        type="button"
        className="mb-2 block max-w-full truncate font-mono text-xs tracking-wide text-primary underline-offset-2 hover:underline"
        onClick={onCopyMachineId}
        title={row.machineId}
      >
        {truncateMachineId(row.machineId)}
      </button>

      <p className="mb-3 text-xs text-label-3">{formatRelativeAge(row.updatedAtMs)}</p>

      {row.status === 'declined' && row.declineReason?.trim() ? (
        <p className="mb-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{row.declineReason.trim()}</p>
      ) : null}

      {revokeBlockedMessage ? (
        <div className="mb-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          <p>{revokeBlockedMessage}</p>
          <button type="button" className={cn(m3BtnPrimary, 'mt-2 h-10 w-full text-sm')} onClick={onRestoreAccess}>
            Approve and restore access
          </button>
        </div>
      ) : null}

      <div className="flex flex-wrap gap-2">
        {row.status === 'pending' ? (
          <button type="button" className={cn(m3BtnPrimary, 'h-10 px-4 text-sm')} onClick={onToggleApprove}>
            {expanded ? 'Cancel' : 'Approve'}
          </button>
        ) : null}
        {row.status !== 'approved' ? (
          <>
            <button type="button" className={cn(m3BtnOutline, 'h-10 px-4 text-sm')} onClick={onDecline}>
              Decline
            </button>
            <button type="button" className={cn(m3BtnText, 'h-10 px-3 text-sm')} onClick={onDelete}>
              Delete
            </button>
          </>
        ) : null}
      </div>

      {expanded && row.status === 'pending' ? (
        <div className="mt-4 border-t border-obsidian-border pt-4">
          <QuickActivationForm
            hideMachineId
            loading={loading}
            newMachineId={row.machineId}
            newLabel={approveLabel}
            newTier={approveTier}
            newNotes={approveNotes}
            customAmount={customAmount}
            customUnit={customUnit}
            newRollingDays={rollingDays}
            newRollingMinutes={rollingMinutes}
            onMachineId={() => {}}
            onLabel={onApproveLabel}
            onTier={onApproveTier}
            onNotes={onApproveNotes}
            onCustomAmount={onCustomAmount}
            onCustomUnit={onCustomUnit}
            onRollingDays={onRollingDays}
            onRollingMinutes={onRollingMinutes}
            onSubmit={onApproveSubmit}
          />
        </div>
      ) : null}
    </article>
  )
}
