import type { PaymentStatus, SubscriptionListItem } from '../api/amanat'
import { cn } from '../lib/ui'

export type SubscriptionFilter = 'all' | 'pending' | 'expiring' | 'expired'

type BadgeTone = 'green' | 'amber' | 'red' | 'gray'

type SubscriptionTiming = Pick<SubscriptionListItem, 'paymentStatus' | 'endsAt'>

/** Matches login denial: EXPIRED status or APPROVED with endsAt in the past. */
export function subscriptionIsExpired(item: SubscriptionTiming): boolean {
  if (item.paymentStatus === 'EXPIRED') return true
  if (item.paymentStatus !== 'APPROVED' || !item.endsAt) return false
  return new Date(item.endsAt) < new Date()
}

export function subscriptionIsActiveApproved(item: SubscriptionTiming): boolean {
  return item.paymentStatus === 'APPROVED' && !subscriptionIsExpired(item)
}

export function subscriptionCanRenew(item: SubscriptionTiming): boolean {
  return subscriptionIsExpired(item)
}

function resolveTone(item: SubscriptionListItem): BadgeTone {
  if (subscriptionIsExpired(item)) return 'red'
  if (item.paymentStatus === 'PENDING' || item.paymentStatus === 'REJECTED') return 'gray'
  if (item.expiringSoon) return 'amber'
  if (item.paymentStatus === 'APPROVED') return 'green'
  return 'gray'
}

const toneClasses: Record<BadgeTone, string> = {
  green: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-600',
  amber: 'border-amber-500/20 bg-amber-500/10 text-amber-700',
  red: 'border-red-500/20 bg-red-500/10 text-red-600',
  gray: 'border-slate-900/10 bg-slate-900/[0.06] text-label-3',
}

function statusLabel(item: SubscriptionListItem): string {
  if (item.paymentStatus === 'REJECTED') return 'Rejected'
  if (item.paymentStatus === 'PENDING') return 'Pending'
  if (subscriptionIsExpired(item)) return 'Expired'
  if (item.expiringSoon) return 'Expiring soon'
  return 'Approved'
}

export function subscriptionStatusBadgeClass(item: SubscriptionListItem): string {
  return cn(
    'inline-flex items-center rounded-full border px-2.5 py-1 text-[0.625rem] font-extrabold uppercase tracking-wider',
    toneClasses[resolveTone(item)],
  )
}

export function subscriptionStatusLabel(item: SubscriptionListItem): string {
  return statusLabel(item)
}

export function filterSubscriptions(
  items: SubscriptionListItem[],
  filter: SubscriptionFilter,
): SubscriptionListItem[] {
  switch (filter) {
    case 'pending':
      return items.filter((item) => item.paymentStatus === 'PENDING')
    case 'expired':
      return items.filter((item) => subscriptionIsExpired(item))
    case 'expiring':
      return items.filter((item) => item.expiringSoon && !subscriptionIsExpired(item))
    default:
      return items
  }
}

export function formatSubscriptionDate(value: string | null): string {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export type { PaymentStatus }
