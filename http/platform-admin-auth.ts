import crypto from 'node:crypto'
import cookie from '@fastify/cookie'
import jwt from '@fastify/jwt'
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'

/** HttpOnly cookie carrying the admin JWT when `PLATFORM_ADMIN_PASSWORD` is set. */
export const PLATFORM_ADMIN_JWT_COOKIE = 'platform_admin_jwt'

export type PlatformAdminAuthState = {
  enabled: boolean
  adminPassword: string | null
  jwtSecret: string
}

/**
 * When `PLATFORM_ADMIN_PASSWORD` is set, `/api/platform/admin/*` requires a JWT (cookie or Bearer).
 * Optional `PLATFORM_JWT_SECRET` (≥16 chars) overrides the derived signing key.
 */
export function resolvePlatformAdminAuthState(): PlatformAdminAuthState {
  const adminPassword = process.env.PLATFORM_ADMIN_PASSWORD?.trim() || null
  if (!adminPassword) {
    return { enabled: false, adminPassword: null, jwtSecret: '' }
  }
  const explicit = process.env.PLATFORM_JWT_SECRET?.trim()
  const jwtSecret =
    explicit && explicit.length >= 16
      ? explicit
      : Buffer.from(
          crypto.hkdfSync(
            'sha256',
            Buffer.from(adminPassword, 'utf8'),
            Buffer.from('amaan-platform-admin', 'utf8'),
            Buffer.from('jwt-signing-key-v1', 'utf8'),
            32,
          ) as Uint8Array,
        ).toString('base64')
  return { enabled: true, adminPassword, jwtSecret }
}

export async function registerPlatformAdminJwtPlugins(
  app: FastifyInstance,
  state: PlatformAdminAuthState,
): Promise<void> {
  if (!state.enabled) return
  await app.register(cookie as unknown as Parameters<FastifyInstance['register']>[0])
  await app.register(jwt as unknown as Parameters<FastifyInstance['register']>[0], {
    secret: state.jwtSecret,
    cookie: {
      cookieName: PLATFORM_ADMIN_JWT_COOKIE,
    },
  })
}

/** @fastify/jwt decorators are not picked up on Fastify 5 handler typings in this project. */
export async function jwtVerifyRequest(req: FastifyRequest): Promise<void> {
  await (req as FastifyRequest & { jwtVerify(): Promise<unknown> }).jwtVerify()
}

export type JwtDecoratedReply = FastifyReply & {
  jwtSign(payload: { role: 'admin' }, opts?: { expiresIn?: string }): Promise<string>
  setCookie(name: string, value: string, opts?: Record<string, unknown>): void
  clearCookie(name: string, opts?: Record<string, unknown>): void
}

export function jwtReply(reply: FastifyReply): JwtDecoratedReply {
  return reply as JwtDecoratedReply
}

/** Compare passwords without leaking length via timing (SHA-256 then timing-safe compare). */
export function verifyAdminPassword(input: string, expected: string): boolean {
  const ha = crypto.createHash('sha256').update(input, 'utf8').digest()
  const hb = crypto.createHash('sha256').update(expected, 'utf8').digest()
  return crypto.timingSafeEqual(ha, hb)
}
