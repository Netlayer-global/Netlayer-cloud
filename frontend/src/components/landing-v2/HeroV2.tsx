import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowUpRight, Sparkles, ChevronRight } from 'lucide-react'
import { useTypewriter } from '../../hooks/useTypewriter'
import { Globe } from './Globe'

const TERMINAL_LINES = [
  { text: '$ netlayer server create \\',                              speed: 14 },
  { text: '    --region mumbai \\',                                    speed: 12 },
  { text: '    --plan c3.large \\',                                    speed: 12 },
  { text: '    --image ubuntu-22.04 \\',                               speed: 12 },
  { text: '    --ssh-key default',                                     speed: 12, delay: 100 },
  { text: '',                                                          speed: 0,  delay: 250 },
  { text: 'Authenticating…',                                           speed: 14, className: 'text-[#9ca3af]' },
  { text: '✓ Region: Mumbai · 3ms',                                    speed: 8,  delay: 280, className: 'text-[#4ad7ff]' },
  { text: '✓ Allocating 4 vCPU · 8 GB · 160 GB NVMe',                  speed: 8,  delay: 200, className: 'text-[#4ad7ff]' },
  { text: '✓ Configuring private VLAN',                                speed: 8,  delay: 200, className: 'text-[#4ad7ff]' },
  { text: '✓ Image: ubuntu-22.04 (cached, 0ms)',                       speed: 8,  delay: 200, className: 'text-[#4ad7ff]' },
  { text: '✓ cloud-init complete',                                     speed: 8,  delay: 200, className: 'text-[#4ad7ff]' },
  { text: '✓ Server up · 31 seconds',                                  speed: 8,  delay: 200, className: 'text-emerald-400 font-medium' },
  { text: '',                                                          speed: 0,  delay: 200 },
  { text: '┌─────────────────────────────────────┐',                  speed: 4,  className: 'text-[#374151]' },
  { text: '│  ID       cm-srv-a8f3c91d           │',                  speed: 6 },
  { text: '│  IPv4     103.21.148.92              │',                  speed: 6 },
  { text: '│  IPv6     2a01:4f8:c17::1            │',                  speed: 6 },
  { text: '│  Region   bom1 · Mumbai, India       │',                  speed: 6 },
  { text: '└─────────────────────────────────────┘',                  speed: 4,  className: 'text-[#374151]' },
  { text: '',                                                          speed: 0,  delay: 250 },
  { text: '$ ssh root@103.21.148.92',                                  speed: 14, className: 'text-[#4ad7ff]' },
  { text: 'Welcome to Ubuntu 22.04.3 LTS',                             speed: 8 },
  { text: 'root@cm-srv-a8f3c91d:~# _',                                 speed: 0 },
]

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
}
const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] } },
}

