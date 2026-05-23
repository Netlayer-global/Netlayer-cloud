import { Router } from 'express'
import express from 'express'
import { z } from 'zod'
import prisma from '../utils/prisma'
import { AppError } from '../utils/errors'
import { AuthedRequest } from '../middleware/auth'
import storageService from '../services/objectStorage.service'
import { emitToUser, emitToAdmin } from '../services/socket.service'
import logger from '../utils/logger'

const router = Router()

const serializeBucket = (b: any) => ({
  ...b,
  // BigInt → number for JSON. Bucket sizes are well under 2^53 in dev.
  sizeBytes: typeof b.sizeBytes === 'bigint' ? Number(b.sizeBytes) : b.sizeBytes,
})

// ─── PUBLIC mock upload/download endpoints (no auth) ────────
//
// These intentionally live on the storage router but are mounted before
// the authMiddleware. The presigned URLs we hand to the browser point
// to these endpoints in mock mode. Real mode talks directly to MinIO.
const publicRouter = Router()

publicRouter.put(
  '/mock-upload/:token',
  express.raw({ limit: '50mb', type: '*/*' }),
  async (req, res, next) => {
    try {
      const t = storageService.consumeUploadToken(req.params.token)
      if (!t) throw new AppError('Upload token invalid or expired', 410, 'TOKEN_EXPIRED')
      const buf = req.body as Buffer
      const size = Buffer.isBuffer(buf) ? buf.length : 0
      storageService.recordMockObject(t.bucket, t.key, size, t.contentType || (req.headers['content-type'] as string))

      // Update the owning bucket's aggregate counters. Bucket is keyed by its
      // endpoint URL containing the physical name we just wrote into.
      const bucketRow = await prisma.storageBucket.findFirst({
        where: { endpoint: { contains: t.bucket } },
      }).catch(() => null)
      if (bucketRow) {
        const stats = await storageService.bucketStats(t.bucket)
        await prisma.storageBucket.update({
          where: { id: bucketRow.id },
          data: { sizeBytes: BigInt(stats.sizeBytes), objects: stats.objects },
        }).catch(() => {})
      }
      res.json({ ok: true, size })
    } catch (e) { next(e) }
  }
)

publicRouter.get('/mock-download/:token', async (req, res, next) => {
  try {
    const t = storageService.consumeUploadToken(req.params.token)
    if (!t) throw new AppError('Download token invalid or expired', 410, 'TOKEN_EXPIRED')
    const meta = storageService.getMockObject(t.bucket, t.key)
    if (!meta) throw new AppError('Object not found', 404, 'NOT_FOUND')
    res.setHeader('Content-Type', meta.contentType || 'application/octet-stream')
    res.setHeader('Content-Length', String(meta.size))
    res.setHeader('Content-Disposition', `attachment; filename="${t.key.split('/').pop() || 'file'}"`)
    // We never persisted the bytes — return a synthetic placeholder.
    res.end(Buffer.alloc(meta.size, 0))
  } catch (e) { next(e) }
})

// ─── BUCKETS ────────────────────────────────────────────────
router.get('/buckets', async (req: AuthedRequest, res, next) => {
  try {
    const buckets = await prisma.storageBucket.findMany({
      where: { userId: req.user!.userId },
      orderBy: { createdAt: 'desc' },
    })
    res.json({ data: buckets.map(serializeBucket) })
  } catch (e) { next(e) }
})

router.post('/buckets', async (req: AuthedRequest, res, next) => {
  try {
    const schema = z.object({
      name: z.string()
        .min(3, 'Bucket name must be at least 3 characters')
        .max(63, 'Bucket name must be 63 characters or fewer')
        .regex(/^[a-z0-9][a-z0-9-]*[a-z0-9]$/, 'Use lowercase letters, numbers, and hyphens only'),
      region: z.string().min(1).default('us-east-1'),
      isPublic: z.boolean().optional(),
    })
    const body = schema.parse(req.body)

    const physicalName = storageService.bucketPhysicalName(req.user!.userId, body.name)

    // Uniqueness check at the DB level (bucket display name is globally unique in our schema).
    const existing = await prisma.storageBucket.findUnique({ where: { name: body.name } })
    if (existing) throw new AppError('Bucket name already taken', 409, 'NAME_TAKEN')

    await storageService.createBucket(physicalName)
    if (body.isPublic) await storageService.setBucketPublic(physicalName, true)

    const bucket = await prisma.storageBucket.create({
      data: {
        userId: req.user!.userId,
        name: body.name,
        region: body.region,
        isPublic: !!body.isPublic,
        endpoint: `${storageService.publicEndpoint().replace(/\/$/, '')}/${physicalName}`,
      },
    })

    await prisma.auditLog.create({
      data: {
        userId: req.user!.userId,
        action: 'storage.bucket.create',
        resource: 'storage_bucket',
        resourceId: bucket.id,
        newValue: JSON.stringify({ name: body.name, region: body.region, isPublic: !!body.isPublic }),
      },
    })

    await prisma.notification.create({
      data: {
        userId: req.user!.userId,
        type: 'bucket_created',
        title: 'Bucket created',
        message: `Bucket “${body.name}” is ready.`,
        link: `/dashboard/storage/object`,
      },
    })

    emitToUser(req.user!.userId, 'storage:bucket_created', serializeBucket(bucket))
    emitToAdmin('admin:storage_bucket_created', { userId: req.user!.userId, name: body.name })

    res.status(201).json({ data: serializeBucket(bucket) })
  } catch (e) { next(e) }
})

