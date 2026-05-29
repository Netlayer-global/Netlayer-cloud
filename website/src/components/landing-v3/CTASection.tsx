import { motion } from 'framer-motion'
import { ArrowRight, Clock, CreditCard, Headphones } from 'lucide-react'

/**
 * CTASection — final pre-footer push.
 *
 * A large rounded panel with a lime aurora wash, an animated gradient hairline
 * border, the primary register CTA + a sales mailto, and a compact row of
 * reassurance points. All copy original; colours from the lime token set.
 */

const BRAND = '#c8f135'
const DASHBOARD_URL =
  import.meta.env.VITE_DASHBOARD_URL || 'http://localhost:5173'

const POINTS = [
  { icon: Clock, label: 'Live in under 60 seconds' },
  { icon: CreditCard, label: '₹3,500 free credit, no card' },
  { icon: Headphones, label: '24/7 human support' },
]

export function CTASection() {
  return (
    <section className="px-4 py-20 sm:px-6 lg:py-28" style={{ background: 'var(--nl-0)' }}>
      <motion.div
        className="relative mx-auto max-w-5xl overflow-hidden rounded-[28px] px-6 py-16 text-center sm:px-12"
        style={{
          background: 'linear-gradient(165deg, var(--nl-3) 0%, var(--nl-1) 60%)',
          border: '1px solid var(--b-strong)',
        }}
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      >
        {/* aurora washes */}
        <div
          aria-hidden
          className="pointer-events-none absolute -top-24 left-1/2 h-72 w-[640px] -translate-x-1/2 animate-aurora rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(200,241,53,0.22), transparent 60%)', filter: 'blur(50px)' }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage:
              'linear-gradient(var(--grid-line) 1px, transparent 1px), linear-gradient(90deg, var(--grid-line) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
            maskImage: 'radial-gradient(ellipse 60% 60% at 50% 0%, black, transparent 70%)',
            WebkitMaskImage: 'radial-gradient(ellipse 60% 60% at 50% 0%, black, transparent 70%)',
          }}
        />

        <div className="relative">
          <span
            className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[12px]"
            style={{ background: 'var(--brand-d)', border: '1px solid var(--brand-b)', color: BRAND }}
          >
            Get started today
          </span>

          <h2
            className="mx-auto mt-6 max-w-2xl font-semibold tracking-tight text-white"
            style={{ fontSize: 'clamp(30px, 4.6vw, 52px)', lineHeight: 1.05, letterSpacing: '-0.025em' }}
          >
            Deploy your first server,
            <br className="hidden sm:block" /> free.
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-[16px]" style={{ color: 'var(--t-med)' }}>
            Join developers shipping on NetLayer. Sign up in seconds and spin up
            infrastructure across 15 regions — no commitment, cancel anytime.
          </p>

          <div className="mt-9 flex flex-wrap justify-center gap-3">
            <a
              href={`${DASHBOARD_URL}/register`}
              className="group inline-flex h-12 items-center gap-2 rounded-xl px-7 text-[15px] font-semibold transition-all hover:-translate-y-0.5"
              style={{ background: BRAND, color: 'var(--brand-fg)', boxShadow: 'var(--shadow-brand)' }}
            >
              Create free account
              <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
            </a>
            <a
              href="mailto:sales@netlayer.com"
              className="inline-flex h-12 items-center rounded-xl px-7 text-[15px] font-medium text-white transition-colors"
              style={{ border: '1px solid var(--b-strong)', background: 'var(--input-bg)' }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--brand-b)')}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--b-strong)')}
            >
              Talk to sales
            </a>
          </div>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-x-7 gap-y-3">
            {POINTS.map((p) => (
              <span key={p.label} className="inline-flex items-center gap-2 text-[13px]" style={{ color: 'var(--t-med)' }}>
                <p.icon size={15} style={{ color: BRAND }} />
                {p.label}
              </span>
            ))}
          </div>
        </div>
      </motion.div>
    </section>
  )
}
