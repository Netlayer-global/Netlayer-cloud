import { Link } from 'react-router-dom'
import { ArrowRight, Zap, Globe, CreditCard, Sparkles } from 'lucide-react'
import { useTypewriter } from '../../hooks/useTypewriter'

const TERMINAL_LINES = [
  { text: '$ netlayer server create \\',                                  speed: 12 },
  { text: '    --region mumbai \\',                                        speed: 10 },
  { text: '    --plan c3.large \\',                                        speed: 10 },
  { text: '    --image ubuntu-22.04',                                      speed: 10, delay: 80 },
  { text: '',                                                              speed: 0,  delay: 200 },
  { text: 'Deploying server...',                                           speed: 12, className: 'text-gray-400' },
  { text: '✓ Region: Mumbai, India (3ms)',                                 speed: 8,  delay: 350, className: 'text-[#00d4ff]' },
  { text: '✓ Allocating NVMe SSD storage',                                 speed: 8,  delay: 250, className: 'text-[#00d4ff]' },
  { text: '✓ Configuring private network',                                 speed: 8,  delay: 250, className: 'text-[#00d4ff]' },
  { text: '✓ Installing Ubuntu 22.04 LTS',                                 speed: 8,  delay: 350, className: 'text-[#00d4ff]' },
  { text: '✓ Cloud-init complete',                                         speed: 8,  delay: 250, className: 'text-[#00d4ff]' },
  { text: '',                                                              speed: 0,  delay: 200 },
  { text: 'Server deployed in 47 seconds!',                                speed: 8,  className: 'text-[#0070f3] font-semibold' },
  { text: '──────────────────────────────',                                speed: 4,  className: 'text-gray-700' },
  { text: 'IP Address:  103.21.148.92',                                    speed: 6 },
  { text: 'IPv6:        2a01:4f8::1',                                      speed: 6 },
  { text: 'Root pass:   Copied to clipboard',                              speed: 6,  className: 'text-gray-400' },
  { text: 'SSH:         ssh root@103.21.148.92',                           speed: 6,  className: 'text-[#00d4ff]' },
]

export function Hero() {
  const { lines, complete } = useTypewriter(TERMINAL_LINES)

  return (
    <section className="relative pt-32 pb-20 overflow-hidden">
      {/* Glow backdrop */}
      <div className="absolute inset-0 -z-10 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1200px] h-[600px] rounded-full bg-[#0070f3]/10 blur-[120px]" />
        <div className="absolute top-32 right-0 w-[600px] h-[400px] rounded-full bg-[#00d4ff]/8 blur-[100px]" />
        <div
          className="absolute inset-0 opacity-[0.05]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)',
            backgroundSize: '48px 48px',
            maskImage: 'radial-gradient(ellipse at top, black 30%, transparent 70%)',
          }}
        />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">
        {/* Left side */}
        <div>
          <div className="inline-flex items-center gap-2 px-3 h-7 rounded-full border border-white/[0.08] bg-white/[0.03] backdrop-blur text-xs text-gray-300 mb-6">
            <Sparkles size={12} className="text-[#00d4ff]" />
            <span>New: Bare Metal from ₹999/mo</span>
          </div>

          <h1 className="text-[44px] sm:text-[56px] lg:text-[64px] leading-[1.05] font-semibold tracking-tight text-white">
            The Cloud Platform
            <br />
            <span className="bg-gradient-to-r from-[#0070f3] via-[#00a0ff] to-[#00d4ff] bg-clip-text text-transparent">
              Built for Developers
            </span>
          </h1>

          <p className="mt-6 text-lg text-gray-400 max-w-xl leading-relaxed">
            Deploy SSD cloud servers, bare metal, and Kubernetes in seconds.
            Global infrastructure across 15+ regions.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              to="/register"
              className="inline-flex items-center gap-2 h-12 px-6 rounded-lg text-[15px] font-medium text-white bg-gradient-to-r from-[#0070f3] to-[#0090ff] hover:from-[#0080ff] hover:to-[#00a0ff] shadow-[0_8px_32px_rgba(0,112,243,0.4)] hover:shadow-[0_8px_40px_rgba(0,112,243,0.6)] transition-all cursor-pointer"
            >
              Deploy Now — Free $100 Credit
              <ArrowRight size={16} />
            </Link>
            <Link
              to="/pricing"
              className="inline-flex items-center gap-1 h-12 px-5 rounded-lg text-[15px] font-medium text-gray-200 hover:text-white hover:bg-white/[0.04] border border-white/[0.08] transition-colors cursor-pointer"
            >
              View Pricing
              <ArrowRight size={14} />
            </Link>
          </div>

          <div className="mt-10 flex flex-wrap items-center gap-6 text-xs text-gray-500">
            <span className="flex items-center gap-1.5">
              <Zap size={13} className="text-[#0070f3]" /> 60-second deploy
            </span>
            <span className="flex items-center gap-1.5">
              <Globe size={13} className="text-[#0070f3]" /> 15 regions
            </span>
            <span className="flex items-center gap-1.5">
              <CreditCard size={13} className="text-[#0070f3]" /> No credit card
            </span>
          </div>

          <div className="mt-10 pt-6 border-t border-white/[0.06]">
            <p className="text-[11px] uppercase tracking-wider text-gray-600 mb-3">Trusted by developers worldwide</p>
            <div className="flex flex-wrap items-center gap-6 opacity-50">
              {['ACME', 'NORTHWIND', 'STARK', 'WAYNE', 'CYBER'].map((name) => (
                <span key={name} className="text-[13px] tracking-widest text-gray-500 font-bold">
                  {name}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Right — terminal mockup */}
        <div className="relative">
          <div className="absolute -inset-4 bg-gradient-to-tr from-[#0070f3]/20 via-transparent to-[#00d4ff]/20 blur-2xl rounded-2xl pointer-events-none" />
          <div className="relative bg-[#0d0d0d] border border-white/[0.08] rounded-xl overflow-hidden shadow-2xl">
            <div className="h-9 flex items-center px-3 gap-1.5 border-b border-white/[0.06] bg-[#111]">
              <span className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#febc2e]" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#28c840]" />
              <span className="ml-3 text-[11px] text-gray-500 font-mono">~ — netlayer cli</span>
            </div>
            <pre className="px-5 py-4 text-[13px] leading-relaxed font-mono text-gray-200 min-h-[460px] whitespace-pre-wrap">
              {lines.map((l, i) => (
                <div key={i} className={l.className || ''}>
                  {l.text || '\u00A0'}
                  {!complete && i === lines.findIndex((x) => !x.done) && (
                    <span className="inline-block w-2 h-4 bg-[#00d4ff] ml-0.5 align-middle animate-pulse" />
                  )}
                </div>
              ))}
            </pre>
          </div>
        </div>
      </div>
    </section>
  )
}
