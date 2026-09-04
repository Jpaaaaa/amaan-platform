import type { FastifyInstance } from 'fastify'
import { getPlatformDb, persistPlatformDb } from '../../db/platform-db.js'
import { parsePlatformProductKey } from '../../shared/platform-product.js'
import {
  MACHINE_ID_RE,
  parseStoreSnapshot,
} from '../../shared/store-profile-validation.js'
import {
  countPendingSince,
  upsertActivationRequest,
} from '../../services/platform-activation.service.js'
import {
  evaluateDevice,
  findDevice,
} from '../../services/platform-device.service.js'

const MACHINE_WRITE_COOLDOWN_MS = 60_000
const IP_WINDOW_MS = 10 * 60 * 1000
const IP_MAX_REQUESTS = 200
const GLOBAL_PENDING_CAP = 500
const GLOBAL_PENDING_WINDOW_MS = 24 * 60 * 60 * 1000
const RENEWAL_WINDOW_MS = 7 * 86400000

const lastWriteByMachine = new Map<string, number>()
const ipRequestTimes = new Map<string, number[]>()

/** Clears in-memory rate-limit state (integration tests only). */
export function clearActivationRateLimitsForTests(): void {
  lastWriteByMachine.clear()
  ipRequestTimes.clear()
}

function pruneIpRequests(ip: string, now: number): number[] {
  const cutoff = now - IP_WINDOW_MS
  const prev = ipRequestTimes.get(ip) ?? []
  const kept = prev.filter((t) => t > cutoff)
  ipRequestTimes.set(ip, kept)
  return kept
}

function recordIpRequest(ip: string, now: number): void {
  const kept = pruneIpRequests(ip, now)
  kept.push(now)
  ipRequestTimes.set(ip, kept)
}

function isIpRateLimited(ip: string, now: number): boolean {
  return pruneIpRequests(ip, now).length >= IP_MAX_REQUESTS
}

function sweepRateLimitMaps(now: number): void {
  if (ipRequestTimes.size > 5000) {
    const cutoff = now - IP_WINDOW_MS
    for (const [ip, times] of ipRequestTimes) {
      const newest = times.length > 0 ? Math.max(...times) : 0
      if (newest <= cutoff) {
        ipRequestTimes.delete(ip)
      }
    }
  }

  if (lastWriteByMachine.size > 20000) {
    const cutoff = now - MACHINE_WRITE_COOLDOWN_MS
    for (const [key, lastWrite] of lastWriteByMachine) {
      if (lastWrite <= cutoff) {
        lastWriteByMachine.delete(key)
      }
    }
  }
}

function shouldWriteActivationRequest(
  device: NonNullable<ReturnType<typeof findDevice>>,
  now: number,
): boolean {
  const { status } = evaluateDevice(device, now)

  if (status === 'active') {
    if (device.tier === 'lifetime') return false
    if (device.expiresAtMs == null) return false
    return device.expiresAtMs - now <= RENEWAL_WINDOW_MS
  }

  if (status === 'expired') return true

  if (status === 'sync_required') {
    return (
      device.tier !== 'lifetime' &&
      device.expiresAtMs != null &&
      now > device.expiresAtMs
    )
  }

  return false
}

function shouldWriteActivationRequestForNewDevice(): boolean {
  return true
}

export async function registerPlatformActivationRoutes(app: FastifyInstance): Promise<void> {
  app.post<{
    Body: {
      machineId?: string
      storeName?: string
      phone?: string | null
      addressLine?: string | null
      city?: string | null
      storeType?: string | null
      storeTypeOther?: string | null
      ownerContactName?: string | null
      product?: string
    }
  }>('/api/platform/v1/activation-requests', async (req, reply) => {
    const now = Date.now()
    sweepRateLimitMaps(now)
    const ip = req.ip ?? 'unknown'

    if (isIpRateLimited(ip, now)) {
      return reply.status(429).send({ error: 'RATE_LIMITED' })
    }
    recordIpRequest(ip, now)

    const machineId = typeof req.body?.machineId === 'string' ? req.body.machineId.trim() : ''
    if (!MACHINE_ID_RE.test(machineId)) {
      return reply.status(400).send({ error: 'INVALID_MACHINE_ID' })
    }

    const store = parseStoreSnapshot(req.body)
    if (!store) {
      return reply.status(400).send({ error: 'STORE_NAME_REQUIRED' })
    }

    const productKey = parsePlatformProductKey(
      typeof req.body?.product === 'string' ? req.body.product : undefined,
    )

    const db = getPlatformDb()
    const device = findDevice(db, productKey, machineId)

    if (device?.revoked) {
      return reply.status(403).send({ error: 'REVOKED' })
    }

    const writeAllowed = device
      ? shouldWriteActivationRequest(device, now)
      : shouldWriteActivationRequestForNewDevice()

    if (!writeAllowed) {
      return reply.send({ ok: true })
    }

    if (!device) {
      const pendingCount = countPendingSince(db, now - GLOBAL_PENDING_WINDOW_MS)
      if (pendingCount > GLOBAL_PENDING_CAP) {
        return reply.status(503).send({ error: 'CAPACITY' })
      }
    }

    const rateKey = `${productKey}:${machineId}`
    const lastWrite = lastWriteByMachine.get(rateKey)
    if (lastWrite != null && now - lastWrite < MACHINE_WRITE_COOLDOWN_MS) {
      return reply.send({ ok: true })
    }

    upsertActivationRequest(db, {
      productKey,
      machineId,
      store,
      requestIp: ip === 'unknown' ? null : ip,
    })
    lastWriteByMachine.set(rateKey, now)
    persistPlatformDb()

    return reply.send({ ok: true })
  })
}
