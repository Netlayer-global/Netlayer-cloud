import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'

/**
 * Pre-footer CTA (DigitalOcean style): a centered, rounded panel with a
 * soft lime radial glow, a confident heading, supporting line, and two
 * actions. Lime palette, theme-aware.
 */
const DASHBOARD_URL = (import.meta.env.VITE_DASHBOARD_URL ?? (import.meta.env.PROD ? '' : 'http://localhost:5173')) as string

export function CTASection() {
  return (
    <section style={{ background: 'var(--nl-0)', borderTop: '1px solid var(--b-subtle)' }}>
      <div className="nl-container" style={{ padding: 'clamp(56px,8vw,96px) clamp(20px,4vw,72px)' }}>
        <div
          className="relative overflow-hidden text-center"
          style={{ borderRadius: 'var(--r-2xl)', border: '1px solid var(--brand-b)', background: 'var(--nl-2)', padding: 'clamp(48px,7vw,88px) clamp(24px,5vw,48px)' }}
        >
          {/* glow */}
          <div
            aria-hidden
            className="absolute pointer-events-none"
            style={{ top: '-40%', left: '50%', transform: 'translateX(-50%)', width: '70%', height: '160%', background: 'radial-gradient(ellipse at 50% 40%, rgba(200,241,53,.18) 0%, transparent 62%)', filter: 'blur(50px)' }}
          />
          <div className="relative">
            <h2 className="nl-display" style={{ fontSize: 'clamp(30px,4.6vw,60px)', color: 'var(--t-hi)', marginBottom: 18, maxWidth: 720, marginInline: 'auto' }}>
              Start building today.
            </h2>
            <p style={{ fontSize: 16.5, color: 'var(--t-med)', lineHeight: 1.6, maxWidth: 540, margin: '0 auto clamp(28px,4vw,38px)' }}>
              Spin up your first server with ₹3,500 in free credit. No card required,
              and you're live in under a minute.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <a href={`${DASHBOARD_URL}/register`} className="nl-btn-primary" style={{ height: 52, padding: '0 32px', fontSize: 15 }}>
                Create free account <ArrowRight size={17} />
              </a>
              <Link to="/pricing" className="nl-btn-ghost" style={{ height: 52, padding: '0 26px', fontSize: 15 }}>
                Compare plans
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
