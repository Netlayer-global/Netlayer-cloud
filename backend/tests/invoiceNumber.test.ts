import { describe, it, expect, beforeEach } from 'vitest'
import prisma from '../src/utils/prisma'
import invoiceNumberService, { getFiscalYear } from '../src/services/invoiceNumber.service'

/**
 * Round 22 — sequential numbering must be:
 *   - monotonic per fiscalYear / kind
 *   - gap-free
 *   - safe under concurrent calls (no duplicates)
 *   - correctly bucketed by Indian fiscal year (April → March)
 */

describe('invoiceNumberService', () => {
  beforeEach(async () => {
    await prisma.invoiceCounter.deleteMany({ where: { fiscalYear: { startsWith: 'TEST-' } } })
  })

  describe('getFiscalYear', () => {
    it('uses April–March fiscal year', () => {
      expect(getFiscalYear(new Date('2025-04-01'))).toBe('2025-26')
      expect(getFiscalYear(new Date('2025-12-31'))).toBe('2025-26')
      expect(getFiscalYear(new Date('2026-03-31'))).toBe('2025-26')
      expect(getFiscalYear(new Date('2026-04-01'))).toBe('2026-27')
    })
    it('handles January correctly (still in previous FY)', () => {
      expect(getFiscalYear(new Date('2026-01-15'))).toBe('2025-26')
    })
  })

  it('issues sequential numbers', async () => {
    const a = await invoiceNumberService.issue('invoice')
    const b = await invoiceNumberService.issue('invoice')
    expect(b.sequence).toBe(a.sequence + 1)
    expect(a.number).toMatch(/^NL\/\d{4}-\d{2}\/\d{6}$/)
    expect(b.number).toMatch(/^NL\/\d{4}-\d{2}\/\d{6}$/)
  })

  it('uses different sequences for invoice vs credit_note', async () => {
    const inv = await invoiceNumberService.issue('invoice')
    const cn = await invoiceNumberService.issue('credit_note')
    expect(inv.number).toMatch(/^NL\//)
    expect(cn.number).toMatch(/^CN\//)
  })

  it('issues unique numbers under concurrent load', async () => {
    const N = 10
    const results = await Promise.all(
      Array.from({ length: N }, () => invoiceNumberService.issue('invoice'))
    )
    const numbers = results.map((r) => r.number)
    const unique = new Set(numbers)
    expect(unique.size).toBe(N)
  })
})
