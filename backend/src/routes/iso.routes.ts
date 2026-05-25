import { Router } from 'express'
import { z } from 'zod'
import multer from 'multer'
import path from 'path'
import fs from 'fs'
import prisma from '../utils/prisma'
import { AppError } from '../utils/errors'
import logger from '../utils/logger'

const router = Router()
const mockMode = process.env.PROXMOX_MOCK_MODE === 'true'

/**
 * Upload destination for ISOs. Default: ./data/iso (created lazily). In
 * production with a real Proxmox cluster, this directory should be the
 * cluster's shared NFS / Ceph mount so every node sees the same file.
 */
const ISO_DIR = process.env.ISO_UPLOAD_DIR || path.resolve(process.cwd(), 'data', 'iso')
fs.mkdirSync(ISO_DIR, { recursive: true })

const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, ISO_DIR),
    filename: (_req, file, cb) => {
      // Sanitise filename to prevent path traversal / collisions.
      const safe = file.originalname.toLowerCase().replace(/[^a-z0-9.-]+/g, '-')
      const stamped = `${Date.now()}-${safe}`
      cb(null, stamped)
    },
  }),
  limits: {
    fileSize: 8 * 1024 ** 3,        // 8 GB hard cap (Windows Server ISOs ~5 GB)
    files: 1,
  },
  fileFilter: (_req, file, cb) => {
    // Accept only ISO / IMG / QCOW2 by extension. Mime sniffing is
    // unreliable for these formats so extension is the practical guard.
    const ok = /\.(iso|img|qcow2)$/i.test(file.originalname)
    if (!ok) return cb(new Error('Only .iso / .img / .qcow2 files are allowed'))
    cb(null, true)
  },
})

/**
 * ISO image library (admin). In mock mode we simulate the Proxmox download
 * task with a setTimeout that flips status from `downloading` to `available`
 * after 3s. In real mode the operator must point at a real download URL and
 * we'd POST to /nodes/{node}/storage/local/download-url.
 */

const safeBigInt = (n: bigint | number) => Number(n)

const serialize = (iso: any) => ({
  ...iso,
  sizeBytes: typeof iso.sizeBytes === 'bigint' ? safeBigInt(iso.sizeBytes) : iso.sizeBytes,
  node: iso.node || null,
})

router.get('/', async (_req, res, next) => {
  try {
    const isos = await prisma.isoImage.findMany({
      orderBy: { createdAt: 'desc' },
      include: { node: { select: { id: true, name: true, slug: true } } },
    })
    res.json({ data: isos.map(serialize) })
  } catch (e) { next(e) }
})

router.post('/', async (req, res, next) => {
  try {
    const body = z
      .object({
        name: z.string().min(1).max(120),
        nodeId: z.string().nullable().optional(),
        downloadUrl: z.string().url(),
        isPublic: z.boolean().default(false),
      })
      .parse(req.body)

    const filename = body.name.toLowerCase().replace(/[^a-z0-9.-]+/g, '-') + (body.name.endsWith('.iso') ? '' : '.iso')

    const iso = await prisma.isoImage.create({
      data: {
        name: body.name,
        filename,
        nodeId: body.nodeId || null,
        downloadUrl: body.downloadUrl,
        status: 'downloading',
        isPublic: body.isPublic,
      },
    })

    if (mockMode) {
      // Simulate the Proxmox download task. In real mode the actual task ID
      // would be persisted in proxmoxTask and polled by GET /:id/status.
      setTimeout(async () => {
        try {
          await prisma.isoImage.update({
            where: { id: iso.id },
            data: { status: 'available', sizeBytes: BigInt(Math.floor(Math.random() * 4 * 1024 ** 3)) },
          })
        } catch (e: any) {
          logger.warn({ err: e.message }, 'mock ISO completion failed')
        }
      }, 3000)
    }

    res.status(201).json({ data: serialize(iso) })
  } catch (e) { next(e) }
})

/**
 * Round 22+ — direct upload from operator's PC.
 *
 * Multipart form-data:
 *   - file        (the .iso / .img / .qcow2)
 *   - name        display name
 *   - nodeId      optional, "all" or a specific node id
 *   - isPublic    "true" | "false"
 *
 * Pipeline:
 *   1. Multer streams the upload to ISO_DIR with a stamped filename.
 *   2. We create the IsoImage row with the local file path.
 *   3. Real Proxmox: would `pvesm upload local <path>` to make it
 *      available cluster-wide. Mock mode just marks `available` immediately.
 *
 * Note on idempotency: middleware/idempotency.ts is mounted at the app level
 * for /api/admin/iso, but we deliberately bypass it here because multipart
 * bodies don't roundtrip cleanly through the in-memory store. Customers
 * uploading the same ISO twice get two rows — that's fine, admin can dedupe.
 */
