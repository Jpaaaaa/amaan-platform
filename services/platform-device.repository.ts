import type { Database as SqlDatabase } from 'sql.js'
import type { PlatformProductKey } from '../shared/platform-product.js'
import type { PlatformDeviceRow, PlatformLicenseTier } from '../shared/types/platform-devices.js'
import { assertTier, clampCustomValidForMs, computeExpiryFromTier } from './platform-device-tier.js'
import { clampRollingOfflineWindowMs } from './platform-device-rolling.js'

function rowFromStmt(row: Record<string, unknown> | undefined): PlatformDeviceRow | null {
  if (!row) return null
  const pk = String(row.product_key)
  if (pk !== 'bazar_one' && pk !== 'sufra_lite') return null
  return {
    productKey: pk as PlatformProductKey,
    machineId: String(row.machine_id),
    label: row.label != null ? String(row.label) : null,
    tier: row.tier as PlatformLicenseTier,
    expiresAtMs: row.expires_at_ms != null ? Number(row.expires_at_ms) : null,
    revoked: Number(row.revoked) === 1,
    lastSyncAtMs: row.last_sync_at_ms != null ? Number(row.last_sync_at_ms) : null,
    createdAtMs: Number(row.created_at_ms),
    updatedAtMs: Number(row.updated_at_ms),
    notes: row.notes != null ? String(row.notes) : null,
    rollingMaxMs:
      row.rolling_max_ms != null && row.rolling_max_ms !== ''
        ? Number(row.rolling_max_ms)
        : null,
  }
}

export function listDevices(database: SqlDatabase, productKey: PlatformProductKey): PlatformDeviceRow[] {
  const stmt = database.prepare(
    `SELECT product_key, machine_id, label, tier, expires_at_ms, revoked, last_sync_at_ms, created_at_ms, updated_at_ms, notes, rolling_max_ms
     FROM platform_devices WHERE product_key = ? ORDER BY updated_at_ms DESC`,
  )
  stmt.bind([productKey])
  const out: PlatformDeviceRow[] = []
  while (stmt.step()) {
    const r = rowFromStmt(stmt.getAsObject())
    if (r) out.push(r)
  }
  stmt.free()
  return out
}

export function findDevice(
  database: SqlDatabase,
  productKey: PlatformProductKey,
  machineId: string,
): PlatformDeviceRow | null {
  const stmt = database.prepare(
    `SELECT product_key, machine_id, label, tier, expires_at_ms, revoked, last_sync_at_ms, created_at_ms, updated_at_ms, notes, rolling_max_ms
     FROM platform_devices WHERE product_key = ? AND machine_id = ?`,
  )
  stmt.bind([productKey, machineId.trim()])
  let row: PlatformDeviceRow | null = null
  if (stmt.step()) {
    row = rowFromStmt(stmt.getAsObject())
  }
  stmt.free()
  return row
}

export type UpsertDeviceInput = {
  productKey: PlatformProductKey
  machineId: string
  label?: string | null
  tier: PlatformLicenseTier
  notes?: string | null
  renew: boolean
  customValidForMs?: number
  rollingMaxMs?: number | null
}

export function upsertDevice(database: SqlDatabase, input: UpsertDeviceInput): PlatformDeviceRow {
  assertTier(input.tier)
  const now = Date.now()
  const mid = input.machineId.trim()
  const pk = input.productKey
  const existing = findDevice(database, pk, mid)

  const createdAtMs = existing?.createdAtMs ?? now
  let expiresAtMs: number | null
  let lastSyncAtMs: number | null

  if (!existing || input.renew) {
    if (input.tier === 'lifetime') {
      expiresAtMs = null
    } else if (input.tier === 'custom') {
      if (input.customValidForMs == null || !Number.isFinite(input.customValidForMs)) {
        throw new Error('CUSTOM_DURATION_REQUIRED')
      }
      expiresAtMs = now + clampCustomValidForMs(input.customValidForMs)
    } else {
      expiresAtMs = computeExpiryFromTier(now, input.tier)
    }
    lastSyncAtMs = now
  } else {
    expiresAtMs = existing.expiresAtMs
    lastSyncAtMs = existing.lastSyncAtMs
  }

  const label = input.label !== undefined ? input.label : existing?.label ?? null
  const notes = input.notes !== undefined ? input.notes : existing?.notes ?? null

  let rollingMaxMsOut: number | null
  if (input.rollingMaxMs !== undefined) {
    rollingMaxMsOut =
      input.rollingMaxMs === null ? null : clampRollingOfflineWindowMs(input.rollingMaxMs)
  } else if (!existing) {
    rollingMaxMsOut = null
  } else {
    rollingMaxMsOut = existing.rollingMaxMs
  }

  database.run(
    `INSERT INTO platform_devices (product_key, machine_id, label, tier, expires_at_ms, revoked, last_sync_at_ms, created_at_ms, updated_at_ms, notes, rolling_max_ms)
     VALUES (?, ?, ?, ?, ?, 0, ?, ?, ?, ?, ?)
     ON CONFLICT(product_key, machine_id) DO UPDATE SET
       label = excluded.label,
       tier = excluded.tier,
       expires_at_ms = excluded.expires_at_ms,
       last_sync_at_ms = excluded.last_sync_at_ms,
       updated_at_ms = excluded.updated_at_ms,
       notes = excluded.notes,
       rolling_max_ms = excluded.rolling_max_ms,
       revoked = 0`,
    [pk, mid, label, input.tier, expiresAtMs, lastSyncAtMs, createdAtMs, now, notes, rollingMaxMsOut],
  )

  const r = findDevice(database, pk, mid)
  if (!r) throw new Error('UPSERT_FAILED')
  return r
}

