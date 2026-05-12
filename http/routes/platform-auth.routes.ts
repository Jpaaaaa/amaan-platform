import type { FastifyInstance } from 'fastify'
import {
  jwtReply,
  jwtVerifyRequest,
  PLATFORM_ADMIN_JWT_COOKIE,
  verifyAdminPassword,
  type PlatformAdminAuthState,
} from '../platform-admin-auth.js'

export async function registerPlatformAuthRoutes(
  app: FastifyInstance,
  state: PlatformAdminAuthState,
): Promise<void> {
  const secureCookie = process.env.NODE_ENV === 'production'

  app.get('/api/platform/auth/me', async (req, reply) => {
    if (!state.enabled) {
      return reply.send({ authEnabled: false, ok: true })
    }
    try {
      await jwtVerifyRequest(req)
      return reply.send({ authEnabled: true, ok: true })
    } catch {
      return reply.send({ authEnabled: true, ok: false })
    }
  })

  app.post<{ Body: { password?: string } }>('/api/platform/auth/login', async (req, reply) => {
    if (!state.enabled) {
      return reply.status(400).send({ error: 'AUTH_DISABLED' })
    }
    const password = typeof req.body?.password === 'string' ? req.body.password : ''
    if (!state.adminPassword || !verifyAdminPassword(password, state.adminPassword)) {
      return reply.status(401).send({ error: 'INVALID_CREDENTIALS' })
    }
    const r = jwtReply(reply)
    const token = await r.jwtSign({ role: 'admin' as const }, { expiresIn: '7d' })
    r.setCookie(PLATFORM_ADMIN_JWT_COOKIE, token, {
      path: '/',
      httpOnly: true,
      secure: secureCookie,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60,
    })
    return reply.send({ ok: true })
  })

  app.post('/api/platform/auth/logout', async (_req, reply) => {
    jwtReply(reply).clearCookie(PLATFORM_ADMIN_JWT_COOKIE, { path: '/', secure: secureCookie })
    return reply.send({ ok: true })
  })
}
