/**
 * Tax engine.
 *
 * Computes the tax breakdown for an invoice based on the customer's billing
 * country. Returns a normalised structure that the invoice generator can
 * print into the PDF.
 *
 * Rules:
 *   - IN: 18% GST. Intra-state (placeOfSupply == sellerState) → 9% CGST + 9% SGST.
 *         Inter-state → 18% IGST. HSN code for cloud services: 998319.
 *   - EU VAT: per-country rates. B2B with valid VAT number → reverse-charge (0%).
 *   - GB: 20% VAT.
 *   - SG: 9% GST.
 *   - US, others: 0% (sales tax not handled at this layer).
 *
 * The seller (NetLayer Cloud) is registered in IN (Maharashtra) for this
 * implementation. Switch SELLER_STATE if you re-domicile.
 */

const SELLER_COUNTRY = 'IN'
const SELLER_STATE = 'MH' // Maharashtra (Mumbai HQ)

const EU_VAT_RATES: Record<string, number> = {
  AT: 0.20, BE: 0.21, BG: 0.20, HR: 0.25, CY: 0.19, CZ: 0.21,
  DK: 0.25, EE: 0.22, FI: 0.255, FR: 0.20, DE: 0.19, GR: 0.24,
  HU: 0.27, IE: 0.23, IT: 0.22, LV: 0.21, LT: 0.21, LU: 0.17,
  MT: 0.18, NL: 0.21, PL: 0.23, PT: 0.23, RO: 0.21, SK: 0.20,
  SI: 0.22, ES: 0.21, SE: 0.25,
}

export interface TaxInput {
  amount: number          // pre-tax subtotal
  country: string         // ISO-3166 alpha-2
  state?: string          // for IN intra/inter-state split
  vatNumber?: string      // EU VAT number (B2B reverse-charge if set)
  gstNumber?: string      // IN GSTIN (informational)
}

export interface TaxLine {
  label: string           // e.g. "GST 18%", "CGST 9%", "VAT 19%"
  rate: number            // 0.18, 0.09, 0.19
  amount: number          // computed
}

export interface TaxResult {
  lines: TaxLine[]
  total: number
  hsnCode?: string        // populated for India
  placeOfSupply?: string  // populated for India
  reverseCharge: boolean  // true if EU B2B with valid VAT number
  notes: string[]
}

const round2 = (n: number) => Math.round(n * 100) / 100

export function computeTax(input: TaxInput): TaxResult {
  const country = (input.country || '').toUpperCase()
  const lines: TaxLine[] = []
  const notes: string[] = []
  const result: TaxResult = {
    lines, total: 0, reverseCharge: false, notes,
  }

  // ── INDIA ───────────────────────────────────────
  if (country === 'IN') {
    const customerState = (input.state || '').toUpperCase()
    const intraState = customerState === SELLER_STATE
    result.hsnCode = '998319'
    result.placeOfSupply = customerState ? `${customerState} (India)` : 'India'

    if (intraState) {
      const half = round2(input.amount * 0.09)
      lines.push({ label: 'CGST 9%', rate: 0.09, amount: half })
      lines.push({ label: 'SGST 9%', rate: 0.09, amount: half })
    } else {
      const igst = round2(input.amount * 0.18)
      lines.push({ label: 'IGST 18%', rate: 0.18, amount: igst })
    }
    if (input.gstNumber) notes.push(`Customer GSTIN: ${input.gstNumber}`)
    result.total = round2(lines.reduce((s, l) => s + l.amount, 0))
    return result
  }

  // ── EUROPEAN UNION ──────────────────────────────
  if (EU_VAT_RATES[country] !== undefined) {
    if (input.vatNumber && /^[A-Z]{2}[0-9A-Z]{2,12}$/.test(input.vatNumber)) {
      result.reverseCharge = true
      notes.push(`Reverse charge — Article 196 of Council Directive 2006/112/EC. VAT: ${input.vatNumber}`)
      result.total = 0
      return result
    }
    const rate = EU_VAT_RATES[country]
    lines.push({
      label: `VAT ${(rate * 100).toFixed(rate * 100 % 1 ? 1 : 0)}%`,
      rate,
      amount: round2(input.amount * rate),
    })
    result.total = round2(lines.reduce((s, l) => s + l.amount, 0))
    return result
  }

  // ── UNITED KINGDOM ──────────────────────────────
  if (country === 'GB') {
    if (input.vatNumber && /^GB[0-9]{9,12}$/.test(input.vatNumber)) {
      result.reverseCharge = true
      notes.push(`Reverse charge — VAT: ${input.vatNumber}`)
      result.total = 0
      return result
    }
    lines.push({ label: 'VAT 20%', rate: 0.20, amount: round2(input.amount * 0.20) })
    result.total = round2(lines.reduce((s, l) => s + l.amount, 0))
    return result
  }

  // ── SINGAPORE ───────────────────────────────────
  if (country === 'SG') {
    lines.push({ label: 'GST 9%', rate: 0.09, amount: round2(input.amount * 0.09) })
    result.total = round2(lines.reduce((s, l) => s + l.amount, 0))
    return result
  }

  // ── DEFAULT (US + rest of world) ────────────────
  result.total = 0
  notes.push(`No tax applied for ${country || 'unknown country'}.`)
  return result
}
