import 'dotenv/config'
import { z } from 'zod'

/**
 * Centralized, validated environment config.
 * Fail fast at boot if anything is missing or malformed.
 */

const Schema = z.object({
  NODE_ENV: z.enum(['development', 'staging', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(5000),
  FRONTEND_URL: z.string().url().default('http://localhost:5173'),

  DATABASE_URL: z.string().min(1),
  REDIS_URL: z
    .string()
    .optional()
    .transform((v) => (v && v.length > 0 ? v : undefined)),

  JWT_SECRET: z.string().min(16, 'JWT_SECRET must be at least 16 chars'),
  JWT_REFRESH_SECRET: z.string().min(16, 'JWT_REFRESH_SECRET must be at least 16 chars'),
  JWT_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),

  // Provider mock toggles
  PROXMOX_MOCK_MODE: z.enum(['true', 'false']).default('true'),
  CLOUDFLARE_MOCK_MODE: z.enum(['true', 'false']).default('true'),
  GRAFANA_MOCK_MODE: z.enum(['true', 'false']).default('true'),
  ZABBIX_MOCK_MODE: z.enum(['true', 'false']).default('true'),
  EMAIL_MOCK_MODE: z.enum(['true', 'false']).optional(),
  SMS_PROVIDER: z.enum(['twilio', 'msg91', 'mock']).default('mock'),
  MINIO_MOCK_MODE: z.enum(['true', 'false']).default('true'),

  // Optional providers
  PROXMOX_HOST: z.string().optional(),
  PROXMOX_NODE: z.string().default('pve'),
  PROXMOX_TOKEN_ID: z.string().optional(),
  PROXMOX_TOKEN_SECRET: z.string().optional(),

  CLOUDFLARE_API_TOKEN: z.string().optional(),
  CLOUDFLARE_ZONE_ID: z.string().optional(),
  CLOUDFLARE_DOMAIN: z.string().default('netlayer.com'),

  GRAFANA_URL: z.string().url().optional(),
  GRAFANA_API_KEY: z.string().optional(),
  GRAFANA_DATASOURCE_ID: z.coerce.number().int().positive().default(1),

  ZABBIX_URL: z.string().url().optional(),
  ZABBIX_USER: z.string().default('Admin'),
  ZABBIX_PASSWORD: z.string().optional(),

  RESEND_API_KEY: z.string().optional(),
  RESEND_FROM: z.string().default('NetLayer Cloud <noreply@netlayer.com>'),

  RAZORPAY_KEY_ID: z.string().optional(),
  RAZORPAY_KEY_SECRET: z.string().optional(),
  RAZORPAY_WEBHOOK_SECRET: z.string().optional(),

  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_PUBLISHABLE_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),

  TWILIO_ACCOUNT_SID: z.string().optional(),
  TWILIO_AUTH_TOKEN: z.string().optional(),
  TWILIO_FROM: z.string().optional(),

  MSG91_API_KEY: z.string().optional(),
  MSG91_SENDER: z.string().default('NETLYR'),

  // Object Storage (MinIO / S3 compatible)
  MINIO_ENDPOINT: z.string().optional(),
  MINIO_ACCESS_KEY: z.string().optional(),
  MINIO_SECRET_KEY: z.string().optional(),
  MINIO_BUCKET_PREFIX: z.string().default('netlayer'),
  MINIO_REGION: z.string().default('us-east-1'),

  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
  LOG_PRETTY: z.enum(['true', 'false']).default('true'),

  // Operational
  METRICS_ENABLED: z.enum(['true', 'false']).default('true'),
  IDEMPOTENCY_TTL_SECONDS: z.coerce.number().int().positive().default(86400),
})

const parsed = Schema.safeParse(process.env)

if (!parsed.success) {
  // Print a clear list of the failures and exit non-zero.
  // We can't use the structured logger here yet — it depends on this module.
  // eslint-disable-next-line no-console
  console.error('❌ Invalid environment configuration:')
  for (const issue of parsed.error.issues) {
    // eslint-disable-next-line no-console
    console.error(`  - ${issue.path.join('.')}: ${issue.message}`)
  }
  process.exit(1)
}

const env = parsed.data

export const config = {
  ...env,
  isProd: env.NODE_ENV === 'production',
  isDev: env.NODE_ENV === 'development',
  proxmoxMock: env.PROXMOX_MOCK_MODE === 'true',
  cloudflareMock: env.CLOUDFLARE_MOCK_MODE === 'true',
  grafanaMock: env.GRAFANA_MOCK_MODE === 'true',
  zabbixMock: env.ZABBIX_MOCK_MODE === 'true',
  emailMock: env.EMAIL_MOCK_MODE === 'true' || !env.RESEND_API_KEY,
  metricsEnabled: env.METRICS_ENABLED === 'true',
  logPretty: env.LOG_PRETTY === 'true',
  minioMock: env.MINIO_MOCK_MODE === 'true' || !env.MINIO_ENDPOINT,
}

export type Config = typeof config
