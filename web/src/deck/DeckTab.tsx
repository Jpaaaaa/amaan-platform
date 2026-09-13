import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { fetchAmanatSubscriptions, type SubscriptionListItem } from '../api/amanat'
import { fetchActivationRequests } from '../api/activation-requests'
import { fetchDevices } from '../api/platform'
import { AmanatLoginForm } from '../amanat/AmanatLoginForm'
import {
  filterSubscriptions,
  subscriptionIsExpired,
  subscriptionStatusLabel,
} from '../amanat/subscription-status'
import { Ico } from '../components/icons'
import {
  AccentTile,
  DeckPageGrid,
  MetricCard,
  type MetricTone,
} from '../components/ui/DeckPrimitives'
import { StatusChip } from '../components/ui/Overlay'
import { useWorkspace } from '../context/WorkspaceContext'
import { clearAmanatToken, isAmanatAuthenticated } from '../lib/amanat-auth'
import {
  deviceDisplayName,
  deviceHealth,
  healthLabel,
  healthTone,
} from '../lib/device-display'
import { isAmanatProduct } from '../lib/product-nav'
import { formatRelativeAge } from '../lib/request-utils'
import { alertBox, cn, emptyState, spinner } from '../lib/ui'
import type { WorkspaceIntent } from '../lib/workspace-intent'
import type { ActivationRequestRow, DeviceRow } from '../types/device'

type ActivityItem = {
  key: string
  title: string
  meta: string
  atMs: number
  tone: MetricTone
  intent: WorkspaceIntent
}

function amanatTone(item: SubscriptionListItem): MetricTone {
  if (subscriptionIsExpired(item)) return 'danger'
  if (item.paymentStatus === 'PENDING') return 'brand'
  if (item.expiringSoon) return 'warning'
  if (item.paymentStatus === 'APPROVED') return 'success'
  return 'neutral'
}

function amanatIntent(item: SubscriptionListItem): WorkspaceIntent {
  if (subscriptionIsExpired(item)) return { filter: 'expired' }
  if (item.paymentStatus === 'PENDING') return { filter: 'pending' }
  if (item.expiringSoon) return { filter: 'expiring' }
  return { filter: 'all' }
}

function createdAtMs(value: string): number {
  const ms = Date.parse(value)
  return Number.isFinite(ms) ? ms : 0
}

