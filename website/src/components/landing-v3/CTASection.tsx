import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'

/**
 * CTASection — final pre-footer call-to-action with a soft brand-coloured
 * radial gradient and two blurred light blobs in the corners. Drives
 * registration + a sales mailto for enterprise-curious visitors.
 */
export function CTASection() {
  return (
    <section
      className="relative overflow-hidden text-center py-24 px-4 sm:px-6"
      style={{
        background: `radial-gradient(ellipse 60% 80% at 50% 50%, var(--brand-d), transparent 70%), var(--nl-0)`,
      }}
    >
      <div
        className="absolute pointer-events-none"
        style={{
          top: '-10%', left: '-10%', width: '300px', height: '300px',
          borderRadius: '50%',
          background: 'var(--brand)',
          opacity: 0.05,
          filter: 'blur(80px)',
        }}
      />
      <div
        className="absolute pointer-events-none"
        style={{
          bottom: '-10%', right: '-10%', width: '400px', height: '400px',
          borderRadius: '50%',
          background: 'var(--brand)',
          opacity: 0.05,
          filter: 'blur(100px)',
        }}
      />

      <h2
        className="relative"
        style={{
          fontSize: 'clamp(32px, 5vw, 40px)',
          fontWeight: 700,
          letterSpacing: '-.02em',
          lineHeight: 1.15,
        }}
      >
        Start building in 60 seconds
      </h2>
      <p
        className="relative mt-4 max-w-xl mx-auto"
        style={{ fontSize: 16, color: 'var(--t-med)' }}
      >
        Deploy your first server free. ₹3,500 in credits for new accounts.
      </p>
      <div className="relative mt-8 flex flex-wrap justify-center gap-3">
        <Link to="/register" className="nl-btn-primary !h-12 !px-6 !text-[15px]">
          Create free account <ArrowRight size={15} />
        </Link>
        <a
          href="mailto:sales@netlayer.com"
          className="nl-btn-ghost !h-12 !px-6 !text-[15px]"
        >
          Talk to sales
        </a>
      </div>
      <p className="relative mt-5 text-[12px]" style={{ color: 'var(--t-low)' }}>
        No credit card required
      </p>
    </section>
  )
}
