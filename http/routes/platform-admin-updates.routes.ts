import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import type { FastifyInstance } from 'fastify'
import type {
  PlatformUpdateFilesResponse,
  PlatformUpdatePublishResponse,
  PlatformUpdateUploadResponse,
} from '../../shared/types/app-update.js'
import { parsePlatformProductKey } from '../../shared/platform-product.js'
import { resolveUpdatesDirForProduct } from '../platform-updates-dir.js'
import {
  buildLatestYml,
  hashFile,
  INSTALLER_EXT,
  listArtifactFiles,
  sanitizeFilename,
  VERSION_FROM_NAME,
} from '../updates-artifacts.js'

export type RegisterPlatformAdminUpdatesRoutesOptions = {
  updatesDir: string
  maxFileBytes?: number
}

export async function registerPlatformAdminUpdatesRoutes(
  app: FastifyInstance,
  opts: RegisterPlatformAdminUpdatesRoutesOptions,
): Promise<void> {
  const { updatesDir } = opts
  const maxFileBytes = opts.maxFileBytes ?? 1024 * 1024 * 1024

  function scopedDir(query: unknown): string {
    const q = query as { product?: string }
    return resolveUpdatesDirForProduct(updatesDir, parsePlatformProductKey(q?.product))
  }

  app.get('/api/platform/admin/updates/files', async (req, reply) => {
    const dir = scopedDir(req.query)
    const body: PlatformUpdateFilesResponse = {
      updatesDir: dir,
      directoryExists: fs.existsSync(dir),
      files: listArtifactFiles(dir),
    }
    return reply.send(body)
  })

  app.post('/api/platform/admin/updates/upload', async (req, reply) => {
    if (!req.isMultipart()) {
      return reply.status(400).send({ error: 'EXPECTED_MULTIPART' })
    }

    const dir = scopedDir(req.query)

    try {
      fs.mkdirSync(dir, { recursive: true })
    } catch (e) {
      return reply.status(500).send({
        error: 'MKDIR_FAILED',
        message: e instanceof Error ? e.message : String(e),
      })
    }

    const accepted: Array<{ name: string; sizeBytes: number; sha512Base64: string }> = []
    const rejected: Array<{ name: string; reason: string }> = []

    const parts = req.files({ limits: { fileSize: maxFileBytes } })
    try {
      for await (const part of parts) {
        const safeName = sanitizeFilename(part.filename)
        if (!safeName) {
          rejected.push({ name: part.filename, reason: 'INVALID_NAME_OR_EXT' })
          part.file.resume()
          continue
        }

        const finalPath = path.join(dir, safeName)
        const tmpPath = `${finalPath}.part`
        const hash = crypto.createHash('sha512')
        let bytes = 0
        let truncated = false

        await new Promise<void>((resolve, reject) => {
          const out = fs.createWriteStream(tmpPath)
          part.file.on('data', (chunk: Buffer) => {
            bytes += chunk.length
            hash.update(chunk)
          })
          part.file.on('limit', () => {
            truncated = true
          })
          part.file.on('error', reject)
          out.on('error', reject)
          out.on('finish', () => resolve())
          part.file.pipe(out)
        })

        if (truncated) {
          try { fs.unlinkSync(tmpPath) } catch { /* ignore */ }
          rejected.push({ name: safeName, reason: 'TOO_LARGE' })
          continue
        }

        try {
          fs.renameSync(tmpPath, finalPath)
        } catch (e) {
          try { fs.unlinkSync(tmpPath) } catch { /* ignore */ }
          rejected.push({
            name: safeName,
            reason: e instanceof Error ? e.message : 'RENAME_FAILED',
          })
          continue
        }

        accepted.push({
          name: safeName,
          sizeBytes: bytes,
          sha512Base64: hash.digest('base64'),
        })
      }
    } catch (e) {
      return reply.status(500).send({
        error: 'UPLOAD_FAILED',
        message: e instanceof Error ? e.message : String(e),
      })
    }

    const body: PlatformUpdateUploadResponse = {
      accepted,
      rejected,
      files: listArtifactFiles(dir),
    }
    return reply.send(body)
  })

  app.post<{
    Body: { installer?: string; version?: string; releaseDate?: string }
  }>('/api/platform/admin/updates/publish', async (req, reply) => {
    const dir = scopedDir(req.query)
    const installerRaw = typeof req.body?.installer === 'string' ? req.body.installer : ''
    const safeName = sanitizeFilename(installerRaw)
    if (!safeName) {
      return reply.status(400).send({ error: 'INVALID_INSTALLER' })
    }
    const lower = safeName.toLowerCase()
    const ext = lower.endsWith('.exe.blockmap') ? '.blockmap' : path.extname(lower)
    if (!INSTALLER_EXT.has(ext)) {
      return reply.status(400).send({
        error: 'NOT_AN_INSTALLER',
        message: `Publish target must be one of ${[...INSTALLER_EXT].join(', ')}`,
      })
    }
    const installerPath = path.join(dir, safeName)
    if (!fs.existsSync(installerPath)) {
      return reply.status(404).send({ error: 'INSTALLER_NOT_FOUND' })
    }

    let version = typeof req.body?.version === 'string' ? req.body.version.trim() : ''
    if (!version) {
      const m = safeName.match(VERSION_FROM_NAME)
      if (!m) {
        return reply.status(400).send({
          error: 'VERSION_REQUIRED',
          message:
            'Could not detect a version in the filename. Provide `version` in the request body (semver, e.g. 1.2.3).',
        })
      }
      version = m[1]
    }
    if (!/^\d+\.\d+\.\d+(-[0-9A-Za-z.-]+)?$/.test(version)) {
      return reply.status(400).send({
        error: 'INVALID_VERSION',
        message: 'Version must be semver (e.g. 1.2.3 or 1.2.3-beta.1).',
      })
    }

    let hashed: { sha512Base64: string; size: number }
    try {
      hashed = await hashFile(installerPath)
    } catch (e) {
      return reply.status(500).send({
        error: 'HASH_FAILED',
        message: e instanceof Error ? e.message : String(e),
      })
    }

    const releaseDateIso =
      typeof req.body?.releaseDate === 'string' && req.body.releaseDate.trim()
        ? req.body.releaseDate.trim()
        : new Date().toISOString()

    const yml = buildLatestYml({
      version,
      installerName: safeName,
      sha512Base64: hashed.sha512Base64,
      size: hashed.size,
      releaseDateIso,
    })

    const ymlPath = path.join(dir, 'latest.yml')
    const tmpPath = `${ymlPath}.part`
    try {
      fs.writeFileSync(tmpPath, yml, 'utf8')
      fs.renameSync(tmpPath, ymlPath)
    } catch (e) {
      try { fs.unlinkSync(tmpPath) } catch { /* ignore */ }
      return reply.status(500).send({
        error: 'WRITE_FAILED',
        message: e instanceof Error ? e.message : String(e),
      })
    }

    const body: PlatformUpdatePublishResponse = {
      version,
      installer: safeName,
      sha512: hashed.sha512Base64,
      sizeBytes: hashed.size,
      releaseDate: releaseDateIso,
      files: listArtifactFiles(dir),
    }
    return reply.send(body)
  })

  app.delete<{ Params: { name: string } }>(
    '/api/platform/admin/updates/files/:name',
    async (req, reply) => {
      const dir = scopedDir(req.query)
      const safeName = sanitizeFilename(req.params.name)
      if (!safeName) {
        return reply.status(400).send({ error: 'INVALID_NAME' })
      }
      const target = path.join(dir, safeName)
      if (!fs.existsSync(target)) {
        return reply.status(404).send({ error: 'NOT_FOUND' })
      }
      try {
        const stat = fs.statSync(target)
        if (!stat.isFile()) {
          return reply.status(400).send({ error: 'NOT_A_FILE' })
        }
        fs.unlinkSync(target)
      } catch (e) {
        return reply.status(500).send({
          error: 'DELETE_FAILED',
          message: e instanceof Error ? e.message : String(e),
        })
      }
      const body: PlatformUpdateFilesResponse = {
        updatesDir: dir,
        directoryExists: fs.existsSync(dir),
        files: listArtifactFiles(dir),
      }
      return reply.send(body)
    },
  )
}
