import {
  PLATFORM_PRODUCT_AMANAT,
  PLATFORM_PRODUCT_BAZAR,
  PLATFORM_PRODUCT_SUFRA,
  type PlatformProductKey,
} from '@shared/platform-product'

export type ProductMeta = {
  key: PlatformProductKey
  label: string
  short: string
  accent: string
  blurb: string
}

export const PRODUCT_META: Record<PlatformProductKey, ProductMeta> = {
  [PLATFORM_PRODUCT_BAZAR]: {
    key: PLATFORM_PRODUCT_BAZAR,
    label: 'Bazar One',
    short: 'Bazar',
    accent: '#4F46E5',
    blurb: 'Point of sale · retail',
  },
  [PLATFORM_PRODUCT_SUFRA]: {
    key: PLATFORM_PRODUCT_SUFRA,
    label: 'Sufra POS',
    short: 'Sufra',
    accent: '#0F766E',
    blurb: 'Restaurants and hospitality',
  },
  [PLATFORM_PRODUCT_AMANAT]: {
    key: PLATFORM_PRODUCT_AMANAT,
    label: 'Amanat',
    short: 'Amanat',
    accent: '#7C3AED',
    blurb: 'Real estate subscriptions',
  },
}

export const PRODUCT_OPTIONS: ProductMeta[] = [
  PRODUCT_META[PLATFORM_PRODUCT_BAZAR],
  PRODUCT_META[PLATFORM_PRODUCT_SUFRA],
  PRODUCT_META[PLATFORM_PRODUCT_AMANAT],
]