export function DeckTab({
  refreshNonce = 0,
  onLoadingChange,
  onUnauthorized,
  onOpenWorkspaces,
}: {
  refreshNonce?: number
  onLoadingChange?: (loading: boolean) => void
  onUnauthorized: () => void
  onOpenWorkspaces: (intent: WorkspaceIntent) => void
}) {
  const { product } = useWorkspace()
  const amanat = isAmanatProduct(product)

  const [amanatAuthed, setAmanatAuthed] = useState(() => isAmanatAuthenticated())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [devices, setDevices] = useState<DeviceRow[]>([])
  const [requests, setRequests] = useState<ActivationRequestRow[]>([])
  const [subscriptions, setSubscriptions] = useState<SubscriptionListItem[]>([])

  const productRef = useRef(product)
  const onUnauthorizedRef = useRef(onUnauthorized)
  const onLoadingChangeRef = useRef(onLoadingChange)
  productRef.current = product
  onUnauthorizedRef.current = onUnauthorized
  onLoadingChangeRef.current = onLoadingChange

  const load = useCallback(async () => {
    const forProduct = productRef.current
    setLoading(true)
    onLoadingChangeRef.current?.(true)
    setError(null)
    try {
      if (isAmanatProduct(forProduct)) {
        if (!isAmanatAuthenticated()) {
          setSubscriptions([])
          return
        }
        const result = await fetchAmanatSubscriptions()
        if (forProduct !== productRef.current) return
        if (!result.ok) {
          if (result.unauthorized) {
            clearAmanatToken()
            setAmanatAuthed(false)
          }
          setSubscriptions([])
          setError(result.error)
          return
        }
        setSubscriptions(result.data)
        return
      }

      const [d, r] = await Promise.all([
        fetchDevices(forProduct),
        fetchActivationRequests(forProduct, 'pending'),
      ])
      if (forProduct !== productRef.current) return
      if (!d.ok) {
        if (d.unauthorized) onUnauthorizedRef.current()
        setDevices([])
        setRequests([])
        setError(d.error)
        return
      }
      if (!r.ok) {
        if (r.unauthorized) onUnauthorizedRef.current()
        setDevices(d.devices)
        setRequests([])
        setError(r.error)
        return
      }
      setDevices(d.devices)
      setRequests(r.requests)
    } catch (e) {
      if (forProduct !== productRef.current) return
      setError(e instanceof Error ? e.message : String(e))
      setDevices([])
      setRequests([])
      setSubscriptions([])
    } finally {
      if (forProduct === productRef.current) {
        setLoading(false)
        onLoadingChangeRef.current?.(false)
      }
    }
  }, [])

  useEffect(() => {
    setDevices([])
    setRequests([])
    setSubscriptions([])
    if (isAmanatProduct(product)) {
      setAmanatAuthed(isAmanatAuthenticated())
    }
    void load()
  }, [load, product, refreshNonce, amanatAuthed])

  const licenseCounts = useMemo(() => {
    let expiring = 0
    let expired = 0
    for (const d of devices) {
      const health = deviceHealth(d)
      if (health === 'expiring') expiring += 1
      if (health === 'expired') expired += 1
    }
    return {
      devices: devices.length,
      pending: requests.length,
      expiring,
      expired,
    }
  }, [devices, requests])

  const amanatCounts = useMemo(
    () => ({
      subscriptions: subscriptions.length,
      pending: filterSubscriptions(subscriptions, 'pending').length,
      expiring: filterSubscriptions(subscriptions, 'expiring').length,
      expired: filterSubscriptions(subscriptions, 'expired').length,
    }),
    [subscriptions],
  )

  const activity = useMemo(() => {
    const items: ActivityItem[] = []
    if (amanat) {
      for (const item of subscriptions) {
        items.push({
          key: item.id,
          title: item.accountName,
          meta: subscriptionStatusLabel(item),
          atMs: createdAtMs(item.createdAt),
          tone: amanatTone(item),
          intent: amanatIntent(item),
        })
      }
    } else {
      for (const row of requests) {
        items.push({
          key: `req-${row.machineId}`,
          title: row.store.storeName?.trim() || 'Unnamed store',
          meta: row.store.city?.trim() || 'Activation request',
          atMs: row.updatedAtMs,
          tone: 'brand',
          intent: { inbox: true },
        })
      }
      for (const d of devices) {
        const health = deviceHealth(d)
        items.push({
          key: `dev-${d.machineId}`,
          title: deviceDisplayName(d),
          meta: healthLabel(health),
          atMs: Math.max(d.updatedAtMs, d.lastSyncAtMs ?? 0, d.createdAtMs),
          tone: healthTone(health),
          intent: { filter: 'all' },
        })
      }
    }
    return items.sort((a, b) => b.atMs - a.atMs).slice(0, 8)
  }, [amanat, subscriptions, requests, devices])

  if (amanat && !amanatAuthed) {
    return <AmanatLoginForm onLoggedIn={() => setAmanatAuthed(true)} />
  }

  const metrics = amanat
    ? [
        {
          key: 'subscriptions',
          kicker: 'Subscriptions',
          value: amanatCounts.subscriptions,
          caption: 'Accounts in this workspace',
          tone: 'brand' as const,
          icon: Ico.subscriptions,
          intent: { filter: 'all' as const },
        },
        {
          key: 'pending',
          kicker: 'Pending',
          value: amanatCounts.pending,
          caption: 'Awaiting approval',
          tone: 'peach' as const,
          icon: Ico.requests,
          intent: { filter: 'pending' as const },
        },
        {
          key: 'expiring',
          kicker: 'Expiring',
          value: amanatCounts.expiring,
          caption: 'Ending soon',
          tone: 'warning' as const,
          icon: Ico.amanat,
          intent: { filter: 'expiring' as const },
        },
        {
          key: 'expired',
          kicker: 'Expired',
          value: amanatCounts.expired,
          caption: 'Subscriptions ended',
          tone: 'danger' as const,
          icon: Ico.lock,
          intent: { filter: 'expired' as const },
        },
      ]
    : [
        {
          key: 'devices',
          kicker: 'Devices',
          value: licenseCounts.devices,
          caption: 'Registered devices',
          tone: 'brand' as const,
          icon: Ico.devices,
          intent: { filter: 'all' as const },
        },
        {
          key: 'pending',
          kicker: 'Pending',
          value: licenseCounts.pending,
          caption: 'Pending activations',
          tone: 'peach' as const,
          icon: Ico.requests,
          intent: { inbox: true },
        },
        {
          key: 'expiring',
          kicker: 'Expiring',
          value: licenseCounts.expiring,
          caption: 'Ending this week',
          tone: 'warning' as const,
          icon: Ico.releases,
          intent: { filter: 'expiring' as const },
        },
        {
          key: 'expired',
          kicker: 'Expired',
          value: licenseCounts.expired,
          caption: 'Licenses ended',
          tone: 'danger' as const,
          icon: Ico.lock,
          intent: { filter: 'expired' as const },
        },
      ]

  const shortcuts = amanat
    ? [
        { key: 'list', label: 'Workspaces', icon: Ico.workspaces, intent: { filter: 'all' as const } },
        { key: 'pending', label: 'Pending', icon: Ico.requests, intent: { filter: 'pending' as const } },
        { key: 'expiring', label: 'Expiring', icon: Ico.amanat, intent: { filter: 'expiring' as const } },
      ]
    : [
        { key: 'list', label: 'Workspaces', icon: Ico.workspaces, intent: { filter: 'all' as const } },
        { key: 'inbox', label: 'Requests', icon: Ico.requests, intent: { inbox: true } },
        { key: 'create', label: 'Activate device', icon: Ico.plus, intent: { create: true } },
      ]

  return (
    <DeckPageGrid
      metrics={metrics.map((m) => (
        <MetricCard
          key={m.key}
          kicker={m.kicker}
          value={loading ? '—' : m.value}
          caption={m.caption}
          tone={m.tone}
          icon={m.icon}
          onClick={() => onOpenWorkspaces(m.intent)}
        />
      ))}
      table={
        <section className="rounded-card border border-obsidian-border bg-surface p-4 shadow-premium">
          <header className="mb-3 flex items-center justify-between gap-3">
            <h2 className="text-sm font-semibold text-label">Recent activity</h2>
            {activity.length > 0 ? (
              <button
                type="button"
                className="cursor-pointer border-0 bg-transparent text-xs font-semibold text-brand"
                onClick={() => onOpenWorkspaces({ filter: 'all' })}
              >
                See all
              </button>
            ) : null}
          </header>
          {error ? (
            <div className={cn(alertBox, 'mb-0')} role="alert">
              <span className="shrink-0 text-red-600">{Ico.exclamation}</span>
              <span>{error}</span>
            </div>
          ) : null}
          {loading && activity.length === 0 ? (
            <div className={cn(emptyState, 'shadow-none')}>
              <span className={cn(spinner, 'h-8 w-8')} />
            </div>
          ) : activity.length === 0 ? (
            <div className={cn(emptyState, 'shadow-none')}>
              {Ico.empty}
              <p className="text-base font-bold text-label-2">Nothing recent</p>
              <p className="max-w-[280px] text-center text-sm leading-relaxed">
                Nothing recent in this workspace.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-obsidian-border">
              {activity.map((item) => (
                <li key={item.key}>
                  <button
                    type="button"
                    className="flex w-full cursor-pointer items-center gap-3 border-0 bg-transparent py-2.5 text-left hover:bg-surface-muted"
                    onClick={() => onOpenWorkspaces(item.intent)}
                  >
                    <AccentTile size="sm" tone={item.tone}>
                      {item.title.slice(0, 1).toUpperCase()}
                    </AccentTile>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-label">{item.title}</span>
                      <span className="block truncate text-xs text-label-2">{item.meta}</span>
                    </span>
                    <StatusChip label={formatRelativeAge(item.atMs)} tone={item.tone === 'peach' ? 'brand' : item.tone} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      }
      side={
        <section className="rounded-card border border-obsidian-border bg-surface p-4 shadow-premium">
          <h2 className="mb-3 text-sm font-semibold text-label">Shortcuts</h2>
          <div className="flex flex-col gap-1.5">
            {shortcuts.map((item) => (
              <button
                key={item.key}
                type="button"
                className="flex w-full cursor-pointer items-center gap-3 rounded-2xl border-0 bg-transparent p-2 text-left hover:bg-surface-muted"
                onClick={() => onOpenWorkspaces(item.intent)}
              >
                <AccentTile tone="brand">{item.icon}</AccentTile>
                <span className="text-sm font-semibold text-label">{item.label}</span>
              </button>
            ))}
          </div>
        </section>
      }
    />
  )
}
