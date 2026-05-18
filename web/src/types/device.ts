export type SessionState = 'loading' | 'anon' | 'ok'

export type TabId = 'devices' | 'releases' | 'settings'

export type CustomUnit = 'seconds' | 'minutes' | 'hours' | 'days'

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
