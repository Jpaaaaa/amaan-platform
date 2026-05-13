import fs from 'node:fs'
import path from 'node:path'
import type { PlatformProductKey } from '../shared/platform-product.js'
import { PLATFORM_PRODUCT_BAZAR, PLATFORM_PRODUCT_KEYS } from '../shared/platform-product.js'

/** Ensure `base/updates/<product>/` exists for each known product. */
export function ensureProductUpdateSubdirs(baseUpdatesDir: string): void {
  for (const k of PLATFORM_PRODUCT_KEYS) {
    try {
      fs.mkdirSync(path.join(baseUpdatesDir, k), { recursive: true })
    } catch {
      /* non-fatal */
    }
  }
}

/**
 * If installers lived at `updates/` root (pre–per-product layout), copy them into
 * `updates/bazar_one/` once so existing Bazar feeds keep working.
 */
export function migrateLegacyRootUpdatesToBazar(baseUpdatesDir: string): void {
  const bazarDir = path.join(baseUpdatesDir, PLATFORM_PRODUCT_BAZAR)
  const legacyYml = path.join(baseUpdatesDir, 'latest.yml')
  if (!fs.existsSync(legacyYml)) return
  if (fs.existsSync(path.join(bazarDir, 'latest.yml'))) return
  const skip = new Set<string>([...PLATFORM_PRODUCT_KEYS])
  let names: string[]
  try {
    names = fs.readdirSync(baseUpdatesDir)
  } catch {
    return
  }
  for (const name of names) {
    if (skip.has(name)) continue
    const src = path.join(baseUpdatesDir, name)
    let st: fs.Stats
    try {
      st = fs.statSync(src)
    } catch {
      continue
    }
    if (!st.isFile()) continue
    const dest = path.join(bazarDir, name)
    try {
      fs.copyFileSync(src, dest)
    } catch {
      /* ignore */
    }
  }
}

export function resolveUpdatesDirForProduct(
  baseUpdatesDir: string,
  productKey: PlatformProductKey,
): string {
  return path.join(baseUpdatesDir, productKey)
}
