import { motion } from 'framer-motion'
import { Shield, Lock, BadgeCheck, Activity, Eye, Zap } from 'lucide-react'

const BADGES = [
  { icon: BadgeCheck, label: 'SOC 2 Type II',    sub: 'Annual third-party audit' },
  { icon: Shield,     label: 'ISO 27001',         sub: 'Information security' },
  { icon: Lock,       label: 'GDPR ready',        sub: 'EU data subject rights' },
  { icon: Activity,   label: '99.99% uptime SLA', sub: 'Backed by service credits' },
  { icon: Eye,        label: 'PCI DSS',           sub: 'Card data tokenisation' },
  { icon: Zap,        label: 'HIPAA ready',       sub: 'BAA available on request' },
]

const TESTIMONIALS = [
  {
    quote: 'We migrated our entire production stack to NetLayer in a weekend. The deploy times alone saved us hours every sprint, and pricing came in 60% cheaper than what we were paying on AWS.',
    name: 'Aarav Sharma',
    title: 'Staff Engineer',
    company: 'Northwind Labs',
    initials: 'AS',
  },
  {
    quote: 'The CLI ergonomics are insane. nl server create is a single command — no console clicks, no confusing IAM dance. Our team ships infrastructure changes the same way we ship code.',
    name: 'Priya Mehta',
    title: 'Platform Lead',
    company: 'Stark Industries',
    initials: 'PM',
  },
  {
    quote: 'I run all my client projects on NetLayer now. Bare metal performance, sane pricing, and a support team that actually answers in the same day. That last part is rare.',
    name: 'James O\'Connor',
    title: 'Founder',
    company: 'Parallax Studio',
    initials: 'JO',
  },
]

export function TrustV2() {
  return (
    <section className="py-32 px-4 sm:px-6 max-w-7xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-100px' }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="text-center max-w-3xl mx-auto"
      >
        <p className="text-[12px] uppercase tracking-[0.2em] text-[var(--nl-brand-2)] mb-4">
          Compliance &amp; trust
        </p>
        <h2 className="text-[40px] sm:text-[52px] leading-[1.05] font-semibold tracking-[-0.02em] nl-gradient-text">
          Enterprise-grade
          <br />
          security defaults.
        </h2>
        <p className="mt-6 text-[17px] text-[var(--nl-text-soft)] leading-[1.55]">
          Audited yearly. Encrypted everywhere. Designed for regulated workloads from day one.
        </p>
      </motion.div>

      {/* Badges */}
      <div className="mt-16 grid grid-cols-2 md:grid-cols-3 gap-3">
        {BADGES.map((b, i) => (
          <motion.div
            key={b.label}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.4, delay: i * 0.05 }}
            className="nl-glass rounded-xl p-5 hover:border-[var(--nl-border-strong)] transition-all"
          >
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg nl-glass flex items-center justify-center shrink-0">
                <b.icon size={15} className="text-[var(--nl-brand-2)]" />
              </div>
              <div>
                <div className="text-[14px] font-semibold text-white">{b.label}</div>
                <div className="text-[12px] text-[var(--nl-text-muted)] mt-0.5">{b.sub}</div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Testimonials */}
      <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-4">
        {TESTIMONIALS.map((t, i) => (
          <motion.figure
            key={t.name}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.5, delay: i * 0.08 }}
            className="nl-glass rounded-xl p-7 flex flex-col gap-5 hover:border-[var(--nl-border-strong)] transition-all"
          >
            {/* Stars */}
            <div className="flex gap-0.5 text-[var(--nl-brand-2)]">
              {Array.from({ length: 5 }).map((_, idx) => (
                <svg key={idx} viewBox="0 0 20 20" className="w-3.5 h-3.5 fill-current">
                  <path d="M10 1.5l2.6 5.3 5.9.85-4.25 4.15 1 5.85L10 14.95 4.75 17.65l1-5.85L1.5 7.65l5.9-.85L10 1.5z" />
                </svg>
              ))}
            </div>
            <blockquote className="text-[14.5px] text-[var(--nl-text-soft)] leading-[1.55] flex-1">
              "{t.quote}"
            </blockquote>
            <figcaption className="flex items-center gap-3 pt-3 border-t border-[var(--nl-border)]">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[var(--nl-brand)] to-[var(--nl-brand-2)] flex items-center justify-center text-[11px] font-semibold text-white">
                {t.initials}
              </div>
              <div>
                <div className="text-[13px] text-white font-medium">{t.name}</div>
                <div className="text-[11.5px] text-[var(--nl-text-muted)]">
                  {t.title} · {t.company}
                </div>
              </div>
            </figcaption>
          </motion.figure>
        ))}
      </div>
    </section>
  )
}
