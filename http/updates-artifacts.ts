import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import type { PlatformUpdateFileEntry } from '../shared/types/app-update.js'

export const ALLOWED_EXT = new Set([
  '.yml',
  '.yaml',
  '.exe',
  '.blockmap',
  '.zip',
  '.dmg',
  '.appimage',
  '.deb',
  '.rpm',
])

export const INSTALLER_EXT = new Set(['.exe', '.zip', '.dmg', '.appimage', '.deb', '.rpm'])

export const VERSION_FROM_NAME = /(\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?)\.(?:exe|zip|dmg|appimage|deb|rpm)$/i

export async function hashFile(filePath: string): Promise<{ sha512Base64: string; size: number }> {
  const hash = crypto.createHash('sha512')
  let size = 0
  await new Promise<void>((resolve, reject) => {
    const s = fs.createReadStream(filePath)
    s.on('data', (chunk) => {
      const buf = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)
      size += buf.length
      hash.update(buf)
    })
    s.on('end', () => resolve())
    s.on('error', reject)
  })
  return { sha512Base64: hash.digest('base64'), size }
}

export function buildLatestYml(params: {
  version: string
  installerName: string
  sha512Base64: string
  size: number
  releaseDateIso: string
}): string {
  const { version, installerName, sha512Base64, size, releaseDateIso } = params
  return (
    `version: ${version}\n` +
    `files:\n` +
    `  - url: ${installerName}\n` +
    `    sha512: ${sha512Base64}\n` +
    `    size: ${size}\n` +
    `path: ${installerName}\n` +
    `sha512: ${sha512Base64}\n` +
    `releaseDate: '${releaseDateIso}'\n`
  )
}

export function sanitizeFilename(name: string): string | null {
  const base = path.basename(name).trim()
  if (!base) return null
  if (base.startsWith('.')) return null
  if (base.includes('/') || base.includes('\\')) return null
  if (base === '.' || base === '..') return null
  const lower = base.toLowerCase()
  const ext =
    lower.endsWith('.exe.blockmap')
      ? '.blockmap'
      : path.extname(lower)
  if (!ALLOWED_EXT.has(ext)) return null
  return base
}

export function listArtifactFiles(dir: string): PlatformUpdateFileEntry[] {
  if (!fs.existsSync(dir)) return []
  const entries = fs.readdirSync(dir, { withFileTypes: true })
  const files: PlatformUpdateFileEntry[] = []
  for (const e of entries) {
    if (!e.isFile()) continue
    if (e.name.endsWith('.part')) continue
    try {
      const stat = fs.statSync(path.join(dir, e.name))
      files.push({
        name: e.name,
        sizeBytes: stat.size,
        modifiedAtMs: stat.mtimeMs,
      })
    } catch {
      // skip transient fs errors
    }
  }
  files.sort((a, b) => b.modifiedAtMs - a.modifiedAtMs)
  return files
}
