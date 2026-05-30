import { Link } from 'react-router-dom'

/**
 * Pre-footer CTA banner (Fireblox split layout). Big condensed heading on
 * the left with a dimmed second line, primary lime button on the right.
 */
const DASHBOARD_URL = import.meta.env.VITE_DASHBOARD_URL || 'http://localhost:5173'

export function CTASection() {
  return (
    <div
      className="relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-8"
      style={{ padding: 'clamp(60px,8vw,90px) clamp(20px,5vw,52px)', borderTop: '1px solid var(--b-subtle)', background: 'var(--nl-0)' }}
    >
      {/* glow */}
      <div
        aria-hidden
        className="absolute pointer-events-none"
        style={{
          top: '-30%', right: '-8%', width: '55%', height: '160%',
          background: 'radial-gradient(ellipse at 60% 50%, rgba(132,204,22,.14) 0%, transparent 65%)',
          filter: 'blur(20px)',
        }}
      />
      <div className="relative">
        <div className="nl-head" style={{ fontSize: 'clamp(38px,6vw,82px)', color: 'var(--t-hi)' }}>
          Ready to deploy?
          <br />
          <span style={{ color: 'color-mix(in srgb, var(--t-hi) 25%, transparent)' }}>
            Spin up your first server free.
          </span>
        </div>
        <p style={{ fontSize: 13, color: 'var(--t-med)', marginTop: 14, letterSpacing: '.04em' }}>
          ₹3,500 in credit · No card required · Live in under a minute.
        </p>
      </div>
      <div className="relative flex flex-col items-start md:items-end gap-3 shrink-0">
        <a href={`${DASHBOARD_URL}/register`} className="nl-btn-primary" style={{ height: 52, padding: '0 38px', fontSize: 13 }}>
          Create free account
        </a>
        <Link to="/pricing" style={{ fontSize: 11, color: 'var(--t-low)', letterSpacing: '.08em', textTransform: 'uppercase' }}>
          or compare plans →
        </Link>
      </div>
    </div>
  )
}
