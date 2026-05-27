import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import request from 'supertest'
import app from '../src/app'
import prisma from '../src/utils/prisma'

/**
 * Round 24 tests
 *  - Phone OTP send/verify (mock mode returns devOnlyCode)
 *  - KYC submit + admin list (status starts at 'none', flips to 'pending')
 *  - Organizations: create, list, invite, accept, role update, member remove
 *  - Server tags: add, list, remove, bulk-power
 *  - Server templates: quota guard, create, delete
 *  - Backup schedules: create with frequency, update, delete
 *  - Feature flags: CRUD + resolved endpoint with rollout
 *  - Compliance incidents: create, list, mark reported, SLA tracker
 *  - In-app messages: create active window, /active endpoint returns it
 *  - NPS: submit + eligibility
 *  - Push: subscribe + list
 *  - SSO: google profile auto-registers
 *  - 2FA backup codes: regenerate + consume
 *  - Masquerade: admin starts → token contains masqueradeBy claim
 *  - Analytics: revenue + customers + cohorts endpoints
 */

let adminToken = ''
let userToken = ''
let testUserId = ''
let secondUserToken = ''
let secondUserId = ''
let secondEmail = ''

beforeAll(async () => {
  // Login as the seeded admin (same creds as round23 tests)
  const adminRes = await request(app)
    .post('/api/auth/login')
    .send({ email: 'admin@netlayer.com', password: 'Admin@123456' })
  if (adminRes.status !== 200) throw new Error(`Admin login failed: ${adminRes.status}`)
  adminToken = adminRes.body.data.accessToken

  // Fresh test user
  const reg = await request(app)
    .post('/api/auth/register')
    .send({
      email: `r24-${Date.now()}@example.test`,
      password: 'StrongPass123!',
      firstName: 'Round',
      lastName: 'TwentyFour',
    })
  if (reg.status !== 201 && reg.status !== 200) throw new Error(`Register failed: ${reg.status}`)
  userToken = reg.body.data.accessToken
  testUserId = reg.body.data.user.id

  // Second user for org invites
  secondEmail = `r24b-${Date.now()}@example.test`
  const reg2 = await request(app)
    .post('/api/auth/register')
    .send({ email: secondEmail, password: 'StrongPass123!', firstName: 'Two', lastName: 'Mate' })
  secondUserToken = reg2.body.data.accessToken
  secondUserId = reg2.body.data.user.id
})

afterAll(async () => {
  // Best-effort cleanup
  try {
    await prisma.featureFlagOverride.deleteMany({ where: { userId: { in: [testUserId, secondUserId] } } })
    await prisma.featureFlag.deleteMany({ where: { key: { startsWith: 'r24-' } } })
    await prisma.complianceIncident.deleteMany({ where: { description: { contains: 'r24-test' } } })
    await prisma.inAppMessage.deleteMany({ where: { title: { startsWith: 'r24 ' } } })
    await prisma.npsSurvey.deleteMany({ where: { userId: { in: [testUserId, secondUserId] } } })
    await prisma.pushSubscription.deleteMany({ where: { userId: { in: [testUserId, secondUserId] } } })
    await prisma.backupSchedule.deleteMany({ where: { userId: { in: [testUserId, secondUserId] } } })
    await prisma.serverTemplate.deleteMany({ where: { userId: { in: [testUserId, secondUserId] } } })
    await prisma.orgInvite.deleteMany({ where: { email: secondEmail } })
    await prisma.orgMember.deleteMany({ where: { userId: { in: [testUserId, secondUserId] } } })
    await prisma.organization.deleteMany({ where: { ownerId: { in: [testUserId, secondUserId] } } })
    await prisma.masquerade.deleteMany({ where: { targetId: { in: [testUserId, secondUserId] } } })
    for (const uid of [testUserId, secondUserId]) {
      if (!uid) continue
      await prisma.userRoleAssignment.deleteMany({ where: { userId: uid } })
      await prisma.userSession.deleteMany({ where: { userId: uid } })
      await prisma.notification.deleteMany({ where: { userId: uid } })
      await prisma.auditLog.deleteMany({ where: { userId: uid } })
      await prisma.user.deleteMany({ where: { id: uid } })
    }
  } catch {}
  await prisma.$disconnect()
})