export function HeroV2() {
  const { lines, complete } = useTypewriter(TERMINAL_LINES)

  return (
    <section className="relative pt-36 pb-24 overflow-hidden">
      {/* Backdrop layers */}
      <div className="absolute inset-0 nl-bg-gradient nl-grid-overlay -z-10" />

      {/* 3D globe — positioned behind the right column on lg+, hidden on mobile to keep TTI fast */}
      <div className="absolute right-0 top-0 bottom-0 w-1/2 hidden lg:block opacity-50 pointer-events-none -z-[5]">
        <Globe />
      </div>

      {/* Floating glow orbs (parallax-ready) */}
      <motion.div
        animate={{ y: [0, -20, 0] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute top-20 left-1/4 w-[600px] h-[600px] rounded-full bg-[var(--nl-brand)]/10 blur-[120px] -z-10 pointer-events-none"
      />
      <motion.div
        animate={{ y: [0, 20, 0] }}
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
        className="absolute top-40 right-1/4 w-[500px] h-[500px] rounded-full bg-[var(--nl-brand-2)]/8 blur-[120px] -z-10 pointer-events-none"
      />

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="max-w-7xl mx-auto px-4 sm:px-6 grid lg:grid-cols-[1.1fr_1fr] gap-12 lg:gap-16 items-center"
      >
        {/* Left — copy */}
        <div>
          {/* Announcement badge */}
          <motion.div variants={itemVariants}>
            <Link
              to="/blog/introducing-netlayer-gpu-cloud"
              className="inline-flex items-center gap-2 h-8 pl-2 pr-3 rounded-full nl-glass text-[12.5px] text-[var(--nl-text-soft)] hover:text-white transition-colors group cursor-pointer"
            >
              <span className="inline-flex items-center gap-1 px-1.5 h-5 rounded-full bg-[var(--nl-brand)]/15 text-[var(--nl-brand-2)] font-medium text-[10.5px]">
                <Sparkles size={9} />
                NEW
              </span>
              <span>GPU Cloud · A100 from ₹1,999/mo</span>
              <ChevronRight size={12} className="text-[var(--nl-text-muted)] group-hover:text-white group-hover:translate-x-0.5 transition-all" />
            </Link>
          </motion.div>

          {/* Headline */}
          <motion.h1
            variants={itemVariants}
            className="mt-7 text-[44px] sm:text-[60px] lg:text-[72px] leading-[0.98] font-semibold tracking-[-0.03em]"
          >
            <span className="nl-gradient-text">Cloud infrastructure</span>
            <br />
            <span className="nl-gradient-text-blue">for builders.</span>
          </motion.h1>

          <motion.p
            variants={itemVariants}
            className="mt-7 text-[17px] lg:text-[18px] text-[var(--nl-text-soft)] max-w-[540px] leading-[1.55]"
          >
            Bare metal, virtualised, and GPU compute across 15 global regions. Deploy in under
            60 seconds. Pay by the hour. Built by engineers who hate slow consoles.
          </motion.p>

          {/* CTAs */}
          <motion.div variants={itemVariants} className="mt-9 flex flex-wrap items-center gap-3">
            <Link to="/register" className="nl-btn-primary">
              Get started — ₹3,500 free credit
              <ArrowUpRight size={15} />
            </Link>
            <Link to="/pricing" className="nl-btn-ghost">
              View pricing
              <ChevronRight size={14} />
            </Link>
          </motion.div>

          {/* Trust line */}
          <motion.div variants={itemVariants} className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-2 text-[12px] text-[var(--nl-text-muted)]">
            <span className="flex items-center gap-1.5">
              <Dot color="emerald" /> 99.99% uptime SLA
            </span>
            <span className="flex items-center gap-1.5">
              <Dot color="blue" /> No egress fees
            </span>
            <span className="flex items-center gap-1.5">
              <Dot color="lavender" /> SOC 2 Type II
            </span>
            <span className="flex items-center gap-1.5">
              <Dot color="cyan" /> 24/7 engineer-staffed support
            </span>
          </motion.div>
        </div>

        {/* Right — terminal */}
        <motion.div variants={itemVariants} className="relative">
          <div className="absolute -inset-6 bg-gradient-to-tr from-[var(--nl-brand)]/30 via-transparent to-[var(--nl-brand-2)]/20 blur-3xl rounded-[32px] pointer-events-none" />
          <div className="relative nl-glass-strong rounded-2xl overflow-hidden shadow-[0_25px_80px_-12px_rgba(0,0,0,0.8)]">
            {/* macOS-style title bar */}
            <div className="h-10 flex items-center px-4 gap-2 border-b border-[var(--nl-border)] bg-gradient-to-b from-white/[0.04] to-transparent">
              <span className="w-3 h-3 rounded-full bg-[#ff5f57]" />
              <span className="w-3 h-3 rounded-full bg-[#febc2e]" />
              <span className="w-3 h-3 rounded-full bg-[#28c840]" />
              <span className="ml-3 nl-mono text-[11px] text-[var(--nl-text-muted)]">~ — netlayer</span>
              <span className="ml-auto inline-flex items-center gap-1.5 text-[10.5px] text-[var(--nl-text-muted)]">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Live deploy
              </span>
            </div>
            <pre className="px-6 py-5 nl-mono text-[12.5px] leading-[1.7] text-[var(--nl-text)] min-h-[480px] whitespace-pre-wrap overflow-hidden">
              {lines.map((l, i) => (
                <div key={i} className={l.className || ''}>
                  {l.text || '\u00A0'}
                  {!complete && i === lines.findIndex((x) => !x.done) && (
                    <span className="inline-block w-1.5 h-3.5 bg-[var(--nl-brand-2)] ml-0.5 align-middle animate-pulse" />
                  )}
                </div>
              ))}
            </pre>
          </div>

          {/* Floating metric pill */}
          <motion.div
            initial={{ opacity: 0, x: 30, y: 30 }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            transition={{ duration: 0.6, delay: 1.4, ease: [0.16, 1, 0.3, 1] }}
            className="absolute -bottom-4 -right-4 nl-glass-strong rounded-xl px-4 py-3 shadow-2xl hidden md:block"
          >
            <div className="text-[10px] text-[var(--nl-text-muted)] uppercase tracking-wider mb-0.5">Avg deploy time</div>
            <div className="text-[24px] font-semibold tracking-tight text-white">
              <span className="nl-gradient-text-blue">31s</span>
            </div>
          </motion.div>
        </motion.div>
      </motion.div>
    </section>
  )
}

function Dot({ color }: { color: 'emerald' | 'blue' | 'lavender' | 'cyan' }) {
  const map = {
    emerald: 'bg-emerald-400',
    blue: 'bg-[var(--nl-brand)]',
    lavender: 'bg-[var(--nl-accent)]',
    cyan: 'bg-[var(--nl-brand-2)]',
  }
  return <span className={`w-1 h-1 rounded-full ${map[color]}`} />
}
