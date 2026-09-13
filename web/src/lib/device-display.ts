import type { DeviceRow } from '../types/device'
import { formatRelativeAge } from './request-utils'

export type DeviceHealth =
  | 'revoked'
  | 'expired'
  | 'expiring'
  | 'sync'
  | 'active'
  | 'unknown'

const WEEK_MS = 7 * 86_400_000

export const DEVICE_TIER_LABELS: Record<string, string> = {
  '5d': '5 days',
  '15d': '15 days',
  '1m': '1 month',
  '2m': '2 months',
  lifetime: 'Lifetime',
  custom: 'Custom',
}

export function deviceDisplayName(device: DeviceRow): string {
  return device.label?.trim()
    ? device.label
    : device.storeName?.trim()
      ? device.storeName
      : 'Unnamed device'
}

export function deviceHealth(device: DeviceRow): DeviceHealth {
  if (device.revoked) return 'revoked'
  const s = (device.computedStatus ?? '').toLowerCase()
  if (s.includes('revok')) return 'revoked'
  if (s.includes('expir')) return 'expired'
  if (s.includes('sync')) return 'sync'
  if (device.expiresAtMs != null) {
    const remaining = device.expiresAtMs - Date.now()
    if (remaining <= 0) return 'expired'
    if (remaining <= WEEK_MS) return 'expiring'
  }
  if (s.includes('active') || s.includes('lifetime') || s.includes('ok')) return 'active'
  return 'unknown'
}

export function healthLabel(health: DeviceHealth): string {
  switch (health) {
    case 'revoked':
      return 'Revoked'
    case 'expired':
      return 'Expired'
    case 'expiring':
      return 'Expiring'
    case 'sync':
      return 'Needs sync'
    case 'active':
      return 'Active'
    default:
      return 'Unknown'
  }
}

export function healthTone(health: DeviceHealth): 'success' | 'warning' | 'danger' | 'neutral' {
  switch (health) {
    case 'active':
      return 'success'
    case 'expiring':
    case 'sync':
      return 'warning'
    case 'expired':
    case 'revoked':
      return 'danger'
    default:
      return 'neutral'
  }
}

export function tierLabel(tier: string): string {
  return DEVICE_TIER_LABELS[tier] ?? tier
}

export function lastSyncLine(device: DeviceRow): string {
  if (device.lastSyncAtMs == null) return 'Never synced'
  return formatRelativeAge(device.lastSyncAtMs)
}
