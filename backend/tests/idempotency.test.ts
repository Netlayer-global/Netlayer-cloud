import { describe, it, expect } from 'vitest'
import request from 'supertest'
import { randomUUID } from 'crypto'
import app from '../src/app'

/**
 * Without Redis, the idempotency middleware falls open (no caching).
 * That's the documented dev behavior. These tests verify the middleware
 * doesn't break the request path when Redis is absent. Cache-replay
 * coverage runs in CI where Redis is available.
 */

describe('idempotency middleware (no-Redis fallback)', () => {
  it('passes Idempotency-Key through without breaking', async () => {
    const key = randomUUID()
    const res = await request(app)
      .post('/api/auth/login')
      .set('Idempotency-Key', key)
      .send({ email: 'nope@example.test', password: 'wrong' })
    // Whether 401 (auth fail) or 200 (cache hit if redis), the middleware
    // must not error out and the response must be a JSON envelope.
    expect([200, 401, 423, 429]).toContain(res.status)
    expect(res.headers['content-type']).toMatch(/json/)
  })
})
