/**
 * Bootstrap Postgres for local development.
 *
 *   1. Bring up the postgres + pgadmin services from docker-compose
 *   2. Wait for Postgres to accept connections
 *   3. Switch the Prisma schema to use Postgres + update DATABASE_URL
 *   4. Run the migrations
 *   5. Re-run the seed script
 *
 *   npm run db:postgres:bootstrap
 *
 * Idempotent — re-running on an already-bootstrapped DB just reapplies
 * migrations and skips the seed if the seed marker row already exists.
 */
import { spawn, spawnSync } from 'child_process'
import { existsSync, readFileSync, writeFileSync } from 'fs'
import { join } from 'path'

const ROOT = join(__dirname, '..', '..')
const ENV_PATH = join(__dirname, '..', '.env')
const DEFAULT_PG_URL = 'postgresql://netlayer:netlayer_secret@localhost:5432/netlayer'

const log = (msg: string) => console.log(`\x1b[36m▶\x1b[0m ${msg}`)
const ok = (msg: string) => console.log(`\x1b[32m✓\x1b[0m ${msg}`)
const fail = (msg: string) => console.log(`\x1b[31m✗\x1b[0m ${msg}`)

function run(cmd: string, args: string[], cwd?: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { cwd, stdio: 'inherit', shell: true })
    child.on('exit', (code) => {
      if (code === 0) resolve()
      else reject(new Error(`${cmd} ${args.join(' ')} exited with ${code}`))
    })
  })
}

function dockerComposeAvailable(): boolean {
  const r = spawnSync('docker', ['compose', 'version'], { encoding: 'utf-8', shell: true })
  return r.status === 0
}

async function waitForPostgres(timeoutMs = 60_000): Promise<void> {
  log('Waiting for Postgres to accept connections…')
  const start = Date.now()
  while (Date.now() - start < timeoutMs) {
    const r = spawnSync(
      'docker',
      ['exec', 'netlayer-postgres', 'pg_isready', '-U', 'netlayer'],
      { encoding: 'utf-8', shell: true }
    )
    if (r.status === 0) {
      ok('Postgres is ready')
      return
    }
    await new Promise((r) => setTimeout(r, 2000))
  }
  throw new Error('Postgres did not become ready within timeout')
}

function updateEnvDatabaseUrl(): void {
  if (!existsSync(ENV_PATH)) {
    fail(`.env not found at ${ENV_PATH}`)
    throw new Error('.env file required')
  }
  const original = readFileSync(ENV_PATH, 'utf-8')
  const lines = original.split(/\r?\n/)
  let replaced = false
  const next = lines.map((line) => {
    if (line.startsWith('DATABASE_URL=') || line.startsWith('# DATABASE_URL=')) {
      replaced = true
      return `DATABASE_URL="${DEFAULT_PG_URL}"`
    }
    return line
  })
  if (!replaced) next.push(`DATABASE_URL="${DEFAULT_PG_URL}"`)
  writeFileSync(ENV_PATH, next.join('\n'))
  ok('.env DATABASE_URL pointed at Postgres')
}

async function main() {
  console.log('\x1b[1mNetLayer Postgres bootstrap\x1b[0m')
  console.log('─'.repeat(40))

  if (!dockerComposeAvailable()) {
    fail('docker compose is not installed or not in PATH')
    fail('Install Docker Desktop first: https://www.docker.com/products/docker-desktop/')
    process.exit(1)
  }

  log('Starting postgres + pgadmin via docker-compose…')
  await run('docker', ['compose', 'up', '-d', 'postgres', 'pgadmin'], ROOT)

  await waitForPostgres()

  log('Switching Prisma schema to Postgres…')
  await run('npx', ['ts-node', 'scripts/switch-db.ts', 'postgres'], join(__dirname, '..'))
  ok('Prisma schema switched')

  updateEnvDatabaseUrl()

  log('Generating Prisma client…')
  await run('npx', ['prisma', 'generate'], join(__dirname, '..'))

  log('Running migrations…')
  await run('npx', ['prisma', 'migrate', 'deploy'], join(__dirname, '..'))
  ok('Migrations applied')

  log('Running seed…')
  await run('npx', ['ts-node', 'prisma/seed.ts'], join(__dirname, '..'))
  ok('Seed complete')

  console.log()
  console.log('\x1b[32m✓ Postgres ready.\x1b[0m')
  console.log('  Postgres:   localhost:5432  (netlayer / netlayer_secret)')
  console.log('  pgAdmin:    http://localhost:5050  (admin@netlayer.com / admin123)')
  console.log()
  console.log('Restart the backend dev server to pick up the new DATABASE_URL.')
}

main().catch((err) => {
  console.error()
  fail(err.message)
  process.exit(1)
})
