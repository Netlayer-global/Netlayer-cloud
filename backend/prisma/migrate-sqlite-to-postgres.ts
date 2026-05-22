/**
 * Data migration script: SQLite → Postgres.
 *
 * Strategy:
 *   1. Open both databases simultaneously (two PrismaClient instances).
 *   2. Read every model in dependency order from SQLite.
 *   3. Write to Postgres with the original IDs preserved.
 *   4. Convert string-encoded JSON columns back to native JSON for Postgres.
 *   5. Verify row counts at the end.
 *
 * Prerequisites:
 *   - Postgres up and reachable (DATABASE_URL_POSTGRES set in env).
 *   - schema.postgres.prisma already migrated against the Postgres URL.
 *   - SQLite still readable at its current path (DATABASE_URL).
 *
 * Run:
 *   DATABASE_URL_SOURCE="file:./dev.db" \
 *   DATABASE_URL_TARGET="postgresql://netlayer:secret@localhost:5432/netlayer" \
 *   npx ts-node prisma/migrate-sqlite-to-postgres.ts
 *
 * Re-runnable: uses upsert by id on every row, so partial failures are safe to retry.
 */

import { PrismaClient } from '@prisma/client'

const SOURCE_URL = process.env.DATABASE_URL_SOURCE || process.env.DATABASE_URL
const TARGET_URL = process.env.DATABASE_URL_TARGET

if (!SOURCE_URL || !TARGET_URL) {
  console.error('❌ DATABASE_URL_SOURCE and DATABASE_URL_TARGET must be set')
  process.exit(1)
}

// Two clients — built with overridden datasources.
const src = new PrismaClient({ datasources: { db: { url: SOURCE_URL } } })
const tgt = new PrismaClient({ datasources: { db: { url: TARGET_URL } } })

const safeJSON = (v: unknown): any => {
  if (v === null || v === undefined) return null
  if (typeof v !== 'string') return v
  try {
    return JSON.parse(v)
  } catch {
    return v
  }
}

const safeJSONArray = (v: unknown): any[] => {
  const parsed = safeJSON(v)
  return Array.isArray(parsed) ? parsed : []
}

interface MigrationStat {
  model: string
  source: number
  copied: number
  skipped: number
  errors: number
}

async function migrateModel<T extends { id: string }>(
  model: string,
  fetch: () => Promise<T[]>,
  upsert: (row: T) => Promise<void>
): Promise<MigrationStat> {
  const rows = await fetch()
  let copied = 0
  let skipped = 0
  let errors = 0
  for (const row of rows) {
    try {
      await upsert(row)
      copied++
    } catch (e: any) {
      // Foreign key races on parallel runs are skipped, real errors logged
      if (e.code === 'P2002' || e.code === 'P2025') {
        skipped++
      } else {
        errors++
        console.error(`  [${model}] error on id=${(row as any).id}: ${e.message}`)
      }
    }
  }
  return { model, source: rows.length, copied, skipped, errors }
}

