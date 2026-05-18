import { Field } from '../components/Field'
import {
  cn,
  fieldInline,
  fieldInput,
  fieldSelect,
  fieldSuffix,
  fieldTextarea,
  iosSection,
  sheetBackdrop,
  sheetContent,
  sheetNav,
  sheetNavBtn,
  sheetNavBtnBold,
  sheetNavTitle,
  sheetPanel,
  spinner,
} from '../lib/ui'
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
    <div
      role="presentation"
      className={sheetBackdrop}
      onClick={onClose}
      onKeyDown={(e) => { if (e.key === 'Escape') onClose() }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-sheet-title"
        className={sheetPanel}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={sheetNav}>
          <button id="edit-cancel-btn" className={sheetNavBtn} type="button" onClick={onClose} disabled={editSaving}>
            Cancel
          </button>
          <span id="edit-sheet-title" className={sheetNavTitle}>Edit device</span>
          <button
            id="edit-save-btn"
            className={sheetNavBtnBold}
            type="button"
            onClick={(e) => void onSave(e as unknown as React.FormEvent)}
            disabled={editSaving}
          >
            {editSaving ? <span className={cn(spinner, 'h-3.5 w-3.5')} /> : 'Save'}
          </button>
        </div>

        <div className={sheetContent}>
          <p className="break-all px-4 pb-1.5 font-mono text-xs leading-normal text-label-3">
            {editRow.machineId}
          </p>

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
                  onChange={(e) => {
                    const v = e.target.value
                    onEditTier(v)
                    if (v === 'lifetime') onEditExpires('')
                  }}
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
        </div>
      </div>
    </div>
  )
}
