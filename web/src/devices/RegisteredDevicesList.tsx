import { DeviceCard } from '../components/DeviceCard'
import { Ico } from '../components/icons'
import { bentoCard, bentoTitle, cn, emptyState, spinner } from '../lib/ui'
import type { DeviceRow } from '../types/device'

export function RegisteredDevicesList({
  devices,
  loading,
  onOpen,
}: {
  devices: DeviceRow[]
  loading: boolean
  onOpen: (d: DeviceRow) => void
}) {
  return (
    <section className={bentoCard}>
      <div className="mb-5 flex items-center justify-between">
        <h2 className={cn(bentoTitle, 'mb-0')}>Registered Devices</h2>
        <span className="text-xs font-bold text-on-surface-variant">
          {devices.length} Total
        </span>
      </div>

      {devices.length > 0 ? (
        <div>
          {devices.map((d) => (
            <DeviceCard key={d.machineId} d={d} onOpen={onOpen} />
          ))}
        </div>
      ) : !loading ? (
        <div className={emptyState}>
          {Ico.empty}
          <p className="text-base font-bold text-label-2">No devices found</p>
          <p className="max-w-[280px] text-center text-sm leading-relaxed">
            Start by activating a machine ID above.
          </p>
        </div>
      ) : (
        <div className={emptyState}>
          <span className={cn(spinner, 'h-8 w-8')} />
        </div>
      )}
    </section>
  )
}
