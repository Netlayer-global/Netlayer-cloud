/**
 * Vitest setup. Runs once before all test files.
 *
 * Critical defaults so tests don't accidentally hit real services:
 *   - all provider mocks ON
 *   - Redis disabled (in-memory fallbacks)
 *   - quiet logger
 *   - JWT secrets pinned to deterministic values
 */

process.env.NODE_ENV = 'development'
process.env.LOG_LEVEL = 'error'
process.env.LOG_PRETTY = 'false'
process.env.METRICS_ENABLED = 'false'

process.env.JWT_SECRET = 'test-jwt-secret-change-in-prod-1234567890'
process.env.JWT_REFRESH_SECRET = 'test-jwt-refresh-secret-change-in-prod-1234567890'

process.env.PROXMOX_MOCK_MODE = 'true'
process.env.CLOUDFLARE_MOCK_MODE = 'true'
process.env.GRAFANA_MOCK_MODE = 'true'
process.env.ZABBIX_MOCK_MODE = 'true'
process.env.EMAIL_MOCK_MODE = 'true'
process.env.SMS_PROVIDER = 'mock'

process.env.REDIS_URL = ''
process.env.IDEMPOTENCY_TTL_SECONDS = '60'

// DATABASE_URL must already be set in .env for the test runner — we use the
// dev SQLite database. Tests must be hermetic: each test that mutates state
// rolls back its own changes, or asserts on read-only paths.
