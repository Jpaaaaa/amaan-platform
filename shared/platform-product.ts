export const PLATFORM_PRODUCT_BAZAR = 'bazar_one' as const
export const PLATFORM_PRODUCT_SUFRA = 'sufra_lite' as const

export const PLATFORM_PRODUCT_KEYS = [PLATFORM_PRODUCT_BAZAR, PLATFORM_PRODUCT_SUFRA] as const

export type PlatformProductKey = (typeof PLATFORM_PRODUCT_KEYS)[number]

const KEY_SET = new Set<string>(PLATFORM_PRODUCT_KEYS)

/** Ping + admin default when omitted (legacy Bazar-only DB rows). */
export const PLATFORM_PRODUCT_DEFAULT: PlatformProductKey = PLATFORM_PRODUCT_BAZAR

export function isPlatformProductKey(s: string): s is PlatformProductKey {
  return KEY_SET.has(s)
}

export function parsePlatformProductKey(raw: string | undefined | null): PlatformProductKey {
  const t = typeof raw === 'string' ? raw.trim() : ''
  if (t && isPlatformProductKey(t)) return t
  return PLATFORM_PRODUCT_DEFAULT
}
