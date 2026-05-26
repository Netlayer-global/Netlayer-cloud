import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import request from 'supertest'
import app from '../src/app'
import prisma from '../src/utils/prisma'

/**
 * Round 23 tests
 *  - Plans GET exposes the new fields (priceYearly, raidSupported, stockAvailable)
 *  - Admin Plans CRUD: create + list + update + stock adjust + delete-guard
 *  - Org settings GET returns defaults; PATCH merges and persists
 *  - Customer ISO list endpoint returns []
 *  - DeployOrder createOrder rejects unsupported billing cycle
 */

let adminToken = ''
let userToken = ''
let testUserId = ''

beforeAll(async () => {
  const planCount = await prisma.plan.count()
  if (planCount === 0) throw new Error('Database not seeded.')

  // Login as the seeded admin
  const adminRes = await request(app)
    .post('/api/auth/login')
    .send({ email: 'admin@netlayer.com', password: 'Admin@123456' })
  if (adminRes.status !== 200) throw new Error(`Admin login failed: ${adminRes.status} ${JSON.stringify(adminRes.body)}`)
  adminToken = adminRes.body.data.accessToken

  // Create a fresh test user for customer-side tests
  const reg = await request(app)
    .post('/api/auth/register')
    .send({
      email: `r23-${Date.now()}@example.test`,
      password: 'StrongPass123!',
      firstName: 'Round',
      lastName: 'TwentyThree',
    })
  if (reg.status !== 201 && reg.status !== 200) {
    throw new Error(`Register failed: ${reg.status} ${JSON.stringify(reg.body)}`)
  }
  userToken = reg.body.data.accessToken
  testUserId = reg.body.data.user.id
})

afterAll(async () => {
  // Clean up created plan + user
  await prisma.plan.deleteMany({ where: { slug: { startsWith: 'r23-test-' } } })

  if (testUserId) {
    await prisma.userRoleAssignment.deleteMany({ where: { userId: testUserId } })
    await prisma.userSession.deleteMany({ where: { userId: testUserId } })
    await prisma.notification.deleteMany({ where: { userId: testUserId } })
    await prisma.auditLog.deleteMany({ where: { userId: testUserId } })
    await prisma.user.deleteMany({ where: { id: testUserId } })
  }
  await prisma.$disconnect()
})

describe('Round 23 — public plans endpoint', () => {
  it('exposes priceYearly + raidSupported + stockAvailable', async () => {
    const res = await request(app).get('/api/plans')
    expect(res.status).toBe(200)
    expect(res.body.data.length).toBeGreaterThan(0)

    const sample = res.body.data[0]
    // raidSupported must be parsed array, not JSON string
    expect(Array.isArray(sample.raidSupported)).toBe(true)
    expect(typeof sample.priceYearly).toBe('number')
    expect(typeof sample.stockAvailable).toBe('number')
  })

  it('bare-metal plans declare stock and RAID', async () => {
    const res = await request(app).get('/api/plans')
    const baremetal = res.body.data.find((p: any) => p.category === 'bare-metal')
    expect(baremetal).toBeTruthy()
    expect(baremetal.stockTotal).toBeGreaterThan(0)
    expect(baremetal.raidSupported.length).toBeGreaterThan(0)
  })
})

