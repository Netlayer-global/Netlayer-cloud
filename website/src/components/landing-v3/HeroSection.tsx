import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight, Clock, Globe, Lock, Rocket, RotateCcw, ShieldCheck, Zap,
} from 'lucide-react'

/**
 * HeroSection — landing page above-the-fold.
 *
 * Animated terminal "deploys" a c3.large server line-by-line. Replays
 * via the small RotateCcw button in the title bar. CTA pair below the
 * headline drives signups + pricing visits.
 */

const TERMINAL_LINES = [
  { text: '$ nl server create --region mumbai --plan c3.large --os ubuntu-22.04', delayBefore: 0,    color: 'var(--t-hi)'  },
  { text: '✓ Authenticating with API key...             0.1s', delayBefore: 600,  color: 'var(--brand)' },
  { text: '✓ Region validated: Mumbai, India (BOM1)      0.2s', delayBefore: 100,  color: 'var(--brand)' },
  { text: '✓ Capacity check: bom1-node-03 selected       0.3s', delayBefore: 100,  color: 'var(--brand)' },
  { text: '✓ Cloning Ubuntu 22.04 base image...          2.1s', delayBefore: 200,  color: 'var(--brand)' },
  { text: '✓ Allocating NVMe storage (160 GB)...         0.8s', delayBefore: 200,  color: 'var(--brand)' },
  { text: '✓ Configuring cloud-init & SSH keys...        0.3s', delayBefore: 200,  color: 'var(--brand)' },
  { text: '✓ Starting KVM instance...                    4.2s', delayBefore: 200,  color: 'var(--brand)' },
  { text: '✓ Guest agent connected                       6.8s', delayBefore: 200,  color: 'var(--brand)' },
  { text: '✓ Assigning IPv4: 103.21.148.92               0.2s', delayBefore: 100,  color: 'var(--brand)' },
  { text: '✓ Registering reverse DNS...                  0.4s', delayBefore: 100,  color: 'var(--brand)' },
  { text: '✓ Firewall rules applied                      0.1s', delayBefore: 100,  color: 'var(--brand)' },
  { text: '',                                                  delayBefore: 200,  color: 'var(--t-hi)'  },
  { text: '╭─────────────────────────────────────────╮',         delayBefore: 80,   color: 'var(--t-low)' },
  { text: '│  Server ID:   nl-f3a7c219               │',         delayBefore: 60,   color: 'var(--t-hi)'  },
  { text: '│  IPv4:        103.21.148.92             │',         delayBefore: 60,   color: 'var(--t-hi)'  },
  { text: '│  IPv6:        2a01:4f8:c17::1           │',         delayBefore: 60,   color: 'var(--t-hi)'  },
  { text: '│  Region:      🇮🇳 Mumbai (BOM1)           │',         delayBefore: 60,   color: 'var(--t-hi)'  },
  { text: '│  Plan:        c3.large (4·8·160 NVMe)   │',         delayBefore: 60,   color: 'var(--t-hi)'  },
  { text: '│  Status:      ● Running                 │',         delayBefore: 60,   color: 'var(--c-green)' },
  { text: '│  Deployed in: 15.7 seconds              │',         delayBefore: 60,   color: 'var(--brand)' },
  { text: '╰─────────────────────────────────────────╯',         delayBefore: 60,   color: 'var(--t-low)' },
]

