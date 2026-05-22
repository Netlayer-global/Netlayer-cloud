import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import request from 'supertest'
import app from '../src/app'
import prisma from '../src/utils/prisma'

const TEST_EMAIL = `test-${Date.now()}@example.test`

beforeAll(async () => {
  // Ensure the seeded plans exist (read-only sanity check)
  const planCount = await prisma.plan.count()
  if (planCount === 0) {
    throw new Error('Database not seeded. Run `npx prisma db seed` first.')
  }
})

afterAll(async () => {
  // Clean up any test users we created — must remove dependent rows first
  // because Prisma+SQLite respects FK constraints.
  const users = await prisma.user.findMany({
    where: { email: { contains: '@example.test' } },
    select: { id: true },
  })
  const userIds = users.map((u) => u.id)
  if (userIds.length > 0) {
    await prisma.userRoleAssignment.deleteMany({ where: { userId: { in: userIds } } })
    await prisma.userSession.deleteMany({ where: { userId: { in: userIds } } })
    await prisma.notification.deleteMany({ where: { userId: { in: userIds } } })
    await prisma.auditLog.deleteMany({ where: { userId: { in: userIds } } })
    await prisma.user.deleteMany({ where: { id: { in: userIds } } })
  }
  await prisma.$disconnect()
})

describe('public endpoints', () => {
  it('GET /healthz returns ok', async () => {
    const res = await request(app).get('/healthz')
    expect(res.status).toBe(200)
    expect(res.body.status).toBe('ok')
  })

  it('GET /api/openapi.json returns the spec', async () => {
    const res = await request(app).get('/api/openapi.json')
    expect(res.status).toBe(200)
    expect(res.body.openapi).toBe('3.0.3')
    expect(res.body.info.title).toBe('NetLayer Cloud API')
  })

  it('GET /api/plans returns seeded plans', async () => {
    const res = await request(app).get('/api/plans')
    expect(res.status).toBe(200)
    expect(Array.isArray(res.body.data)).toBe(true)
    expect(res.body.data.length).toBeGreaterThan(0)
  })

  it('GET /api/regions returns seeded regions', async () => {
    const res = await request(app).get('/api/regions')
    expect(res.status).toBe(200)
    expect(res.body.data.length).toBeGreaterThan(0)
  })

  it('GET /api/os returns seeded OS templates', async () => {
    const res = await request(app).get('/api/os')
    expect(res.status).toBe(200)
    expect(res.body.data.length).toBeGreaterThan(0)
  })
})

describe('auth flow', () => {
  let accessToken: string

  it('rejects login with bad credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nope@example.test', password: 'wrong' })
    expect(res.status).toBe(401)
  })

  it('registers a fresh user', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        email: TEST_EMAIL,
        password: 'Valid12345',
        firstName: 'Test',
        lastName: 'User',
      })
    expect(res.status).toBe(201)
    expect(res.body.data.user.email).toBe(TEST_EMAIL)
    expect(res.body.data.accessToken).toMatch(/^eyJ/)
    accessToken = res.body.data.accessToken
  })

  it('rejects duplicate registration', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        email: TEST_EMAIL,
        password: 'Valid12345',
        firstName: 'Test',
        lastName: 'User',
      })
    expect(res.status).toBe(409)
  })

  it('logs in with correct credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: TEST_EMAIL, password: 'Valid12345' })
    expect(res.status).toBe(200)
    expect(res.body.data.accessToken).toMatch(/^eyJ/)
    accessToken = res.body.data.accessToken
  })

  it('GET /api/auth/me returns the user', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${accessToken}`)
    expect(res.status).toBe(200)
    expect(res.body.data.email).toBe(TEST_EMAIL)
    expect(res.body.data.role).toBe('USER')
  })

  it('GET /api/auth/me without token is 401', async () => {
    const res = await request(app).get('/api/auth/me')
    expect(res.status).toBe(401)
  })

  it('GET /api/servers returns empty list for new user', async () => {
    const res = await request(app)
      .get('/api/servers')
      .set('Authorization', `Bearer ${accessToken}`)
    expect(res.status).toBe(200)
    expect(res.body.data).toEqual([])
  })
})

describe('admin gating', () => {
  it('GET /api/admin/stats requires admin', async () => {
    // Login as the freshly-registered USER role
    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: TEST_EMAIL, password: 'Valid12345' })
    const token = login.body.data.accessToken

    const res = await request(app)
      .get('/api/admin/stats')
      .set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(403)
  })

  it('GET /api/admin/stats works for super admin', async () => {
    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: 'super@netlayer.com', password: 'Super@123456' })
    expect(login.status).toBe(200)
    const token = login.body.data.accessToken

    const res = await request(app)
      .get('/api/admin/stats')
      .set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(200)
    expect(res.body.data.users.total).toBeGreaterThanOrEqual(4)
    expect(res.body.data.nodes.total).toBeGreaterThanOrEqual(1)
  })
})
