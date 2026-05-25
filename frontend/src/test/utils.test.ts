import { describe, it, expect } from 'vitest'
import { cn, formatCurrency } from '../lib/utils'

describe('cn (classname helper)', () => {
  it('joins truthy strings', () => {
    expect(cn('a', 'b', 'c')).toBe('a b c')
  })
  it('drops falsy values', () => {
    expect(cn('a', false && 'b', null, undefined, 'c')).toBe('a c')
  })
  it('handles conditional objects via clsx', () => {
    expect(cn('base', { active: true, hidden: false })).toContain('active')
    expect(cn('base', { active: true, hidden: false })).not.toContain('hidden')
  })
})

describe('formatCurrency', () => {
  it('formats INR with rupee symbol', () => {
    const out = formatCurrency(1234.5)
    expect(out).toMatch(/₹/)
    expect(out).toMatch(/1,234/)
  })
  it('formats USD with currency code prefix', () => {
    const out = formatCurrency(99.9, 'USD')
    expect(out).toMatch(/USD/)
    expect(out).toMatch(/99\.9/)
  })
  it('handles zero correctly', () => {
    const out = formatCurrency(0)
    expect(out).toMatch(/0/)
  })
})
