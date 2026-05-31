import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Check } from 'lucide-react'
import { ThemeToggle } from '../ThemeToggle'

/**
 * AuthLayout — premium split-screen shell for login / register / reset.
 *
 * Left  (lg+): brand showcase — faint dot grid, lime/cyan glow, the lime
 *              logo mark + wordmark, a headline, and a short benefit list.
 * Right:       the form card, centered, with a theme toggle top-right.
 *
 * Theme-aware via CSS tokens (works in both light and dark). Mirrors the
 * marketing site's aesthetic so the jump from website → app feels seamless.
 */
const BENEFITS = [
  'Deploy a server in under 30 seconds',
  'Per-second billing, no lock-in',
  '15 global regions · 99.99% uptime SLA',
  'Developer-first API + Terraform provider',
]

export function AuthLayout({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string
  subtitle: string
  children: ReactNode
  footer?: ReactNode
}) {
  return (
    <div className="min-h-screen grid lg:grid-cols-2" style={{ background: 'var(--nl-0)', color: 'var(--t-hi)' }}>
      {/* ── left: brand showcase ── */}
      <aside
        className="relative hidden lg:flex flex-col justify-between overflow-hidden"
        style={{ background: 'var(--nl-1)', borderRight: '1px solid var(--b-subtle)', padding: 'clamp(40px,4vw,64px)' }}
      >
        {/* grid + glows */}
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            backgroundImage:
              'linear-gradient(to right, var(--grid-line, rgba(255,255,255,.6)) 1px, transparent 1px),' +
              ' linear-gradient(to bottom, var(--grid-line, rgba(255,255,255,.6)) 1px, transparent 1px)',
            backgroundSize: '54px 54px',
            opacity: 0.1,
          }}
        />
        <div
          aria-hidden
          className="absolute pointer-events-none"
          style={{
            top: '-15%', left: '-10%', width: '60%', height: '70%',
            background: 'radial-gradient(ellipse at 40% 40%, rgba(200,241,53,.14) 0%, transparent 66%)',
            filter: 'blur(70px)',
          }}
        />
        <div
          aria-hidden
          className="absolute pointer-events-none"
          style={{
            bottom: '-15%', right: '-8%', width: '52%', height: '64%',
            background: 'radial-gradient(ellipse at 60% 60%, rgba(95,227,192,.10) 0%, transparent 66%)',
            filter: 'blur(70px)',
          }}
        />

        {/* logo */}
        <Link to="/" className="relative inline-flex items-center gap-2.5 cursor-pointer" style={{ width: 'fit-content' }}>
          <span
            className="inline-flex items-center justify-center"
            style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--brand)', color: 'var(--brand-fg)' }}
          >
            <svg viewBox="0 0 32 32" width="19" height="19" aria-hidden>
              <path d="M9 9h4.5l5 8V9H23v14h-4.5l-5-8v8H9V9z" fill="currentColor" />
            </svg>
          </span>
          <span className="nl-heading" style={{ fontWeight: 700, fontSize: 20, color: 'var(--t-hi)' }}>NetLayer</span>
        </Link>

        {/* headline + benefits */}
        <div className="relative">
          <div
            className="inline-flex items-center gap-2 nl-mono"
            style={{
              fontSize: 10.5, letterSpacing: '.16em', textTransform: 'uppercase', color: 'var(--brand)',
              padding: '5px 12px', border: '1px solid var(--brand-b)', borderRadius: 999,
              background: 'var(--brand-d)', marginBottom: 24,
            }}
          >
            <span className="rounded-full" style={{ width: 6, height: 6, background: 'var(--brand)' }} />
            15 regions · 99.99% uptime
          </div>
          <h2 className="nl-heading" style={{ fontSize: 'clamp(28px,2.6vw,40px)', fontWeight: 700, lineHeight: 1.1, color: 'var(--t-hi)', marginBottom: 28, maxWidth: 420 }}>
            The cloud built to{' '}
            <span
              style={{
                background: 'linear-gradient(100deg, var(--brand) 0%, var(--c-cyan) 75%)',
                WebkitBackgroundClip: 'text', backgroundClip: 'text', WebkitTextFillColor: 'transparent', color: 'transparent',
              }}
            >
              deploy in seconds.
            </span>
          </h2>
          <ul className="flex flex-col gap-3.5">
            {BENEFITS.map((b) => (
              <li key={b} className="flex items-center gap-3" style={{ fontSize: 14.5, color: 'var(--t-med)' }}>
                <span
                  className="inline-flex items-center justify-center shrink-0"
                  style={{ width: 22, height: 22, borderRadius: 999, background: 'var(--brand-d)', border: '1px solid var(--brand-b)' }}
                >
                  <Check size={12} style={{ color: 'var(--brand)' }} />
                </span>
                {b}
              </li>
            ))}
          </ul>

          {/* mini stat row */}
          <div className="flex items-center gap-8" style={{ marginTop: 40 }}>
            {[['50K+', 'Developers'], ['15', 'Regions'], ['~30s', 'To deploy']].map(([n, l]) => (
              <div key={l}>
                <div className="nl-heading" style={{ fontSize: 26, fontWeight: 700, color: 'var(--t-hi)' }}>{n}</div>
                <div className="nl-mono" style={{ fontSize: 10.5, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--t-low)', marginTop: 2 }}>{l}</div>
              </div>
            ))}
          </div>
        </div>

        {/* footer line */}
        <div className="relative" style={{ fontSize: 12.5, color: 'var(--t-low)' }}>
          © {new Date().getFullYear()} NetLayer Cloud · Made in India
        </div>
      </aside>

      {/* ── right: form ── */}
      <main className="relative flex items-center justify-center" style={{ padding: 'clamp(28px,5vw,48px)' }}>
        <div className="absolute top-4 right-4">
          <ThemeToggle />
        </div>

        <div className="w-full" style={{ maxWidth: 400 }}>
          {/* mobile logo */}
          <Link to="/" className="lg:hidden flex items-center justify-center gap-2.5 cursor-pointer" style={{ marginBottom: 32 }}>
            <span className="inline-flex items-center justify-center" style={{ width: 30, height: 30, borderRadius: 8, background: 'var(--brand)', color: 'var(--brand-fg)' }}>
              <svg viewBox="0 0 32 32" width="18" height="18" aria-hidden>
                <path d="M9 9h4.5l5 8V9H23v14h-4.5l-5-8v8H9V9z" fill="currentColor" />
              </svg>
            </span>
            <span className="nl-heading" style={{ fontWeight: 700, fontSize: 19, color: 'var(--t-hi)' }}>NetLayer</span>
          </Link>

          <div
            style={{
              background: 'var(--nl-2)',
              border: '1px solid var(--b-default)',
              borderRadius: 'var(--r-xl)',
              padding: 'clamp(24px,3vw,36px)',
              boxShadow: 'var(--shadow-lg)',
            }}
          >
            <div style={{ marginBottom: 24 }}>
              <h1 className="nl-heading" style={{ fontSize: 26, fontWeight: 700, color: 'var(--t-hi)', marginBottom: 8 }}>{title}</h1>
              <p style={{ fontSize: 14.5, color: 'var(--t-med)' }}>{subtitle}</p>
            </div>

            {children}

            {footer && <div style={{ marginTop: 24 }}>{footer}</div>}
          </div>
        </div>
      </main>
    </div>
  )
}
