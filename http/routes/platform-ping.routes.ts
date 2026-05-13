import type { FastifyInstance } from 'fastify'
import { getPlatformDb, persistPlatformDb } from '../../db/platform-db.js'
import { parsePlatformProductKey } from '../../shared/platform-product.js'
import {
  buildPingResponse,
  findDevice,
  recordSync,
} from '../../services/platform-device.service.js'

export async function registerPlatformPingRoutes(app: FastifyInstance): Promise<void> {
  app.post<{
    Body: { machineId?: string; product?: string }
  }>('/api/platform/v1/ping', async (req, reply) => {
    const machineId = typeof req.body?.machineId === 'string' ? req.body.machineId.trim() : ''
    if (!machineId) {
      return reply.status(400).send({ error: 'VALIDATION', message: 'machineId required' })
    }
    const productKey = parsePlatformProductKey(
      typeof req.body?.product === 'string' ? req.body.product : undefined,
    )

    const database = getPlatformDb()
    const rowBefore = findDevice(database, productKey, machineId)

    if (!rowBefore) {
      return reply.send(buildPingResponse(null))
    }

    if (rowBefore.revoked) {
      return reply.send(buildPingResponse(rowBefore))
    }

    recordSync(database, productKey, machineId)
    persistPlatformDb()

    const rowAfter = findDevice(database, productKey, machineId)
    return reply.send(buildPingResponse(rowAfter))
  })
}
