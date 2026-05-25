import { Router } from 'express'
import { z } from 'zod'
import prisma from '../utils/prisma'
import { AppError } from '../utils/errors'
import logger from '../utils/logger'

const router = Router()
const mockMode = process.env.PROXMOX_MOCK_MODE === 'true'

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
