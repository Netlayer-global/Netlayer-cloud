import crypto from 'crypto'
import prisma from '../utils/prisma'
import { AppError } from '../utils/errors'
import logger from '../utils/logger'

/**
 * Managed Database service — provisions PostgreSQL/MySQL/Redis instances
 * by allocating connection details and (in real mode) launching containers
 * on a hypervisor node. Mock mode emulates a 5-second provisioning window
 * and returns a synthetic but realistic-looking connection string.
 *
 * Backups are scheduled by `nodeMonitor.handler` if `backupEnabled` is true.
 */

const ENGINE_PORT: Record<string, number> = {
  postgresql: 5432,
  mysql: 3306,
  redis: 6379,
}

const ENGINE_VERSIONS: Record<string, string[]> = {
  postgresql: ['14', '15', '16'],
  mysql: ['5.7', '8.0', '8.1'],
  redis: ['6.2', '7.0', '7.2'],
}

const ipNano = () =>
  `103.21.${Math.floor(Math.random() * 250) + 1}.${Math.floor(Math.random() * 250) + 1}`

const makePassword = () =>
  crypto.randomBytes(18).toString('base64').replace(/[+/=]/g, '').slice(0, 24)

const dbHostFor = (id: string, region: string) =>
  `db-${id.slice(-8).toLowerCase()}.${region}.netlayer.cloud`

const dbNameFor = (engine: string) =>
  engine === 'redis' ? '0' : 'defaultdb'

const userNameFor = (engine: string) =>
  engine === 'postgresql' ? 'netlayer_user' : engine === 'mysql' ? 'netlayer' : 'default'

export class ManagedDatabaseService {
  validateEngineVersion(engine: string, version: string) {
    const versions = ENGINE_VERSIONS[engine]
    if (!versions) throw new AppError('Unsupported engine', 400, 'INVALID_ENGINE')
    if (!versions.includes(version)) {
      throw new AppError(`Version ${version} not supported for ${engine}`, 400, 'INVALID_VERSION')
    }
  }

  async create(userId: string, data: {
    name: string
    engine: 'postgresql' | 'mysql' | 'redis'
    version: string
    planId: string
    region: string
    backupEnabled?: boolean
  }) {
    this.validateEngineVersion(data.engine, data.version)

    const region = await prisma.region.findUnique({ where: { slug: data.region } })
    if (!region) throw new AppError('Region not found', 400, 'INVALID_REGION')

    const plan = await prisma.plan.findUnique({ where: { id: data.planId } })
    if (!plan) throw new AppError('Plan not found', 400, 'INVALID_PLAN')

    const port = ENGINE_PORT[data.engine]
    const password = makePassword()

    const db = await prisma.managedDatabase.create({
      data: {
        userId,
        name: data.name,
        engine: data.engine,
        version: data.version,
        planId: data.planId,
        region: data.region,
        backupEnabled: data.backupEnabled !== false,
        status: 'creating',
        port,
        username: userNameFor(data.engine),
        password,
        database: dbNameFor(data.engine),
      },
    })

    // Async provision — flip to "available" with a host after ~5s.
    setTimeout(async () => {
      try {
        await prisma.managedDatabase.update({
          where: { id: db.id },
          data: {
            status: 'available',
            host: dbHostFor(db.id, data.region),
          },
        })
        logger.info(`Managed DB ${db.id} ready`)
      } catch (e: any) {
        logger.warn(`Provision DB ${db.id} failed: ${e.message}`)
      }
    }, 5000)

    return db
  }

  async list(userId: string) {
    return prisma.managedDatabase.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    })
  }

  async get(userId: string, id: string) {
    const db = await prisma.managedDatabase.findFirst({ where: { id, userId } })
    if (!db) throw new AppError('Database not found', 404, 'NOT_FOUND')
    return db
  }

  async destroy(userId: string, id: string) {
    const db = await prisma.managedDatabase.findFirst({ where: { id, userId } })
    if (!db) throw new AppError('Database not found', 404, 'NOT_FOUND')

    await prisma.managedDatabase.update({
      where: { id },
      data: { status: 'deleting' },
    })

    // Async destroy
    setTimeout(async () => {
      try {
        await prisma.managedDatabase.delete({ where: { id } })
      } catch (e: any) {
        logger.warn(`Delete DB ${id} failed: ${e.message}`)
      }
    }, 1500)
  }

  async rotatePassword(userId: string, id: string) {
    const db = await prisma.managedDatabase.findFirst({ where: { id, userId } })
    if (!db) throw new AppError('Database not found', 404, 'NOT_FOUND')
    const password = makePassword()
    return prisma.managedDatabase.update({
      where: { id },
      data: { password },
    })
  }

  async toggleBackup(userId: string, id: string, enabled: boolean) {
    const db = await prisma.managedDatabase.findFirst({ where: { id, userId } })
    if (!db) throw new AppError('Database not found', 404, 'NOT_FOUND')
    return prisma.managedDatabase.update({
      where: { id },
      data: { backupEnabled: enabled },
    })
  }

  buildConnectionString(db: {
    engine: string; host: string | null; port: number | null;
    username: string | null; password: string | null; database: string | null
  }) {
    if (!db.host) return null
    const enc = (s: string | null) => encodeURIComponent(s || '')
    if (db.engine === 'redis') {
      return `redis://default:${enc(db.password)}@${db.host}:${db.port}/${db.database || '0'}`
    }
    if (db.engine === 'postgresql') {
      return `postgresql://${db.username}:${enc(db.password)}@${db.host}:${db.port}/${db.database}?sslmode=require`
    }
    if (db.engine === 'mysql') {
      return `mysql://${db.username}:${enc(db.password)}@${db.host}:${db.port}/${db.database}?ssl=true`
    }
    return null
  }

  static availableEngines() {
    return Object.entries(ENGINE_VERSIONS).map(([engine, versions]) => ({
      engine,
      versions,
      port: ENGINE_PORT[engine],
    }))
  }
}

export default new ManagedDatabaseService()