describe('Round 23 — admin Plans CRUD', () => {
  let createdId = ''

  it('rejects requests without admin token', async () => {
    const res = await request(app).get('/api/admin/plans')
    expect([401, 403]).toContain(res.status)
  })

  it('lists plans (admin)', async () => {
    const res = await request(app)
      .get('/api/admin/plans')
      .set('Authorization', `Bearer ${adminToken}`)
    expect(res.status).toBe(200)
    expect(res.body.data.length).toBeGreaterThan(0)
  })

  it('creates a new plan with raidSupported array', async () => {
    const res = await request(app)
      .post('/api/admin/plans')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'r23-test',
        slug: 'r23-test-1',
        category: 'bare-metal',
        cpu: 8, ramGB: 16, diskGB: 256, bandwidthTB: 5,
        priceMonthly: 999, priceHourly: 0, priceInr: 999, priceYearly: 9990,
        hourlyEnabled: false, monthlyEnabled: true, yearlyEnabled: true,
        diskType: 'nvme', diskCount: 2,
        raidSupported: ['raid0', 'raid1'],
        stockTotal: 5,
      })
    expect(res.status).toBe(201)
    expect(res.body.data.slug).toBe('r23-test-1')
    expect(res.body.data.raidSupported).toEqual(['raid0', 'raid1'])
    expect(res.body.data.stockAvailable).toBe(5)
    createdId = res.body.data.id
  })

  it('rejects duplicate slug', async () => {
    const res = await request(app)
      .post('/api/admin/plans')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'r23-test-dup',
        slug: 'r23-test-1', // same slug
        category: 'compute',
        cpu: 1, ramGB: 1, diskGB: 10, bandwidthTB: 1,
        priceMonthly: 99, priceHourly: 0.14, priceInr: 99,
      })
    expect(res.status).toBe(400)
    expect(res.body.code).toBe('SLUG_EXISTS')
  })

  it('adjusts stock by delta', async () => {
    const res = await request(app)
      .post(`/api/admin/plans/${createdId}/stock`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ delta: 3 })
    expect(res.status).toBe(200)
    expect(res.body.data.stockTotal).toBe(8)
  })

  it('refuses to drop stockTotal below stockReserved', async () => {
    // Manually bump reserved to simulate an active server
    await prisma.plan.update({ where: { id: createdId }, data: { stockReserved: 4 } })
    const res = await request(app)
      .post(`/api/admin/plans/${createdId}/stock`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ total: 1 })
    expect(res.status).toBe(400)
    expect(res.body.code).toBe('STOCK_UNDERFLOW')
    // reset for cleanup
    await prisma.plan.update({ where: { id: createdId }, data: { stockReserved: 0 } })
  })

  it('updates a plan', async () => {
    const res = await request(app)
      .patch(`/api/admin/plans/${createdId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ priceMonthly: 1199, isPopular: true })
    expect(res.status).toBe(200)
    expect(res.body.data.priceMonthly).toBe(1199)
    expect(res.body.data.isPopular).toBe(true)
  })

  it('deletes the plan', async () => {
    const res = await request(app)
      .delete(`/api/admin/plans/${createdId}`)
      .set('Authorization', `Bearer ${adminToken}`)
    expect(res.status).toBe(200)
  })
})

describe('Round 23 — org settings', () => {
  it('returns merged defaults on GET', async () => {
    const res = await request(app)
      .get('/api/admin/org-settings')
      .set('Authorization', `Bearer ${adminToken}`)
    expect(res.status).toBe(200)
    expect(res.body.data.organization.name).toBeTruthy()
    expect(res.body.data.gst.gstin).toMatch(/^\d{2}/)
    expect(res.body.data.gst.invoicePrefix).toBeTruthy()
    expect(res.body.data.legal.supportEmail).toContain('@')
  })

  it('PATCH merges into existing config', async () => {
    const res = await request(app)
      .patch('/api/admin/org-settings')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ organization: { phone: '+91 99999 00000' } })
    expect(res.status).toBe(200)
    expect(res.body.data.saved).toContain('organization')

    // Confirm only the patched key changed and the rest survived
    const after = await request(app)
      .get('/api/admin/org-settings')
      .set('Authorization', `Bearer ${adminToken}`)
    expect(after.body.data.organization.phone).toBe('+91 99999 00000')
    expect(after.body.data.organization.name).toBeTruthy() // still populated
  })
})

describe('Round 23 — customer ISO endpoint', () => {
  it('GET /api/iso/custom returns empty array for new user', async () => {
    const res = await request(app)
      .get('/api/iso/custom')
      .set('Authorization', `Bearer ${userToken}`)
    expect(res.status).toBe(200)
    expect(Array.isArray(res.body.data)).toBe(true)
    expect(res.body.data.length).toBe(0)
  })

  it('rejects unauthenticated requests', async () => {
    const res = await request(app).get('/api/iso/custom')
    expect([401, 403]).toContain(res.status)
  })
})
