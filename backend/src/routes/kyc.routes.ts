import { Router } from 'express'
import { z } from 'zod'
import path from 'path'
import fs from 'fs'
import multer from 'multer'
import prisma from '../utils/prisma'
import { AppError } from '../utils/errors'
import { AuthedRequest } from '../middleware/auth'
import logger from '../utils/logger'

const router = Router()

const KYC_DIR = path.resolve(process.env.KYC_UPLOAD_DIR || './data/kyc')
fs.mkdirSync(KYC_DIR, { recursive: true })

/**
 * Round 24 — India KYC (PAN + Aadhaar + address proof).
 *
 * Flow:
 *   1. Customer fills PAN number + uploads PAN, Aadhaar, address proof images
 *      → kycStatus = "pending"
 *   2. Admin reviews via /api/admin/kyc → approves or rejects
 *   3. On approve, kycStatus = "approved"; rejected sets kycRejectReason and
 *      keeps the user in a holding state.
 *
 * Why KYC: any sustained transaction volume triggers Razorpay's KYC checks.
 * Doing it upfront improves conversion + meets DPDP Act 2023 requirements
 * for processing PII (we collect only what we strictly need).
 */

const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, KYC_DIR),
    filename: (req, file, cb) => {
      const userId = (req as AuthedRequest).user?.userId || 'anon'
      const safe = file.originalname.toLowerCase().replace(/[^a-z0-9.-]+/g, '-')
      cb(null, `${userId.slice(-8)}-${Date.now()}-${safe}`)
    },
  }),
  limits: { fileSize: 5 * 1024 ** 2, files: 3 }, // 5 MB per file, max 3
  fileFilter: (_req, file, cb) => {
    if (!/\.(jpg|jpeg|png|pdf)$/i.test(file.originalname)) {
      return cb(new Error('Only JPG, PNG, or PDF allowed'))
    }
    cb(null, true)
  },
})

router.get('/status', async (req: AuthedRequest, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      select: {
        kycStatus: true,
        kycPanNumber: true,
        kycRejectReason: true,
        kycSubmittedAt: true,
        kycReviewedAt: true,
      },
    })
    if (!user) throw new AppError('User not found', 404, 'NOT_FOUND')
    res.json({ data: user })
  } catch (e) { next(e) }
})

router.post(
  '/submit',
  upload.fields([
    { name: 'pan', maxCount: 1 },
    { name: 'aadhaar', maxCount: 1 },
    { name: 'address', maxCount: 1 },
  ]),
  async (req: AuthedRequest, res, next) => {
    try {
      const body = z.object({
        panNumber: z.string().regex(/^[A-Z]{5}\d{4}[A-Z]$/, 'Invalid PAN format'),
      }).parse(req.body)

      const files = req.files as { [field: string]: Express.Multer.File[] } | undefined
      const panFile = files?.pan?.[0]
      const aadhaarFile = files?.aadhaar?.[0]
      const addressFile = files?.address?.[0]

      if (!panFile || !aadhaarFile || !addressFile) {
        throw new AppError('All 3 files required: pan, aadhaar, address', 400, 'INVALID_INPUT')
      }

      const existing = await prisma.user.findUnique({
        where: { id: req.user!.userId },
        select: { kycStatus: true, kycPanFile: true, kycAadhaarFile: true, kycAddressFile: true },
      })
      if (existing?.kycStatus === 'approved') {
        throw new AppError('KYC already approved', 400, 'ALREADY_APPROVED')
      }

      // Clean up old uploads if this is a re-submission
      ;[existing?.kycPanFile, existing?.kycAadhaarFile, existing?.kycAddressFile].forEach((f) => {
        if (f) try { fs.unlinkSync(f) } catch {}
      })

      const updated = await prisma.user.update({
        where: { id: req.user!.userId },
        data: {
          kycStatus: 'pending',
          kycPanNumber: body.panNumber,
          kycPanFile: panFile.path,
          kycAadhaarFile: aadhaarFile.path,
          kycAddressFile: addressFile.path,
          kycSubmittedAt: new Date(),
          kycRejectReason: null,
        },
      })

      await prisma.auditLog.create({
        data: {
          userId: updated.id,
          action: 'kyc.submitted',
          resource: 'kyc',
          resourceId: updated.id,
          newValue: JSON.stringify({ panNumber: body.panNumber }),
        },
      })

      res.json({
        data: {
          kycStatus: updated.kycStatus,
          submittedAt: updated.kycSubmittedAt,
        },
      })
    } catch (e: any) {
      if (e?.code === 'LIMIT_FILE_SIZE') {
        return next(new AppError('File too large (max 5 MB each)', 413, 'FILE_TOO_LARGE'))
      }
      next(e)
    }
  }
)

// Admin endpoints: list + approve + reject
router.get('/admin/list', async (_req, res, next) => {
  try {
    const users = await prisma.user.findMany({
      where: { kycStatus: { in: ['pending', 'approved', 'rejected'] } },
      select: {
        id: true, email: true, firstName: true, lastName: true,
        kycStatus: true, kycPanNumber: true, kycSubmittedAt: true,
        kycReviewedAt: true, kycRejectReason: true,
      },
      orderBy: { kycSubmittedAt: 'desc' },
      take: 200,
    })
    res.json({ data: users })
  } catch (e) { next(e) }
})

router.post('/admin/:userId/approve', async (req: AuthedRequest, res, next) => {
  try {
    const updated = await prisma.user.update({
      where: { id: req.params.userId },
      data: {
        kycStatus: 'approved',
        kycReviewedAt: new Date(),
        kycReviewedBy: req.user!.userId,
        kycRejectReason: null,
      },
    })
    await prisma.auditLog.create({
      data: {
        userId: req.user!.userId,
        action: 'kyc.approved',
        resource: 'kyc',
        resourceId: updated.id,
      },
    })
    logger.info({ userId: updated.id, by: req.user!.userId }, 'KYC approved')
    res.json({ data: { kycStatus: updated.kycStatus } })
  } catch (e) { next(e) }
})

router.post('/admin/:userId/reject', async (req: AuthedRequest, res, next) => {
  try {
    const body = z.object({ reason: z.string().min(3).max(500) }).parse(req.body)
    const updated = await prisma.user.update({
      where: { id: req.params.userId },
      data: {
        kycStatus: 'rejected',
        kycReviewedAt: new Date(),
        kycReviewedBy: req.user!.userId,
        kycRejectReason: body.reason,
      },
    })
    await prisma.auditLog.create({
      data: {
        userId: req.user!.userId,
        action: 'kyc.rejected',
        resource: 'kyc',
        resourceId: updated.id,
        newValue: JSON.stringify({ reason: body.reason }),
      },
    })
    res.json({ data: { kycStatus: updated.kycStatus } })
  } catch (e) { next(e) }
})

export default router
