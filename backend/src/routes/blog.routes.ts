import { Router } from 'express'
import prisma from '../utils/prisma'

const router = Router()

/**
 * Public blog API powering /blog and /blog/:slug.
 *
 * Posts are stored as Markdown — the frontend handles rendering. Tags are
 * a JSON-encoded string in SQLite; we parse them back to an array at the
 * boundary so the API surface looks like a real Postgres-backed CMS.
 */

const parsePost = (p: any) => ({
  ...p,
  tags: (() => {
    try { return JSON.parse(p.tags || '[]') } catch { return [] }
  })(),
})

router.get('/', async (req, res, next) => {
  try {
    const { category, tag, limit = '20' } = req.query
    const where: any = { published: true }
    if (typeof category === 'string' && category) where.category = category

    const posts = await prisma.blogPost.findMany({
      where,
      orderBy: { publishedAt: 'desc' },
      take: Math.min(parseInt(String(limit), 10) || 20, 100),
      select: {
        id: true,
        slug: true,
        title: true,
        excerpt: true,
        cover: true,
        category: true,
        authorName: true,
        authorRole: true,
        readMinutes: true,
        tags: true,
        publishedAt: true,
      },
    })

    let parsed = posts.map(parsePost)
    if (typeof tag === 'string' && tag) {
      parsed = parsed.filter((p) => p.tags.includes(tag))
    }

    res.setHeader('Cache-Control', 'public, max-age=60')
    res.json({ data: parsed })
  } catch (e) { next(e) }
})

router.get('/:slug', async (req, res, next) => {
  try {
    const post = await prisma.blogPost.findFirst({
      where: { slug: req.params.slug, published: true },
    })
    if (!post) return res.status(404).json({ error: 'Post not found', code: 'NOT_FOUND' })
    res.setHeader('Cache-Control', 'public, max-age=120')
    res.json({ data: parsePost(post) })
  } catch (e) { next(e) }
})

export default router