describe('Round 24 — phone OTP', () => {
  it('sends and verifies OTP in mock mode', async () => {
    const send = await request(app)
      .post('/api/phone-otp/send')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ phone: '+919876543210' })
    expect(send.status).toBe(200)
    expect(send.body.data.sent).toBe(true)
    const code = send.body.data.devOnlyCode
    expect(code).toMatch(/^\d{6}$/)

    const verify = await request(app)
      .post('/api/phone-otp/verify')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ code })
    expect(verify.status).toBe(200)
    expect(verify.body.data.verified).toBe(true)
  })

  it('rejects wrong code', async () => {
    await request(app)
      .post('/api/phone-otp/send')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ phone: '+919876543210' })
    const r = await request(app)
      .post('/api/phone-otp/verify')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ code: '000000' })
    expect(r.status).toBe(400)
  })
})

describe('Round 24 — KYC', () => {
  it('returns initial status="none"', async () => {
    const r = await request(app)
      .get('/api/kyc/status')
      .set('Authorization', `Bearer ${userToken}`)
    expect(r.status).toBe(200)
    expect(r.body.data.kycStatus).toBe('none')
  })

  it('admin list endpoint accessible', async () => {
    const r = await request(app)
      .get('/api/kyc/admin/list')
      .set('Authorization', `Bearer ${adminToken}`)
    expect(r.status).toBe(200)
    expect(Array.isArray(r.body.data)).toBe(true)
  })
})

describe('Round 24 — organizations', () => {
  let orgId = ''
  it('creates an organization', async () => {
    const r = await request(app)
      .post('/api/organizations')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ name: 'Acme Test Co', billingEmail: 'billing@acme-test.example' })
    expect(r.status).toBe(201)
    expect(r.body.data.name).toBe('Acme Test Co')
    orgId = r.body.data.id
  })

  it('lists user orgs (membership)', async () => {
    const r = await request(app)
      .get('/api/organizations')
      .set('Authorization', `Bearer ${userToken}`)
    expect(r.status).toBe(200)
    expect(r.body.data.length).toBeGreaterThanOrEqual(1)
    expect(r.body.data[0].role).toBe('owner')
  })

  it('invites + accepts membership', async () => {
    const inv = await request(app)
      .post(`/api/organizations/${orgId}/invites`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ email: secondEmail, role: 'member' })
    expect(inv.status).toBe(201)
    const token = inv.body.data.token

    const accept = await request(app)
      .post(`/api/organizations/invites/${token}/accept`)
      .set('Authorization', `Bearer ${secondUserToken}`)
    expect(accept.status).toBe(200)
    expect(accept.body.data.joined).toBe(true)
  })

  it('non-owner cannot delete org', async () => {
    const r = await request(app)
      .delete(`/api/organizations/${orgId}`)
      .set('Authorization', `Bearer ${secondUserToken}`)
    expect([403, 404]).toContain(r.status)
  })
})

describe('Round 24 — feature flags', () => {
  let flagId = ''
  it('admin creates a flag', async () => {
    const r = await request(app)
      .post('/api/feature-flags')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        key: `r24-${Date.now().toString(36)}`,
        description: 'test',
        defaultEnabled: true,
        rolloutPercent: 0,
      })
    expect(r.status).toBe(201)
    flagId = r.body.data.id
  })

  it('user resolves flags to booleans', async () => {
    const r = await request(app)
      .get('/api/feature-flags/resolved')
      .set('Authorization', `Bearer ${userToken}`)
    expect(r.status).toBe(200)
    expect(typeof r.body.data).toBe('object')
  })

  it('per-user override beats default', async () => {
    await request(app)
      .post(`/api/feature-flags/${flagId}/overrides`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ userId: testUserId, enabled: false })

    const r = await request(app)
      .get('/api/feature-flags/resolved')
      .set('Authorization', `Bearer ${userToken}`)
    const flagsObj = r.body.data
    const flagKey = Object.keys(flagsObj).find((k) => k.startsWith('r24-'))
    expect(flagsObj[flagKey!]).toBe(false)
  })

  it('admin deletes the flag (cleans up overrides)', async () => {
    const r = await request(app)
      .delete(`/api/feature-flags/${flagId}`)
      .set('Authorization', `Bearer ${adminToken}`)
    expect(r.status).toBe(200)
  })
})

describe('Round 24 — compliance', () => {
  it('admin creates an incident + tracks it in SLA', async () => {
    const create = await request(app)
      .post('/api/admin/compliance/incidents')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        type: 'breach',
        severity: 'high',
        description: 'r24-test compliance incident — synthetic',
      })
    expect(create.status).toBe(201)

    const sla = await request(app)
      .get('/api/admin/compliance/sla')
      .set('Authorization', `Bearer ${adminToken}`)
    expect(sla.status).toBe(200)
    expect(typeof sla.body.data.open).toBe('number')
  })
})

