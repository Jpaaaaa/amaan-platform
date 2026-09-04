import fs from 'node:fs'
import path from 'node:path'
import cors from '@fastify/cors'
import fastifyMultipart from '@fastify/multipart'
import fastifyStatic from '@fastify/static'
import Fastify, { type FastifyInstance } from 'fastify'
import { initPlatformDb } from '../db/platform-db.js'
import { loadPlatformEnvFile } from '../load-env.js'
import {
  jwtVerifyRequest,
  registerPlatformAdminJwtPlugins,
  resolvePlatformAdminAuthState,
  type PlatformAdminAuthState,
} from './platform-admin-auth.js'
import { registerPlatformAdminRoutes } from './routes/platform-admin.routes.js'
import { registerPlatformAdminActivationRoutes } from './routes/platform-admin-activation.routes.js'
import { registerPlatformAdminUpdatesRoutes } from './routes/platform-admin-updates.routes.js'
import { registerPlatformAuthRoutes } from './routes/platform-auth.routes.js'
import { registerPlatformPingRoutes } from './routes/platform-ping.routes.js'
import { registerPlatformActivationRoutes } from './routes/platform-activation.routes.js'
import { registerPlatformUpdateRoutes } from './routes/platform-update.routes.js'
import { ensureProductUpdateSubdirs, migrateLegacyRootUpdatesToBazar } from './platform-updates-dir.js'

export type StartPlatformServerOptions = {
  dbPath: string
  port: number
  host?: string
  /** If set and exists, serve admin UI (e.g. platform/web/dist) */
  webDist?: string
  /**
   * Directory that holds auto-update artifacts (`latest.yml`, `*.exe`, `*.exe.blockmap`).
   * Served under `/updates/*`. Created if missing.
   */
  updatesDir?: string
}

export type CreatePlatformAppOptions = {
  webDist?: string
  updatesDir?: string
  /** When false, skip request logging (tests). Default true. */
  logger?: boolean
  authState?: PlatformAdminAuthState
}

/** Build the Fastify app without listening (tests use `inject`). */
export async function createPlatformApp(opts: CreatePlatformAppOptions = {}): Promise<FastifyInstance> {
  const authState = opts.authState ?? resolvePlatformAdminAuthState()

  const app = Fastify({
    logger: opts.logger !== false,
    bodyLimit: 2 * 1024 * 1024 * 1024,
  })
  await app.register(cors, { origin: true, credentials: true })
  await app.register(fastifyMultipart, {
    limits: {
      fileSize: 1024 * 1024 * 1024,
      files: 10,
    },
  })

  if (authState.enabled) {
    await registerPlatformAdminJwtPlugins(app, authState)
  }
  await registerPlatformAuthRoutes(app, authState)

  app.get('/api/platform/health', async () => ({
    ok: true,
    service: 'amaan-platform',
    adminAuth: authState.enabled ? ('jwt' as const) : ('none' as const),
  }))

  await registerPlatformPingRoutes(app)
  await registerPlatformActivationRoutes(app)

  const updatesDir = path.resolve(opts.updatesDir ?? path.join(process.cwd(), 'platform-data', 'updates'))
  try {
    fs.mkdirSync(updatesDir, { recursive: true })
    ensureProductUpdateSubdirs(updatesDir)
    migrateLegacyRootUpdatesToBazar(updatesDir)
  } catch {
    // non-fatal
  }
  await app.register(fastifyStatic, {
    root: updatesDir,
    prefix: '/updates/',
    decorateReply: false,
    list: false,
  })
  await registerPlatformUpdateRoutes(app, { updatesDir })

  if (authState.enabled) {
    app.addHook('preHandler', async (req, reply) => {
      const pathOnly = (req.url ?? '').split('?')[0] ?? ''
      if (!pathOnly.startsWith('/api/platform/admin')) return
      try {
        await jwtVerifyRequest(req)
      } catch {
        return reply.status(401).send({
          error: 'UNAUTHORIZED',
          message: 'Admin login required',
        })
      }
    })
  }

  await registerPlatformAdminRoutes(app)
  await registerPlatformAdminActivationRoutes(app)
  await registerPlatformAdminUpdatesRoutes(app, { updatesDir })

  const webRoot = opts.webDist
  if (webRoot && fs.existsSync(webRoot)) {
    await app.register(fastifyStatic, {
      root: path.resolve(webRoot),
      prefix: '/',
      decorateReply: false,
    })
    const indexHtml = path.join(path.resolve(webRoot), 'index.html')
    app.setNotFoundHandler((req, reply) => {
      if (req.url.startsWith('/api')) {
        return reply.status(404).send({ error: 'Not found' })
      }
      if (!fs.existsSync(indexHtml)) {
        return reply.status(404).send('Not found')
      }
      return reply.type('text/html').send(fs.createReadStream(indexHtml))
    })
  }

  return app
}

export async function startPlatformServer(opts: StartPlatformServerOptions): Promise<void> {
  loadPlatformEnvFile()
  await initPlatformDb(opts.dbPath)

  const authState = resolvePlatformAdminAuthState()
  const app = await createPlatformApp({
    webDist: opts.webDist,
    updatesDir: opts.updatesDir,
    authState,
  })

  const host = opts.host ?? '0.0.0.0'
  await app.listen({ port: opts.port, host })
  if (authState.enabled) {
    console.log('[platform] Admin APIs require JWT (set via login or Authorization: Bearer).')
  } else {
    console.log(
      '[platform] PLATFORM_ADMIN_PASSWORD is unset — /api/platform/admin/* is open. Set the password to enforce login.',
    )
  }
}
