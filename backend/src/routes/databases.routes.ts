import { Router } from 'express'
import { z } from 'zod'
import prisma from '../utils/prisma'
import { AppError } from '../utils/errors'
import { AuthedRequest } from '../middleware/auth'
import dbService, { ManagedDatabaseService } from '../services/managedDatabase.service'
import { emitToUser } from '../services/socket.service'

const router = Router()

const serializeDb = (db: any) => ({
  ...db,
  // Strip password unless explicitly requested.
  password: undefined,
  hasPassword: !!db.password,
  connectionString: dbService.buildConnectionString(db),
})

router.get('/engines', (_req, res) => {
  res.json({ data: ManagedDatabaseService.availableEngines() })
})

router.get('/', async (req: AuthedRequest, res, next) => {
  try {
    const dbs = await dbService.list(req.user!.userId)
    res.json({ data: dbs.map(serializeDb) })
  } catch (e) { next(e) }
})

router.post('/', async (req: AuthedRequest, res, next) => {
  try {
    const schema = z.object({
      name: z.string().min(1).max(64),
      engine: z.enum(['postgresql', 'mysql', 'redis']),
      version: z.string().min(1),
      planId: z.string().min(1),
      region: z.string().min(1),
      backupEnabled: z.boolean().optional(),
    })
    const body = schema.parse(req.body)

    const db = await dbService.create(req.user!.userId, body)

    await prisma.auditLog.create({
      data: {
        userId: req.user!.userId,
        action: 'database.create',
        resource: 'managed_database',
        resourceId: db.id,
        newValue: JSON.stringify({ name: body.name, engine: body.engine, region: body.region }),
      },
    })
    await prisma.notification.create({
      data: {
        userId: req.user!.userId,
        type: 'database_created',
        title: 'Database provisioning',
        message: `${body.name} (${body.engine} ${body.version}) is being provisioned.`,
        link: `/dashboard/databases`,
      },
    })

    emitToUser(req.user!.userId, 'database:created', serializeDb(db))
    res.status(201).json({ data: serializeDb(db) })
  } catch (e) { next(e) }
})

router.get('/:id', async (req: AuthedRequest, res, next) => {
  try {
    const db = await dbService.get(req.user!.userId, req.params.id)
    // Detail endpoint includes the password (only available to the owner).
    const out = {
      ...db,
      hasPassword: !!db.password,
      connectionString: dbService.buildConnectionString(db),
    }
    res.json({ data: out })
  } catch (e) { next(e) }
})

router.post('/:id/rotate-password', async (req: AuthedRequest, res, next) => {
  try {
    const db = await dbService.rotatePassword(req.user!.userId, req.params.id)
    await prisma.auditLog.create({
      data: {
        userId: req.user!.userId,
        action: 'database.rotate_password',
        resource: 'managed_database',
        resourceId: db.id,
      },
    })
    res.json({
      data: {
        ...db,
        hasPassword: !!db.password,
        connectionString: dbService.buildConnectionString(db),
      },
    })
  } catch (e) { next(e) }
})

router.patch('/:id', async (req: AuthedRequest, res, next) => {
  try {
    const schema = z.object({ backupEnabled: z.boolean().optional() })
    const body = schema.parse(req.body)
    let db: any
    if (typeof body.backupEnabled === 'boolean') {
      db = await dbService.toggleBackup(req.user!.userId, req.params.id, body.backupEnabled)
    } else {
      db = await dbService.get(req.user!.userId, req.params.id)
    }
    await prisma.auditLog.create({
      data: {
        userId: req.user!.userId,
        action: 'database.update',
        resource: 'managed_database',
        resourceId: db.id,
        newValue: JSON.stringify(body),
      },
    })
    res.json({ data: serializeDb(db) })
  } catch (e) { next(e) }
})

router.delete('/:id', async (req: AuthedRequest, res, next) => {
  try {
    await dbService.destroy(req.user!.userId, req.params.id)
    await prisma.auditLog.create({
      data: {
        userId: req.user!.userId,
        action: 'database.delete',
        resource: 'managed_database',
        resourceId: req.params.id,
      },
    })
    emitToUser(req.user!.userId, 'database:deleted', { id: req.params.id })
    res.json({ message: 'Database deleted' })
  } catch (e) { next(e) }
})

// Avoid "unused" import warning when AppError is referenced by the service only.
void AppError

export default router
