import type { PlatformDeviceRow } from '../shared/types/platform-devices.js'
import { LICENSE_ROLLING_SYNC_MAX_MS } from '../shared/license-rolling.js'

function resolveRollingSyncMaxMs(): number {
  const raw = process.env.AMAAN_ROLLING_SYNC_MAX_MS?.trim()
  if (!raw) return LICENSE_ROLLING_SYNC_MAX_MS
  const n = Number(raw)
  if (!Number.isFinite(n)) return LICENSE_ROLLING_SYNC_MAX_MS
  const min = 1000
  const max = 366 * 24 * 60 * 60 * 1000
  return Math.min(max, Math.max(min, Math.round(n)))
}

export const ROLLING_SYNC_MAX_MS = resolveRollingSyncMaxMs()

const ROLLING_OFFLINE_MS_MIN = 1000
const ROLLING_OFFLINE_MS_MAX = 366 * 24 * 60 * 60 * 1000

export function clampRollingOfflineWindowMs(n: number): number {
  return Math.min(ROLLING_OFFLINE_MS_MAX, Math.max(ROLLING_OFFLINE_MS_MIN, Math.round(n)))
}

export function effectiveRollingSyncMaxMs(row: PlatformDeviceRow): number {
  if (row.rollingMaxMs != null && Number.isFinite(row.rollingMaxMs)) {
    return clampRollingOfflineWindowMs(row.rollingMaxMs)
  }
  return ROLLING_SYNC_MAX_MS
}
