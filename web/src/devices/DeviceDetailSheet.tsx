import { fmtDate } from '../lib/device-form'
import {
  cn,
  m3BtnText,
  m3BtnTonal,
  sheetBackdrop,
  sheetContent,
  sheetNav,
  sheetNavBtn,
  sheetNavTitle,
  sheetPanel,
} from '../lib/ui'
import type { DeviceRow } from '../types/device'
import { Ico } from '../components/icons'

export function DeviceDetailSheet({
  row,
  onClose,
  onEdit,
  onRemove,
  onToggleRevoke,
}: {
  row: DeviceRow
  onClose: () => void
  onEdit: () => void
  onRemove: () => void
  onToggleRevoke: () => void
}) {
  return (
    <div
      role="presentation"
      className={sheetBackdrop}
      onClick={onClose}
      onKeyDown={(e) => { if (e.key === 'Escape') onClose() }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="device-detail-title"
        className={sheetPanel}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={sheetNav}>
          <button type="button" className={sheetNavBtn} onClick={onClose}>
            Close
          </button>
          <span id="device-detail-title" className={sheetNavTitle}>Device</span>
          <span className="pointer-events-none min-w-16 shrink-0 basis-16" aria-hidden />
        </div>

        <div className={cn(sheetContent, 'px-4 pb-6')}>
          <p className="mb-3.5 break-all font-mono text-xs leading-snug text-on-surface-variant">
            {row.machineId}
          </p>
          <div className="mb-5 grid grid-cols-2 gap-2">
            <div className="flex flex-col">
              <span className="text-xs text-on-surface-variant/80">Tier</span>
              <span className="text-sm font-medium">{row.tier}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-xs text-on-surface-variant/80">Expires</span>
              <span className="text-sm font-medium">{fmtDate(row.expiresAtMs)}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-xs text-on-surface-variant/80">Last sync</span>
              <span className="text-sm font-medium">{fmtDate(row.lastSyncAtMs)}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-xs text-on-surface-variant/80">Status</span>
              <span className="text-sm font-medium">{row.computedStatus}</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-2 pt-1">
            <button type="button" className={m3BtnText} onClick={onRemove}>
              {Ico.trash}
            </button>
            <button type="button" className={m3BtnText} onClick={onToggleRevoke}>
              {row.revoked ? Ico.unlock : Ico.lock}
            </button>
            <button type="button" className={m3BtnTonal} onClick={onEdit}>
              {Ico.edit} Edit
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
