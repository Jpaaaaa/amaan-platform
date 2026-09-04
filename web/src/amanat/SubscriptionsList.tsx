import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  approveAmanatSubscription,
  deleteAmanatAccount,
  fetchAmanatSubscriptions,
  rejectAmanatSubscription,
  suspendAmanatAccount,
  unlockAmanatAccount,
  type SubscriptionListItem,
} from '../api/amanat'
import { Ico } from '../components/icons'
import {
  alertBox,
  bentoCard,
  bentoTitle,
  cn,
  emptyState,
  m3BtnOutline,
  m3BtnPrimary,
  m3BtnText,
  spinner,
} from '../lib/ui'
import { ApproveModal } from './ApproveModal'
import { AccountDetailSheet } from './AccountDetailSheet'
import {
  filterSubscriptions,
  formatSubscriptionDate,
  subscriptionCanRenew,
  subscriptionIsActiveApproved,
  subscriptionStatusBadgeClass,
  subscriptionStatusLabel,
  type SubscriptionFilter,
} from './subscription-status'

const FILTER_TABS: { id: SubscriptionFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'pending', label: 'Pending' },
  { id: 'expiring', label: 'Expiring' },
  { id: 'expired', label: 'Expired' },
]

const actionBtn = cn(m3BtnOutline, 'h-9 min-h-0 px-3 text-xs font-bold')
const actionBtnPrimary = cn(m3BtnPrimary, 'h-9 min-h-0 px-3 text-xs font-bold')
const actionBtnDanger = cn(
  actionBtn,
  'border-red-300 text-red-600 hover:border-red-400 hover:bg-red-50',
)

function SubscriptionCard({
  item,
  busy,
  onView,
  onApprove,
  onReject,
  onLock,
  onUnlock,
  onDelete,
}: {
  item: SubscriptionListItem
  busy: boolean
  onView: () => void
  onApprove: () => void
  onReject: () => void
  onLock: () => void
  onUnlock: () => void
  onDelete: () => void
}) {
  return (
    <article className="mb-3 rounded-2xl border border-obsidian-border bg-white p-4 px-5">
      <div className="mb-2 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-base font-bold text-label">{item.accountName}</h3>
          <p className="text-xs capitalize text-on-surface-variant">
            {item.accountType}
            {item.isLocked ? ' · locked' : ''}
          </p>
        </div>
        <span className={subscriptionStatusBadgeClass(item)}>
          {subscriptionStatusLabel(item)}
        </span>
      </div>

      <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
        <div>
          <dt className="text-[0.625rem] font-bold uppercase tracking-wider text-label-3">Tier</dt>
          <dd className="font-medium capitalize text-label">{item.tier.toLowerCase()}</dd>
        </div>
        <div>
          <dt className="text-[0.625rem] font-bold uppercase tracking-wider text-label-3">Agents</dt>
          <dd className="font-medium text-label">
            {item.accountType === 'individual' ? (
              '—'
            ) : (
              <span className={item.agentsCount >= item.maxAgents ? 'text-red-600' : undefined}>
                {item.agentsCount} / {item.maxAgents}
              </span>
            )}
          </dd>
        </div>
        <div>
          <dt className="text-[0.625rem] font-bold uppercase tracking-wider text-label-3">Starts</dt>
          <dd className="text-label-2">{formatSubscriptionDate(item.startsAt)}</dd>
        </div>
        <div>
          <dt className="text-[0.625rem] font-bold uppercase tracking-wider text-label-3">Ends</dt>
          <dd className="text-label-2">{formatSubscriptionDate(item.endsAt)}</dd>
        </div>
      </dl>

      <div className="mt-4 flex flex-wrap gap-2 border-t border-obsidian-border pt-3">
        <button type="button" className={actionBtn} disabled={busy} onClick={onView}>
          View
        </button>
        {item.paymentStatus === 'PENDING' && (
          <>
            <button
              type="button"
              className={actionBtnPrimary}
              disabled={busy}
              onClick={onApprove}
            >
              {busy ? <span className={spinner} /> : 'Approve'}
            </button>
            <button type="button" className={actionBtn} disabled={busy} onClick={onReject}>
              {busy ? <span className={spinner} /> : 'Reject'}
            </button>
          </>
        )}
        {subscriptionCanRenew(item) && (
          <button
            type="button"
            className={actionBtnPrimary}
            disabled={busy}
            onClick={onApprove}
          >
            {busy ? <span className={spinner} /> : 'Renew'}
          </button>
        )}
        {!item.isLocked && subscriptionIsActiveApproved(item) && (
          <button type="button" className={actionBtn} disabled={busy} onClick={onLock}>
            {busy ? <span className={spinner} /> : 'Lock'}
          </button>
        )}
        {item.isLocked && subscriptionIsActiveApproved(item) && (
          <button type="button" className={actionBtn} disabled={busy} onClick={onUnlock}>
            {busy ? <span className={spinner} /> : 'Unlock'}
          </button>
        )}
        <button type="button" className={actionBtnDanger} disabled={busy} onClick={onDelete}>
          {busy ? <span className={spinner} /> : 'Delete'}
        </button>
      </div>
    </article>
  )
}

