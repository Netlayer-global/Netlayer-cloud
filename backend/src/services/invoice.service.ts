import PDFDocument from 'pdfkit'
import prisma from '../utils/prisma'
import { AppError } from '../utils/errors'
import { computeTax, TaxResult } from './tax.service'
import logger from '../utils/logger'

/**
 * Invoice service — PDF generation + tax recompute.
 *
 * The PDF is rendered on-demand via pdfkit. Layout is intentionally
 * minimal/professional: header → bill-to → items table → totals → footer.
 *
 * For India invoices, GST split (CGST/SGST or IGST), HSN code, and
 * place-of-supply are printed per the tax rules. For EU VAT we print the
 * reverse-charge notice when applicable.
 */

const COMPANY = {
  name: 'NetLayer Cloud Pvt. Ltd.',
  address1: 'Trade Centre, Bandra Kurla Complex',
  address2: 'Mumbai, Maharashtra 400051',
  country: 'India',
  email: 'billing@netlayer.com',
  phone: '+91 22 0000 0000',
  gstin: '27AAAAA0000A1Z5',           // placeholder; set real value from settings
  cin: 'U72200MH2024PTC000000',
  state: 'MH',
}

interface RenderOptions {
  invoiceId: string
}

export async function generateInvoicePDF({ invoiceId }: RenderOptions): Promise<Buffer> {
  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: { user: true },
  })
  if (!invoice) throw new AppError('Invoice not found', 404, 'NOT_FOUND')

  // Items
  let items: any[] = []
  try { items = JSON.parse(invoice.items) } catch { items = [] }

  // Recompute tax from authoritative rules so the printed PDF is always correct.
  const subtotal = invoice.amount
  const tax: TaxResult = computeTax({
    amount: subtotal,
    country: invoice.user.country,
    state: invoice.user.state || undefined,
    gstNumber: invoice.user.gstNumber || undefined,
    vatNumber: invoice.user.vatNumber || undefined,
  })
  const grandTotal = subtotal + tax.total

  return new Promise<Buffer>((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'A4', margin: 50, info: { Title: `Invoice ${invoice.invoiceNumber}` } })
      const chunks: Buffer[] = []
      doc.on('data', (c) => chunks.push(c))
      doc.on('end', () => resolve(Buffer.concat(chunks)))
      doc.on('error', reject)

      // ── Header ──────────────────────────────────
      doc
        .fillColor('#0070f3').fontSize(22).text('NetLayer Cloud', 50, 50, { continued: false })
        .fillColor('#666').fontSize(9).text('netlayer.com', 50, 75)

      doc
        .fillColor('#000').fontSize(20).text('INVOICE', 400, 50, { align: 'right' })
        .fontSize(10).fillColor('#666')
        .text(`#${invoice.invoiceNumber}`, 400, 78, { align: 'right' })
        .text(invoice.createdAt.toDateString(), 400, 92, { align: 'right' })

      doc.moveTo(50, 120).lineTo(545, 120).strokeColor('#e5e5e5').stroke()

      // ── From / To ──────────────────────────────
      doc.fillColor('#666').fontSize(8).text('FROM', 50, 135)
      doc.fillColor('#000').fontSize(10).font('Helvetica-Bold').text(COMPANY.name, 50, 150)
      doc.font('Helvetica').fontSize(9).fillColor('#444')
        .text(COMPANY.address1, 50, 165)
        .text(COMPANY.address2, 50, 178)
        .text(COMPANY.country, 50, 191)
        .text(`GSTIN: ${COMPANY.gstin}`, 50, 207)
        .text(`CIN: ${COMPANY.cin}`, 50, 220)

      doc.fillColor('#666').fontSize(8).text('BILL TO', 320, 135)
      doc.fillColor('#000').fontSize(10).font('Helvetica-Bold')
        .text(`${invoice.user.firstName} ${invoice.user.lastName}`, 320, 150)
      doc.font('Helvetica').fontSize(9).fillColor('#444')
        .text(invoice.user.email, 320, 165)
      let yTo = 178
      if (invoice.user.company) { doc.text(invoice.user.company, 320, yTo); yTo += 13 }
      if (invoice.user.addressLine1) { doc.text(invoice.user.addressLine1, 320, yTo); yTo += 13 }
      if (invoice.user.addressLine2) { doc.text(invoice.user.addressLine2, 320, yTo); yTo += 13 }
      const cityLine = [invoice.user.city, invoice.user.state, invoice.user.postalCode].filter(Boolean).join(', ')
      if (cityLine) { doc.text(cityLine, 320, yTo); yTo += 13 }
      doc.text(invoice.user.country, 320, yTo); yTo += 13
      if (invoice.user.gstNumber) { doc.text(`GSTIN: ${invoice.user.gstNumber}`, 320, yTo); yTo += 13 }
      if (invoice.user.vatNumber) { doc.text(`VAT: ${invoice.user.vatNumber}`, 320, yTo); yTo += 13 }

      // ── Meta strip ─────────────────────────────
      const metaY = 260
      doc.moveTo(50, metaY).lineTo(545, metaY).strokeColor('#e5e5e5').stroke()
      doc.fillColor('#666').fontSize(8)
        .text('ISSUE DATE', 50, metaY + 10)
        .text('DUE DATE', 200, metaY + 10)
        .text('STATUS', 350, metaY + 10)
        .text('CURRENCY', 470, metaY + 10)
      doc.fillColor('#000').fontSize(10)
        .text(invoice.createdAt.toDateString(), 50, metaY + 25)
        .text(invoice.dueDate.toDateString(), 200, metaY + 25)
        .text(invoice.status, 350, metaY + 25)
        .text(invoice.currency, 470, metaY + 25)
      if (tax.placeOfSupply) {
        doc.fillColor('#666').fontSize(8).text('PLACE OF SUPPLY', 50, metaY + 50)
        doc.fillColor('#000').fontSize(10).text(tax.placeOfSupply, 50, metaY + 65)
      }
      if (tax.hsnCode) {
        doc.fillColor('#666').fontSize(8).text('HSN/SAC CODE', 200, metaY + 50)
        doc.fillColor('#000').fontSize(10).text(tax.hsnCode, 200, metaY + 65)
      }

      // ── Items table ─────────────────────────────
      const tableY = metaY + 100
      doc.moveTo(50, tableY).lineTo(545, tableY).strokeColor('#000').stroke()
      doc.fillColor('#000').fontSize(9).font('Helvetica-Bold')
        .text('Description', 55, tableY + 8)
        .text('Qty', 350, tableY + 8, { width: 40, align: 'right' })
        .text('Unit Price', 400, tableY + 8, { width: 60, align: 'right' })
        .text('Amount', 470, tableY + 8, { width: 70, align: 'right' })
      doc.moveTo(50, tableY + 25).lineTo(545, tableY + 25).strokeColor('#e5e5e5').stroke()

      let rowY = tableY + 35
      const currencySymbol: Record<string, string> = { INR: '₹', USD: '$', EUR: '€', GBP: '£', AUD: 'A$', AED: 'د.إ ' }
      const sym = currencySymbol[invoice.currency] || `${invoice.currency} `
      const fmt = (n: number) => `${sym}${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

      doc.font('Helvetica').fontSize(9).fillColor('#000')
      if (items.length === 0) {
        doc.text(invoice.notes || 'Cloud services', 55, rowY)
        doc.text('1', 350, rowY, { width: 40, align: 'right' })
        doc.text(fmt(invoice.amount), 400, rowY, { width: 60, align: 'right' })
        doc.text(fmt(invoice.amount), 470, rowY, { width: 70, align: 'right' })
        rowY += 18
      } else {
        for (const item of items) {
          const qty = item.qty || item.quantity || 1
          const unit = item.price || item.amount || 0
          const total = qty * (item.price ?? item.amount ?? unit)
          doc.text(String(item.description || item.name || 'Item'), 55, rowY, { width: 290 })
          doc.text(String(qty), 350, rowY, { width: 40, align: 'right' })
          doc.text(fmt(unit), 400, rowY, { width: 60, align: 'right' })
          doc.text(fmt(item.amount ?? total), 470, rowY, { width: 70, align: 'right' })
          rowY += 18
        }
      }

      // ── Totals block ────────────────────────────
      doc.moveTo(50, rowY + 10).lineTo(545, rowY + 10).strokeColor('#e5e5e5').stroke()
      let totalsY = rowY + 25

      const printRow = (label: string, value: string, bold = false) => {
        if (bold) doc.font('Helvetica-Bold')
        doc.fillColor('#444').fontSize(9).text(label, 350, totalsY, { width: 110, align: 'right' })
        doc.fillColor('#000').text(value, 470, totalsY, { width: 70, align: 'right' })
        if (bold) doc.font('Helvetica')
        totalsY += 18
      }

      printRow('Subtotal', fmt(subtotal))
      for (const line of tax.lines) printRow(line.label, fmt(line.amount))
      if (tax.reverseCharge) printRow('Reverse charge', '0.00')

      doc.moveTo(350, totalsY).lineTo(545, totalsY).strokeColor('#000').stroke()
      totalsY += 8
      printRow('Total', fmt(grandTotal), true)

      // Notes
      if (tax.notes.length > 0) {
        doc.fillColor('#666').fontSize(8).text(tax.notes.join('  ·  '), 50, totalsY + 20, { width: 495 })
      }

      // ── Footer ─────────────────────────────────
      doc.fontSize(8).fillColor('#999')
        .text('Thank you for your business.', 50, 760, { align: 'center', width: 495 })
        .text(`${COMPANY.name} · ${COMPANY.email} · ${COMPANY.phone}`, 50, 772, { align: 'center', width: 495 })
        .text('This is a computer-generated invoice and does not require a signature.', 50, 784, { align: 'center', width: 495 })

      doc.end()
    } catch (e: any) {
      logger.error({ err: e, invoiceId }, 'PDF render failed')
      reject(e)
    }
  })
}
