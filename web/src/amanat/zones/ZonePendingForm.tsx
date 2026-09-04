import { useEffect, useState } from 'react'
import type { GeoJsonPolygon } from '../../api/neighborhoods'
import {
  alertBox,
  cn,
  fieldInput,
  iosSection,
  m3BtnOutline,
  m3BtnPrimary,
  spinner,
} from '../../lib/ui'

export function ZonePendingForm({
  title,
  description,
  initialName = '',
  submitLabel,
  saving,
  onCancel,
  onSubmit,
}: {
  title: string
  description: string
  initialName?: string
  submitLabel: string
  saving: boolean
  onCancel: () => void
  onSubmit: (name: string) => Promise<void>
}) {
  const [name, setName] = useState(initialName)
  const [error, setError] = useState('')

  useEffect(() => {
    setName(initialName)
  }, [initialName])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) {
      setError('Zone name is required.')
      return
    }
    setError('')
    try {
      await onSubmit(trimmed)
    } catch {
      setError('Failed to save zone.')
    }
  }

  return (
    <form onSubmit={(ev) => void handleSubmit(ev)} className="border-b border-primary/20 bg-primary/5 px-4 py-4">
      <p className="text-sm font-bold text-label">{title}</p>
      <p className="mt-1 text-xs text-on-surface-variant">{description}</p>
      <div className={cn(iosSection, 'mt-3 rounded-xl')}>
        <div className="field-row border-t-0 px-4 py-3 pb-3.5">
          <label
            className="mb-1.5 block text-[0.6875rem] font-bold uppercase tracking-wider text-label-2"
            htmlFor="zone-pending-name"
          >
            Zone name
          </label>
          <input
            id="zone-pending-name"
            className={fieldInput}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Raparin"
            autoFocus
            disabled={saving}
          />
        </div>
      </div>
      {error && <div className={cn(alertBox, 'mt-3 rounded-xl')}>{error}</div>}
      <div className="mt-3 flex gap-2">
        <button
          type="submit"
          className={cn(m3BtnPrimary, 'h-9 min-h-0 px-4 text-xs font-bold')}
          disabled={saving}
        >
          {saving ? <span className={spinner} /> : submitLabel}
        </button>
        <button
          type="button"
          className={cn(m3BtnOutline, 'h-9 min-h-0 px-4 text-xs font-bold')}
          onClick={onCancel}
          disabled={saving}
        >
          Cancel
        </button>
      </div>
    </form>
  )
}
