#!/usr/bin/env ts-node
/**
 * Switch the Prisma schema between SQLite and Postgres without losing the
 * other variant. Both files coexist; this script just copies one over the
 * active `schema.prisma`.
 *
 * Usage:
 *   npx ts-node scripts/switch-db.ts sqlite
 *   npx ts-node scripts/switch-db.ts postgres
 */

import { copyFileSync, existsSync, readFileSync, writeFileSync } from 'fs'
import { resolve } from 'path'

const target = process.argv[2]
if (!target || !['sqlite', 'postgres'].includes(target)) {
  console.error('Usage: switch-db.ts <sqlite|postgres>')
  process.exit(1)
}

const root = resolve(__dirname, '..')
const active = resolve(root, 'prisma', 'schema.prisma')
const sqliteVariant = resolve(root, 'prisma', 'schema.sqlite.prisma')
const postgresVariant = resolve(root, 'prisma', 'schema.postgres.prisma')

// First time: capture the current schema as the SQLite variant if missing
if (!existsSync(sqliteVariant) && existsSync(active)) {
  const current = readFileSync(active, 'utf8')
  if (current.includes('provider = "sqlite"')) {
    writeFileSync(sqliteVariant, current)
    console.log('📌 Captured current schema.prisma as schema.sqlite.prisma')
  }
}

const source = target === 'sqlite' ? sqliteVariant : postgresVariant
if (!existsSync(source)) {
  console.error(`❌ Source variant not found: ${source}`)
  process.exit(1)
}

copyFileSync(source, active)
console.log(`✅ schema.prisma now points at ${target}`)
console.log('')
console.log('Next steps:')
if (target === 'postgres') {
  console.log('  1. Set DATABASE_URL="postgresql://user:pass@host:5432/db" in .env')
  console.log('  2. npx prisma generate')
  console.log('  3. npx prisma migrate dev --name init_postgres')
  console.log('  4. npx ts-node prisma/migrate-sqlite-to-postgres.ts   (if you have SQLite data to bring over)')
  console.log('  5. npx prisma db seed')
} else {
  console.log('  1. Set DATABASE_URL="file:./dev.db" in .env')
  console.log('  2. npx prisma generate')
  console.log('  3. npx prisma migrate dev')
}
