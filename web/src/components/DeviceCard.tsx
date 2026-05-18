import { cn, deviceCard, statusBadge, statusDot } from '../lib/ui'
import type { DeviceRow } from '../types/device'

export function DeviceCard({ d, onOpen }: { d: DeviceRow; onOpen: (d: DeviceRow) => void }) {
  const name = d.label?.trim() ? d.label : 'Unnamed Device'
  const isRevoked = d.revoked
  return (
    <button type="button" className={deviceCard} onClick={() => onOpen(d)}>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="truncate text-[0.9375rem] font-bold text-label">{name}</span>
        <span className="truncate font-mono text-xs tracking-wide text-on-surface-variant">{d.machineId}</span>
      </div>
      <div className={cn(statusBadge(!isRevoked), 'shrink-0')}>
        <span className={statusDot(!isRevoked)} />
        {isRevoked ? 'Revoked' : 'Active'}
      </div>
    </button>
  )
}
