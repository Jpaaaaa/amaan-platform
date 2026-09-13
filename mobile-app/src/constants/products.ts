import {
  PLATFORM_PRODUCT_BAZAR,
  PLATFORM_PRODUCT_SUFRA,
  type PlatformProductKey,
} from '../types'

export type ProductMeta = {
  key: PlatformProductKey
  label: string
  short: string
  icon: string
  accent: string
  blurb: string
}

export const PRODUCT_META: Record<PlatformProductKey, ProductMeta> = {
  [PLATFORM_PRODUCT_BAZAR]: {
    key: PLATFORM_PRODUCT_BAZAR,
    label: 'Bazar One',
    short: 'Bazar',
    icon: 'storefront',
    accent: '#4F46E5',
    blurb: 'Point of sale · retail',
  },
  [PLATFORM_PRODUCT_SUFRA]: {
    key: PLATFORM_PRODUCT_SUFRA,
    label: 'Sufra POS',
    short: 'Sufra',
    icon: 'restaurant',
    accent: '#0F766E',
    blurb: 'Restaurants and hospitality',
  },
}

export const PRODUCT_OPTIONS: ProductMeta[] = [
  PRODUCT_META[PLATFORM_PRODUCT_BAZAR],
  PRODUCT_META[PLATFORM_PRODUCT_SUFRA],
]
