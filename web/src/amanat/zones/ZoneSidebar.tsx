import type { GeoJsonPolygon, Neighborhood } from '../../api/neighborhoods'
import { cn, m3BtnOutline, spinner } from '../../lib/ui'
import { ZonePendingForm } from './ZonePendingForm'

const actionBtn = cn(m3BtnOutline, 'h-8 min-h-0 px-2.5 text-[0.6875rem] font-bold')
const actionBtnDanger = cn(actionBtn, 'border-red-300 text-red-600')

export function ZoneSidebar({
  zones,
  selectedId,
  loading,
  saving,
  actionId,
  pendingCreate,
  pendingEdit,
  onSelect,
  onEdit,
  onDelete,
  onCreateSubmit,
  onCreateCancel,
  onRenameSubmit,
  onRenameCancel,
}: {
  zones: Neighborhood[]
  selectedId: string | null
  loading: boolean
  saving: boolean
  actionId: string | null
  pendingCreate: GeoJsonPolygon | null
  pendingEdit: Neighborhood | null
  onSelect: (id: string) => void
  onEdit: (zone: Neighborhood) => void
  onDelete: (zone: Neighborhood) => void
  onCreateSubmit: (name: string) => Promise<void>
  onCreateCancel: () => void
  onRenameSubmit: (name: string) => Promise<void>
  onRenameCancel: () => void
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-obsidian-border bg-white">
      <div className="border-b border-obsidian-border bg-slate-900/[0.03] px-4 py-3">
        <h2 className="text-sm font-bold text-label">Zone list</h2>
        <p className="text-xs text-on-surface-variant">
          Tap a zone to highlight it on the map.
        </p>
      </div>

      {pendingCreate && (
        <ZonePendingForm
          title="New zone ready"
          description="Your polygon is closed. Enter a name and save."
          submitLabel="Create zone"
          saving={saving}
          onCancel={onCreateCancel}
          onSubmit={onCreateSubmit}
        />
      )}

      {pendingEdit && !pendingCreate && (
        <ZonePendingForm
          title="Rename zone"
          description={`Update the name for ${pendingEdit.name}.`}
          initialName={pendingEdit.name}
          submitLabel="Save"
          saving={saving}
          onCancel={onRenameCancel}
          onSubmit={onRenameSubmit}
        />
      )}

      <div className="max-h-[280px] overflow-y-auto">
        {loading ? (
          <div className="flex justify-center py-8">
            <span className={spinner} />
          </div>
        ) : zones.length === 0 && !pendingCreate ? (
          <p className="px-4 py-8 text-center text-sm text-on-surface-variant">
            No zones yet. Use the polygon tool on the map.
          </p>
        ) : (
          <ul className="divide-y divide-obsidian-border">
            {zones.map((zone) => {
              const selected = zone.id === selectedId
              const busy = actionId === zone.id
              return (
                <li
                  key={zone.id}
                  className={cn(
                    'flex items-start justify-between gap-2 px-4 py-3',
                    selected && 'bg-primary/5',
                  )}
                >
                  <button
                    type="button"
                    onClick={() => onSelect(zone.id)}
                    className="min-w-0 flex-1 text-left"
                  >
                    <div className="font-semibold text-label">{zone.name}</div>
                    <div className="text-xs text-on-surface-variant">{zone.city}</div>
                  </button>
                  <div className="flex shrink-0 gap-1">
                    <button
                      type="button"
                      className={actionBtn}
                      disabled={busy || saving}
                      onClick={() => onEdit(zone)}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className={actionBtnDanger}
                      disabled={busy || saving}
                      onClick={() => onDelete(zone)}
                    >
                      {busy ? <span className={spinner} /> : 'Delete'}
                    </button>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}
