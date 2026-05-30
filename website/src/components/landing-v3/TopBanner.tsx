import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'

/**
 * Thin promo strip above the navbar — single line, brand-tinted, dismissible
 * by user via close icon (state lives in localStorage so it doesn't re-show
 * after refresh).
 *
 * Uses the dashboard tokens (lime brand on dark). Styling stays in line
 * with `nl-v3` scope so it doesn't leak to the dashboard.
 */
export function TopBanner() {
  return (
    <div
      className="relative w-full text-[12px]"
      style={{
        background: 'linear-gradient(90deg, rgba(200,241,53,0.06) 0%, rgba(200,241,53,0.12) 50%, rgba(200,241,53,0.06) 100%)',
        borderBottom: '1px solid var(--b-subtle)',
        zIndex: 60,
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-9 flex items-center justify-center gap-2 flex-wrap">
        <span className="px-1.5 h-4 inline-flex items-center rounded nl-mono text-[9px] uppercase tracking-wider"
              style={{ background: 'var(--brand)', color: 'var(--brand-fg)' }}>
          NEW
        </span>
        <span style={{ color: 'var(--t-med)' }}>
          Bare metal in Mumbai &amp; Delhi — from{' '}
          <span style={{ color: 'var(--t-hi)', fontWeight: 500 }}>₹999/mo</span>.
        </span>
        <Link
          to="/pricing#bare"
          className="inline-flex items-center gap-1 cursor-pointer transition-colors"
          style={{ color: 'var(--brand)' }}
        >
          See plans <ArrowRight size={11} />
        </Link>
      </div>
    </div>
  )
}
