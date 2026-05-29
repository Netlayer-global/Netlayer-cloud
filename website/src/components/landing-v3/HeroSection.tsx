import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowRight, Check, Terminal, Zap } from 'lucide-react'

/**
 * HeroSection — modern "everywhere cloud" hero.
 *
 * Layout: split. Left column carries the headline, value copy, an inline
 * email capture that hands off to the dashboard register flow, and a row of
 * proof chips. Right column renders an animated canvas globe — a rotating
 * point-cloud sphere with pulsing lime hub nodes and great-circle arcs —
 * representing NetLayer's global footprint.
 *
 * The globe is pure 2D canvas (a rotating fibonacci-sphere projected with
 * cheap perspective), so there's no WebGL dependency and it degrades to a
 * static dot field under prefers-reduced-motion.
 *
 * All copy is original. Colours come from the lime-on-dark token set.
 */

const DASHBOARD_URL =
  import.meta.env.VITE_DASHBOARD_URL || 'http://localhost:5173'

const BRAND = '#c8f135'

/* ── Animated globe ───────────────────────────────────────── */

interface P3 {
  x: number
  y: number
  z: number
  hub: boolean
}

function fibonacciSphere(n: number): P3[] {
  const pts: P3[] = []
  const golden = Math.PI * (3 - Math.sqrt(5))
  for (let i = 0; i < n; i++) {
    const y = 1 - (i / (n - 1)) * 2
    const r = Math.sqrt(1 - y * y)
    const theta = golden * i
    pts.push({
      x: Math.cos(theta) * r,
      y,
      z: Math.sin(theta) * r,
      hub: false,
    })
  }
  return pts
}

function GlobeCanvas() {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    const points = fibonacciSphere(620)
    // promote a scattered handful of points to glowing "hub" datacenters
    const hubIndices = [4, 60, 130, 190, 250, 320, 400, 470, 540, 600]
    hubIndices.forEach((i) => {
      if (points[i]) points[i].hub = true
    })
    const hubs = points.filter((p) => p.hub)

    let raf = 0
    let dpr = Math.max(1, Math.min(window.devicePixelRatio || 1, 2))
    let size = 0
    let cx = 0
    let cy = 0
    let radius = 0

    const resize = () => {
      const rect = canvas.getBoundingClientRect()
      size = Math.min(rect.width, rect.height)
      dpr = Math.max(1, Math.min(window.devicePixelRatio || 1, 2))
      canvas.width = rect.width * dpr
      canvas.height = rect.height * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      cx = rect.width / 2
      cy = rect.height / 2
      radius = size * 0.4
    }
    resize()
    window.addEventListener('resize', resize)

    const TILT = -0.42
    const cosT = Math.cos(TILT)
    const sinT = Math.sin(TILT)

    const project = (p: P3, rot: number) => {
      // rotate around Y
      const x1 = p.x * Math.cos(rot) - p.z * Math.sin(rot)
      const z1 = p.x * Math.sin(rot) + p.z * Math.cos(rot)
      // tilt around X
      const y2 = p.y * cosT - z1 * sinT
      const z2 = p.y * sinT + z1 * cosT
      const persp = 1 / (1.6 - z2 * 0.45)
      return {
        sx: cx + x1 * radius * persp,
        sy: cy + y2 * radius * persp,
        depth: z2, // -1 (back) .. 1 (front)
        scale: persp,
      }
    }

    const start = performance.now()
    const render = (now: number) => {
      const t = (now - start) * 0.00012
      const rot = reduce ? 0.6 : t
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // soft halo behind the globe
      const halo = ctx.createRadialGradient(cx, cy, radius * 0.2, cx, cy, radius * 1.5)
      halo.addColorStop(0, 'rgba(200,241,53,0.08)')
      halo.addColorStop(1, 'rgba(200,241,53,0)')
      ctx.fillStyle = halo
      ctx.beginPath()
      ctx.arc(cx, cy, radius * 1.5, 0, Math.PI * 2)
      ctx.fill()

      // base dots
      for (const p of points) {
        if (p.hub) continue
        const pr = project(p, rot)
        const front = (pr.depth + 1) / 2 // 0..1
        const alpha = 0.12 + front * 0.5
        const r = (0.6 + front * 1.1) * pr.scale
        ctx.beginPath()
        ctx.fillStyle = `rgba(180,190,180,${alpha.toFixed(3)})`
        ctx.arc(pr.sx, pr.sy, r, 0, Math.PI * 2)
        ctx.fill()
      }

      // arcs between hubs that are both on the front hemisphere
      const projHubs = hubs.map((h) => ({ h, pr: project(h, rot) }))
      ctx.lineWidth = 1
      for (let i = 0; i < projHubs.length; i++) {
        const a = projHubs[i]
        const b = projHubs[(i + 3) % projHubs.length]
        if (a.pr.depth < -0.1 || b.pr.depth < -0.1) continue
        const midx = (a.pr.sx + b.pr.sx) / 2
        const midy = (a.pr.sy + b.pr.sy) / 2
        const dx = b.pr.sx - a.pr.sx
        const dy = b.pr.sy - a.pr.sy
        const dist = Math.sqrt(dx * dx + dy * dy)
        // bow the control point outward from the globe centre
        const nx = (midx - cx) / (radius || 1)
        const ny = (midy - cy) / (radius || 1)
        const ctrlx = midx + nx * dist * 0.18
        const ctrly = midy + ny * dist * 0.18
        const grad = ctx.createLinearGradient(a.pr.sx, a.pr.sy, b.pr.sx, b.pr.sy)
        grad.addColorStop(0, 'rgba(200,241,53,0)')
        grad.addColorStop(0.5, 'rgba(200,241,53,0.45)')
        grad.addColorStop(1, 'rgba(200,241,53,0)')
        ctx.strokeStyle = grad
        ctx.beginPath()
        ctx.moveTo(a.pr.sx, a.pr.sy)
        ctx.quadraticCurveTo(ctrlx, ctrly, b.pr.sx, b.pr.sy)
        ctx.stroke()
      }

      // hub nodes on top with a glow + pulse
      const pulse = 0.5 + 0.5 * Math.sin(now * 0.003)
      for (const { pr } of projHubs) {
        if (pr.depth < -0.2) continue
        const front = (pr.depth + 1) / 2
        const baseR = (1.8 + front * 1.6) * pr.scale
        ctx.beginPath()
        ctx.fillStyle = `rgba(200,241,53,${(0.1 + front * 0.18 + pulse * 0.18).toFixed(3)})`
        ctx.arc(pr.sx, pr.sy, baseR * (2.4 + pulse), 0, Math.PI * 2)
        ctx.fill()
        ctx.beginPath()
        ctx.fillStyle = `rgba(220,245,90,${(0.6 + front * 0.4).toFixed(3)})`
        ctx.arc(pr.sx, pr.sy, baseR, 0, Math.PI * 2)
        ctx.fill()
      }

      if (!reduce) raf = requestAnimationFrame(render)
    }

    render(performance.now())
    if (reduce) {
      // draw a single static frame
      cancelAnimationFrame(raf)
    }

    return () => {
      window.removeEventListener('resize', resize)
      cancelAnimationFrame(raf)
    }
  }, [])

  return (
    <canvas
      ref={ref}
      className="absolute inset-0 h-full w-full"
      aria-hidden="true"
    />
  )
}

