import PDFDocument from 'pdfkit'
import prisma from '../utils/prisma'
import { AppError } from '../utils/errors'
import logger from '../utils/logger'

/**
 * Round 20 — Credit note PDF generation.
 *
 * Layout matches the tax invoice for visual consistency but the title and
 * sequence number make the document type unambiguous. India GST law allows
 * credit notes to share the same template as long as they are clearly
 * labeled and reference the originating invoice number.
 */

const COMPANY = {
  name: 'NetLayer Cloud Pvt. Ltd.',
  address1: 'Trade Centre, Bandra Kurla Complex',
  address2: 'Mumbai, Maharashtra 400051',
  country: 'India',
  email: 'billing@netlayer.com',
  phone: '+91 22 0000 0000',
  gstin: '27AAAAA0000A1Z5',
  cin: 'U72200MH2024PTC000000',
}

const SYMBOLS: Record<string, string> = { INR: '₹', USD: '$', EUR: '€', GBP: '£', AUD: 'A$' }

export async function generateCreditNotePDF(creditNoteId: string): Promise<Buffer> {
  const cn = await prisma.creditNote.findUnique({
    where: { id: creditNoteId },
    include: { invoice: true, user: true },
  })
  if (!cn) throw new AppError('Credit note not found', 404, 'NOT_FOUND')

  const sym = SYMBOLS[cn.currency] || `${cn.currency} `
  const fmt = (n: number) =>
    `${sym}${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

  return new Promise<Buffer>((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'A4', margin: 50, info: { Title: `Credit Note ${cn.creditNoteNumber}` } })
      const chunks: Buffer[] = []
      doc.on('data', (c) => chunks.push(c))
      doc.on('end', () => resolve(Buffer.concat(chunks)))
      doc.on('error', reject)


      // Header
      doc.fillColor('#0070f3').fontSize(22).text('NetLayer Cloud', 50, 50)
      doc.fillColor('#666').fontSize(9).text('netlayer.com', 50, 75)
      doc.fillColor('#dc2626').fontSize(20).text('CREDIT NOTE', 400, 50, { align: 'right' })
      doc.fontSize(10).fillColor('#666')
        .text(`#${cn.creditNoteNumber}`, 400, 78, { align: 'right' })
        .text(cn.createdAt.toDateString(), 400, 92, { align: 'right' })
        .text(`Against invoice #${cn.invoice.invoiceNumber}`, 400, 106, { align: 'right' })

      doc.moveTo(50, 130).lineTo(545, 130).strokeColor('#e5e5e5').stroke()

      // From / To
      doc.fillColor('#666').fontSize(8).text('FROM', 50, 145)
      doc.fillColor('#000').fontSize(10).font('Helvetica-Bold').text(COMPANY.name, 50, 160)
      doc.font('Helvetica').fontSize(9).fillColor('#444')
        .text(COMPANY.address1, 50, 175)
        .text(COMPANY.address2, 50, 188)
        .text(COMPANY.country, 50, 201)
        .text(`GSTIN: ${COMPANY.gstin}`, 50, 217)
        .text(`CIN: ${COMPANY.cin}`, 50, 230)

      doc.fillColor('#666').fontSize(8).text('CREDIT TO', 320, 145)
      doc.fillColor('#000').fontSize(10).font('Helvetica-Bold')
        .text(`${cn.user.firstName} ${cn.user.lastName}`, 320, 160)
      doc.font('Helvetica').fontSize(9).fillColor('#444').text(cn.user.email, 320, 175)
      let yTo = 188
      if (cn.user.company) { doc.text(cn.user.company, 320, yTo); yTo += 13 }
      if (cn.user.gstNumber) { doc.text(`GSTIN: ${cn.user.gstNumber}`, 320, yTo); yTo += 13 }

      // Reason box
      const reasonY = 270
      doc.moveTo(50, reasonY).lineTo(545, reasonY).strokeColor('#e5e5e5').stroke()
      doc.fillColor('#666').fontSize(8).text('REASON', 50, reasonY + 10)
      doc.fillColor('#000').fontSize(11).text(cn.reason.toUpperCase(), 50, reasonY + 25)
      if (cn.notes) {
        doc.fontSize(9).fillColor('#444').text(cn.notes, 50, reasonY + 45, { width: 495 })
      }

      // Totals
      const totalsY = 380
      doc.moveTo(380, totalsY).lineTo(545, totalsY).strokeColor('#000').stroke()
      let y = totalsY + 8
      doc.fillColor('#444').fontSize(9).text('Subtotal', 380, y, { width: 110, align: 'right' })
      doc.fillColor('#000').text(fmt(cn.amount), 470, y, { width: 70, align: 'right' })
      y += 18
      if (cn.tax > 0) {
        doc.fillColor('#444').fontSize(9).text('Tax', 380, y, { width: 110, align: 'right' })
        doc.fillColor('#000').text(fmt(cn.tax), 470, y, { width: 70, align: 'right' })
        y += 18
      }
      doc.moveTo(380, y).lineTo(545, y).strokeColor('#000').stroke()
      y += 8
      doc.font('Helvetica-Bold').fontSize(11).fillColor('#000')
        .text('Credit total', 380, y, { width: 110, align: 'right' })
        .text(fmt(cn.total), 470, y, { width: 70, align: 'right' })
      doc.font('Helvetica')

      // Footer
      doc.fontSize(8).fillColor('#999')
        .text('This credit note has been issued in accordance with India GST regulations.', 50, 760, { align: 'center', width: 495 })
        .text(`${COMPANY.name} · ${COMPANY.email} · ${COMPANY.phone}`, 50, 772, { align: 'center', width: 495 })
        .text('Computer-generated document. No signature required.', 50, 784, { align: 'center', width: 495 })

      doc.end()
    } catch (e: any) {
      logger.error({ err: e, creditNoteId }, 'Credit note PDF render failed')
      reject(e)
    }
  })
}
