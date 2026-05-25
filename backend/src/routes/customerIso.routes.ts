import { Router } from 'express'
import multer from 'multer'
import path from 'path'
import fs from 'fs'
import prisma from '../utils/prisma'
import { AppError } from '../utils/errors'
import logger from '../utils/logger'
import { AuthedRequest } from '../middleware/auth'

const router = Router()

const ISO_DIR = path.resolve(process.env.ISO_UPLOAD_DIR || './data/iso', 'customer')
fs.mkdirSync(ISO_DIR, { recursive: true })

/**
 * Round 23 — customer-side ISO upload.
 *
 * Used for: bare-metal custom installs, niche Linux distros not in our
 * marketplace, custom rescue images. Scoped to userId — only the uploader
 * can attach this ISO at deploy time.
 *
 * Limits:
 *   - 4 GB cap per file (vs admin's 8 GB)
 *   - 5 ISOs per customer (avoid storage abuse)
 *   - Same extensions: .iso / .img / .qcow2
 */

const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, ISO_DIR),
    filename: (req, file, cb) => {
      const userId = (req as AuthedRequest).user?.userId || 'anon'
      const safe = file.originalname.toLowerCase().replace(/[^a-z0-9.-]+/g, '-')
      cb(null, `${userId.slice(-8)}-${Date.now()}-${safe}`)
    },
  }),
  limits: { fileSize: 4 * 1024 ** 3, files: 1 },
  fileFilter: (_req, file, cb) => {
    if (!/\.(iso|img|qcow2)$/i.test(file.originalname)) {
      return cb(new Error('Only .iso / .img / .qcow2 files are allowed'))
    }
    cb(null, true)
  },
})

router.get('/', async (req: AuthedRequest, res, next) => {
  try {
    const isos = await prisma.isoImage.findMany({
      where: { userId: req.user!.userId },
      orderBy: { createdAt: 'desc' },
    })
    res.json({
      data: isos.map((i) => ({
        ...i,
        sizeBytes: typeof i.sizeBytes === 'bigint' ? Number(i.sizeBytes) : i.sizeBytes,
      })),
    })
  } catch (e) { next(e) }
})

router.post('/upload', upload.single('file'), async (req: AuthedRequest, res, next) => {
  try {
    if (!req.file) throw new AppError('No file uploaded', 400, 'NO_FILE')

    // Per-user quota guard
    const existingCount = await prisma.isoImage.count({
      where: { userId: req.user!.userId },
    })
    if (existingCount >= 5) {
      // Clean up the just-uploaded file before throwing
      try { fs.unlinkSync(req.file.path) } catch {}
      throw new AppError(
        'Custom ISO limit reached (5 per account). Delete an old one to upload a new ISO.',
        400,
        'QUOTA_EXCEEDED'
      )
    }

    const file = req.file
    const name = (req.body?.name as string) || file.originalname.replace(/\.(iso|img|qcow2)$/i, '')

    const iso = await prisma.isoImage.create({
      data: {
        name,
        filename: file.filename,
        userId: req.user!.userId,
        downloadUrl: `file://${file.path}`,
        sizeBytes: BigInt(file.size),
        status: 'available',
        isPublic: false,
      },
    })

    logger.info({ userId: req.user!.userId, isoId: iso.id, size: file.size }, 'customer ISO uploaded')

    res.status(201).json({
      data: {
        ...iso,
        sizeBytes: Number(iso.sizeBytes),
      },
    })
  } catch (e: any) {
    if (e?.code === 'LIMIT_FILE_SIZE') {
      return next(new AppError('File too large (max 4 GB)', 413, 'FILE_TOO_LARGE'))
    }
    next(e)
  }
})

router.delete('/:id', async (req: AuthedRequest, res, next) => {
  try {
    const iso = await prisma.isoImage.findFirst({
      where: { id: req.params.id, userId: req.user!.userId },
    })
    if (!iso) throw new AppError('ISO not found', 404, 'NOT_FOUND')

    // Refuse to delete if any of the user's servers reference it.
    const inUse = await prisma.server.count({
      where: { customIsoId: iso.id, deletedAt: null },
    })
    if (inUse > 0) {
      throw new AppError(
        `ISO is in use by ${inUse} server(s). Detach first.`,
        400,
        'ISO_IN_USE'
      )
    }

    // Best-effort delete the file from disk
    if (iso.downloadUrl?.startsWith('file://')) {
      try { fs.unlinkSync(iso.downloadUrl.replace('file://', '')) } catch {}
    }

    await prisma.isoImage.delete({ where: { id: iso.id } })
    res.json({ message: 'ISO deleted' })
  } catch (e) { next(e) }
})

export default router
