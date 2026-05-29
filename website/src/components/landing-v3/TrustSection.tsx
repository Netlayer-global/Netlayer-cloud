import { Link } from 'react-router-dom'
import { Award, BadgeCheck, Eye, Lock, Shield, Star } from 'lucide-react'

/**
 * Trust + compliance section. Two-column layout:
 *   Left  — wrapping pill cluster of compliance badges (SOC 2, ISO 27001, …)
 *   Right — large headline + paragraph + "Visit Trust Center" CTA
 *
 * No external badge SVGs — all glyphs come from lucide. Keeps the section
 * brand-safe (no third-party logos = no clearance work).
 */

const BADGES = [
  { icon: BadgeCheck, label: 'SOC 2 Type II' },
  { icon: Shield,     label: 'ISO 27001:2022' },
  { icon: Lock,       label: 'GDPR compliant' },
  { icon: Award,      label: 'PCI-DSS ready' },
  { icon: Eye,        label: 'HIPAA ready (BAA)' },
  { icon: Star,       label: 'India DPDP 2023' },
] as const

export function TrustSection() {
  return (
    <section
      className="py-16 lg:py-24"
      style={{
        background: 'var(--nl-1)',
        borderTop: '1px solid var(--b-subtle)',
        borderBottom: '1px solid var(--b-subtle)',
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-[1fr_1.1fr] gap-12 lg:gap-20 items-center">
        {/* Left badge cluster */}
        <div className="flex flex-wrap gap-3">
          {BADGES.map((b) => (
            <span
              key={b.label}
              className="inline-flex items-center gap-2 px-4 h-10 rounded-md text-[13px]"
              style={{
                background: 'var(--nl-2)',
                border: '1px solid var(--b-default)',
                color: 'var(--t-hi)',
              }}
            >
              <b.icon size={14} style={{ color: 'var(--brand)' }} />
              {b.label}
            </span>
          ))}
        </div>

        {/* Right copy */}
        <div>
          <div className="text-[11px] uppercase tracking-[.22em] mb-3" style={{ color: 'var(--brand)' }}>
            Trust &amp; compliance
          </div>
          <h2
            className="leading-[1.15] tracking-tight"
            style={{ fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 500, color: 'var(--t-hi)' }}
          >
            Audited cloud infrastructure for{' '}
            <span style={{ color: 'var(--brand)' }}>regulated workloads.</span>
          </h2>
          <p className="mt-6 text-[15px] leading-[1.65]" style={{ color: 'var(--t-med)' }}>
            Encrypted at rest with AES-256. CGST/SGST/IGST split on every Indian
            invoice. CERT-In 6-hour incident reporting integrated. Independent
            yearly audits.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              to="/legal/terms"
              className="inline-flex items-center gap-2 h-11 px-5 rounded-md text-[13.5px] font-medium transition-colors cursor-pointer"
              style={{ background: 'var(--brand)', color: '#0d0e0d' }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--brand-h)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--brand)')}
            >
              Visit Trust Center
            </Link>
            <Link
              to="/abuse-report"
              className="inline-flex items-center gap-2 h-11 px-5 rounded-md text-[13.5px] transition-colors cursor-pointer"
              style={{
                color: 'var(--t-hi)',
                border: '1px solid var(--b-strong)',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--brand-b)')}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--b-strong)')}
            >
              Report abuse
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
