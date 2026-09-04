export const PLATFORM_PRODUCT_BAZAR = 'bazar_one' as const
export const PLATFORM_PRODUCT_SUFRA = 'sufra_lite' as const

export const PLATFORM_PRODUCT_KEYS = [
  PLATFORM_PRODUCT_BAZAR,
  PLATFORM_PRODUCT_SUFRA,
] as const

export type PlatformProductKey = (typeof PLATFORM_PRODUCT_KEYS)[number]

export type PlatformLicenseTier =
  | '5d'
  | '15d'
  | '1m'
  | '2m'
  | 'lifetime'
  | 'custom'

export type PlatformDevicePublicStatus =
  | 'unknown_device'
  | 'revoked'
  | 'sync_required'
  | 'expired'
  | 'active'

export type PlatformDeviceRow = {
  productKey: PlatformProductKey
  machineId: string
  label: string | null
  tier: PlatformLicenseTier
  expiresAtMs: number | null
  revoked: boolean
  lastSyncAtMs: number | null
  createdAtMs: number
  updatedAtMs: number
  notes: string | null
  rollingMaxMs: number | null
}

/** Device row as returned by GET /api/platform/admin/devices */
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
}

export type PlatformUpdateFileEntry = {
  name: string
  sizeBytes: number
  modifiedAtMs: number
}

export type PlatformUpdateFilesResponse = {
  updatesDir: string
  directoryExists: boolean
  files: PlatformUpdateFileEntry[]
}

export type CreateDeviceInput = {
  product: PlatformProductKey
  machineId: string
  label: string | null
  tier: string
  renew: boolean
  notes: string | null
}

export type PatchDeviceInput = {
  product: PlatformProductKey
  machineId: string
  label: string | null
  notes: string | null
  tier: string
  expiresAtMs: number | null
  lastSyncAtMs: number | null
  rollingMaxMs: number | null
}
