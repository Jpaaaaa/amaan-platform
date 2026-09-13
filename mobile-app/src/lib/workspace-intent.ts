import type { DeviceHealth } from '../utils/deviceDisplay'
import type { SubscriptionFilter } from './subscription-status'

export type WorkspaceIntent = {
  filter?: DeviceHealth | SubscriptionFilter
  inbox?: boolean
  create?: boolean
}

const LICENSE_FILTERS = new Set<string>([
  'all',
  'revoked',
  'expired',
  'expiring',
  'sync',
  'active',
  'unknown',
])

const AMANAT_FILTERS = new Set<SubscriptionFilter>(['all', 'pending', 'expiring', 'expired'])

export function asLicenseFilter(
  filter: WorkspaceIntent['filter'],
): 'all' | DeviceHealth | undefined {
  if (filter && LICENSE_FILTERS.has(filter) && filter !== 'pending') {
    return filter as 'all' | DeviceHealth
  }
  return undefined
}

export function asAmanatFilter(filter: WorkspaceIntent['filter']): SubscriptionFilter | undefined {
  if (filter && AMANAT_FILTERS.has(filter as SubscriptionFilter)) {
    return filter as SubscriptionFilter
  }
  return undefined
}
