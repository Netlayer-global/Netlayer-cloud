import type { ReactNode } from 'react'

/**
 * PageHero — the shared inner-hero for every sub-page (Features, Docs,
 * About, etc.). Gives all pages the same premium full-width treatment used
 * on the home page: faint dot grid, soft lime/cyan glow, mono eyebrow,
 * Plus Jakarta display headline, and an optional accent word.
 *
 * Keeps copy centered but the band itself spans the full page width.
 */
export function PageHero({
  eyebrow,
  title,
  accent,
  subtitle,
  children,
}: {
  eyebrow: string
  title: ReactNode
  accent?: string
  subtitle?: ReactNode
  children?: ReactNode
}) {
  return (
    <section className="relative w-full overflow-hidden" style={{ background: 'var(--surface-canvas)' }}>
      <div aria-hidden className="absolute inset-0 nl-grid-bg" style={{ zIndex: 0 }} />
      <div
        aria-hidden
        className="absolute pointer-events-none"
        style={{
          top: '-30%', left: '50%', transform: 'translateX(-50%)', width: '70%', height: '120%', zIndex: 0,
          background: 'radial-gradient(ellipse at 50% 40%, rgba(200,241,53,.12) 0%, rgba(95,227,192,.06) 45%, transparent 70%)',
          filter: 'blur(70px)',
        }}
      />
      <div
        className="nl-container relative text-center"
        style={{ zIndex: 2, padding: 'clamp(120px,16vh,180px) clamp(20px,4vw,72px) clamp(48px,7vw,80px)' }}
      >
        <div
          className="inline-flex items-center gap-2 nl-mono"
          style={{
            fontSize: 11, letterSpacing: '.18em', textTransform: 'uppercase', color: 'var(--brand)',
            padding: '6px 14px', border: '1px solid var(--brand-b)', borderRadius: 'var(--r-full)',
            background: 'var(--brand-d)', marginBottom: 26,
          }}
        >
          <span className="rounded-full" style={{ width: 6, height: 6, background: 'var(--brand)' }} />
          {eyebrow}
        </div>
        <h1 className="nl-display" style={{ fontSize: 'clamp(38px,5.4vw,72px)', color: 'var(--t-hi)', maxWidth: 900, marginInline: 'auto' }}>
          {title}{accent ? <> <span style={{ color: 'var(--brand)' }}>{accent}</span></> : null}
        </h1>
        {subtitle && (
          <p style={{ fontSize: 'clamp(16px,1.4vw,19px)', color: 'var(--t-med)', lineHeight: 1.65, maxWidth: 620, margin: '22px auto 0' }}>
            {subtitle}
          </p>
        )}
        {children && <div className="mt-9 flex flex-wrap items-center justify-center gap-3">{children}</div>}
      </div>
    </section>
  )
}
