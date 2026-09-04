import type { Database as SqlDatabase } from 'sql.js'
import { isPlatformProductKey, type PlatformProductKey } from '../shared/platform-product.js'
import type {
  ActivationRequestState,
  PlatformActivationRequestRow,
  PlatformStoreSnapshot,
} from '../shared/types/platform-activation.js'

const ACTIVATION_REQUEST_SELECT = `
  product_key, machine_id, status, store_name, phone, address_line, city,
  store_type, store_type_other, owner_contact_name, request_ip,
  created_at_ms, updated_at_ms, decided_at_ms, decline_reason
`.trim()

function storeFromRow(row: Record<string, unknown>): PlatformStoreSnapshot {
  return {
    storeName: String(row.store_name ?? ''),
    phone: row.phone != null ? String(row.phone) : null,
    addressLine: row.address_line != null ? String(row.address_line) : null,
    city: row.city != null ? String(row.city) : null,
    storeType: row.store_type != null ? String(row.store_type) : null,
    storeTypeOther: row.store_type_other != null ? String(row.store_type_other) : null,
    ownerContactName: row.owner_contact_name != null ? String(row.owner_contact_name) : null,
  }
}

function rowFromStmt(row: Record<string, unknown> | undefined): PlatformActivationRequestRow | null {
  if (!row) return null
  const pk = String(row.product_key)
  if (!isPlatformProductKey(pk)) return null
  const status = String(row.status)
  if (status !== 'pending' && status !== 'declined' && status !== 'approved') return null
  return {
    productKey: pk as PlatformProductKey,
    machineId: String(row.machine_id),
    status: status as ActivationRequestState,
    store: storeFromRow(row),
    requestIp: row.request_ip != null ? String(row.request_ip) : null,
    createdAtMs: Number(row.created_at_ms),
    updatedAtMs: Number(row.updated_at_ms),
    decidedAtMs: row.decided_at_ms != null ? Number(row.decided_at_ms) : null,
    declineReason: row.decline_reason != null ? String(row.decline_reason) : null,
  }
}

export function findActivationRequest(
  database: SqlDatabase,
  productKey: PlatformProductKey,
  machineId: string,
): PlatformActivationRequestRow | null {
  const stmt = database.prepare(
    `SELECT ${ACTIVATION_REQUEST_SELECT}
     FROM platform_activation_requests WHERE product_key = ? AND machine_id = ?`,
  )
  stmt.bind([productKey, machineId.trim()])
  let row: PlatformActivationRequestRow | null = null
  if (stmt.step()) {
    row = rowFromStmt(stmt.getAsObject())
  }
  stmt.free()
  return row
}

export function listActivationRequests(
  database: SqlDatabase,
  productKey: PlatformProductKey,
  status?: ActivationRequestState,
): PlatformActivationRequestRow[] {
  const stmt =
    status != null
      ? database.prepare(
          `SELECT ${ACTIVATION_REQUEST_SELECT}
           FROM platform_activation_requests
           WHERE product_key = ? AND status = ?
           ORDER BY updated_at_ms DESC`,
        )
      : database.prepare(
          `SELECT ${ACTIVATION_REQUEST_SELECT}
           FROM platform_activation_requests
           WHERE product_key = ?
           ORDER BY updated_at_ms DESC`,
        )
  if (status != null) {
    stmt.bind([productKey, status])
  } else {
    stmt.bind([productKey])
  }
  const out: PlatformActivationRequestRow[] = []
  while (stmt.step()) {
    const r = rowFromStmt(stmt.getAsObject())
    if (r) out.push(r)
  }
  stmt.free()
  return out
}

export type UpsertActivationRequestInput = {
  productKey: PlatformProductKey
  machineId: string
  store: PlatformStoreSnapshot
  requestIp: string | null
}

export function upsertActivationRequest(
  database: SqlDatabase,
  input: UpsertActivationRequestInput,
): PlatformActivationRequestRow {
  const now = Date.now()
  const mid = input.machineId.trim()
  const pk = input.productKey
  const existing = findActivationRequest(database, pk, mid)
  const createdAtMs = existing?.createdAtMs ?? now
  const { store } = input

  database.run(
    `INSERT INTO platform_activation_requests (
       product_key, machine_id, status, store_name, phone, address_line, city,
       store_type, store_type_other, owner_contact_name, request_ip,
       created_at_ms, updated_at_ms, decided_at_ms, decline_reason
     ) VALUES (?, ?, 'pending', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, NULL)
     ON CONFLICT(product_key, machine_id) DO UPDATE SET
       status = 'pending',
       store_name = excluded.store_name,
       phone = excluded.phone,
       address_line = excluded.address_line,
       city = excluded.city,
       store_type = excluded.store_type,
       store_type_other = excluded.store_type_other,
       owner_contact_name = excluded.owner_contact_name,
       request_ip = excluded.request_ip,
       updated_at_ms = excluded.updated_at_ms,
       decided_at_ms = NULL,
       decline_reason = NULL`,
    [
      pk,
      mid,
      store.storeName,
      store.phone,
      store.addressLine,
      store.city,
      store.storeType,
      store.storeTypeOther,
      store.ownerContactName,
      input.requestIp,
      createdAtMs,
      now,
    ],
  )

  const row = findActivationRequest(database, pk, mid)
  if (!row) throw new Error('UPSERT_FAILED')
  return row
}

export function setActivationDecision(
  database: SqlDatabase,
  productKey: PlatformProductKey,
  machineId: string,
  status: ActivationRequestState,
  declineReason?: string | null,
): PlatformActivationRequestRow {
  const now = Date.now()
  const mid = machineId.trim()
  const existing = findActivationRequest(database, productKey, mid)
  if (!existing) throw new Error('NOT_FOUND')

  const decidedAtMs = status === 'pending' ? null : now
  const declineReasonOut =
    status === 'declined' ? (declineReason !== undefined ? declineReason : null) : null

  database.run(
    `UPDATE platform_activation_requests
     SET status = ?, updated_at_ms = ?, decided_at_ms = ?, decline_reason = ?
     WHERE product_key = ? AND machine_id = ?`,
    [status, now, decidedAtMs, declineReasonOut, productKey, mid],
  )

  const row = findActivationRequest(database, productKey, mid)
  if (!row) throw new Error('UPDATE_FAILED')
  return row
}

export function deleteActivationRequest(
  database: SqlDatabase,
  productKey: PlatformProductKey,
  machineId: string,
): boolean {
  const mid = machineId.trim()
  if (!findActivationRequest(database, productKey, mid)) return false
  database.run(
    `DELETE FROM platform_activation_requests WHERE product_key = ? AND machine_id = ?`,
    [productKey, mid],
  )
  return findActivationRequest(database, productKey, mid) === null
}

export function countPendingSince(database: SqlDatabase, sinceMs: number): number {
  const stmt = database.prepare(
    `SELECT COUNT(*) AS cnt FROM platform_activation_requests
     WHERE status = 'pending' AND created_at_ms >= ?`,
  )
  stmt.bind([sinceMs])
  let count = 0
  if (stmt.step()) {
    const row = stmt.getAsObject() as { cnt?: unknown }
    count = Number(row.cnt ?? 0)
  }
  stmt.free()
  return count
}
