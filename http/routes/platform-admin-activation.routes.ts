import type { FastifyInstance } from 'fastify'
import { getPlatformDb, persistPlatformDb } from '../../db/platform-db.js'
import { parsePlatformProductKey, type PlatformProductKey } from '../../shared/platform-product.js'
import type { ActivationRequestState } from '../../shared/types/platform-activation.js'
import {
  deleteActivationRequest,
  findActivationRequest,
  listActivationRequests,
  setActivationDecision,
} from '../../services/platform-activation.service.js'
import {
  parseDeviceActivationInput,
  resolveApproveDeviceFields,
} from '../../services/platform-device-admin-input.js'
import {
  findDevice,
  updateDeviceStoreSnapshot,
  upsertDevice,
} from '../../services/platform-device.service.js'

function productFromQuery(query: unknown): PlatformProductKey {
  const q = query as { product?: string }
  return parsePlatformProductKey(q?.product)
}

function parseStatusFilter(raw: unknown): ActivationRequestState | undefined {
  if (typeof raw !== 'string' || !raw.trim()) return undefined
  const s = raw.trim()
  if (s === 'pending' || s === 'declined' || s === 'approved') return s
  return undefined
}

export async function registerPlatformAdminActivationRoutes(app: FastifyInstance): Promise<void> {
  app.get<{
    Querystring: { product?: string; status?: string }
  }>('/api/platform/admin/activation-requests', async (req, reply) => {
    const productKey = productFromQuery(req.query)
    const status = parseStatusFilter(req.query?.status)
    const requests = listActivationRequests(getPlatformDb(), productKey, status)
    return reply.send({ requests })
  })

  app.post<{
    Params: { machineId: string }
    Querystring: { product?: string }
    Body: {
      tier?: string
      label?: string | null
      notes?: string | null
      customValidForMs?: number
      rollingMaxMs?: number | null
      allowRevoked?: boolean
    }
  }>('/api/platform/admin/activation-requests/:machineId/approve', async (req, reply) => {
    const productKey = productFromQuery(req.query)
    const mid = req.params.machineId.trim()
    const db = getPlatformDb()

    const request = findActivationRequest(db, productKey, mid)
    if (!request) {
      return reply.status(404).send({ error: 'NOT_FOUND' })
    }

    const parsed = parseDeviceActivationInput(req.body, { isNew: true })
    if (!parsed.ok) {
      return reply.status(400).send({
        error: parsed.error,
        ...(parsed.message ? { message: parsed.message } : {}),
      })
    }

    const existing = findDevice(db, productKey, mid)
    if (existing?.revoked && req.body?.allowRevoked !== true) {
      return reply.status(409).send({
        error: 'DEVICE_REVOKED',
        message: 'Device is revoked. Set allowRevoked to restore access deliberately.',
      })
    }

    const { label, notes } = resolveApproveDeviceFields(request, parsed)

    try {
      upsertDevice(db, {
        productKey,
        machineId: mid,
        label,
        tier: parsed.tier,
        notes,
        renew: true,
        customValidForMs: parsed.customValidForMs,
        rollingMaxMs: parsed.rollingMaxMs,
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

    updateDeviceStoreSnapshot(db, productKey, mid, request.store)
    const updatedRequest = setActivationDecision(db, productKey, mid, 'approved')
    const deviceOut = findDevice(db, productKey, mid)
    if (!deviceOut) throw new Error('DEVICE_MISSING')
    persistPlatformDb()

    return reply.send({ device: deviceOut, request: updatedRequest })
  })

  app.post<{
    Params: { machineId: string }
    Querystring: { product?: string }
    Body: { reason?: string | null }
  }>('/api/platform/admin/activation-requests/:machineId/decline', async (req, reply) => {
    const productKey = productFromQuery(req.query)
    const mid = req.params.machineId.trim()
    const db = getPlatformDb()

    const existing = findActivationRequest(db, productKey, mid)
    if (!existing) {
      return reply.status(404).send({ error: 'NOT_FOUND' })
    }

    const reason = req.body?.reason
    const declineReason =
      reason === undefined || reason === null ? null : typeof reason === 'string' ? reason : String(reason)

    const request = setActivationDecision(db, productKey, mid, 'declined', declineReason)
    persistPlatformDb()

    return reply.send({ request })
  })

  app.delete<{
    Params: { machineId: string }
    Querystring: { product?: string }
  }>('/api/platform/admin/activation-requests/:machineId', async (req, reply) => {
    const productKey = productFromQuery(req.query)
    const mid = req.params.machineId.trim()
    const db = getPlatformDb()
    const ok = deleteActivationRequest(db, productKey, mid)
    if (!ok) return reply.status(404).send({ error: 'NOT_FOUND' })
    persistPlatformDb()
    return reply.send({ ok: true })
  })
}
