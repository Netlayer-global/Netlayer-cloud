import { Link } from 'react-router-dom'
import { ArrowRight, Check } from 'lucide-react'

/**
 * Hero — DigitalOcean-style clean two-column layout (lime-themed, VPS).
 *
 * Left:  eyebrow, big Plus Jakarta headline with a lime accent word, a
 *        readable Inter subtext, two CTAs (solid + ghost), and a short
 *        trust microcopy row with check marks.
 * Right: a clean product visual — a rounded "console" panel floating over
 *        a soft lime radial glow + faint dot grid, with a live region pill.
 *
 * Airy, lots of whitespace, rounded cards — DO aesthetic, but lime-on-dark
 * and theme-aware. No crypto/AI-hype; straight VPS infrastructure copy.
 */
const DASHBOARD_URL = import.meta.env.VITE_DASHBOARD_URL || 'http://localhost:5173'

const TRUST = ['Free $200 credit', 'No card to start', 'Live in under a minute']

const PANEL_REGIONS = [
  { city: 'Mumbai', ping: '12 ms' },
  { city: 'Frankfurt', ping: '28 ms' },
  { city: 'New York', ping: '34 ms' },
  { city: 'Singapore', ping: '21 ms' },
]

export function HeroSection() {
  return (
    <section className="relative w-full overflow-hidden" style={{ background: 'var(--surface-canvas)' }}>
      {/* faint dot grid + radial glow */}
      <div aria-hidden className="absolute inset-0 nl-grid-bg" style={{ zIndex: 0 }} />
      <div
        aria-hidden
        className="absolute pointer-events-none"
        style={{
          top: '-20%', right: '-10%', width: '60%', height: '90%', zIndex: 0,
          background: 'radial-gradient(ellipse at 60% 40%, rgba(200,241,53,.14) 0%, transparent 64%)',
          filter: 'blur(70px)',
        }}
      />

      <div
        className="relative grid lg:grid-cols-2 gap-12 lg:gap-16 items-center max-w-7xl mx-auto"
        style={{ zIndex: 2, padding: 'clamp(110px,15vh,170px) clamp(20px,5vw,40px) clamp(64px,9vw,110px)' }}
      >
        {/* ── left: copy ── */}
        <div>
          <div
            className="inline-flex items-center gap-2 nl-mono"
            style={{
              fontSize: 11, letterSpacing: '.16em', textTransform: 'uppercase', color: 'var(--brand)',
              padding: '6px 14px', border: '1px solid var(--brand-b)', borderRadius: 'var(--r-full)',
              background: 'var(--brand-d)', marginBottom: 28,
            }}
          >
            <span className="nl-status-dot rounded-full" style={{ width: 6, height: 6, background: 'var(--brand)' }} />
            15 regions · 99.99% uptime
          </div>

          <h1
            className="nl-display"
            style={{ fontSize: 'clamp(40px,5.6vw,76px)', color: 'var(--t-hi)', marginBottom: 22 }}
          >
            The cloud built to{' '}
            <span style={{ color: 'var(--brand)' }}>deploy in seconds.</span>
          </h1>

          <p style={{ fontSize: 'clamp(16px,1.4vw,19px)', color: 'var(--t-med)', lineHeight: 1.65, maxWidth: 520, marginBottom: 34 }}>
            Cloud VPS, bare metal, and GPU servers on a global KVM platform.
            Per-second billing, a developer-first API, and flat pricing — without
            the enterprise-cloud complexity.
          </p>

          <div className="flex flex-wrap items-center gap-3" style={{ marginBottom: 28 }}>
            <a href={`${DASHBOARD_URL}/register`} className="nl-btn-primary" style={{ height: 50, padding: '0 28px', fontSize: 15 }}>
              Get started <ArrowRight size={17} />
            </a>
            <Link to="/pricing" className="nl-btn-ghost" style={{ height: 50, padding: '0 24px', fontSize: 15 }}>
              Explore products
            </Link>
          </div>

          <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
            {TRUST.map((t) => (
              <span key={t} className="inline-flex items-center gap-2" style={{ fontSize: 13.5, color: 'var(--t-low)' }}>
                <Check size={15} style={{ color: 'var(--brand)' }} /> {t}
              </span>
            ))}
          </div>
        </div>

        {/* ── right: product visual ── */}
        <div className="relative">
          <div
            aria-hidden
            className="absolute pointer-events-none"
            style={{
              inset: '-12%',
              background: 'radial-gradient(ellipse at 50% 45%, rgba(132,204,22,.16) 0%, transparent 66%)',
              filter: 'blur(40px)',
            }}
          />

          {/* console panel */}
          <div
            className="relative nl-float-slow"
            style={{ borderRadius: 'var(--r-2xl)', border: '1px solid var(--b-default)', background: 'var(--nl-2)', boxShadow: 'var(--shadow-lg)', overflow: 'hidden' }}
          >
            {/* header */}
            <div className="flex items-center justify-between" style={{ padding: '16px 20px', borderBottom: '1px solid var(--b-subtle)', background: 'var(--nl-1)' }}>
              <div className="flex items-center gap-2">
                <span className="rounded-full" style={{ width: 10, height: 10, background: 'var(--c-red)' }} />
                <span className="rounded-full" style={{ width: 10, height: 10, background: 'var(--c-amber)' }} />
                <span className="rounded-full" style={{ width: 10, height: 10, background: 'var(--c-green)' }} />
              </div>
              <span className="nl-mono" style={{ fontSize: 11, color: 'var(--t-low)' }}>deploy.netlayer.cloud</span>
            </div>

            {/* body */}
            <div style={{ padding: 22 }}>
              <div className="flex items-center justify-between" style={{ marginBottom: 18 }}>
                <div>
                  <div className="nl-head" style={{ fontSize: 16, color: 'var(--t-hi)' }}>Deploy a server</div>
                  <div style={{ fontSize: 12.5, color: 'var(--t-low)', marginTop: 2 }}>Ubuntu 24.04 · 4 vCPU · 8 GB</div>
                </div>
                <span
                  className="nl-mono inline-flex items-center gap-1.5"
                  style={{ fontSize: 10.5, padding: '5px 11px', borderRadius: 'var(--r-full)', background: 'var(--c-green-d)', border: '1px solid color-mix(in srgb, var(--c-green) 30%, transparent)', color: 'var(--c-green)' }}
                >
                  <span className="nl-status-dot rounded-full" style={{ width: 6, height: 6, background: 'var(--c-green)' }} /> Provisioning
                </span>
              </div>

              {/* region picker */}
              <div className="grid grid-cols-2 gap-2.5">
                {PANEL_REGIONS.map((r, i) => (
                  <div
                    key={r.city}
                    className="flex items-center justify-between"
                    style={{
                      padding: '12px 14px', borderRadius: 'var(--r-md)',
                      border: `1px solid ${i === 0 ? 'var(--brand-b)' : 'var(--b-default)'}`,
                      background: i === 0 ? 'var(--brand-d)' : 'var(--nl-1)',
                    }}
                  >
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--t-hi)' }}>{r.city}</span>
                    <span className="nl-mono" style={{ fontSize: 11, color: i === 0 ? 'var(--brand)' : 'var(--t-low)' }}>{r.ping}</span>
                  </div>
                ))}
              </div>

              {/* progress */}
              <div style={{ marginTop: 18 }}>
                <div className="flex items-center justify-between" style={{ marginBottom: 8 }}>
                  <span className="nl-mono" style={{ fontSize: 10.5, color: 'var(--t-low)' }}>BOOT</span>
                  <span className="nl-mono" style={{ fontSize: 10.5, color: 'var(--brand)' }}>72%</span>
                </div>
                <div style={{ height: 6, borderRadius: 'var(--r-full)', background: 'var(--nl-4)', overflow: 'hidden' }}>
                  <div style={{ width: '72%', height: '100%', background: 'var(--brand)', borderRadius: 'var(--r-full)' }} />
                </div>
              </div>
            </div>
          </div>

          {/* floating mini stat card */}
          <div
            className="absolute hidden sm:flex items-center gap-3 nl-pill nl-float"
            style={{ bottom: -22, left: -18, padding: '14px 18px' }}
          >
            <div className="nl-display" style={{ fontSize: 26, color: 'var(--brand)' }}>~30s</div>
            <div style={{ fontSize: 11.5, color: 'var(--t-med)', lineHeight: 1.3 }}>average<br />boot time</div>
          </div>
        </div>
      </div>
    </section>
  )
}