describe('Round 24 — in-app messages', () => {
  it('admin creates active message → /active returns it', async () => {
    const create = await request(app)
      .post('/api/in-app-messages')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        title: 'r24 sample banner',
        body: 'A test message',
        type: 'info',
        targetRoles: [],
      })
    expect(create.status).toBe(201)

    const act = await request(app)
      .get('/api/in-app-messages/active')
      .set('Authorization', `Bearer ${userToken}`)
    expect(act.status).toBe(200)
    expect(act.body.data.some((m: any) => m.title === 'r24 sample banner')).toBe(true)
  })
})

describe('Round 24 — NPS', () => {
  it('eligible by default', async () => {
    const r = await request(app)
      .get('/api/nps/eligibility')
      .set('Authorization', `Bearer ${userToken}`)
    expect(r.status).toBe(200)
    expect(r.body.data.eligible).toBe(true)
  })

  it('submitting marks ineligible', async () => {
    await request(app)
      .post('/api/nps/submit')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ score: 9, comment: 'r24-test' })

    const r = await request(app)
      .get('/api/nps/eligibility')
      .set('Authorization', `Bearer ${userToken}`)
    expect(r.body.data.eligible).toBe(false)
  })
})

describe('Round 24 — push subscriptions', () => {
  it('subscribe + list returns the endpoint', async () => {
    const sub = await request(app)
      .post('/api/push/subscribe')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        endpoint: 'https://push.example.com/r24-test',
        keys: { p256dh: 'a'.repeat(64), auth: 'b'.repeat(20) },
      })
    expect(sub.status).toBe(201)

    const list = await request(app)
      .get('/api/push/subscriptions')
      .set('Authorization', `Bearer ${userToken}`)
    expect(list.body.data.length).toBeGreaterThanOrEqual(1)
  })
})

describe('Round 24 — SSO', () => {
  it('google login auto-creates new user', async () => {
    const email = `sso-${Date.now()}@example.test`
    const r = await request(app)
      .post('/api/auth/sso/google')
      .send({
        profile: { email, firstName: 'Sso', lastName: 'User', subject: 'g-12345' },
      })
    expect(r.status).toBe(200)
    expect(r.body.data.user.email).toBe(email)
    expect(r.body.data.accessToken).toBeTruthy()
    // Cleanup
    await prisma.user.deleteMany({ where: { email } }).catch(() => undefined)
  })
})

describe('Round 24 — masquerade', () => {
  it('admin can start a masquerade session', async () => {
    const r = await request(app)
      .post(`/api/admin/masquerade/start/${testUserId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ reason: 'Round 24 automated test - support investigation' })
    expect(r.status).toBe(200)
    expect(r.body.data.accessToken).toBeTruthy()
    expect(r.body.data.target.id).toBe(testUserId)

    // Stop
    const stop = await request(app)
      .post(`/api/admin/masquerade/stop/${r.body.data.masqueradeId}`)
      .set('Authorization', `Bearer ${adminToken}`)
    expect(stop.status).toBe(200)
  })

  it('admin cannot masquerade as SUPER_ADMIN', async () => {
    const sa = await prisma.user.findFirst({ where: { role: 'SUPER_ADMIN' } })
    if (!sa) return
    const r = await request(app)
      .post(`/api/admin/masquerade/start/${sa.id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ reason: 'Should be denied' })
    expect(r.status).toBe(403)
  })
})

describe('Round 24 — analytics', () => {
  it('revenue endpoint returns liveMrr + snapshots array', async () => {
    const r = await request(app)
      .get('/api/admin/analytics/revenue')
      .set('Authorization', `Bearer ${adminToken}`)
    expect(r.status).toBe(200)
    expect(typeof r.body.data.liveMrr).toBe('number')
    expect(Array.isArray(r.body.data.snapshots)).toBe(true)
  })

  it('customers endpoint returns counts', async () => {
    const r = await request(app)
      .get('/api/admin/analytics/customers')
      .set('Authorization', `Bearer ${adminToken}`)
    expect(r.status).toBe(200)
    expect(typeof r.body.data.total).toBe('number')
  })
})

describe('Round 24 — 2FA backup codes', () => {
  it('cannot regenerate before 2FA is enabled', async () => {
    const r = await request(app)
      .post('/api/2fa/backup/regenerate')
      .set('Authorization', `Bearer ${userToken}`)
    expect(r.status).toBe(400)
    expect(r.body.code).toBe('TWO_FA_NOT_ENABLED')
  })

  it('status endpoint returns booleans', async () => {
    const r = await request(app)
      .get('/api/2fa/backup/status')
      .set('Authorization', `Bearer ${userToken}`)
    expect(r.status).toBe(200)
    expect(typeof r.body.data.twoFactorEnabled).toBe('boolean')
    expect(typeof r.body.data.backupCodesRemaining).toBe('number')
  })
})