router.get('/buckets/:id', async (req: AuthedRequest, res, next) => {
  try {
    const bucket = await prisma.storageBucket.findFirst({
      where: { id: req.params.id, userId: req.user!.userId },
    })
    if (!bucket) throw new AppError('Bucket not found', 404, 'NOT_FOUND')

    const physicalName = storageService.bucketPhysicalName(bucket.userId, bucket.name)
    const stats = await storageService.bucketStats(physicalName).catch(() => ({ objects: bucket.objects, sizeBytes: Number(bucket.sizeBytes) }))

    res.json({ data: { ...serializeBucket(bucket), liveStats: stats } })
  } catch (e) { next(e) }
})

router.patch('/buckets/:id', async (req: AuthedRequest, res, next) => {
  try {
    const schema = z.object({ isPublic: z.boolean().optional() })
    const body = schema.parse(req.body)
    const bucket = await prisma.storageBucket.findFirst({
      where: { id: req.params.id, userId: req.user!.userId },
    })
    if (!bucket) throw new AppError('Bucket not found', 404, 'NOT_FOUND')

    if (body.isPublic !== undefined) {
      const physicalName = storageService.bucketPhysicalName(bucket.userId, bucket.name)
      await storageService.setBucketPublic(physicalName, body.isPublic).catch((e) =>
        logger.warn(`setBucketPublic failed: ${e.message}`)
      )
    }

    const updated = await prisma.storageBucket.update({
      where: { id: bucket.id },
      data: { ...body },
    })

    await prisma.auditLog.create({
      data: {
        userId: req.user!.userId,
        action: 'storage.bucket.update',
        resource: 'storage_bucket',
        resourceId: bucket.id,
        newValue: JSON.stringify(body),
      },
    })

    res.json({ data: serializeBucket(updated) })
  } catch (e) { next(e) }
})

router.delete('/buckets/:id', async (req: AuthedRequest, res, next) => {
  try {
    const bucket = await prisma.storageBucket.findFirst({
      where: { id: req.params.id, userId: req.user!.userId },
    })
    if (!bucket) throw new AppError('Bucket not found', 404, 'NOT_FOUND')

    const physicalName = storageService.bucketPhysicalName(bucket.userId, bucket.name)
    await storageService.deleteBucket(physicalName).catch((e) => {
      logger.warn(`deleteBucket failed for ${physicalName}: ${e.message}`)
    })

    await prisma.storageBucket.delete({ where: { id: bucket.id } })

    await prisma.auditLog.create({
      data: {
        userId: req.user!.userId,
        action: 'storage.bucket.delete',
        resource: 'storage_bucket',
        resourceId: bucket.id,
        oldValue: JSON.stringify({ name: bucket.name }),
      },
    })

    emitToUser(req.user!.userId, 'storage:bucket_deleted', { id: bucket.id })

    res.json({ message: 'Bucket deleted' })
  } catch (e) { next(e) }
})

// ─── OBJECTS ────────────────────────────────────────────────
router.get('/buckets/:id/objects', async (req: AuthedRequest, res, next) => {
  try {
    const bucket = await prisma.storageBucket.findFirst({
      where: { id: req.params.id, userId: req.user!.userId },
    })
    if (!bucket) throw new AppError('Bucket not found', 404, 'NOT_FOUND')

    const prefix = (req.query.prefix as string) || ''
    const physicalName = storageService.bucketPhysicalName(bucket.userId, bucket.name)
    const objects = await storageService.listObjects(physicalName, prefix)
    res.json({ data: objects })
  } catch (e) { next(e) }
})

router.delete('/buckets/:id/objects', async (req: AuthedRequest, res, next) => {
  try {
    const bucket = await prisma.storageBucket.findFirst({
      where: { id: req.params.id, userId: req.user!.userId },
    })
    if (!bucket) throw new AppError('Bucket not found', 404, 'NOT_FOUND')

    const { key } = z.object({ key: z.string().min(1) }).parse(req.body)
    const physicalName = storageService.bucketPhysicalName(bucket.userId, bucket.name)
    await storageService.deleteObject(physicalName, key)

    const stats = await storageService.bucketStats(physicalName)
    await prisma.storageBucket.update({
      where: { id: bucket.id },
      data: { sizeBytes: BigInt(stats.sizeBytes), objects: stats.objects },
    })

    res.json({ message: 'Object deleted' })
  } catch (e) { next(e) }
})

