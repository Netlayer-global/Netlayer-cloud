import { Link } from 'react-router-dom'

/**
 * Editorial hero (Fireblox-inspired, lime-themed, VPS content).
 *
 * Layers:
 *   - giant Bebas display word "NETLAYER" with a top-lit fade
 *   - a lime/emerald glowing sphere peeking from the bottom edge
 *   - corner vignettes + ambient glow blobs
 *   - bottom row: condensed tagline (left) + uppercase descriptor (right)
 *
 * Differs from Fireblox: lime/green palette instead of red, single-word
 * mark, VPS copy, and a softer green sphere rather than molten-red.
 */
const DASHBOARD_URL = import.meta.env.VITE_DASHBOARD_URL || 'http://localhost:5173'

export function HeroSection() {
  return (
    <section
      className="relative w-full overflow-hidden"
      style={{ height: '100vh', minHeight: 700, background: 'var(--nl-0)' }}
    >
      {/* corner vignettes */}
      <div
        aria-hidden
        className="absolute inset-0 z-[3] pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 55% 70% at 0% 0%, rgba(0,0,0,.7) 0%, transparent 55%),' +
            ' radial-gradient(ellipse 30% 45% at 100% 0%, rgba(0,0,0,.4) 0%, transparent 55%)',
        }}
      />

      {/* ambient glow blobs (lime + teal) */}
      <div
        aria-hidden
        className="absolute z-[1] pointer-events-none"
        style={{
          top: '-8%', right: '-4%', width: '42%', height: '62%',
          background: 'radial-gradient(ellipse at 55% 28%, rgba(200,241,53,.22) 0%, transparent 65%)',
          filter: 'blur(65px)',
        }}
      />
      <div
        aria-hidden
        className="absolute z-[1] pointer-events-none"
        style={{
          bottom: 0, left: 0, width: '32%', height: '52%',
          background: 'radial-gradient(ellipse at 0% 100%, rgba(34,211,238,.18) 0%, transparent 65%)',
          filter: 'blur(45px)',
        }}
      />

      {/* GIANT DISPLAY WORD */}
      <div
        className="absolute top-0 left-0 right-0 z-[5] text-center nl-display"
        style={{
          paddingTop: 'clamp(96px, 13vh, 150px)',
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(86px, 18vw, 280px)',
          lineHeight: 1,
          background:
            'linear-gradient(to bottom, var(--t-hi) 0%, var(--t-hi) 24%,' +
            ' color-mix(in srgb, var(--t-hi) 70%, transparent) 46%,' +
            ' color-mix(in srgb, var(--t-hi) 22%, transparent) 64%,' +
            ' transparent 82%)',
          WebkitBackgroundClip: 'text',
          backgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          animation: 'nl-text-reveal 1.2s cubic-bezier(.16,1,.3,1) .1s both',
        }}
      >
        NETLAYER
      </div>

      {/* GLOWING SPHERE peeking from bottom */}
      <div
        className="absolute z-[2]"
        style={{
          top: '96%', left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 'clamp(720px, 115vw, 1560px)',
          aspectRatio: '1 / 1',
          animation: 'nl-sphere-in 1.6s cubic-bezier(.16,1,.3,1) .2s both',
        }}
      >
        {/* halo */}
        <div
          aria-hidden
          className="absolute rounded-full"
          style={{
            inset: '-10%',
            background: 'radial-gradient(ellipse at 50% 44%, rgba(132,204,22,.22) 0%, transparent 65%)',
            filter: 'blur(35px)', zIndex: -1,
          }}
        />
        {/* core */}
        <div className="relative w-full h-full rounded-full">
          <div
            aria-hidden
            className="absolute inset-0 rounded-full"
            style={{
              background:
                'radial-gradient(ellipse at 35% 24%, rgba(200,241,53,.85) 0%, transparent 35%),' +
                ' radial-gradient(ellipse at 60% 19%, rgba(132,204,22,.7) 0%, transparent 35%),' +
                ' radial-gradient(ellipse at 50% 50%, #5a8a0a 0%, #234600 42%, #0a1500 78%, #000 100%)',
            }}
          />
          <div
            aria-hidden
            className="absolute inset-0 rounded-full"
            style={{
              background:
                'radial-gradient(ellipse at 78% 13%, rgba(34,211,238,.45) 0%, transparent 38%),' +
                ' radial-gradient(ellipse at 18% 72%, rgba(80,140,30,.4) 0%, transparent 34%)',
            }}
          />
          {/* specular shine */}
          <div
            aria-hidden
            className="absolute inset-0 rounded-full"
            style={{
              background:
                'radial-gradient(ellipse at 37% 11%, rgba(235,255,190,.3) 0%, transparent 30%),' +
                ' radial-gradient(ellipse at 70% 8%, rgba(180,235,255,.22) 0%, transparent 28%)',
            }}
          />
        </div>
      </div>

      {/* BOTTOM ROW */}
      <div
        className="absolute bottom-0 left-0 right-0 z-[6] flex items-end justify-between gap-8"
        style={{
          padding: '0 clamp(20px,5vw,52px) clamp(40px,7vh,64px)',
          animation: 'nl-bottom-reveal 1.3s cubic-bezier(.16,1,.3,1) .5s both',
        }}
      >
        <div>
          <h1
            className="nl-head"
            style={{ fontSize: 'clamp(30px, 4.6vw, 58px)', color: 'var(--t-hi)' }}
          >
            Deploy-Ready Cloud
            <span className="block" style={{ color: 'color-mix(in srgb, var(--t-hi) 28%, transparent)' }}>
              Infrastructure
            </span>
          </h1>

          <div className="mt-7 flex flex-wrap items-center gap-3">
            <a href={`${DASHBOARD_URL}/register`} className="nl-btn-primary">
              Deploy a server
            </a>
            <Link to="/pricing" className="nl-btn-ghost">View pricing</Link>
          </div>
        </div>

        <div
          className="hidden sm:block text-right"
          style={{
            maxWidth: 260,
            fontSize: 10.5, fontWeight: 600, letterSpacing: '.09em',
            textTransform: 'uppercase', color: 'var(--t-low)', lineHeight: 1.85,
          }}
        >
          Cloud VPS, bare metal &amp; GPU servers built for scale, billed by the second, trusted for uptime.
        </div>
      </div>
    </section>
  )
}