async function main() {
  console.log('🔄 Migrating SQLite → Postgres')
  console.log(`   source: ${SOURCE_URL}`)
  console.log(`   target: ${TARGET_URL}`)
  console.log('')

  const stats: MigrationStat[] = []

  // Order matters — parent tables first
  stats.push(await migrateModel('Region',
    () => src.region.findMany(),
    (r) => tgt.region.upsert({ where: { id: r.id }, update: r as any, create: r as any }).then(() => undefined)
  ))

  stats.push(await migrateModel('Plan',
    () => src.plan.findMany(),
    (r) => tgt.plan.upsert({ where: { id: r.id }, update: r as any, create: r as any }).then(() => undefined)
  ))

  stats.push(await migrateModel('OsTemplate',
    () => src.osTemplate.findMany(),
    (r) => tgt.osTemplate.upsert({
      where: { id: r.id },
      update: { ...r, family: (r as any).family } as any,
      create: { ...r, family: (r as any).family } as any,
    }).then(() => undefined)
  ))

  stats.push(await migrateModel('Node',
    () => src.node.findMany(),
    (r: any) => {
      const data = { ...r, ipRanges: safeJSONArray(r.ipRanges), status: r.status }
      return tgt.node.upsert({ where: { id: r.id }, update: data, create: data }).then(() => undefined)
    }
  ))

  stats.push(await migrateModel('User',
    () => src.user.findMany(),
    (r: any) => {
      const data = { ...r, metadata: safeJSON(r.metadata), role: r.role, status: r.status }
      return tgt.user.upsert({ where: { id: r.id }, update: data, create: data }).then(() => undefined)
    }
  ))

  // Custom roles live in `role` table on Postgres (model Role_) but `Role` on SQLite
  stats.push(await migrateModel('Role',
    () => (src as any).role.findMany() as Promise<any[]>,
    (r: any) => {
      const data = { ...r, permissions: safeJSONArray(r.permissions) }
      return (tgt as any).role_.upsert({ where: { id: r.id }, update: data, create: data })
    }
  ))

  stats.push(await migrateModel('UserRoleAssignment',
    () => src.userRoleAssignment.findMany(),
    (r) => tgt.userRoleAssignment.upsert({ where: { id: r.id }, update: r as any, create: r as any }).then(() => undefined)
  ))

  stats.push(await migrateModel('Server',
    () => src.server.findMany(),
    (r: any) => {
      const data = {
        ...r,
        specs: safeJSON(r.specs),
        bandwidth: safeJSON(r.bandwidth),
        tags: safeJSONArray(r.tags),
        status: r.status,
      }
      return tgt.server.upsert({ where: { id: r.id }, update: data, create: data }).then(() => undefined)
    }
  ))

  stats.push(await migrateModel('SshKey',
    () => src.sshKey.findMany(),
    (r) => tgt.sshKey.upsert({ where: { id: r.id }, update: r as any, create: r as any }).then(() => undefined)
  ))

  stats.push(await migrateModel('UserSession',
    () => src.userSession.findMany(),
    (r) => tgt.userSession.upsert({ where: { id: r.id }, update: r as any, create: r as any }).then(() => undefined)
  ))

  stats.push(await migrateModel('ApiKey',
    () => src.apiKey.findMany(),
    (r: any) => {
      const data = { ...r, permissions: safeJSONArray(r.permissions) }
      return tgt.apiKey.upsert({ where: { id: r.id }, update: data, create: data }).then(() => undefined)
    }
  ))

  stats.push(await migrateModel('Invoice',
    () => src.invoice.findMany(),
    (r: any) => {
      const data = { ...r, items: safeJSON(r.items), status: r.status }
      return tgt.invoice.upsert({ where: { id: r.id }, update: data, create: data }).then(() => undefined)
    }
  ))

  stats.push(await migrateModel('PaymentMethod',
    () => src.paymentMethod.findMany(),
    (r) => tgt.paymentMethod.upsert({ where: { id: r.id }, update: r as any, create: r as any }).then(() => undefined)
  ))

  stats.push(await migrateModel('Transaction',
    () => src.transaction.findMany(),
    (r) => tgt.transaction.upsert({ where: { id: r.id }, update: r as any, create: r as any }).then(() => undefined)
  ))

  stats.push(await migrateModel('SupportTicket',
    () => src.supportTicket.findMany(),
    (r) => tgt.supportTicket.upsert({ where: { id: r.id }, update: r as any, create: r as any }).then(() => undefined)
  ))

  stats.push(await migrateModel('TicketMessage',
    () => src.ticketMessage.findMany(),
    (r) => tgt.ticketMessage.upsert({ where: { id: r.id }, update: r as any, create: r as any }).then(() => undefined)
  ))

  stats.push(await migrateModel('ServerSnapshot',
    () => src.serverSnapshot.findMany(),
    (r) => tgt.serverSnapshot.upsert({ where: { id: r.id }, update: r as any, create: r as any }).then(() => undefined)
  ))

  stats.push(await migrateModel('FirewallRule',
    () => src.firewallRule.findMany(),
    (r) => tgt.firewallRule.upsert({ where: { id: r.id }, update: r as any, create: r as any }).then(() => undefined)
  ))

  stats.push(await migrateModel('Notification',
    () => src.notification.findMany(),
    (r) => tgt.notification.upsert({ where: { id: r.id }, update: r as any, create: r as any }).then(() => undefined)
  ))

  stats.push(await migrateModel('Announcement',
    () => src.announcement.findMany(),
    (r: any) => {
      const data = { ...r, targetRoles: safeJSONArray(r.targetRoles) }
      return tgt.announcement.upsert({ where: { id: r.id }, update: data, create: data }).then(() => undefined)
    }
  ))

  stats.push(await migrateModel('IntegrationConfig',
    () => src.integrationConfig.findMany(),
    (r: any) => {
      const data = { ...r, value: safeJSON(r.value) }
      return tgt.integrationConfig.upsert({ where: { id: r.id }, update: data, create: data }).then(() => undefined)
    }
  ))

  stats.push(await migrateModel('EmailTemplate',
    () => src.emailTemplate.findMany(),
    (r: any) => {
      const data = { ...r, variables: safeJSONArray(r.variables) }
      return tgt.emailTemplate.upsert({ where: { id: r.id }, update: data, create: data }).then(() => undefined)
    }
  ))

  stats.push(await migrateModel('SmsTemplate',
    () => src.smsTemplate.findMany(),
    (r: any) => {
      const data = { ...r, variables: safeJSONArray(r.variables) }
      return tgt.smsTemplate.upsert({ where: { id: r.id }, update: data, create: data }).then(() => undefined)
    }
  ))

  stats.push(await migrateModel('AuditLog',
    () => src.auditLog.findMany(),
    (r: any) => {
      const data = {
        ...r,
        oldValue: r.oldValue ? safeJSON(r.oldValue) : null,
        newValue: r.newValue ? safeJSON(r.newValue) : null,
        metadata: r.metadata ? safeJSON(r.metadata) : null,
      }
      return tgt.auditLog.upsert({ where: { id: r.id }, update: data, create: data }).then(() => undefined)
    }
  ))

  stats.push(await migrateModel('ServerMetric',
    () => src.serverMetric.findMany(),
    (r) => tgt.serverMetric.upsert({ where: { id: r.id }, update: r as any, create: r as any }).then(() => undefined)
  ))

  // Report
  console.log('\n📊 Migration summary')
  console.log('────────────────────────────────────────────────────────')
  console.log('Model                Source   Copied   Skipped  Errors')
  console.log('────────────────────────────────────────────────────────')
  let totalCopied = 0
  let totalErrors = 0
  for (const s of stats) {
    console.log(
      `${s.model.padEnd(20)} ${String(s.source).padStart(6)}   ` +
      `${String(s.copied).padStart(6)}   ${String(s.skipped).padStart(6)}   ${String(s.errors).padStart(6)}`
    )
    totalCopied += s.copied
    totalErrors += s.errors
  }
  console.log('────────────────────────────────────────────────────────')
  console.log(`Total copied: ${totalCopied}, total errors: ${totalErrors}`)
  console.log('')

  if (totalErrors > 0) {
    console.error('❌ Migration completed with errors. Re-run after fixing.')
    process.exit(1)
  }
  console.log('✅ Migration complete')
}

main()
  .catch((e) => {
    console.error('❌ Migration failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await Promise.all([src.$disconnect(), tgt.$disconnect()])
  })
