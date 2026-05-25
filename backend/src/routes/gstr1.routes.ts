import { Router } from 'express'
import prisma from '../utils/prisma'
import { AppError } from '../utils/errors'

const router = Router()

/**
 * Round 20 — GSTR-1 monthly export.
 *
 * Generates a CSV that an Indian seller can use to file their GSTR-1
 * return on the GSTN portal. Layout:
 *   - B2B: invoices issued to customers with GSTIN → CSV section "B2B"
 *   - B2C: small-value invoices to customers without GSTIN → CSV section "B2CS"
 *   - Export: invoices with country != IN → CSV section "EXPORT"
 *   - Credit notes → CSV section "CDNR"
 *
 * Real production filing requires the official offline tool's exact JSON
 * format (per [https://tutorial.gst.gov.in/downloads/news/](https://tutorial.gst.gov.in/downloads/news/) ).
 * We emit a CSV that the seller's accountant uploads manually — that's
 * what 95% of small sellers do anyway. Direct GSTN API integration is
 * Round 23 (P3 compliance round).
 */

const csvEscape = (s: any): string => {
  if (s === null || s === undefined) return ''
  const v = String(s)
  if (v.includes('"') || v.includes(',') || v.includes('\n')) {
    return `"${v.replace(/"/g, '""')}"`
  }
  return v
}

const monthRange = (yyyymm: string) => {
  const m = /^(\d{4})-(\d{2})$/.exec(yyyymm)
  if (!m) throw new AppError('month must be YYYY-MM', 400, 'INVALID_MONTH')
  const year = parseInt(m[1], 10)
  const month = parseInt(m[2], 10) - 1
  const start = new Date(year, month, 1, 0, 0, 0, 0)
  const end = new Date(year, month + 1, 0, 23, 59, 59, 999)
  return { start, end }
}

router.get('/', async (req, res, next) => {
  try {
    const yyyymm = (req.query.month as string) || new Date().toISOString().slice(0, 7)
    const { start, end } = monthRange(yyyymm)

    const [invoices, creditNotes] = await Promise.all([
      prisma.invoice.findMany({
        where: { createdAt: { gte: start, lte: end }, status: { in: ['PAID', 'PENDING'] } },
        include: { user: true },
        orderBy: { createdAt: 'asc' },
      }),
      prisma.creditNote.findMany({
        where: { createdAt: { gte: start, lte: end } },
        include: { user: true, invoice: true },
        orderBy: { createdAt: 'asc' },
      }),
    ])

    const lines: string[] = []
    lines.push(`# GSTR-1 export — Period ${yyyymm}`)
    lines.push(`# Generated ${new Date().toISOString()}`)
    lines.push('')

    // ── B2B ──
    lines.push('## B2B (registered customers with GSTIN)')
    lines.push(['Invoice Number', 'Date', 'GSTIN', 'Customer', 'Place of Supply', 'Taxable Value', 'CGST', 'SGST', 'IGST', 'Total'].join(','))
    for (const inv of invoices) {
      if (!inv.user.gstNumber) continue
      const tb = (() => { try { return JSON.parse(inv.taxBreakdown || '{}') } catch { return {} } })() as any
      const cgst = tb.lines?.find((l: any) => /CGST/i.test(l.label))?.amount ?? 0
      const sgst = tb.lines?.find((l: any) => /SGST/i.test(l.label))?.amount ?? 0
      const igst = tb.lines?.find((l: any) => /IGST/i.test(l.label))?.amount ?? 0
      lines.push([
        csvEscape(inv.invoiceNumber),
        csvEscape(inv.createdAt.toISOString().slice(0, 10)),
        csvEscape(inv.user.gstNumber),
        csvEscape(`${inv.user.firstName} ${inv.user.lastName}`),
        csvEscape(tb.placeOfSupply || inv.user.state || ''),
        csvEscape(inv.amount.toFixed(2)),
        csvEscape(cgst.toFixed(2)),
        csvEscape(sgst.toFixed(2)),
        csvEscape(igst.toFixed(2)),
        csvEscape(inv.total.toFixed(2)),
      ].join(','))
    }
    lines.push('')

    // ── B2CS ──
    lines.push('## B2CS (consumers, no GSTIN)')
    lines.push(['Invoice Number', 'Date', 'Place of Supply', 'Taxable Value', 'Tax', 'Total'].join(','))
    for (const inv of invoices) {
      if (inv.user.gstNumber) continue
      if (inv.user.country !== 'IN') continue
      lines.push([
        csvEscape(inv.invoiceNumber),
        csvEscape(inv.createdAt.toISOString().slice(0, 10)),
        csvEscape(inv.user.state || ''),
        csvEscape(inv.amount.toFixed(2)),
        csvEscape(inv.tax.toFixed(2)),
        csvEscape(inv.total.toFixed(2)),
      ].join(','))
    }
    lines.push('')

    // ── EXPORT ──
    lines.push('## EXPORT (foreign customers, zero-rated)')
    lines.push(['Invoice Number', 'Date', 'Customer', 'Country', 'Currency', 'Amount'].join(','))
    for (const inv of invoices) {
      if (inv.user.country === 'IN') continue
      lines.push([
        csvEscape(inv.invoiceNumber),
        csvEscape(inv.createdAt.toISOString().slice(0, 10)),
        csvEscape(`${inv.user.firstName} ${inv.user.lastName}`),
        csvEscape(inv.user.country || ''),
        csvEscape(inv.currency),
        csvEscape(inv.total.toFixed(2)),
      ].join(','))
    }
    lines.push('')

    // ── CDNR (credit notes against B2B) ──
    lines.push('## CDNR (credit notes)')
    lines.push(['CN Number', 'Date', 'Original Invoice', 'GSTIN', 'Customer', 'Reason', 'Amount', 'Total'].join(','))
    for (const cn of creditNotes) {
      lines.push([
        csvEscape(cn.creditNoteNumber),
        csvEscape(cn.createdAt.toISOString().slice(0, 10)),
        csvEscape(cn.invoice.invoiceNumber),
        csvEscape(cn.user.gstNumber || ''),
        csvEscape(`${cn.user.firstName} ${cn.user.lastName}`),
        csvEscape(cn.reason),
        csvEscape(cn.amount.toFixed(2)),
        csvEscape(cn.total.toFixed(2)),
      ].join(','))
    }

    const csv = lines.join('\r\n')
    res.setHeader('Content-Type', 'text/csv')
    res.setHeader('Content-Disposition', `attachment; filename="GSTR1-${yyyymm}.csv"`)
    res.send(csv)
  } catch (e) { next(e) }
})

export default router
