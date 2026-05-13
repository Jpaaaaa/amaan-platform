import type { FastifyInstance } from 'fastify'
import type { PlatformLicenseTier } from '../../shared/types/platform-devices.js'
import { persistPlatformDb, getPlatformDb } from '../../db/platform-db.js'
import { parsePlatformProductKey, type PlatformProductKey } from '../../shared/platform-product.js'
import {
  assertTier,
  deleteDevice,
  effectiveRollingSyncMaxMs,
  evaluateDevice,
  findDevice,
  listDevices,
  setRevoked,
  updateDeviceAdmin,
  upsertDevice,
} from '../../services/platform-device.service.js'

function productFromQuery(query: unknown): PlatformProductKey {
  const q = query as { product?: string }
  return parsePlatformProductKey(q?.product)
}

function productFromBody(body: unknown): PlatformProductKey {
  if (body && typeof body === 'object' && 'product' in body) {
    return parsePlatformProductKey(String((body as Record<string, unknown>).product))
  }
  return parsePlatformProductKey(undefined)
}

/** Own-property check + coerce string JSON numbers (some proxies/clients send strings). */
function readRollingMaxMsFromBody(body: unknown): { v: number | null | undefined; err?: string } {
  if (body == null || typeof body !== 'object') return { v: undefined }
  if (!Object.prototype.hasOwnProperty.call(body, 'rollingMaxMs')) return { v: undefined }
  const raw = (body as Record<string, unknown>).rollingMaxMs
  if (raw === null) return { v: null }
  if (typeof raw === 'number' && Number.isFinite(raw)) return { v: raw }
  if (typeof raw === 'string' && raw.trim() !== '') {
    const n = Number(raw.trim())
    if (Number.isFinite(n)) return { v: n }
  }
  return { v: undefined, err: 'rollingMaxMs must be a finite number or null' }
}

