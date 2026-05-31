import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'

/**
 * CtaBand — reusable centered CTA panel for sub-pages (rounded card, soft
 * lime glow). Distinct from the home page CTASection so copy can vary.
 */
const DASHBOARD_URL = (import.meta.env.VITE_DASHBOARD_URL ?? (import.meta.env.PROD ? '' : 'http://localhost:5173')) as string

export function CtaBand({
  title = 'Start building today.',
  subtitle = '₹3,500 in starter credits. No card required, live in under a minute.',
  primaryLabel = 'Create free account',
  secondaryLabel = 'View pricing',
  secondaryTo = '/pricing',
}: {
  title?: string
  subtitle?: string
  primaryLabel?: string
  secondaryLabel?: string
  secondaryTo?: string
}) {
  return (
    <section style={{ background: 'var(--nl-1)', borderTop: '1px solid var(--b-subtle)' }}>
      <div className="nl-container" style={{ padding: 'clamp(56px,8vw,96px) clamp(20px,4vw,72px)' }}>
        <div
          className="relative overflow-hidden text-center"
          style={{ borderRadius: 'var(--r-2xl)', border: '1px solid var(--brand-b)', background: 'var(--nl-2)', padding: 'clamp(44px,6vw,72px) clamp(24px,5vw,48px)' }}
        >
          <div
            aria-hidden
            className="absolute pointer-events-none"
            style={{ top: '-40%', left: '50%', transform: 'translateX(-50%)', width: '70%', height: '160%', background: 'radial-gradient(ellipse at 50% 40%, rgba(200,241,53,.16) 0%, transparent 62%)', filter: 'blur(50px)' }}
          />
          <div className="relative">
            <h2 className="nl-display" style={{ fontSize: 'clamp(28px,4vw,52px)', color: 'var(--t-hi)', marginBottom: 16, maxWidth: 640, marginInline: 'auto' }}>{title}</h2>
            <p style={{ fontSize: 16, color: 'var(--t-med)', lineHeight: 1.6, maxWidth: 520, margin: '0 auto 28px' }}>{subtitle}</p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <a href={`${DASHBOARD_URL}/register`} className="nl-btn-primary" style={{ height: 50, padding: '0 28px' }}>
                {primaryLabel} <ArrowRight size={16} />
              </a>
              <Link to={secondaryTo} className="nl-btn-ghost" style={{ height: 50, padding: '0 24px' }}>{secondaryLabel}</Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
