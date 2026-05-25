import prisma from '../utils/prisma'

/**
 * Round 20 — sequential, gap-free invoice numbering for India GST compliance.
 *
 * India GST law (CGST Rule 46) requires:
 *   - Tax invoices: monotonic, gap-free sequence per fiscal year per series
 *   - Credit notes: separate sequence with own format (e.g. CN/...)
 *   - Receipts: optional, separate sequence
 *
 * Format used by NetLayer:
 *   NL/2025-26/000001  → tax invoice
 *   CN/2025-26/000001  → credit note
 *   RC/2025-26/000001  → receipt (top-up)
 *
 * Round 23: prefixes are configurable via platform.gst settings
 *   { invoicePrefix: 'NL', creditNotePrefix: 'CN', receiptPrefix: 'RC' }
 *
 * Concurrency:
 *   - We wrap the increment in a Prisma `$transaction` with an UPDATE on
 *     a unique row (kind, fiscalYear). On Postgres this acquires a row
 *     lock; on SQLite the entire DB is single-writer so it's already safe.
 *   - Even under burst load (10 deploys/sec) the unique-constraint guarantee
 *     is preserved by Prisma's SERIALIZABLE-equivalent isolation.
 */

export type CounterKind = 'invoice' | 'credit_note' | 'receipt'

const FALLBACK_PREFIX: Record<CounterKind, string> = {
  invoice:     'NL',
  credit_note: 'CN',
  receipt:     'RC',
}

const PREFIX_KEY_BY_KIND: Record<CounterKind, string> = {
  invoice:     'invoicePrefix',
  credit_note: 'creditNotePrefix',
  receipt:     'receiptPrefix',
}

let prefixCache: { fetchedAt: number; values: Record<CounterKind, string> } | null = null

async function loadPrefixes(): Promise<Record<CounterKind, string>> {
  // 60s cache so we don't hit the DB every issue() call.
  if (prefixCache && Date.now() - prefixCache.fetchedAt < 60_000) {
    return prefixCache.values
  }
  const cfg = await prisma.integrationConfig.findUnique({ where: { key: 'platform.gst' } })
  let stored: Record<string, string> = {}
  if (cfg?.value) {
    try { stored = JSON.parse(cfg.value) } catch {}
  }
  const values: Record<CounterKind, string> = {
    invoice:     stored[PREFIX_KEY_BY_KIND.invoice]     || FALLBACK_PREFIX.invoice,
    credit_note: stored[PREFIX_KEY_BY_KIND.credit_note] || FALLBACK_PREFIX.credit_note,
    receipt:     stored[PREFIX_KEY_BY_KIND.receipt]     || FALLBACK_PREFIX.receipt,
  }
  prefixCache = { fetchedAt: Date.now(), values }
  return values
}

/**
 * Indian fiscal year is April → March. So 2025-04-01 falls in FY 2025-26.
 * For non-India use, we still use this scheme since it's unambiguous.
 */
export function getFiscalYear(date: Date = new Date()): string {
  const month = date.getMonth() // 0-11
  const year = date.getFullYear()
  if (month >= 3) {
    // April or later
    return `${year}-${String(year + 1).slice(-2)}`
  }
  return `${year - 1}-${String(year).slice(-2)}`
}

export interface IssuedNumber {
  number: string         // 'NL/2025-26/000001'
  sequence: number       // 1
  fiscalYear: string     // '2025-26'
  kind: CounterKind
}

export class InvoiceNumberService {
  /**
   * Atomically reserve the next number for the given kind/fiscalYear pair.
   * Always returns a unique number, even under concurrent calls.
   */
  async issue(kind: CounterKind, date: Date = new Date()): Promise<IssuedNumber> {
    const fiscalYear = getFiscalYear(date)
    const prefixes = await loadPrefixes()
    const prefix = prefixes[kind]

    // The transaction guarantees the upsert+read happens atomically. We use
    // upsert so the very first invoice in a new FY auto-creates the counter
    // without an admin step.
    const counter = await prisma.$transaction(async (tx) => {
      const existing = await tx.invoiceCounter.findUnique({
        where: { kind_fiscalYear: { kind, fiscalYear } },
      })
      if (existing) {
        return tx.invoiceCounter.update({
          where: { id: existing.id },
          data: { current: { increment: 1 } },
        })
      }
      return tx.invoiceCounter.create({
        data: { kind, fiscalYear, current: 1, prefix },
      })
    })

    const padded = String(counter.current).padStart(6, '0')
    return {
      number: `${prefix}/${fiscalYear}/${padded}`,
      sequence: counter.current,
      fiscalYear,
      kind,
    }
  }

  /**
   * Read-only: peek at what the next number *would* be without consuming it.
   * Used by admin previews — never call this then write the same number,
   * always use `issue()` for the actual write.
   */
  async peek(kind: CounterKind, date: Date = new Date()): Promise<string> {
    const fiscalYear = getFiscalYear(date)
    const prefixes = await loadPrefixes()
    const prefix = prefixes[kind]
    const counter = await prisma.invoiceCounter.findUnique({
      where: { kind_fiscalYear: { kind, fiscalYear } },
    })
    const next = (counter?.current ?? 0) + 1
    const padded = String(next).padStart(6, '0')
    return `${prefix}/${fiscalYear}/${padded}`
  }

  /** Admin: list counter state across fiscal years (used by /admin/billing dashboard). */
  async listCounters() {
    return prisma.invoiceCounter.findMany({
      orderBy: [{ fiscalYear: 'desc' }, { kind: 'asc' }],
    })
  }
}

export default new InvoiceNumberService()
