export type SessionState = 'loading' | 'anon' | 'ok'

export type TabId = 'devices' | 'releases' | 'amanat' | 'settings' | 'requests'

export type CustomUnit = 'seconds' | 'minutes' | 'hours' | 'days'

export type StoreSnapshot = {
  storeName: string
  phone: string | null
  addressLine: string | null
  city: string | null
  storeType: string | null
  storeTypeOther: string | null
  ownerContactName: string | null
}

export type ActivationRequestRow = {
  productKey: string
  machineId: string
  status: 'pending' | 'declined' | 'approved'
  store: StoreSnapshot
  requestIp: string | null
  createdAtMs: number
  updatedAtMs: number
  decidedAtMs: number | null
  declineReason: string | null
}

export type DeviceRow = {
  machineId: string
  label: string | null
  tier: string
  expiresAtMs: number | null
  revoked: boolean
  lastSyncAtMs: number | null
  createdAtMs: number
  updatedAtMs: number
  notes: string | null
  rollingMaxMs: number | null
  effectiveRollingMaxMs?: number
  computedStatus: string
  rollingDeadlineMs: number
  storeName: string | null
  phone: string | null
  addressLine: string | null
  city: string | null
  storeType: string | null
  storeTypeOther: string | null
  ownerContactName: string | null
  storeUpdatedAtMs: number | null
  kpiMonthRevenueCents: number | null
  kpiMonthGrossProfitCents: number | null
  kpiMonthSaleCount: number | null
  kpiYearRevenueCents: number | null
  kpiYearGrossProfitCents: number | null
  kpiYearSaleCount: number | null
  kpiUpdatedAtMs: number | null
}
