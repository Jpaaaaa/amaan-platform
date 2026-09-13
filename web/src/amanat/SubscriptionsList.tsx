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
import { AccentTile, type MetricTone } from '../components/ui/DeckPrimitives'
import { DataTable, type DataTableColumn } from '../components/ui/DataTable'
import { FilterBar } from '../components/ui/FilterBar'
import { SearchField } from '../components/ui/SearchField'
import {
  alertBox,
  cn,
  emptyState,
  m3BtnOutline,
  m3BtnPrimary,
  m3BtnText,
  spinner,
} from '../lib/ui'
import { ApproveModal } from './ApproveModal'
import { AccountDetailSheet } from './AccountDetailSheet'
import { asAmanatFilter, type WorkspaceIntent } from '../lib/workspace-intent'
import {
  filterSubscriptions,
  formatSubscriptionDate,
  subscriptionCanRenew,
  subscriptionIsActiveApproved,
  subscriptionIsExpired,
  subscriptionStatusBadgeClass,
  subscriptionStatusLabel,
  type SubscriptionFilter,
} from './subscription-status'

const FILTER_TABS: { key: SubscriptionFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'expiring', label: 'Expiring' },
  { key: 'expired', label: 'Expired' },
]

const actionBtn = cn(m3BtnOutline, 'h-9 min-h-0 px-3 text-xs font-bold')
const actionBtnPrimary = cn(m3BtnPrimary, 'h-9 min-h-0 px-3 text-xs font-bold')
const actionBtnDanger = cn(
  actionBtn,
  'border-red-300 text-red-600 hover:border-red-400 hover:bg-red-50',
)

function subscriptionTone(item: SubscriptionListItem): MetricTone {
  if (subscriptionIsExpired(item)) return 'danger'
  if (item.paymentStatus === 'PENDING') return 'brand'
  if (item.expiringSoon) return 'warning'
  if (item.paymentStatus === 'APPROVED') return 'success'
  return 'neutral'
}

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
    <article className="mb-3 rounded-card border border-obsidian-border bg-surface p-4 px-5 shadow-premium">
      <div className="mb-2 flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <AccentTile tone={subscriptionTone(item)}>
            {item.accountName.slice(0, 1).toUpperCase()}
          </AccentTile>
          <div className="min-w-0">
            <h3 className="truncate text-base font-bold text-label">{item.accountName}</h3>
            <p className="text-xs capitalize text-on-surface-variant">
              {item.accountType}
              {item.isLocked ? ' · locked' : ''}
            </p>
          </div>
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
  intent,
  onLoadingChange,
  onUnauthorized,
  onSignOut,
}: {
  refreshNonce?: number
  intent?: WorkspaceIntent | null
  onLoadingChange?: (loading: boolean) => void
  onUnauthorized: () => void
  onSignOut: () => void
}) {
  const [items, setItems] = useState<SubscriptionListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<SubscriptionFilter>(() => asAmanatFilter(intent?.filter) ?? 'all')
  const [searchQuery, setSearchQuery] = useState('')
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

  useEffect(() => {
    if (!intent) return
    const next = asAmanatFilter(intent.filter)
    if (next) setFilter(next)
  }, [intent])

  const filtered = useMemo(() => {
    const q = searchQuery.toLowerCase().trim()
    return filterSubscriptions(items, filter).filter((item) => {
      if (!q) return true
      return (
        item.accountName.toLowerCase().includes(q) ||
        item.accountType.toLowerCase().includes(q) ||
        item.tier.toLowerCase().includes(q)
      )
    })
  }, [items, filter, searchQuery])

  const filterCounts = useMemo(() => {
    return {
      all: items.length,
      pending: filterSubscriptions(items, 'pending').length,
      expiring: filterSubscriptions(items, 'expiring').length,
      expired: filterSubscriptions(items, 'expired').length,
    } satisfies Record<SubscriptionFilter, number>
  }, [items])

  const columns: DataTableColumn<SubscriptionListItem>[] = [
    {
      key: 'account',
      header: 'Account',
      render: (item) => (
        <span className="flex min-w-0 items-center gap-2.5">
          <AccentTile size="sm" tone={subscriptionTone(item)}>
            {item.accountName.slice(0, 1).toUpperCase()}
          </AccentTile>
          <span className="truncate font-semibold">{item.accountName}</span>
        </span>
      ),
    },
    {
      key: 'type',
      header: 'Type',
      render: (item) => <span className="capitalize">{item.accountType}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      render: (item) => (
        <span className={subscriptionStatusBadgeClass(item)}>{subscriptionStatusLabel(item)}</span>
      ),
    },
    {
      key: 'tier',
      header: 'Tier',
      render: (item) => <span className="capitalize">{item.tier.toLowerCase()}</span>,
    },
    {
      key: 'agents',
      header: 'Agents',
      render: (item) =>
        item.accountType === 'individual' ? '—' : `${item.agentsCount} / ${item.maxAgents}`,
    },
    {
      key: 'starts',
      header: 'Starts',
      render: (item) => formatSubscriptionDate(item.startsAt),
    },
    {
      key: 'ends',
      header: 'Ends',
      render: (item) => formatSubscriptionDate(item.endsAt),
    },
  ]

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
      <div className="mb-3 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0 flex-1 lg:max-w-md">
          <SearchField
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search account"
          />
        </div>
        <button type="button" className={cn(m3BtnText, 'h-10 shrink-0 px-3')} onClick={onSignOut}>
          Sign out
        </button>
      </div>

      <div className="mb-4">
        <FilterBar
          value={filter}
          onChange={setFilter}
          options={FILTER_TABS.map((tab) => ({
            ...tab,
            count: filterCounts[tab.key],
          }))}
        />
      </div>

      {error && (
        <div className={cn(alertBox, 'mb-4 rounded-2xl')}>
          <span className="shrink-0 text-red-600">{Ico.exclamation}</span>
          <span>{error}</span>
        </div>
      )}

      <div className="lg:hidden">
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
      </div>

      <div className="hidden lg:block">
        <DataTable
          columns={columns}
          rows={filtered}
          rowKey={(item) => item.id}
          onRowClick={(item) => setViewing(item)}
          loading={loading}
          emptyTitle="No subscriptions"
          emptyBody="Nothing matches this filter yet."
        />
      </div>

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
