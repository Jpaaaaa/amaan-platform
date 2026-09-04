import type { Database as SqlDatabase } from 'sql.js'
import { PLATFORM_PRODUCT_DEFAULT } from '../shared/platform-product.js'

function columnExists(database: SqlDatabase, table: string, column: string): boolean {
  const stmt = database.prepare(`SELECT 1 FROM pragma_table_info(?) WHERE name = ? LIMIT 1`)
  stmt.bind([table, column])
  const ok = stmt.step()
  stmt.free()
  return ok
}

function tableExists(database: SqlDatabase, table: string): boolean {
  const stmt = database.prepare(
    "SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = ? LIMIT 1",
  )
  stmt.bind([table])
  const ok = stmt.step()
  stmt.free()
  return ok
}

function ensureRollingMaxColumn(database: SqlDatabase): void {
  if (columnExists(database, 'platform_devices', 'rolling_max_ms')) return
  database.run('ALTER TABLE platform_devices ADD COLUMN rolling_max_ms INTEGER')
}

function ensureDeviceStoreColumns(database: SqlDatabase): void {
  const columns: Array<[string, string]> = [
    ['store_name', 'TEXT'],
    ['phone', 'TEXT'],
    ['address_line', 'TEXT'],
    ['city', 'TEXT'],
    ['store_type', 'TEXT'],
    ['store_type_other', 'TEXT'],
    ['owner_contact_name', 'TEXT'],
    ['store_updated_at_ms', 'INTEGER'],
  ]
  for (const [name, type] of columns) {
    if (columnExists(database, 'platform_devices', name)) continue
    database.run(`ALTER TABLE platform_devices ADD COLUMN ${name} ${type}`)
  }
}

function ensureDeviceKpiColumns(database: SqlDatabase): void {
  const columns: Array<[string, string]> = [
    ['kpi_month_revenue_cents', 'INTEGER'],
    ['kpi_month_gross_profit_cents', 'INTEGER'],
    ['kpi_month_sale_count', 'INTEGER'],
    ['kpi_year_revenue_cents', 'INTEGER'],
    ['kpi_year_gross_profit_cents', 'INTEGER'],
    ['kpi_year_sale_count', 'INTEGER'],
    ['kpi_updated_at_ms', 'INTEGER'],
  ]
  for (const [name, type] of columns) {
    if (columnExists(database, 'platform_devices', name)) continue
    database.run(`ALTER TABLE platform_devices ADD COLUMN ${name} ${type}`)
  }
}

function ensureActivationRequestsTable(database: SqlDatabase): void {
  if (tableExists(database, 'platform_activation_requests')) return
  database.run(`
    CREATE TABLE platform_activation_requests (
      product_key         TEXT    NOT NULL,
      machine_id          TEXT    NOT NULL,
      status              TEXT    NOT NULL,
      store_name          TEXT    NOT NULL,
      phone               TEXT,
      address_line        TEXT,
      city                TEXT,
      store_type          TEXT,
      store_type_other    TEXT,
      owner_contact_name  TEXT,
      request_ip          TEXT,
      created_at_ms       INTEGER NOT NULL,
      updated_at_ms       INTEGER NOT NULL,
      decided_at_ms       INTEGER,
      decline_reason      TEXT,
      PRIMARY KEY (product_key, machine_id)
    );
  `)
  database.run(`
    CREATE INDEX IF NOT EXISTS idx_activation_requests_status
      ON platform_activation_requests (status, updated_at_ms DESC);
  `)
}

/** New installs: composite PK (product + machine). */
function createPlatformDevicesV2(database: SqlDatabase): void {
  database.run(`
    CREATE TABLE platform_devices (
      product_key TEXT NOT NULL,
      machine_id TEXT NOT NULL,
      label TEXT,
      tier TEXT NOT NULL,
      expires_at_ms INTEGER,
      revoked INTEGER NOT NULL DEFAULT 0,
      last_sync_at_ms INTEGER,
      created_at_ms INTEGER NOT NULL,
      updated_at_ms INTEGER NOT NULL,
      notes TEXT,
      rolling_max_ms INTEGER,
      PRIMARY KEY (product_key, machine_id)
    );
  `)
}

/**
 * Legacy table had PRIMARY KEY(machine_id) only. Rebuild with (product_key, machine_id),
 * assigning all rows to `bazar_one` so existing Bazar activations keep working.
 */
function migratePlatformDevicesAddProductKey(database: SqlDatabase): void {
  database.run('BEGIN')
  try {
    database.run(`
      CREATE TABLE platform_devices_new (
        product_key TEXT NOT NULL,
        machine_id TEXT NOT NULL,
        label TEXT,
        tier TEXT NOT NULL,
        expires_at_ms INTEGER,
        revoked INTEGER NOT NULL DEFAULT 0,
        last_sync_at_ms INTEGER,
        created_at_ms INTEGER NOT NULL,
        updated_at_ms INTEGER NOT NULL,
        notes TEXT,
        rolling_max_ms INTEGER,
        PRIMARY KEY (product_key, machine_id)
      );
    `)
    database.run(
      `
      INSERT INTO platform_devices_new (
        product_key, machine_id, label, tier, expires_at_ms, revoked,
        last_sync_at_ms, created_at_ms, updated_at_ms, notes, rolling_max_ms
      )
      SELECT ?, machine_id, label, tier, expires_at_ms, revoked,
        last_sync_at_ms, created_at_ms, updated_at_ms, notes, rolling_max_ms
      FROM platform_devices;
    `,
      [PLATFORM_PRODUCT_DEFAULT],
    )
    database.run('DROP TABLE platform_devices')
    database.run('ALTER TABLE platform_devices_new RENAME TO platform_devices')
    database.run('COMMIT')
  } catch (e) {
    try {
      database.run('ROLLBACK')
    } catch {
      /* ignore */
    }
    throw e
  }
}

export function runPlatformSchemaBootstrap(database: SqlDatabase): void {
  if (!tableExists(database, 'platform_devices')) {
    createPlatformDevicesV2(database)
  } else if (!columnExists(database, 'platform_devices', 'product_key')) {
    migratePlatformDevicesAddProductKey(database)
  }

  if (tableExists(database, 'platform_devices')) {
    ensureRollingMaxColumn(database)
    ensureDeviceStoreColumns(database)
    ensureDeviceKpiColumns(database)
  }

  ensureActivationRequestsTable(database)
}