export function setRevoked(
  database: SqlDatabase,
  productKey: PlatformProductKey,
  machineId: string,
  revoked: boolean,
): void {
  const now = Date.now()
  database.run(
    `UPDATE platform_devices SET revoked = ?, updated_at_ms = ? WHERE product_key = ? AND machine_id = ?`,
    [revoked ? 1 : 0, now, productKey, machineId.trim()],
  )
}

export type AdminDevicePatch = {
  label?: string | null
  notes?: string | null
  tier?: PlatformLicenseTier
  expiresAtMs?: number | null
  lastSyncAtMs?: number | null
  rollingMaxMs?: number | null
}

export function updateDeviceAdmin(
  database: SqlDatabase,
  productKey: PlatformProductKey,
  machineId: string,
  patch: AdminDevicePatch,
): PlatformDeviceRow {
  const mid = machineId.trim()
  const existing = findDevice(database, productKey, mid)
  if (!existing) throw new Error('NOT_FOUND')

  const tier = patch.tier !== undefined ? patch.tier : existing.tier
  assertTier(tier)

  let expiresAtMs = existing.expiresAtMs
  if (patch.expiresAtMs !== undefined) expiresAtMs = patch.expiresAtMs
  if (tier === 'lifetime') expiresAtMs = null

  if (tier !== 'lifetime' && (expiresAtMs == null || !Number.isFinite(expiresAtMs))) {
    throw new Error('EXPIRY_REQUIRED')
  }

  let lastSyncAtMs = existing.lastSyncAtMs
  if (patch.lastSyncAtMs !== undefined) lastSyncAtMs = patch.lastSyncAtMs
  if (lastSyncAtMs != null && !Number.isFinite(lastSyncAtMs)) {
    throw new Error('INVALID_LAST_SYNC')
  }

  let rollingMaxMs = existing.rollingMaxMs
  if (patch.rollingMaxMs !== undefined) {
    rollingMaxMs =
      patch.rollingMaxMs === null ? null : clampRollingOfflineWindowMs(patch.rollingMaxMs)
  }

  const label = patch.label !== undefined ? patch.label : existing.label
  const notes = patch.notes !== undefined ? patch.notes : existing.notes
  const now = Date.now()

  database.run(
    `UPDATE platform_devices SET tier = ?, expires_at_ms = ?, last_sync_at_ms = ?, label = ?, notes = ?, rolling_max_ms = ?, updated_at_ms = ? WHERE product_key = ? AND machine_id = ?`,
    [tier, expiresAtMs, lastSyncAtMs, label, notes, rollingMaxMs, now, productKey, mid],
  )

  const row = findDevice(database, productKey, mid)
  if (!row) throw new Error('UPDATE_FAILED')
  return row
}

export function deleteDevice(
  database: SqlDatabase,
  productKey: PlatformProductKey,
  machineId: string,
): boolean {
  const mid = machineId.trim()
  if (!findDevice(database, productKey, mid)) return false
  database.run(`DELETE FROM platform_devices WHERE product_key = ? AND machine_id = ?`, [productKey, mid])
  return findDevice(database, productKey, mid) === null
}

export function recordSync(
  database: SqlDatabase,
  productKey: PlatformProductKey,
  machineId: string,
): void {
  const now = Date.now()
  database.run(
    `UPDATE platform_devices SET last_sync_at_ms = ?, updated_at_ms = ? WHERE product_key = ? AND machine_id = ?`,
    [now, now, productKey, machineId.trim()],
  )
}