export function SubscriptionsList({
  refreshNonce = 0,
  onLoadingChange,
  onUnauthorized,
  onSignOut,
}: {
  refreshNonce?: number
  onLoadingChange?: (loading: boolean) => void
  onUnauthorized: () => void
  onSignOut: () => void
}) {
  const [items, setItems] = useState<SubscriptionListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<SubscriptionFilter>('all')
  const [actionId, setActionId] = useState<string | null>(null)
  const [approving, setApproving] = useState<SubscriptionListItem | null>(null)
  const [viewing, setViewing] = useState<SubscriptionListItem | null>(null)

  const onUnauthorizedRef = useRef(onUnauthorized)
  const onLoadingChangeRef = useRef(onLoadingChange)
  onUnauthorizedRef.current = onUnauthorized
  onLoadingChangeRef.current = onLoadingChange

  const load = useCallback(async (opts?: { silent?: boolean }) => {
    const silent = opts?.silent ?? false
    if (!silent) {
      setLoading(true)
      onLoadingChangeRef.current?.(true)
    }
    if (!silent) setError(null)
    try {
      const result = await fetchAmanatSubscriptions()
      if (!result.ok) {
        if (result.unauthorized) onUnauthorizedRef.current()
        setItems([])
        setError(result.error)
        return
      }
      setItems(result.data)
    } finally {
      if (!silent) {
        setLoading(false)
        onLoadingChangeRef.current?.(false)
      }
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load, refreshNonce])

  const filtered = useMemo(() => filterSubscriptions(items, filter), [items, filter])

  const runAction = useCallback(
    async (id: string, fn: () => ReturnType<typeof approveAmanatSubscription>): Promise<boolean> => {
      setActionId(id)
      setError(null)
      try {
        const result = await fn()
        if (!result.ok) {
          if (result.unauthorized) onUnauthorizedRef.current()
          else setError(result.error)
          return false
        }
        await load({ silent: true })
        return true
      } finally {
        setActionId(null)
      }
    },
    [load],
  )

  function handleReject(item: SubscriptionListItem) {
    if (!window.confirm(`Reject subscription for "${item.accountName}"?`)) return
    void runAction(item.id, () => rejectAmanatSubscription(item.id))
  }

  function handleLock(item: SubscriptionListItem) {
    if (
      !window.confirm(
        `Lock "${item.accountName}"? The user will not be able to sign in.`,
      )
    ) {
      return
    }
    void runAction(item.id, () => suspendAmanatAccount(item.id))
  }

  function handleUnlock(item: SubscriptionListItem) {
    void runAction(item.id, () => unlockAmanatAccount(item.id))
  }

  function handleDelete(item: SubscriptionListItem) {
    const msg = subscriptionIsActiveApproved(item)
        ? `Permanently delete active account "${item.accountName}" and all related data (agents, listings, teams)? This cannot be undone.`
        : `Permanently delete "${item.accountName}" and all related data? This cannot be undone.`
    if (!window.confirm(msg)) return
    void runAction(item.id, () => deleteAmanatAccount(item.id))
  }

  return (
    <>
      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="text-sm text-on-surface-variant">
          Account subscriptions across the Amanat platform
        </p>
        <button type="button" className={cn(m3BtnText, 'h-10 shrink-0 px-3')} onClick={onSignOut}>
          Sign out
        </button>
      </div>

      <div className="mb-5 flex flex-wrap gap-2">
        {FILTER_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={cn(
              'rounded-xl px-3 py-1.5 text-xs font-bold uppercase tracking-wide transition-colors',
              filter === tab.id
                ? 'bg-primary text-primary-on'
                : 'bg-slate-900/[0.06] text-label-3 hover:text-label',
            )}
            onClick={() => setFilter(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {error && (
        <div className={cn(alertBox, 'mb-4 rounded-2xl')}>
          <span className="shrink-0 text-red-600">{Ico.exclamation}</span>
          <span>{error}</span>
        </div>
      )}

      <section className={bentoCard}>
        <div className="mb-5 flex items-center justify-between">
          <h2 className={cn(bentoTitle, 'mb-0')}>Subscriptions</h2>
          <span className="text-xs font-bold text-on-surface-variant">
            {filtered.length} shown
          </span>
        </div>

        {loading ? (
          <div className={emptyState}>
            <span className={cn(spinner, 'h-8 w-8')} />
          </div>
        ) : filtered.length > 0 ? (
          <div>
            {filtered.map((item) => (
              <SubscriptionCard
                key={item.id}
                item={item}
                busy={actionId === item.id}
                onView={() => setViewing(item)}
                onApprove={() => setApproving(item)}
                onReject={() => handleReject(item)}
                onLock={() => handleLock(item)}
                onUnlock={() => handleUnlock(item)}
                onDelete={() => handleDelete(item)}
              />
            ))}
          </div>
        ) : (
          <div className={emptyState}>
            {Ico.empty}
            <p className="text-base font-bold text-label-2">No subscriptions</p>
            <p className="max-w-[280px] text-center text-sm leading-relaxed">
              Nothing matches this filter yet.
            </p>
          </div>
        )}
      </section>

      <button
        type="button"
        className={cn(m3BtnOutline, 'mb-6 min-h-12 w-full')}
        onClick={() => void load()}
        disabled={loading}
      >
        Refresh list
      </button>

      {viewing && (
        <AccountDetailSheet
          subscriptionId={viewing.id}
          accountName={viewing.accountName}
          onClose={() => setViewing(null)}
          onUnauthorized={onUnauthorized}
        />
      )}

      {approving && (
        <ApproveModal
          subscription={approving}
          onClose={() => setApproving(null)}
          onApprove={async (startsAt, endsAt) => {
            const ok = await runAction(approving.id, () =>
              approveAmanatSubscription(approving.id, startsAt, endsAt),
            )
            if (ok) setApproving(null)
            return ok
          }}
        />
      )}
    </>
  )
}
