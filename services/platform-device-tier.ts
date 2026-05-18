import { addMonths } from 'date-fns'
import type { PlatformLicenseTier } from '../shared/types/platform-devices.js'

const TIERS: ReadonlySet<string> = new Set(['5d', '15d', '1m', '2m', 'lifetime', 'custom'])

export const CUSTOM_VALID_FOR_MS_MIN = 1_000
export const CUSTOM_VALID_FOR_MS_MAX = Math.floor(10 * 365.25 * 24 * 60 * 60 * 1000)

export function clampCustomValidForMs(n: number): number {
  return Math.min(CUSTOM_VALID_FOR_MS_MAX, Math.max(CUSTOM_VALID_FOR_MS_MIN, Math.round(n)))
}

export function assertTier(x: string): asserts x is PlatformLicenseTier {
  if (!TIERS.has(x)) throw new Error('INVALID_TIER')
}

export function computeExpiryFromTier(issuedAtMs: number, tier: PlatformLicenseTier): number | null {
  if (tier === 'lifetime') return null
  if (tier === 'custom') return null
  if (tier === '5d') return issuedAtMs + 5 * 86400000
  if (tier === '15d') return issuedAtMs + 15 * 86400000
  if (tier === '1m') return addMonths(new Date(issuedAtMs), 1).getTime()
  if (tier === '2m') return addMonths(new Date(issuedAtMs), 2).getTime()
  return null
}
