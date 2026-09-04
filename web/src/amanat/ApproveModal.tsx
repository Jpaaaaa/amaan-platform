import { useState } from 'react'
import type { SubscriptionListItem } from '../api/amanat'
import { subscriptionCanRenew } from './subscription-status'
import {
  alertBox,
  cn,
  fieldInput,
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

export function ApproveModal({
  subscription,
  onClose,
  onApprove,
}: {
  subscription: SubscriptionListItem
  onClose: () => void
  onApprove: (startsAt: string, endsAt: string) => Promise<boolean>
}) {
  const renew = subscriptionCanRenew(subscription)
  const today = new Date().toISOString().slice(0, 10)
  const [startsAt, setStartsAt] = useState(today)
  const [endsAt, setEndsAt] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!endsAt) {
      setError('Expiry date is required.')
      return
    }
    setError(null)
    setBusy(true)
    try {
      const ok = await onApprove(startsAt, endsAt)
      if (ok) onClose()
      else setError(renew ? 'Failed to renew subscription.' : 'Failed to approve subscription.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div
      role="presentation"
      className={sheetBackdrop}
      onClick={onClose}
      onKeyDown={(e) => {
        if (e.key === 'Escape') onClose()
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="approve-sheet-title"
        className={sheetPanel}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={sheetNav}>
          <button className={sheetNavBtn} type="button" onClick={onClose} disabled={busy}>
            Cancel
          </button>
          <span id="approve-sheet-title" className={sheetNavTitle}>
            {renew ? 'Renew' : 'Approve'}
          </span>
          <button
            className={sheetNavBtnBold}
            type="submit"
            form="approve-form"
            disabled={busy}
          >
            {busy ? <span className={cn(spinner, 'h-3.5 w-3.5')} /> : renew ? 'Renew' : 'Save'}
          </button>
        </div>

        <div className={sheetContent}>
          <p className="px-4 pb-4 text-sm text-on-surface-variant">
            {renew ? 'Set new subscription dates for ' : 'Set activation and expiry dates for '}
            <span className="font-semibold text-label">{subscription.accountName}</span>
          </p>

          <form id="approve-form" onSubmit={(ev) => void handleSubmit(ev)}>
            <div className={cn(iosSection, 'mb-2 rounded-none')}>
              <div className="field-row border-t-0 px-4 py-3 pb-3.5">
                <label
                  className="mb-1.5 block text-[0.6875rem] font-bold uppercase tracking-wider text-label-2"
                  htmlFor="approve-starts"
                >
                  Activation date
                </label>
                <input
                  id="approve-starts"
                  className={fieldInput}
                  type="date"
                  value={startsAt}
                  onChange={(e) => setStartsAt(e.target.value)}
                  required
                  disabled={busy}
                />
              </div>
              <div className="field-row border-t border-slate-900/[0.06] px-4 py-3 pb-3.5">
                <label
                  className="mb-1.5 block text-[0.6875rem] font-bold uppercase tracking-wider text-label-2"
                  htmlFor="approve-ends"
                >
                  Expiry date
                </label>
                <input
                  id="approve-ends"
                  className={fieldInput}
                  type="date"
                  value={endsAt}
                  onChange={(e) => setEndsAt(e.target.value)}
                  required
                  disabled={busy}
                />
              </div>
            </div>

            {error && <div className={cn(alertBox, 'mx-4 rounded-2xl')}>{error}</div>}
          </form>
        </div>
      </div>
    </div>
  )
}