/* ── Hero ─────────────────────────────────────────────────── */

export function HeroSection() {
  const [email, setEmail] = useState('')

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const url = email
      ? `${DASHBOARD_URL}/register?email=${encodeURIComponent(email)}`
      : `${DASHBOARD_URL}/register`
    window.location.assign(url)
  }

  return (
    <section className="relative overflow-hidden" style={{ background: 'var(--nl-0)' }}>
      {/* aurora blobs */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 left-1/2 h-[560px] w-[560px] -translate-x-1/2 rounded-full animate-aurora"
        style={{ background: 'radial-gradient(circle, rgba(200,241,53,0.16), transparent 60%)', filter: 'blur(40px)' }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute top-20 -right-32 h-[420px] w-[420px] rounded-full animate-float-slow"
        style={{ background: 'radial-gradient(circle, rgba(132,204,22,0.12), transparent 60%)', filter: 'blur(60px)' }}
      />
      {/* dot grid */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.05]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.7) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.7) 1px, transparent 1px)',
          backgroundSize: '46px 46px',
          maskImage: 'radial-gradient(ellipse 75% 60% at 50% 30%, black 0%, transparent 75%)',
          WebkitMaskImage: 'radial-gradient(ellipse 75% 60% at 50% 30%, black 0%, transparent 75%)',
        }}
      />

      <div className="relative z-10 mx-auto max-w-7xl px-4 pb-20 pt-24 sm:px-6 lg:px-8 lg:pb-28 lg:pt-32">
        <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-8">
          {/* ── Left: copy ── */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          >
            <span
              className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[12px]"
              style={{ background: 'var(--brand-d)', border: '1px solid var(--brand-b)', color: BRAND }}
            >
              <Zap size={12} className="fill-current" />
              The everywhere cloud — now in 15 regions
            </span>

            <h1
              className="mt-6 font-semibold tracking-tight text-white"
              style={{ fontSize: 'clamp(40px, 6vw, 72px)', lineHeight: 1.02, letterSpacing: '-0.03em' }}
            >
              Cloud infrastructure
              <br className="hidden sm:block" /> that deploys in{' '}
              <span
                style={{
                  background: 'linear-gradient(120deg, #c8f135 0%, #a8e620 55%, #84cc16 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                seconds.
              </span>
            </h1>

            <p
              className="mt-6 max-w-xl leading-relaxed"
              style={{ color: 'var(--t-med)', fontSize: 'clamp(15px, 1.4vw, 18px)' }}
            >
              Spin up high-performance cloud VPS, bare metal, and GPU servers on a
              global KVM platform. Per-second billing, a developer-first API, and a
              flat, predictable price — no surprises.
            </p>

            {/* inline email capture */}
            <form onSubmit={submit} className="mt-8 flex max-w-md flex-col gap-2.5 sm:flex-row">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                className="h-12 flex-1 rounded-xl px-4 text-[14px] text-white outline-none transition-colors placeholder:text-white/40"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid var(--b-strong)' }}
                onFocus={(e) => (e.currentTarget.style.borderColor = BRAND)}
                onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--b-strong)')}
              />
              <button
                type="submit"
                className="group inline-flex h-12 items-center justify-center gap-2 whitespace-nowrap rounded-xl px-6 text-[14.5px] font-semibold transition-all hover:-translate-y-0.5"
                style={{ background: BRAND, color: '#0d0e0d', boxShadow: 'var(--shadow-brand)' }}
              >
                Start free
                <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
              </button>
            </form>

            {/* proof chips */}
            <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-[13px]" style={{ color: 'var(--t-med)' }}>
              {['₹3,500 free credit', 'No card required', 'Cancel anytime'].map((c) => (
                <span key={c} className="inline-flex items-center gap-1.5">
                  <Check size={14} style={{ color: BRAND }} />
                  {c}
                </span>
              ))}
            </div>
          </motion.div>

          {/* ── Right: globe + terminal card ── */}
          <motion.div
            className="relative mx-auto aspect-square w-full max-w-[520px]"
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.9, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
          >
            <GlobeCanvas />

            {/* floating terminal chip */}
            <motion.div
              className="absolute bottom-4 left-0 w-[270px] rounded-xl p-3.5 backdrop-blur-md sm:-left-6"
              style={{
                background: 'rgba(13,14,13,0.82)',
                border: '1px solid var(--b-strong)',
                boxShadow: 'var(--shadow-lg)',
              }}
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
            >
              <div className="flex items-center gap-2 text-[11px]" style={{ color: 'var(--t-low)' }}>
                <Terminal size={12} style={{ color: BRAND }} />
                <span className="font-mono">netlayer deploy</span>
                <span className="ml-auto flex items-center gap-1" style={{ color: 'var(--c-green)' }}>
                  <span className="h-1.5 w-1.5 rounded-full" style={{ background: 'var(--c-green)' }} />
                  live
                </span>
              </div>
              <div className="mt-2 font-mono text-[12px] leading-relaxed text-white">
                <span style={{ color: BRAND }}>✓</span> server ready
                <span className="text-white/40"> · 27s</span>
              </div>
            </motion.div>

            {/* floating region chip */}
            <motion.div
              className="absolute right-0 top-6 rounded-xl px-3 py-2 backdrop-blur-md sm:-right-2"
              style={{
                background: 'rgba(13,14,13,0.82)',
                border: '1px solid var(--b-strong)',
                boxShadow: 'var(--shadow-lg)',
              }}
              animate={{ y: [0, 8, 0] }}
              transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut', delay: 0.6 }}
            >
              <div className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--t-low)' }}>
                Active regions
              </div>
              <div className="mt-0.5 text-[18px] font-semibold text-white">
                15 <span className="text-[12px] font-normal" style={{ color: BRAND }}>online</span>
              </div>
            </motion.div>
          </motion.div>
        </div>

        {/* trust strip */}
        <div className="mt-16 lg:mt-20">
          <p className="text-center text-[11px] uppercase tracking-[0.22em]" style={{ color: 'var(--t-low)' }}>
            Trusted by builders at fast-growing teams
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-x-10 gap-y-4 opacity-60">
            {['Northwind', 'Karta', 'Stackbase', 'Lumen IO', 'Finch', 'Orbital'].map((name) => (
              <span key={name} className="text-[15px] font-semibold tracking-tight text-white/70">
                {name}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