// ─── PRESIGNED URLs ─────────────────────────────────────────
router.post('/buckets/:id/presign', async (req: AuthedRequest, res, next) => {
  try {
    const schema = z.object({
      key: z.string().min(1).max(1024),
      contentType: z.string().optional(),
      operation: z.enum(['put', 'get']).default('put'),
      expirySec: z.number().int().min(60).max(3600).default(900),
    })
    const body = schema.parse(req.body)

    const bucket = await prisma.storageBucket.findFirst({
      where: { id: req.params.id, userId: req.user!.userId },
    })
    if (!bucket) throw new AppError('Bucket not found', 404, 'NOT_FOUND')

    const physicalName = storageService.bucketPhysicalName(bucket.userId, bucket.name)

    if (body.operation === 'put') {
      const out = await storageService.presignPut(physicalName, body.key, body.contentType, body.expirySec)
      res.json({ data: { ...out, key: body.key, expiresIn: body.expirySec, mock: storageService.isMock() } })
    } else {
      const out = await storageService.presignGet(physicalName, body.key, body.expirySec)
      res.json({ data: { ...out, method: 'GET', key: body.key, expiresIn: body.expirySec, mock: storageService.isMock() } })
    }
  } catch (e) { next(e) }
})

// ─── ACCESS KEYS ────────────────────────────────────────────
//
// We persist user-scoped storage credentials as IntegrationConfig rows.
// Real MinIO would create per-user IAM creds; in mock mode we just
// generate opaque keys clients can use against an external MinIO if
// they choose to point their own tooling at the same backing store.

router.get('/access-keys', async (req: AuthedRequest, res, next) => {
  try {
    const key = `storage.user.${req.user!.userId}`
    const row = await prisma.integrationConfig.findUnique({ where: { key } })
    if (!row) return res.json({ data: [] })
    let parsed: any
    try { parsed = JSON.parse(row.value) } catch { parsed = { keys: [] } }
    const keys = (parsed.keys || []).map((k: any) => ({
      id: k.id,
      name: k.name,
      accessKey: k.accessKey,
      // never return secret again after creation
      lastUsedAt: k.lastUsedAt || null,
      createdAt: k.createdAt,
    }))
    res.json({ data: keys })
  } catch (e) { next(e) }
})

router.post('/access-keys', async (req: AuthedRequest, res, next) => {
  try {
    const { name } = z.object({ name: z.string().min(1).max(64) }).parse(req.body)
    const cfgKey = `storage.user.${req.user!.userId}`
    const row = await prisma.integrationConfig.findUnique({ where: { key: cfgKey } })
    let cur: any = { keys: [] }
    if (row) {
      try { cur = JSON.parse(row.value) } catch {}
      if (!Array.isArray(cur.keys)) cur.keys = []
    }
    if (cur.keys.length >= 5) throw new AppError('Maximum 5 access keys per user', 400, 'KEY_LIMIT')

    const { accessKey, secretKey } = storageService.generateAccessKeyPair()
    const id = `ak_${Date.now()}`
    cur.keys.push({ id, name, accessKey, secretKey, createdAt: new Date().toISOString() })

    await prisma.integrationConfig.upsert({
      where: { key: cfgKey },
      update: { value: JSON.stringify(cur) },
      create: { key: cfgKey, value: JSON.stringify(cur) },
    })

    await prisma.auditLog.create({
      data: {
        userId: req.user!.userId,
        action: 'storage.access_key.create',
        resource: 'storage_access_key',
        resourceId: id,
        newValue: JSON.stringify({ name, accessKey }),
      },
    })

    // Return secret ONCE — frontend must show & store immediately.
    res.status(201).json({ data: { id, name, accessKey, secretKey, createdAt: new Date().toISOString() } })
  } catch (e) { next(e) }
})

router.delete('/access-keys/:keyId', async (req: AuthedRequest, res, next) => {
  try {
    const cfgKey = `storage.user.${req.user!.userId}`
    const row = await prisma.integrationConfig.findUnique({ where: { key: cfgKey } })
    if (!row) throw new AppError('Access key not found', 404, 'NOT_FOUND')
    let cur: any = {}
    try { cur = JSON.parse(row.value) } catch {}
    const before = (cur.keys || []).length
    cur.keys = (cur.keys || []).filter((k: any) => k.id !== req.params.keyId)
    if (cur.keys.length === before) throw new AppError('Access key not found', 404, 'NOT_FOUND')
    await prisma.integrationConfig.update({ where: { key: cfgKey }, data: { value: JSON.stringify(cur) } })
    await prisma.auditLog.create({
      data: {
        userId: req.user!.userId,
        action: 'storage.access_key.delete',
        resource: 'storage_access_key',
        resourceId: req.params.keyId,
      },
    })
    res.json({ message: 'Access key revoked' })
  } catch (e) { next(e) }
})

export { publicRouter as storagePublicRouter }
export default router
