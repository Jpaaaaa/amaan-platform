import type { PlatformProductKey } from '../platform-product.js'

/** What the ping tells the app. Matches bazar-one/shared/types/platform-devices.ts. */
export type PlatformActivationStatus = 'none' | 'pending' | 'declined'

/** Internal row state; 'approved' is history only and never leaves the server. */
export type ActivationRequestState = 'pending' | 'declined' | 'approved'

export type PlatformStoreSnapshot = {
  storeName: string
  phone: string | null
  addressLine: string | null
  city: string | null
  storeType: string | null
  storeTypeOther: string | null
  ownerContactName: string | null
}

export type PlatformKpiWindow = {
  revenueCents: number
  grossProfitCents: number
  saleCount: number
}

export type PlatformKpisIqd = {
  month: PlatformKpiWindow
  year: PlatformKpiWindow
}

export type PlatformActivationRequestRow = {
  productKey: PlatformProductKey
  machineId: string
  status: ActivationRequestState
  store: PlatformStoreSnapshot
  requestIp: string | null
  createdAtMs: number
  updatedAtMs: number
  decidedAtMs: number | null
  declineReason: string | null
}
