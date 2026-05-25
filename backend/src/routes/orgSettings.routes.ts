import { Router } from 'express'
import { z } from 'zod'
import prisma from '../utils/prisma'
import { AuthedRequest } from '../middleware/auth'

const router = Router()

/**
 * Round 23 — organization + GST + invoice prefix settings.
 *
 * Stored as IntegrationConfig rows with keys:
 *   platform.organization  → company name, address, contact
 *   platform.gst           → GSTIN, PAN, HSN, fiscal-year prefix
 *   platform.invoicing     → invoice number prefix, footer text, payment terms
 *   platform.legal         → support/legal/privacy email targets
 *
 * One endpoint returns all four merged. PATCH accepts a partial object
 * keyed by section name.
 */

const safeJSON = <T>(v: unknown, fallback: T): T => {
  if (typeof v !== 'string') return (v as T) ?? fallback
  try { return JSON.parse(v) as T } catch { return fallback }
}

const DEFAULTS = {
  organization: {
    name: 'NetLayer Cloud Pvt. Ltd.',
    addressLine1: 'Trade Centre, Bandra Kurla Complex',
    addressLine2: '',
    city: 'Mumbai',
    state: 'Maharashtra',
    postalCode: '400051',
    country: 'India',
    countryCode: 'IN',
    phone: '+91 22 0000 0000',
    website: 'https://netlayer.com',
  },
  gst: {
    gstin: '27AAAAA0000A1Z5',
    pan: 'AAAAA0000A',
    cin: 'U72200MH2024PTC000000',
    hsnCode: '998319',
    sellerStateCode: '27',                    // 27 = Maharashtra
    invoicePrefix: 'NL',                      // NL/2025-26/000001
    creditNotePrefix: 'CN',                   // CN/2025-26/000001
    receiptPrefix: 'RC',
    fiscalYearStart: 'april',                 // april | january
  },
  invoicing: {
    paymentTermsDays: 7,
    footerNote: 'Computer-generated invoice. No signature required.',
    autoSendOnCreate: true,
    attachPdfToEmail: true,
    cancelStuckOrdersAfterHours: 24,
  },
  legal: {
    supportEmail: 'support@netlayer.com',
    salesEmail: 'sales@netlayer.com',
    legalEmail: 'legal@netlayer.com',
    privacyEmail: 'privacy@netlayer.com',
    abuseEmail: 'abuse@netlayer.com',
    billingEmail: 'billing@netlayer.com',
  },
} as const

type SettingsKey = keyof typeof DEFAULTS

router.get('/', async (_req, res, next) => {
  try {
    const keys = (Object.keys(DEFAULTS) as SettingsKey[]).map((k) => `platform.${k}`)
    const rows = await prisma.integrationConfig.findMany({ where: { key: { in: keys as string[] } } })
    const out: Record<string, any> = {}
    for (const k of Object.keys(DEFAULTS) as SettingsKey[]) {
      const row = rows.find((r) => r.key === `platform.${k}`)
      const stored = row ? safeJSON(row.value, {} as any) : {}
      out[k] = { ...DEFAULTS[k], ...stored }
    }
    res.json({ data: out })
  } catch (e) { next(e) }
})

router.patch('/', async (req: AuthedRequest, res, next) => {
  try {
    const body = z
      .object({
        organization: z.record(z.any()).optional(),
        gst: z.record(z.any()).optional(),
        invoicing: z.record(z.any()).optional(),
        legal: z.record(z.any()).optional(),
      })
      .parse(req.body)

    const updates: Promise<any>[] = []
    for (const k of Object.keys(body) as SettingsKey[]) {
      const incoming = (body as any)[k] as Record<string, any>
      if (!incoming) continue
      const fullKey = `platform.${k}`
      const existing = await prisma.integrationConfig.findUnique({ where: { key: fullKey } })
      const merged = {
        ...(existing ? safeJSON(existing.value, {} as any) : {}),
        ...incoming,
      }
      updates.push(
        prisma.integrationConfig.upsert({
          where: { key: fullKey },
          update: { value: JSON.stringify(merged), updatedBy: req.user!.userId },
          create: { key: fullKey, value: JSON.stringify(merged), updatedBy: req.user!.userId },
        })
      )
    }
    await Promise.all(updates)

    // Audit
    await prisma.auditLog.create({
      data: {
        userId: req.user!.userId,
        action: 'admin.org_settings_updated',
        resource: 'settings',
        newValue: JSON.stringify(Object.keys(body)),
      },
    })

    res.json({ data: { saved: Object.keys(body) } })
  } catch (e) { next(e) }
})

export default router
