import type { DeviceRow } from '../types'
import { DEVICE_TIER_LABELS } from '../constants/devices'
import { formatRelativeAge } from './requestDisplay'

export type DeviceHealth =
  | 'revoked'
  | 'expired'
  | 'expiring'
  | 'sync'
  | 'active'
  | 'unknown'

const WEEK_MS = 7 * 86_400_000

export function fmtDeviceDate(ms: number | null): string {
  if (ms == null) return '—'
  return new Date(ms).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export function deviceDisplayName(device: DeviceRow): string {
  return device.label?.trim() ? device.label : 'Unnamed device'
}

export function statusLabel(status: string, revoked: boolean): string {
  if (revoked) return 'Revoked'
  const s = status.toLowerCase()
  if (s.includes('lifetime')) return 'Lifetime'
  if (s.includes('active') || s.includes('ok')) return 'Active'
  if (s.includes('expir')) return 'Expired'
  if (s.includes('sync')) return 'Sync required'
  if (s.includes('unknown')) return 'Unknown'
  return status.replace(/_/g, ' ')
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

export function tierLabel(tier: string): string {
  return DEVICE_TIER_LABELS[tier] ?? tier
}

export function deviceMetaLine(device: DeviceRow): string {
  const parts = [tierLabel(device.tier)]
  if (device.revoked) {
    return parts.join(' · ')
  }
  if (device.tier === 'lifetime') {
    parts.push('no expiry')
  } else if (device.expiresAtMs != null) {
    const remaining = device.expiresAtMs - Date.now()
    if (remaining <= 0) parts.push(`expired ${fmtDeviceDate(device.expiresAtMs)}`)
    else parts.push(`expires ${fmtDeviceDate(device.expiresAtMs)}`)
  }
  return parts.join(' · ')
}

export function lastSyncLine(device: DeviceRow): string {
  if (device.lastSyncAtMs == null) return 'Never synced'
  return `Last sync ${formatRelativeAge(device.lastSyncAtMs)}`
}
