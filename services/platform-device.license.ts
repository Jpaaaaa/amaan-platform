import type {
  PlatformDevicePublicStatus,
  PlatformDeviceRow,
  PlatformPingResponse,
} from '../shared/types/platform-devices.js'
import { effectiveRollingSyncMaxMs } from './platform-device-rolling.js'

function daysBetween(fromMs: number, toMs: number): number {
  return Math.ceil((toMs - fromMs) / 86400000)
}

export function evaluateDevice(
  row: PlatformDeviceRow | null,
  nowMs: number = Date.now(),
): { status: PlatformDevicePublicStatus; nextRequiredSyncBeforeMs: number | null } {
  if (!row) {
    return { status: 'unknown_device', nextRequiredSyncBeforeMs: null }
  }
  if (row.revoked) {
    return { status: 'revoked', nextRequiredSyncBeforeMs: null }
  }

  const anchor = row.lastSyncAtMs ?? row.createdAtMs
  const rollingDeadline = anchor + effectiveRollingSyncMaxMs(row)

  if (nowMs > rollingDeadline) {
    return { status: 'sync_required', nextRequiredSyncBeforeMs: rollingDeadline }
  }

  if (row.tier !== 'lifetime' && row.expiresAtMs != null && nowMs > row.expiresAtMs) {
    return { status: 'expired', nextRequiredSyncBeforeMs: null }
  }

  const datedCap = row.tier !== 'lifetime' && row.expiresAtMs != null ? row.expiresAtMs : Infinity
  const nextSync = Math.min(rollingDeadline, datedCap)

  return { status: 'active', nextRequiredSyncBeforeMs: nextSync }
}

export function buildPingResponse(row: PlatformDeviceRow | null, nowMs: number = Date.now()): PlatformPingResponse {
  if (!row) {
    return {
      ok: false,
      status: 'unknown_device',
      machineId: '',
      tier: null,
      expiresAtMs: null,
      daysUntilExpiry: null,
      nextRequiredSyncBeforeMs: null,
      serverTimeMs: nowMs,
      message: 'Machine not registered',
    }
  }

  const { status, nextRequiredSyncBeforeMs } = evaluateDevice(row, nowMs)

  let daysUntilExpiry: number | null = null
  if (row.expiresAtMs != null && row.tier !== 'lifetime') {
    daysUntilExpiry = Math.max(0, daysBetween(nowMs, row.expiresAtMs))
  }

  const ok = status === 'active'

  return {
    ok,
    status,
    machineId: row.machineId,
    tier: row.tier,
    expiresAtMs: row.expiresAtMs,
    daysUntilExpiry,
    nextRequiredSyncBeforeMs,
    serverTimeMs: nowMs,
    message:
      status === 'sync_required'
        ? 'Monthly online check required — connect to renew your window.'
        : undefined,
  }
}
