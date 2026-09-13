import { Field } from '../components/Field'
import { Ico } from '../components/icons'
import {
  alertBox,
  cn,
  fieldInline,
  fieldInput,
  fieldSelect,
  fieldSuffix,
  fieldTextarea,
  iosSection,
  m3BtnPrimary,
  spinner,
} from '../lib/ui'
import { Overlay } from '../components/ui/Overlay'
import type { DeviceRow } from '../types/device'

export function DeviceEditModal({
  editRow,
  editLabel,
  editNotes,
  editTier,
  editExpires,
  editLastSync,
  editRollingDays,
  editRollingMinutes,
  editSaving,
  editError,
  onEditLabel,
  onEditNotes,
  onEditTier,
  onEditExpires,
  onEditLastSync,
  onEditRollingDays,
  onEditRollingMinutes,
  onClose,
  onSave,
}: {
  editRow: DeviceRow
  editLabel: string
  editNotes: string
  editTier: string
  editExpires: string
  editLastSync: string
  editRollingDays: string
  editRollingMinutes: string
  editSaving: boolean
  editError: string | null
  onEditLabel: (v: string) => void
  onEditNotes: (v: string) => void
  onEditTier: (v: string) => void
  onEditExpires: (v: string) => void
  onEditLastSync: (v: string) => void
  onEditRollingDays: (v: string) => void
  onEditRollingMinutes: (v: string) => void
  onClose: () => void
  onSave: (e: React.FormEvent) => void
}) {
  return (
    <Overlay
      open
      title="Edit device"
      onClose={onClose}
      footer={
        <button
          id="edit-save-btn"
          className={cn(m3BtnPrimary, 'h-11 w-full')}
          type="button"
          onClick={(e) => void onSave(e as unknown as React.FormEvent)}
          disabled={editSaving}
        >
          {editSaving ? <span className={cn(spinner, 'h-3.5 w-3.5')} /> : 'Save'}
        </button>
      }
    >
          <p className="break-all pb-1.5 font-mono text-xs leading-normal text-label-3">
            {editRow.machineId}
          </p>

          {editError ? (
            <div className={cn(alertBox, 'mb-3')} role="alert">
              <span className="shrink-0 text-red-600">{Ico.exclamation}</span>
              <span>{editError}</span>
            </div>
          ) : null}

          <form id="edit-form" onSubmit={(ev) => void onSave(ev)}>
            <div className={cn(iosSection, 'mb-2 rounded-none')}>
              <Field label="Label" first>
                <input
                  id="edit-label"
                  className={fieldInput}
                  value={editLabel}
                  onChange={(e) => onEditLabel(e.target.value)}
                  placeholder="Front desk"
                />
              </Field>
              <Field label="Tier">
                <select
                  id="edit-tier"
                  className={fieldSelect}
                  value={editTier}
                  onChange={(e) => onEditTier(e.target.value)}
                >
                  <option value="5d">5 days</option>
                  <option value="15d">15 days</option>
                  <option value="1m">1 month</option>
                  <option value="2m">2 months</option>
                  <option value="lifetime">Lifetime</option>
                  <option value="custom">Custom</option>
                </select>
              </Field>
              <Field label="Expires" hint={editTier === 'lifetime' ? 'Not applicable for lifetime tier.' : undefined}>
                <input
                  id="edit-expires"
                  className={fieldInput}
                  type="datetime-local"
                  disabled={editTier === 'lifetime'}
                  value={editExpires}
                  onChange={(e) => onEditExpires(e.target.value)}
                />
              </Field>
              <Field
                label="Last sync"
                hint="Rolling deadline uses last sync + offline grace (custom or server default)."
              >
                <input
                  id="edit-last-sync"
                  className={fieldInput}
                  type="datetime-local"
                  value={editLastSync}
                  onChange={(e) => onEditLastSync(e.target.value)}
                />
              </Field>
              <Field label="Offline grace" hint="Blank days and minutes = server default window.">
                <div className={fieldInline}>
                  <input
                    id="edit-rolling-days"
                    className={cn(fieldInput, 'field-no-spin flex-1')}
                    type="number"
                    min={0}
                    step={1}
                    dir="ltr"
                    placeholder="Days"
                    aria-label="Offline grace days"
                    value={editRollingDays}
                    onChange={(e) => onEditRollingDays(e.target.value)}
                  />
                  <span className={fieldSuffix}>d</span>
                  <input
                    id="edit-rolling-minutes"
                    className={cn(fieldInput, 'field-no-spin flex-1')}
                    type="number"
                    min={0}
                    step={1}
                    dir="ltr"
                    placeholder="Minutes"
                    aria-label="Offline grace minutes"
                    value={editRollingMinutes}
                    onChange={(e) => onEditRollingMinutes(e.target.value)}
                  />
                  <span className={fieldSuffix}>m</span>
                </div>
              </Field>
              <Field label="Notes">
                <textarea
                  id="edit-notes"
                  className={fieldTextarea}
                  value={editNotes}
                  onChange={(e) => onEditNotes(e.target.value)}
                  rows={2}
                />
              </Field>
            </div>
          </form>
    </Overlay>
  )
}
