import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { after, before, describe, it } from 'node:test'
import { closePlatformDb, initPlatformDb } from '../../db/platform-db.js'
import { createPlatformApp } from '../../http/platform-server.js'
import { resolvePlatformAdminAuthState } from '../../http/platform-admin-auth.js'
import { clearActivationRateLimitsForTests } from '../../http/routes/platform-activation.routes.js'

const ADMIN_PASSWORD = 'test-platform-admin-password'
const PRODUCT = 'bazar_one'
const PQ = `?product=${encodeURIComponent(PRODUCT)}`

const STORE = {
  storeName: 'Al Noor Market',
  phone: '07700001111',
  addressLine: 'Street 1',
  city: 'Baghdad',
  storeType: 'supermarket',
  ownerContactName: 'Ali',
}

/** 40-char hex machine id (MACHINE_ID_RE). */
function mid(hexPrefix: string): string {
  const h = hexPrefix.replace(/[^0-9a-f]/gi, 'a').toLowerCase()
  return (h + '0'.repeat(40)).slice(0, 40)
}

async function loginAdmin(
  app: Awaited<ReturnType<typeof createPlatformApp>>,
): Promise<{ authorization: string }> {
  const r = await app.inject({
    method: 'POST',
    url: '/api/platform/auth/login',
    payload: { password: ADMIN_PASSWORD },
  })
  assert.equal(r.statusCode, 200)
  const token = (r.json() as { token: string }).token
  return { authorization: `Bearer ${token}` }
}