export async function registerPlatformAdminRoutes(app: FastifyInstance): Promise<void> {
  app.get('/api/platform/admin/devices', async (req, reply) => {
    const productKey = productFromQuery(req.query)
    const rows = listDevices(getPlatformDb(), productKey)
    const now = Date.now()
    const enriched = rows.map((r) => {
      const ev = evaluateDevice(r, now)
      const effRolling = effectiveRollingSyncMaxMs(r)
      return {
        ...r,
        computedStatus: ev.status,
        rollingDeadlineMs: (r.lastSyncAtMs ?? r.createdAtMs) + effRolling,
        effectiveRollingMaxMs: effRolling,
      }
    })
    return reply.send({ devices: enriched })
  })

  app.post<{
    Body: {
      machineId?: string
      label?: string | null
      tier?: string
      renew?: boolean
      notes?: string | null
      /** ms; required for `custom` tier when creating or renewing */
      customValidForMs?: number
      /** Per-device offline grace (ms); null = server default */
      rollingMaxMs?: number | null
      /** `bazar_one` (default) or `sufra_lite` */
      product?: string
    }
  }>('/api/platform/admin/devices', async (req, reply) => {
    const productKey = productFromBody(req.body)
    const machineId = typeof req.body?.machineId === 'string' ? req.body.machineId.trim() : ''
    const tierRaw = typeof req.body?.tier === 'string' ? req.body.tier.trim() : ''
    if (!machineId || !tierRaw) {
      return reply.status(400).send({ error: 'VALIDATION', message: 'machineId and tier required' })
    }
    try {
      assertTier(tierRaw)
    } catch {
      return reply.status(400).send({ error: 'INVALID_TIER' })
    }
    const renew = Boolean(req.body?.renew)
    const rawCustom = req.body?.customValidForMs
    const customValidForMs =
      typeof rawCustom === 'number' && Number.isFinite(rawCustom) ? rawCustom : undefined

    const rollingRead = readRollingMaxMsFromBody(req.body)
    if (rollingRead.err) {
      return reply.status(400).send({ error: 'VALIDATION', message: rollingRead.err })
    }
    const rollingMaxMs = rollingRead.v

    const db = getPlatformDb()
    const existing = findDevice(db, productKey, machineId)
    const needsCustomDuration = tierRaw === 'custom' && (renew || !existing)
    if (needsCustomDuration) {
      if (customValidForMs == null || customValidForMs <= 0) {
        return reply.status(400).send({
          error: 'VALIDATION',
          message: 'customValidForMs (positive ms) required for custom tier when activating or renewing',
        })
      }
    }

    let row
    try {
      row = upsertDevice(db, {
        productKey,
        machineId,
        label: req.body?.label,
        tier: tierRaw as PlatformLicenseTier,
        notes: req.body?.notes,
        renew,
        customValidForMs,
        rollingMaxMs,
      })
    } catch (e) {
      if (e instanceof Error && e.message === 'CUSTOM_DURATION_REQUIRED') {
        return reply.status(400).send({
          error: 'VALIDATION',
          message: 'customValidForMs required for custom tier when activating or renewing',
        })
      }
      throw e
    }
    persistPlatformDb()
    return reply.send({ device: row })
  })

  app.patch<{
    Params: { machineId: string }
    Body: {
      label?: string | null
      notes?: string | null
      tier?: string
      expiresAtMs?: number | null
      lastSyncAtMs?: number | null
      rollingMaxMs?: number | null
    }
  }>('/api/platform/admin/devices/:machineId', async (req, reply) => {
    const productKey = productFromQuery(req.query)
    const mid = req.params.machineId.trim()
    const body = req.body ?? {}
    const patch: Parameters<typeof updateDeviceAdmin>[3] = {}

    if ('label' in body) patch.label = body.label === null ? null : String(body.label)
    if ('notes' in body) patch.notes = body.notes === null ? null : String(body.notes)
    if (body.tier !== undefined) {
      const t = typeof body.tier === 'string' ? body.tier.trim() : ''
      try {
        assertTier(t)
        patch.tier = t as PlatformLicenseTier
      } catch {
        return reply.status(400).send({ error: 'INVALID_TIER' })
      }
    }
    if ('expiresAtMs' in body) {
      const v = body.expiresAtMs
      if (v === null) patch.expiresAtMs = null
      else if (typeof v === 'number' && Number.isFinite(v)) patch.expiresAtMs = v
      else return reply.status(400).send({ error: 'VALIDATION', message: 'expiresAtMs must be number or null' })
    }
    if ('lastSyncAtMs' in body) {
      const v = body.lastSyncAtMs
      if (v === null) patch.lastSyncAtMs = null
      else if (typeof v === 'number' && Number.isFinite(v)) patch.lastSyncAtMs = v
      else
        return reply.status(400).send({ error: 'VALIDATION', message: 'lastSyncAtMs must be number or null' })
    }
    const rollingPatch = readRollingMaxMsFromBody(body)
    if (rollingPatch.err) {
      return reply.status(400).send({ error: 'VALIDATION', message: rollingPatch.err })
    }
    if (rollingPatch.v !== undefined) {
      patch.rollingMaxMs = rollingPatch.v
    }

    if (Object.keys(patch).length === 0) {
      return reply.status(400).send({ error: 'VALIDATION', message: 'No fields to update' })
    }

    try {
      const row = updateDeviceAdmin(getPlatformDb(), productKey, mid, patch)
      persistPlatformDb()
      return reply.send({ device: row })
    } catch (e) {
      if (e instanceof Error) {
        if (e.message === 'NOT_FOUND') return reply.status(404).send({ error: 'NOT_FOUND' })
        if (e.message === 'EXPIRY_REQUIRED') {
          return reply.status(400).send({
            error: 'VALIDATION',
            message: 'expiresAtMs is required for non-lifetime tiers (or switch tier to lifetime)',
          })
        }
        if (e.message === 'INVALID_LAST_SYNC') {
          return reply.status(400).send({ error: 'VALIDATION', message: 'Invalid lastSyncAtMs' })
        }
      }
      throw e
    }
  })

  app.delete<{
    Params: { machineId: string }
  }>('/api/platform/admin/devices/:machineId', async (req, reply) => {
    const productKey = productFromQuery(req.query)
    const mid = req.params.machineId.trim()
    const ok = deleteDevice(getPlatformDb(), productKey, mid)
    if (!ok) return reply.status(404).send({ error: 'NOT_FOUND' })
    persistPlatformDb()
    return reply.send({ ok: true })
  })

  app.patch<{
    Params: { machineId: string }
    Body: { revoked?: boolean }
  }>('/api/platform/admin/devices/:machineId/revoke', async (req, reply) => {
    const productKey = productFromQuery(req.query)
    const mid = req.params.machineId.trim()
    const revoked = Boolean(req.body?.revoked)
    const existing = findDevice(getPlatformDb(), productKey, mid)
    if (!existing) return reply.status(404).send({ error: 'NOT_FOUND' })
    setRevoked(getPlatformDb(), productKey, mid, revoked)
    persistPlatformDb()
    return reply.send({ ok: true, device: findDevice(getPlatformDb(), productKey, mid) })
  })
}
