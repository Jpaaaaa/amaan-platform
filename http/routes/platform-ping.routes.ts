import type { Database as SqlDatabase } from 'sql.js'
import type { FastifyInstance } from 'fastify'
import { getPlatformDb, persistPlatformDb } from '../../db/platform-db.js'
import { parsePlatformProductKey } from '../../shared/platform-product.js'
import { parseKpisIqd, parseStoreSnapshot } from '../../shared/store-profile-validation.js'
import type { PlatformActivationStatus } from '../../shared/types/platform-activation.js'
import { findActivationRequest } from '../../services/platform-activation.service.js'
import {
  buildPingResponse,
  findDevice,
  recordSync,
  updateDeviceKpiSnapshot,
  updateDeviceStoreSnapshot,
} from '../../services/platform-device.service.js'

function activationStatusForUnknown(
  database: SqlDatabase,
  productKey: ReturnType<typeof parsePlatformProductKey>,
  machineId: string,
): PlatformActivationStatus {
  const row = findActivationRequest(database, productKey, machineId)
  if (!row) return 'none'
  if (row.status === 'pending') return 'pending'
  if (row.status === 'declined') return 'declined'
  return 'none'
}

export async function registerPlatformPingRoutes(app: FastifyInstance): Promise<void> {
  app.post<{
    Body: {
      machineId?: string
      product?: string
      store?: unknown
      kpisIqd?: unknown
    }
  }>('/api/platform/v1/ping', async (req, reply) => {
    const machineId = typeof req.body?.machineId === 'string' ? req.body.machineId.trim() : ''
    if (!machineId) {
      return reply.status(400).send({ error: 'VALIDATION', message: 'machineId required' })
    }
    const productKey = parsePlatformProductKey(
      typeof req.body?.product === 'string' ? req.body.product : undefined,
    )

    const store = parseStoreSnapshot(req.body?.store)
    const kpisIqd = parseKpisIqd(req.body?.kpisIqd)

    const database = getPlatformDb()
    const rowBefore = findDevice(database, productKey, machineId)

    if (!rowBefore) {
      const response = buildPingResponse(null)
      return reply.send({
        ...response,
        activationStatus: activationStatusForUnknown(database, productKey, machineId),
      })
    }

    if (rowBefore.revoked) {
      return reply.send(buildPingResponse(rowBefore))
    }

    if (store) {
      updateDeviceStoreSnapshot(database, productKey, machineId, store)
    }
    if (kpisIqd) {
      updateDeviceKpiSnapshot(database, productKey, machineId, kpisIqd)
    }

    recordSync(database, productKey, machineId)
    persistPlatformDb()

    const rowAfter = findDevice(database, productKey, machineId)
    return reply.send(buildPingResponse(rowAfter))
  })
}
