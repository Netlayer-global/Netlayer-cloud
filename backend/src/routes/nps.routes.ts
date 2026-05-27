import { Router } from 'express'
import { z } from 'zod'
import prisma from '../utils/prisma'
import { AuthedRequest } from '../middleware/auth'

const router = Router()

/**
 * Round 24 — NPS surveys.
 *
 * Customers see the survey via a banner (max once per 30 days). Score
 * 0-6 = detractor, 7-8 = passive, 9-10 = promoter. NPS = %promoters - %detractors.
 */

const categoryFor = (score: number) =>
  score >= 9 ? 'promoter' : score >= 7 ? 'passive' : 'detractor'

router.post('/submit', async (req: AuthedRequest, res, next) => {
  try {
    const body = z.object({
      score: z.number().int().min(0).max(10),
      comment: z.string().max(2000).optional(),
    }).parse(req.body)

    const survey = await prisma.npsSurvey.create({
      data: {
        userId: req.user!.userId,
        score: body.score,
        comment: body.comment,
        category: categoryFor(body.score),
      },
    })
    res.status(201).json({ data: survey })
  } catch (e) { next(e) }
})

router.get('/eligibility', async (req: AuthedRequest, res, next) => {
  try {
    // Eligible if no submission in the last 30 days
    const cutoff = new Date(Date.now() - 30 * 86_400_000)
    const last = await prisma.npsSurvey.findFirst({
      where: { userId: req.user!.userId, surveyedAt: { gt: cutoff } },
    })
    res.json({ data: { eligible: !last } })
  } catch (e) { next(e) }
})

// Admin: NPS dashboard
router.get('/admin/summary', async (_req, res, next) => {
  try {
    const since = new Date(Date.now() - 90 * 86_400_000)
    const recent = await prisma.npsSurvey.findMany({
      where: { surveyedAt: { gt: since } },
    })
    const promoters = recent.filter((r) => r.category === 'promoter').length
    const passives = recent.filter((r) => r.category === 'passive').length
    const detractors = recent.filter((r) => r.category === 'detractor').length
    const total = recent.length
    const npsScore = total
      ? Math.round(((promoters / total) - (detractors / total)) * 100)
      : null

    res.json({
      data: {
        total,
        promoters, passives, detractors,
        npsScore,
        comments: recent
          .filter((r) => r.comment)
          .slice(0, 50)
          .map((r) => ({ score: r.score, comment: r.comment, category: r.category, at: r.surveyedAt })),
      },
    })
  } catch (e) { next(e) }
})

export default router
