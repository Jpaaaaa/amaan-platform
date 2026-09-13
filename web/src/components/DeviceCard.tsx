import { StatusChip } from './ui/Overlay'
import { AccentTile } from './ui/DeckPrimitives'
import { deviceCard } from '../lib/ui'
import {
  deviceDisplayName,
  deviceHealth,
  healthLabel,
  healthTone,
  lastSyncLine,
  tierLabel,
} from '../lib/device-display'
import type { DeviceRow } from '../types/device'

export function DeviceCard({ d, onOpen }: { d: DeviceRow; onOpen: (d: DeviceRow) => void }) {
  const health = deviceHealth(d)
  const name = deviceDisplayName(d)
  return (
    <button type="button" className={deviceCard} onClick={() => onOpen(d)}>
      <AccentTile tone={healthTone(health)}>{name.slice(0, 1).toUpperCase()}</AccentTile>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="flex items-center justify-between gap-2">
          <span className="truncate text-[0.9375rem] font-bold text-label">{name}</span>
          <StatusChip label={healthLabel(health)} tone={healthTone(health)} />
        </span>
        <span className="truncate font-mono text-xs tracking-wide text-on-surface-variant">{d.machineId}</span>
        <span className="text-xs text-label-2">
          {tierLabel(d.tier)} · {lastSyncLine(d)}
        </span>
      </div>
    </button>
  )
}
