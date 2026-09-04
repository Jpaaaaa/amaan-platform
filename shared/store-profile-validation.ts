import type { PlatformKpisIqd, PlatformKpiWindow, PlatformStoreSnapshot } from './types/platform-activation.js'

export const MACHINE_ID_RE = /^[0-9a-f]{40}$/

export const STORE_FIELD_MAX = {
  storeName: 120,
  phone: 40,
  addressLine: 200,
  city: 80,
  ownerContactName: 120,
  storeTypeOther: 80,
} as const

export const STORE_TYPES = [
  'supermarket',
  'electronics',
  'general',
  'pharmacy',
  'cosmetics',
  'other',
] as const

function truncateOptional(value: unknown, max: number): string | null {
  if (value == null) return null
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  if (!trimmed) return null
  return trimmed.length > max ? trimmed.slice(0, max) : trimmed
}

function parseKpiWindow(value: unknown): PlatformKpiWindow | null {
  if (value == null || typeof value !== 'object') return null
  const o = value as Record<string, unknown>
  const revenueCents = o.revenueCents
  const grossProfitCents = o.grossProfitCents
  const saleCount = o.saleCount
  if (typeof revenueCents !== 'number' || !Number.isFinite(revenueCents) || revenueCents < 0) {
    return null
  }
  if (typeof grossProfitCents !== 'number' || !Number.isFinite(grossProfitCents) || grossProfitCents < 0) {
    return null
  }
  if (typeof saleCount !== 'number' || !Number.isFinite(saleCount) || saleCount < 0) {
    return null
  }
  return { revenueCents, grossProfitCents, saleCount }
}

export function parseStoreSnapshot(body: unknown): PlatformStoreSnapshot | null {
  if (body == null || typeof body !== 'object') return null
  const o = body as Record<string, unknown>
  const storeNameRaw = typeof o.storeName === 'string' ? o.storeName.trim() : ''
  if (!storeNameRaw) return null

  const storeName =
    storeNameRaw.length > STORE_FIELD_MAX.storeName
      ? storeNameRaw.slice(0, STORE_FIELD_MAX.storeName)
      : storeNameRaw

  let storeType: string | null = null
  if (typeof o.storeType === 'string') {
    const t = o.storeType.trim()
    if ((STORE_TYPES as readonly string[]).includes(t)) {
      storeType = t
    }
  }

  return {
    storeName,
    phone: truncateOptional(o.phone, STORE_FIELD_MAX.phone),
    addressLine: truncateOptional(o.addressLine, STORE_FIELD_MAX.addressLine),
    city: truncateOptional(o.city, STORE_FIELD_MAX.city),
    storeType,
    storeTypeOther: truncateOptional(o.storeTypeOther, STORE_FIELD_MAX.storeTypeOther),
    ownerContactName: truncateOptional(o.ownerContactName, STORE_FIELD_MAX.ownerContactName),
  }
}

export function parseKpisIqd(body: unknown): PlatformKpisIqd | null {
  if (body == null || typeof body !== 'object') return null
  const o = body as Record<string, unknown>
  const month = parseKpiWindow(o.month)
  const year = parseKpiWindow(o.year)
  if (!month || !year) return null
  return { month, year }
}
