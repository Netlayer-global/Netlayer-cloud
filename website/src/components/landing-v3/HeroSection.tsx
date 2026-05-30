import { Link } from 'react-router-dom'
import { ArrowUpRight, Server } from 'lucide-react'

/**
 * Premium editorial hero (VAULTEX-inspired, lime-themed, VPS content).
 *
 * Layers:
 *   - faint dot/line grid background + two radial lime/cyan glows
 *   - floating glass KPI pills: status (top-left) + metric stack (top-right)
 *   - a huge Playfair serif title where the middle line is an outlined
 *     `.nl-stroke` variant (VAULTEX signature)
 *   - hero-bottom: description + actions (left) and a hero-numbers row (right)
 *
 * Differs from VAULTEX: lime/cyan palette instead of gold, VPS copy (servers,
 * regions, deploy time), a server glyph in the status pill, and original
 * numerals. Theme-aware via CSS tokens.
 */
const DASHBOARD_URL = import.meta.env.VITE_DASHBOARD_URL || 'http://localhost:5173'

const HERO_NUMBERS = [
  { num: '50K+', label: 'Servers deployed' },
  { num: '15',   label: 'Global regions' },
  { num: '<30s', label: 'Time to boot' },
] as const

const KPI_STACK = [
  { val: '99.99%', label: 'Uptime SLA', tone: 'green' },
  { val: '24.8ms', label: 'Avg latency', tone: 'brand' },
  { val: '248',    label: 'Live nodes', tone: '' },
] as const

export function HeroSection() {
  return (
    <section
      className="relative w-full overflow-hidden"
      style={{ minHeight: '100vh', background: 'var(--surface-canvas)', paddingTop: 96 }}
    >
      {/* grid background */}
      <div aria-hidden className="absolute inset-0 nl-grid-bg" style={{ zIndex: 0 }} />

      {/* radial glows */}
      <div
        aria-hidden
        className="absolute pointer-events-none"
        style={{
          top: '-10%', left: '-6%', width: '46%', height: '60%', zIndex: 0,
          background: 'radial-gradient(ellipse at 40% 40%, rgba(200,241,53,.16) 0%, transparent 66%)',
          filter: 'blur(60px)',
        }}
      />
      <div
        aria-hidden
        className="absolute pointer-events-none"
        style={{
          bottom: '-12%', right: '-6%', width: '42%', height: '58%', zIndex: 0,
          background: 'radial-gradient(ellipse at 60% 60%, rgba(34,211,238,.13) 0%, transparent 66%)',
          filter: 'blur(60px)',
        }}
      />

      {/* ── floating KPI pills ── */}
      {/* top-left status pill */}
      <div
        className="absolute hidden md:flex items-center gap-3 nl-pill nl-float"
        style={{ top: 140, left: 'clamp(20px,5vw,72px)', padding: '14px 18px', zIndex: 4 }}
      >
        <span className="relative inline-flex">
          <span className="nl-status-dot block rounded-full" style={{ width: 9, height: 9, background: 'var(--c-green)' }} />
        </span>
        <div>
          <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--t-hi)' }}>All systems operational</div>
          <div className="nl-mono" style={{ fontSize: 10, color: 'var(--t-low)', marginTop: 2 }}>15 / 15 regions online</div>
        </div>
      </div>

      {/* top-right KPI stack */}
      <div
        className="absolute hidden lg:block nl-pill nl-float-slow"
        style={{ top: 150, right: 'clamp(20px,5vw,72px)', padding: '18px 22px', zIndex: 4, minWidth: 188 }}
      >
        <div className="flex items-center gap-2" style={{ marginBottom: 14 }}>
          <Server size={13} style={{ color: 'var(--brand)' }} />
          <span className="nl-mono" style={{ fontSize: 10, letterSpacing: '.16em', textTransform: 'uppercase', color: 'var(--t-low)' }}>
            Fleet live
          </span>
        </div>
        <div className="flex flex-col gap-3">
          {KPI_STACK.map((k) => (
            <div key={k.label} className="flex items-baseline justify-between gap-6">
              <span
                className="nl-mono"
                style={{
                  fontSize: 17, fontWeight: 500,
                  color: k.tone === 'green' ? 'var(--c-green)' : k.tone === 'brand' ? 'var(--brand)' : 'var(--t-hi)',
                }}
              >
                {k.val}
              </span>
              <span style={{ fontSize: 11, color: 'var(--t-low)' }}>{k.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── center title ── */}
      <div
        className="relative flex flex-col items-center text-center"
        style={{ zIndex: 3, padding: '0 clamp(20px,5vw,52px)', paddingTop: 'clamp(80px,12vh,150px)' }}
      >
        <div
          className="inline-flex items-center gap-2 nl-mono"
          style={{
            fontSize: 11, letterSpacing: '.2em', textTransform: 'uppercase', color: 'var(--t-med)',
            padding: '7px 16px', border: '1px solid var(--b-default)', borderRadius: 'var(--r-full)',
            background: 'var(--brand-d)', marginBottom: 'clamp(28px,4vw,40px)',
          }}
        >
          <span className="rounded-full" style={{ width: 6, height: 6, background: 'var(--brand)' }} />
          Cloud infrastructure, reimagined
        </div>

        <h1
          className="nl-display"
          style={{ fontSize: 'clamp(48px,8.5vw,132px)', color: 'var(--t-hi)', maxWidth: 1100 }}
        >
          <span className="block">Servers that</span>
          <span className="block nl-stroke-brand" style={{ fontStyle: 'italic' }}>deploy in</span>
          <span className="block">seconds.</span>
        </h1>
      </div>

      {/* ── hero bottom row ── */}
      <div
        className="relative grid lg:grid-cols-2 gap-10 lg:items-end"
        style={{ zIndex: 3, padding: 'clamp(48px,7vw,90px) clamp(20px,5vw,52px) clamp(48px,7vh,72px)' }}
      >
        {/* left — description + actions */}
        <div style={{ maxWidth: 460 }}>
          <p style={{ fontSize: 16, color: 'var(--t-med)', lineHeight: 1.7 }}>
            Cloud VPS, bare metal, and GPU servers on a global KVM platform.
            Per-second billing, a developer-first API, and flat pricing across
            fifteen regions.
          </p>
          <div className="mt-7 flex flex-wrap items-center gap-3">
            <a href={`${DASHBOARD_URL}/register`} className="nl-btn-primary">
              Deploy a server <ArrowUpRight size={16} />
            </a>
            <Link to="/pricing" className="nl-btn-ghost">View pricing</Link>
          </div>
        </div>

        {/* right — hero numbers */}
        <div className="grid grid-cols-3 gap-px" style={{ background: 'var(--b-subtle)', border: '1px solid var(--b-subtle)' }}>
          {HERO_NUMBERS.map((n) => (
            <div key={n.label} style={{ background: 'var(--surface-canvas)', padding: 'clamp(20px,3vw,30px) clamp(14px,2vw,22px)' }}>
              <div className="nl-display" style={{ fontSize: 'clamp(32px,4.5vw,56px)', color: 'var(--t-hi)', marginBottom: 8 }}>
                {n.num}
              </div>
              <div className="nl-mono" style={{ fontSize: 10.5, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--t-low)' }}>
                {n.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
