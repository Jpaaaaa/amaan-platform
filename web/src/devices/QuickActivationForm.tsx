import { Field } from '../components/Field'
import { Ico } from '../components/icons'
import {
  bentoCard,
  bentoTitle,
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
import type { CustomUnit } from '../types/device'

export function QuickActivationForm({
  loading,
  newMachineId,
  newLabel,
  newTier,
  newNotes,
  customAmount,
  customUnit,
  newRollingDays,
  newRollingMinutes,
  onMachineId,
  onLabel,
  onTier,
  onNotes,
  onCustomAmount,
  onCustomUnit,
  onRollingDays,
  onRollingMinutes,
  onSubmit,
}: {
  loading: boolean
  newMachineId: string
  newLabel: string
  newTier: string
  newNotes: string
  customAmount: string
  customUnit: CustomUnit
  newRollingDays: string
  newRollingMinutes: string
  onMachineId: (v: string) => void
  onLabel: (v: string) => void
  onTier: (v: string) => void
  onNotes: (v: string) => void
  onCustomAmount: (v: string) => void
  onCustomUnit: (v: CustomUnit) => void
  onRollingDays: (v: string) => void
  onRollingMinutes: (v: string) => void
  onSubmit: (e: React.FormEvent) => void
}) {
  return (
    <section className={bentoCard}>
      <h2 className={bentoTitle}>Quick Activation</h2>
      <form onSubmit={(ev) => void onSubmit(ev)}>
        <div className={iosSection}>
          <Field label="Machine ID" first>
            <input
              id="new-machine-id"
              className={fieldInput}
              required
              value={newMachineId}
              onChange={(e) => onMachineId(e.target.value)}
              dir="ltr"
              placeholder="WIN-ABC123-XYZ"
              autoComplete="off"
              spellCheck={false}
            />
          </Field>
          <Field label="Label">
            <input
              id="new-label"
              className={fieldInput}
              value={newLabel}
              onChange={(e) => onLabel(e.target.value)}
              placeholder="Front desk"
            />
          </Field>
          <Field label="Tier">
            <select id="new-tier" className={fieldSelect} value={newTier} onChange={(e) => onTier(e.target.value)}>
              <option value="5d">5 days</option>
              <option value="15d">15 days</option>
              <option value="1m">1 month</option>
              <option value="2m">2 months</option>
              <option value="lifetime">Lifetime</option>
              <option value="custom">Custom…</option>
            </select>
          </Field>
          {newTier === 'custom' ? (
            <>
              <Field label="Amount">
                <input
                  id="custom-amount"
                  className={cn(fieldInput, 'field-no-spin')}
                  type="number"
                  min={0.001}
                  step="any"
                  required
                  dir="ltr"
                  value={customAmount}
                  onChange={(e) => onCustomAmount(e.target.value)}
                />
              </Field>
              <Field label="Unit">
                <select
                  id="custom-unit"
                  className={fieldSelect}
                  value={customUnit}
                  onChange={(e) => onCustomUnit(e.target.value as CustomUnit)}
                >
                  <option value="seconds">Seconds</option>
                  <option value="minutes">Minutes</option>
                  <option value="hours">Hours</option>
                  <option value="days">Days</option>
                </select>
              </Field>
            </>
          ) : null}
          <Field label="Notes">
            <textarea
              id="new-notes"
              className={fieldTextarea}
              value={newNotes}
              onChange={(e) => onNotes(e.target.value)}
              rows={2}
              placeholder="Optional"
            />
          </Field>
          <Field label="Offline grace" hint="Max time without a sync before check-in.">
            <div className={fieldInline}>
              <input
                id="new-rolling-days"
                className={cn(fieldInput, 'field-no-spin flex-1')}
                type="number"
                min={0}
                placeholder="Days"
                value={newRollingDays}
                onChange={(e) => onRollingDays(e.target.value)}
              />
              <span className={fieldSuffix}>d</span>
              <input
                id="new-rolling-minutes"
                className={cn(fieldInput, 'field-no-spin flex-1')}
                type="number"
                min={0}
                placeholder="Mins"
                value={newRollingMinutes}
                onChange={(e) => onRollingMinutes(e.target.value)}
              />
              <span className={fieldSuffix}>m</span>
            </div>
          </Field>
        </div>

        <button
          id="activate-btn"
          type="submit"
          className={cn(m3BtnPrimary, 'h-[52px] w-full rounded-2xl')}
          disabled={loading}
        >
          {loading ? <span className={spinner} /> : <>{Ico.plus} Activate Device</>}
        </button>
      </form>
    </section>
  )
}
