import { DeviceCard } from '../components/DeviceCard'
import { AccentTile } from '../components/ui/DeckPrimitives'
import { DataTable, type DataTableColumn } from '../components/ui/DataTable'
import { StatusChip } from '../components/ui/Overlay'
import { fmtDate } from '../lib/device-form'
import {
  deviceDisplayName,
  deviceHealth,
  healthLabel,
  healthTone,
  lastSyncLine,
  tierLabel,
} from '../lib/device-display'
import type { DeviceRow } from '../types/device'

const COLUMNS: DataTableColumn<DeviceRow>[] = [
  {
    key: 'name',
    header: 'Name',
    render: (d) => {
      const name = deviceDisplayName(d)
      return (
        <span className="flex min-w-0 items-center gap-2.5">
          <AccentTile size="sm" tone={healthTone(deviceHealth(d))}>
            {name.slice(0, 1).toUpperCase()}
          </AccentTile>
          <span className="truncate font-semibold">{name}</span>
        </span>
      )
    },
  },
  {
    key: 'machine',
    header: 'Machine',
    className: 'font-mono text-xs',
    render: (d) => d.machineId,
  },
  {
    key: 'store',
    header: 'Store',
    render: (d) => d.storeName?.trim() || '—',
  },
  {
    key: 'city',
    header: 'City',
    render: (d) => d.city?.trim() || '—',
  },
  {
    key: 'tier',
    header: 'Tier',
    render: (d) => tierLabel(d.tier),
  },
  {
    key: 'health',
    header: 'Status',
    render: (d) => {
      const health = deviceHealth(d)
      return <StatusChip label={healthLabel(health)} tone={healthTone(health)} />
    },
  },
  {
    key: 'expires',
    header: 'Expires',
    render: (d) => (d.tier === 'lifetime' ? '—' : fmtDate(d.expiresAtMs)),
  },
  {
    key: 'sync',
    header: 'Last sync',
    render: (d) => lastSyncLine(d),
  },
]

export function RegisteredDevicesList({
  devices,
  loading,
  onOpen,
  emptyTitle,
  emptyBody,
}: {
  devices: DeviceRow[]
  loading: boolean
  onOpen: (d: DeviceRow) => void
  emptyTitle?: string
  emptyBody?: string
}) {
  return (
    <>
      <div className="lg:hidden">
        {loading && devices.length === 0 ? (
          <DataTable
            columns={COLUMNS}
            rows={[]}
            rowKey={(d) => d.machineId}
            loading
            emptyTitle={emptyTitle}
            emptyBody={emptyBody}
          />
        ) : devices.length === 0 ? (
          <DataTable
            columns={COLUMNS}
            rows={[]}
            rowKey={(d) => d.machineId}
            emptyTitle={emptyTitle}
            emptyBody={emptyBody}
          />
        ) : (
          <div>
            {devices.map((d) => (
              <DeviceCard key={d.machineId} d={d} onOpen={onOpen} />
            ))}
          </div>
        )}
      </div>
      <div className="hidden lg:block">
        <DataTable
          columns={COLUMNS}
          rows={devices}
          rowKey={(d) => d.machineId}
          onRowClick={onOpen}
          loading={loading}
          emptyTitle={emptyTitle}
          emptyBody={emptyBody}
        />
      </div>
    </>
  )
}
