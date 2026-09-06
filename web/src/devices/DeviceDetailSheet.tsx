import { fmtDate } from '../lib/device-form'
import { deviceHasKpiSnapshot, formatIqd } from '../lib/request-utils'
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

function StoreKpiBlock({ row }: { row: DeviceRow }) {
  const hasStore =
    row.city?.trim() ||
    row.phone?.trim() ||
    row.ownerContactName?.trim()
  const hasKpi = deviceHasKpiSnapshot(row)

  if (!hasStore && !hasKpi) return null

  return (
    <div className="mb-5 rounded-2xl border border-obsidian-border bg-[#f8fafc] p-4">
      {hasStore ? (
        <div className="mb-3 space-y-1">
          {row.city?.trim() ? (
            <p className="text-sm">
              <span className="text-on-surface-variant/80">City: </span>
              <span className="font-medium">{row.city.trim()}</span>
            </p>
          ) : null}
          {row.phone?.trim() ? (
            <p className="text-sm">
              <span className="text-on-surface-variant/80">Phone: </span>
              <span className="font-medium">{row.phone.trim()}</span>
            </p>
          ) : null}
          {row.ownerContactName?.trim() ? (
            <p className="text-sm">
              <span className="text-on-surface-variant/80">Owner: </span>
              <span className="font-medium">{row.ownerContactName.trim()}</span>
            </p>
          ) : null}
        </div>
      ) : null}

      {hasKpi && row.kpiUpdatedAtMs != null ? (
        <div className={hasStore ? 'border-t border-obsidian-border pt-3' : ''}>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-label-3">
            Sales snapshot · as of {fmtDate(row.kpiUpdatedAtMs)}
          </p>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-xs text-on-surface-variant/80">Month revenue</p>
              <p className="font-medium">
                {row.kpiMonthRevenueCents != null ? formatIqd(row.kpiMonthRevenueCents) : '—'}
              </p>
            </div>
            <div>
              <p className="text-xs text-on-surface-variant/80">Month profit</p>
              <p className="font-medium">
                {row.kpiMonthGrossProfitCents != null ? formatIqd(row.kpiMonthGrossProfitCents) : '—'}
              </p>
            </div>
            <div>
              <p className="text-xs text-on-surface-variant/80">Month sales</p>
              <p className="font-medium">{row.kpiMonthSaleCount ?? '—'}</p>
            </div>
            <div>
              <p className="text-xs text-on-surface-variant/80">Year revenue</p>
              <p className="font-medium">
                {row.kpiYearRevenueCents != null ? formatIqd(row.kpiYearRevenueCents) : '—'}
              </p>
            </div>
            <div>
              <p className="text-xs text-on-surface-variant/80">Year profit</p>
              <p className="font-medium">
                {row.kpiYearGrossProfitCents != null ? formatIqd(row.kpiYearGrossProfitCents) : '—'}
              </p>
            </div>
            <div>
              <p className="text-xs text-on-surface-variant/80">Year sales</p>
              <p className="font-medium">{row.kpiYearSaleCount ?? '—'}</p>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}

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

          <StoreKpiBlock row={row} />

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
