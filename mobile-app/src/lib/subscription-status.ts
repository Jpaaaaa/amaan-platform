import type { SubscriptionListItem } from '../api/amanat'

export type SubscriptionFilter = 'all' | 'pending' | 'expiring' | 'expired'

export type StatusTone = 'success' | 'warning' | 'danger' | 'neutral' | 'brand'

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

export function subscriptionStatusLabel(item: SubscriptionListItem): string {
  if (item.paymentStatus === 'REJECTED') return 'Rejected'
  if (item.paymentStatus === 'PENDING') return 'Pending'
  if (subscriptionIsExpired(item)) return 'Expired'
  if (item.expiringSoon) return 'Expiring soon'
  return 'Approved'
}

export function subscriptionStatusTone(item: SubscriptionListItem): StatusTone {
  if (subscriptionIsExpired(item)) return 'danger'
  if (item.paymentStatus === 'PENDING') return 'brand'
  if (item.paymentStatus === 'REJECTED') return 'neutral'
  if (item.expiringSoon) return 'warning'
  if (item.paymentStatus === 'APPROVED') return 'success'
  return 'neutral'
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