export function HeroSection() {
  const [visibleLines, setVisibleLines] = useState<number>(0)
  const [epoch, setEpoch] = useState(0)

  useEffect(() => {
    let cancelled = false
    let cumulative = 0
    setVisibleLines(0)
    TERMINAL_LINES.forEach((l, idx) => {
      cumulative += l.delayBefore
      window.setTimeout(() => {
        if (!cancelled) setVisibleLines(idx + 1)
      }, cumulative)
    })
    return () => { cancelled = true }
  }, [epoch])

  const allDone = visibleLines >= TERMINAL_LINES.length

  return (
    <section
      className="relative min-h-screen flex flex-col items-center justify-start pt-32 pb-16 px-4 sm:px-6 noise-overlay"
      style={{
        background: `
          radial-gradient(ellipse 80% 50% at 50% 0%, rgba(200,241,53,0.04), transparent 70%),
          radial-gradient(circle at 50% 50%, rgba(255,255,255,0.015) 1px, transparent 1px) 0 0/24px 24px,
          var(--nl-0)
        `,
      }}
    >
      <Link
        to="/blog/introducing-gpu-cloud"
        className="inline-flex items-center gap-2 px-3 h-7 rounded-full text-[12px] cursor-pointer transition-all"
        style={{
          background: 'var(--brand-d)',
          border: '1px solid var(--brand-b)',
          color: 'var(--t-med)',
        }}
      >
        <Zap size={12} style={{ color: 'var(--c-amber)' }} />
        GPU Cloud now available — NVIDIA A100 from ₹1,999/mo
        <ArrowRight size={11} style={{ color: 'var(--t-low)' }} />
      </Link>

      <h1
        className="text-center mt-8"
        style={{
          fontSize: 'clamp(36px, 5.5vw, 52px)',
          fontWeight: 700,
          letterSpacing: '-.03em',
          lineHeight: 1.1,
        }}
      >
        Infrastructure that
        <br />
        <span className="gradient-text-brand">deploys in seconds</span>
      </h1>

      <p
        className="text-center mt-6 px-4"
        style={{ fontSize: 18, color: 'var(--t-med)', maxWidth: 560 }}
      >
        Bare metal servers, cloud VMs, Kubernetes, and managed databases across 15 global regions.
        Built for developers who need real performance.
      </p>

      <div className="flex flex-wrap items-center justify-center gap-3 mt-9">
        <Link to="/register" className="nl-btn-primary">
          <Rocket size={15} />
          Deploy now — Free ₹3,500 credit
        </Link>
        <Link to="/pricing" className="nl-btn-ghost">
          View pricing <ArrowRight size={14} />
        </Link>
      </div>

      <p className="mt-3 text-[11px]" style={{ color: 'var(--t-low)' }}>
        No credit card required · Cancel anytime
      </p>

      <div className="mt-7 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[12px]">
        <span className="inline-flex items-center gap-1.5" style={{ color: 'var(--t-med)' }}>
          <Clock size={13} style={{ color: 'var(--brand)' }} /> 30-second deploy
        </span>
        <span style={{ color: 'var(--t-off)' }}>·</span>
        <span className="inline-flex items-center gap-1.5" style={{ color: 'var(--t-med)' }}>
          <Globe size={13} style={{ color: 'var(--brand)' }} /> 15 regions
        </span>
        <span style={{ color: 'var(--t-off)' }}>·</span>
        <span className="inline-flex items-center gap-1.5" style={{ color: 'var(--t-med)' }}>
          <ShieldCheck size={13} style={{ color: 'var(--brand)' }} /> 99.99% SLA
        </span>
        <span style={{ color: 'var(--t-off)' }}>·</span>
        <span className="inline-flex items-center gap-1.5" style={{ color: 'var(--t-med)' }}>
          <Lock size={13} style={{ color: 'var(--brand)' }} /> SOC2 compliant
        </span>
      </div>

      <div className="mt-10 max-w-3xl mx-auto w-full">
        <p className="text-center text-[11px] uppercase tracking-[.18em]" style={{ color: 'var(--t-low)' }}>
          Trusted by 50,000+ developers
        </p>
        <div className="mt-4 flex flex-wrap items-center justify-center gap-x-10 gap-y-3 opacity-25">
          {['NORTHWIND', 'STARK', 'WAYNE', 'CYBERLOOP', 'PARALLAX', 'OBSIDIAN', 'KINETIC', 'AXIOM'].map((n) => (
            <span
              key={n}
              className="font-bold tracking-[0.18em]"
              style={{ fontSize: 13, color: 'var(--t-med)' }}
            >
              {n}
            </span>
          ))}
        </div>
      </div>

      <div className="hidden sm:block w-full max-w-2xl mx-auto mt-12 relative">
        <div
          className="rounded-xl overflow-hidden"
          style={{
            background: 'var(--nl-1)',
            border: '1px solid var(--b-default)',
            boxShadow: 'var(--shadow-lg)',
          }}
        >
          <div
            className="h-9 flex items-center px-4 gap-2"
            style={{
              background: 'var(--nl-2)',
              borderBottom: '1px solid var(--b-default)',
            }}
          >
            <span className="w-3 h-3 rounded-full" style={{ background: '#ff5f57' }} />
            <span className="w-3 h-3 rounded-full" style={{ background: '#febc2e' }} />
            <span className="w-3 h-3 rounded-full" style={{ background: '#28c840' }} />
            <span
              className="ml-3 text-[11px]"
              style={{ color: 'var(--t-low)', fontFamily: 'var(--font-mono)' }}
            >
              netlayer — zsh
            </span>
            <button
              onClick={() => setEpoch((e) => e + 1)}
              className="ml-auto p-1 rounded cursor-pointer"
              style={{ color: 'var(--t-low)' }}
              title="Replay"
            >
              <RotateCcw size={12} />
            </button>
          </div>
          <pre
            className="px-5 py-4 overflow-hidden"
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 12,
              lineHeight: 1.65,
              minHeight: 460,
            }}
          >
            {TERMINAL_LINES.slice(0, visibleLines).map((l, i) => (
              <div key={`${epoch}-${i}`} style={{ color: l.color, whiteSpace: 'pre-wrap' }}>
                {l.text || '\u00A0'}
              </div>
            ))}
            {!allDone && (
              <span
                className="inline-block w-2 h-3.5 align-middle"
                style={{ background: 'var(--brand)', animation: 'nl-pulse-dot 1s infinite' }}
              />
            )}
          </pre>
        </div>
      </div>
    </section>
  )
}