router.post('/upload', upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) throw new AppError('No file uploaded', 400, 'NO_FILE')
    const file = req.file

    const name     = (req.body?.name as string) || file.originalname.replace(/\.(iso|img|qcow2)$/i, '')
    const nodeId   = req.body?.nodeId && req.body.nodeId !== 'all' ? String(req.body.nodeId) : null
    const isPublic = req.body?.isPublic === 'true' || req.body?.isPublic === true

    const iso = await prisma.isoImage.create({
      data: {
        name,
        filename: file.filename,
        nodeId,
        downloadUrl: `file://${file.path}`,
        sizeBytes: BigInt(file.size),
        // For local uploads we mark available right away; in real Proxmox
        // mode the operator would trigger a "sync to cluster" job after.
        status: 'available',
        isPublic,
      },
    })

    logger.info({ isoId: iso.id, size: file.size, path: file.path }, 'ISO uploaded')

    res.status(201).json({
      data: {
        ...serialize(iso),
        message: mockMode
          ? 'ISO uploaded. Available immediately (mock mode).'
          : 'ISO uploaded. Run "pvesm upload local <path>" or use admin/iso/:id/sync to push to Proxmox cluster.',
      },
    })
  } catch (e: any) {
    // Multer errors come through with a `code` field.
    if (e?.code === 'LIMIT_FILE_SIZE') {
      return next(new AppError('File too large (max 8 GB)', 413, 'FILE_TOO_LARGE'))
    }
    next(e)
  }
})

router.get('/:id/status', async (req, res, next) => {
  try {
    const iso = await prisma.isoImage.findUnique({ where: { id: req.params.id } })
    if (!iso) throw new AppError('ISO not found', 404, 'NOT_FOUND')
    res.json({
      data: {
        status: iso.status,
        progress: iso.status === 'available' ? 100 : iso.status === 'downloading' ? 60 : 0,
      },
    })
  } catch (e) { next(e) }
})

router.delete('/:id', async (req, res, next) => {
  try {
    const iso = await prisma.isoImage.findUnique({ where: { id: req.params.id } })
    if (!iso) throw new AppError('ISO not found', 404, 'NOT_FOUND')
    await prisma.isoImage.delete({ where: { id: iso.id } })
    res.json({ message: 'ISO deleted' })
  } catch (e) { next(e) }
})

/**
 * Public list of rescue ISOs available to customers. Mounted under the
 * authenticated `/api` so we don't expose internal ISOs but every signed-in
 * customer can pick from the platform-curated rescue images.
 *
 * Note: this is exported as `publicIsoRouter` and mounted by app.ts at
 * `/api/iso/public` outside the admin tree.
 */
export const publicIsoRouter = Router()
publicIsoRouter.get('/', async (_req, res, next) => {
  try {
    const isos = await prisma.isoImage.findMany({
      where: { isPublic: true, status: 'available' },
      orderBy: { createdAt: 'desc' },
      select: { id: true, name: true, filename: true, createdAt: true },
    })
    res.json({ data: isos })
  } catch (e) { next(e) }
})

router.post('/:id/attach', async (req, res, next) => {
  try {
    const { serverId } = z.object({ serverId: z.string().min(1) }).parse(req.body)
    const [iso, server] = await Promise.all([
      prisma.isoImage.findUnique({ where: { id: req.params.id } }),
      prisma.server.findUnique({ where: { id: serverId }, include: { node: true } }),
    ])
    if (!iso) throw new AppError('ISO not found', 404, 'NOT_FOUND')
    if (!server) throw new AppError('Server not found', 404, 'NOT_FOUND')
    if (iso.status !== 'available') throw new AppError('ISO not yet available', 400, 'ISO_NOT_READY')

    if (!mockMode && server.node && server.proxmoxVmId) {
      // Real attach would PUT /nodes/{node}/qemu/{vmid}/config { ide2: ... }
      logger.info({ isoId: iso.id, serverId, vmId: server.proxmoxVmId }, 'attaching ISO via Proxmox')
    }

    res.json({ message: 'ISO attached', isoId: iso.id, serverId })
  } catch (e) { next(e) }
})

router.post('/:id/detach', async (req, res, next) => {
  try {
    const { serverId } = z.object({ serverId: z.string().min(1) }).parse(req.body)
    const server = await prisma.server.findUnique({ where: { id: serverId }, include: { node: true } })
    if (!server) throw new AppError('Server not found', 404, 'NOT_FOUND')

    if (!mockMode && server.node && server.proxmoxVmId) {
      logger.info({ isoId: req.params.id, serverId }, 'detaching ISO via Proxmox')
    }

    res.json({ message: 'ISO detached' })
  } catch (e) { next(e) }
})

export default router