describe('platform API', { concurrency: false }, () => {
  let tmpDir = ''
  let savedPassword: string | undefined
  let app: Awaited<ReturnType<typeof createPlatformApp>>
  let AUTH: { authorization: string }

  before(async () => {
    savedPassword = process.env.PLATFORM_ADMIN_PASSWORD
    process.env.PLATFORM_ADMIN_PASSWORD = ADMIN_PASSWORD
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'amaan-platform-api-'))
    await initPlatformDb(path.join(tmpDir, 'platform.db'))
    const authState = resolvePlatformAdminAuthState()
    app = await createPlatformApp({ logger: false, authState })
    AUTH = await loginAdmin(app)
  })

  after(async () => {
    await app.close()
    closePlatformDb()
    fs.rmSync(tmpDir, { recursive: true, force: true })
    if (savedPassword == null) delete process.env.PLATFORM_ADMIN_PASSWORD
    else process.env.PLATFORM_ADMIN_PASSWORD = savedPassword
  })

  it('health is public and reports jwt when password is set', async () => {
    const r = await app.inject({ method: 'GET', url: '/api/platform/health' })
    assert.equal(r.statusCode, 200)
    const body = r.json() as { ok: boolean; adminAuth: string }
    assert.equal(body.ok, true)
    assert.equal(body.adminAuth, 'jwt')
  })

  it('ping works without a token', async () => {
    const r = await app.inject({
      method: 'POST',
      url: '/api/platform/v1/ping',
      payload: { machineId: mid('01'), product: PRODUCT },
    })
    assert.equal(r.statusCode, 200)
    const body = r.json() as { status: string; ok: boolean }
    assert.equal(body.ok, false)
    assert.equal(body.status, 'unknown_device')
  })

  it('admin devices without token → 401', async () => {
    const r = await app.inject({ method: 'GET', url: `/api/platform/admin/devices${PQ}` })
    assert.equal(r.statusCode, 401)
    assert.equal((r.json() as { error: string }).error, 'UNAUTHORIZED')
  })

  it('admin devices with wrong token → 401', async () => {
    const r = await app.inject({
      method: 'GET',
      url: `/api/platform/admin/devices${PQ}`,
      headers: { authorization: 'Bearer wrong-token' },
    })
    assert.equal(r.statusCode, 401)
  })

  it('admin devices with JWT → 200', async () => {
    const r = await app.inject({
      method: 'GET',
      url: `/api/platform/admin/devices${PQ}`,
      headers: AUTH,
    })
    assert.equal(r.statusCode, 200)
    assert.ok(Array.isArray((r.json() as { devices: unknown[] }).devices))
  })

  it('admin updates list requires JWT', async () => {
    const r = await app.inject({ method: 'GET', url: `/api/platform/admin/updates/files${PQ}` })
    assert.equal(r.statusCode, 401)
  })

  it('unset PLATFORM_ADMIN_PASSWORD → admin routes open (adminAuth none)', async () => {
    const prev = process.env.PLATFORM_ADMIN_PASSWORD
    delete process.env.PLATFORM_ADMIN_PASSWORD
    try {
      const openApp = await createPlatformApp({ logger: false })
      const health = await openApp.inject({ method: 'GET', url: '/api/platform/health' })
      assert.equal((health.json() as { adminAuth: string }).adminAuth, 'none')
      const r = await openApp.inject({ method: 'GET', url: `/api/platform/admin/devices${PQ}` })
      assert.equal(r.statusCode, 200)
      await openApp.close()
    } finally {
      if (prev == null) delete process.env.PLATFORM_ADMIN_PASSWORD
      else process.env.PLATFORM_ADMIN_PASSWORD = prev
    }
  })

  it('submit → pending ping → approve by machineId → next ping ok', async () => {
    clearActivationRateLimitsForTests()
    const machineId = mid('02')
    const submitted = await app.inject({
      method: 'POST',
      url: '/api/platform/v1/activation-requests',
      payload: { machineId, product: PRODUCT, ...STORE },
    })
    assert.equal(submitted.statusCode, 200)
    assert.equal((submitted.json() as { ok: boolean }).ok, true)

    const pendingPing = await app.inject({
      method: 'POST',
      url: '/api/platform/v1/ping',
      payload: { machineId, product: PRODUCT },
    })
    const pendingBody = pendingPing.json() as { status: string; activationStatus?: string; ok: boolean }
    assert.equal(pendingBody.status, 'unknown_device')
    assert.equal(pendingBody.activationStatus, 'pending')
    assert.equal(pendingBody.ok, false)

    const approve = await app.inject({
      method: 'POST',
      url: `/api/platform/admin/activation-requests/${encodeURIComponent(machineId)}/approve${PQ}`,
      headers: AUTH,
      payload: { tier: '5d', renew: true },
    })
    assert.equal(approve.statusCode, 200)

    const okPing = await app.inject({
      method: 'POST',
      url: '/api/platform/v1/ping',
      payload: { machineId, product: PRODUCT },
    })
    const okBody = okPing.json() as { ok: boolean; status: string }
    assert.equal(okBody.ok, true)
    assert.equal(okBody.status, 'active')
  })

  it('decline surfaces activationStatus declined on ping', async () => {
    clearActivationRateLimitsForTests()
    const machineId = mid('03')
    await app.inject({
      method: 'POST',
      url: '/api/platform/v1/activation-requests',
      payload: {
        machineId,
        product: PRODUCT,
        storeName: 'Declined Shop',
        phone: '07700002222',
        addressLine: 'Street 2',
        storeType: 'general',
      },
    })
    const decline = await app.inject({
      method: 'POST',
      url: `/api/platform/admin/activation-requests/${encodeURIComponent(machineId)}/decline${PQ}`,
      headers: AUTH,
      payload: { reason: 'Call support first' },
    })
    assert.equal(decline.statusCode, 200)
    const ping = await app.inject({
      method: 'POST',
      url: '/api/platform/v1/ping',
      payload: { machineId, product: PRODUCT },
    })
    const body = ping.json() as { ok: boolean; status: string; activationStatus?: string }
    assert.equal(body.ok, false)
    assert.equal(body.status, 'unknown_device')
    assert.equal(body.activationStatus, 'declined')
  })

  it('resubmit updates the pending row store name', async () => {
    clearActivationRateLimitsForTests()
    const machineId = mid('04')
    await app.inject({
      method: 'POST',
      url: '/api/platform/v1/activation-requests',
      payload: {
        machineId,
        product: PRODUCT,
        storeName: 'Old Name',
        phone: '07700003333',
        addressLine: 'Street 3',
        storeType: 'general',
      },
    })
    clearActivationRateLimitsForTests()
    await app.inject({
      method: 'POST',
      url: '/api/platform/v1/activation-requests',
      payload: {
        machineId,
        product: PRODUCT,
        storeName: 'New Name',
        phone: '07700003333',
        addressLine: 'Street 3',
        storeType: 'general',
      },
    })
    const list = await app.inject({
      method: 'GET',
      url: `/api/platform/admin/activation-requests${PQ}&status=pending`,
      headers: AUTH,
    })
    assert.equal(list.statusCode, 200)
    const row = (list.json() as { requests: { machineId: string; store: { storeName: string } }[] }).requests.find(
      (r) => r.machineId === machineId,
    )
    assert.ok(row)
    assert.equal(row.store.storeName, 'New Name')
  })

  it('unknown ping does not create a device row', async () => {
    const machineId = mid('05')
    const ping = await app.inject({
      method: 'POST',
      url: '/api/platform/v1/ping',
      payload: {
        machineId,
        product: PRODUCT,
        kpisIqd: {
          month: { revenueCents: 9_999, grossProfitCents: 1, saleCount: 3 },
          year: { revenueCents: 9_999, grossProfitCents: 1, saleCount: 3 },
        },
      },
    })
    assert.equal((ping.json() as { status: string }).status, 'unknown_device')
    const list = await app.inject({
      method: 'GET',
      url: `/api/platform/admin/devices${PQ}`,
      headers: AUTH,
    })
    const devices = (list.json() as { devices: { machineId: string }[] }).devices
    assert.equal(devices.some((d) => d.machineId === machineId), false)
  })

  it('known device ping stores store and KPI columns on device row', async () => {
    const machineId = mid('06')
    const created = await app.inject({
      method: 'POST',
      url: `/api/platform/admin/devices${PQ}`,
      headers: AUTH,
      payload: { machineId, tier: 'lifetime', renew: true, label: 'KPI shop', product: PRODUCT },
    })
    assert.equal(created.statusCode, 200)
    const ping = await app.inject({
      method: 'POST',
      url: '/api/platform/v1/ping',
      payload: {
        machineId,
        product: PRODUCT,
        store: { storeName: 'KPI shop', storeType: 'electronics', phone: '0770', addressLine: 'A' },
        kpisIqd: {
          month: { revenueCents: 150_000, grossProfitCents: 40_000, saleCount: 2 },
          year: { revenueCents: 400_000, grossProfitCents: 90_000, saleCount: 8 },
        },
      },
    })
    assert.equal((ping.json() as { ok: boolean }).ok, true)
    const list = await app.inject({
      method: 'GET',
      url: `/api/platform/admin/devices${PQ}`,
      headers: AUTH,
    })
    const row = (list.json() as {
      devices: Array<{
        machineId: string
        storeType: string | null
        kpiUpdatedAtMs: number | null
        kpiMonthRevenueCents: number | null
        kpiYearGrossProfitCents: number | null
      }>
    }).devices.find((d) => d.machineId === machineId)
    assert.ok(row)
    assert.equal(row.storeType, 'electronics')
    assert.equal(row.kpiMonthRevenueCents, 150_000)
    assert.equal(row.kpiYearGrossProfitCents, 90_000)
    assert.ok(row.kpiUpdatedAtMs != null && row.kpiUpdatedAtMs > 0)
  })
})
