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
    ensureRollingMaxColumn(database)
    return
  }

  if (!columnExists(database, 'platform_devices', 'product_key')) {
    migratePlatformDevicesAddProductKey(database)
  }

  ensureRollingMaxColumn(database)
}
