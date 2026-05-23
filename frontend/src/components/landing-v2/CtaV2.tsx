import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowUpRight } from 'lucide-react'

export function CtaV2() {
  return (
    <section className="relative py-32 px-4 sm:px-6 overflow-hidden">
      {/* Glow backdrop */}
      <div
        className="absolute inset-0 -z-10"
        style={{
          background:
            'radial-gradient(ellipse 60% 80% at 50% 50%, rgba(79, 139, 255, 0.18), transparent 70%)',
        }}
      />
      <div className="absolute inset-0 nl-grid-overlay -z-10" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-100px' }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="max-w-4xl mx-auto text-center relative"
      >
        <h2 className="text-[44px] sm:text-[64px] leading-[1.02] font-semibold tracking-[-0.025em] nl-gradient-text">
          Start building.
          <br />
          <span className="nl-gradient-text-blue">No credit card required.</span>
        </h2>
        <p className="mt-7 text-[18px] text-[var(--nl-text-soft)] leading-[1.55] max-w-xl mx-auto">
          Sign up in 30 seconds, get ₹3,500 in credits, and deploy your first server before the kettle boils.
        </p>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
          <Link to="/register" className="nl-btn-primary">
            Create free account
            <ArrowUpRight size={15} />
          </Link>
          <a href="mailto:sales@netlayer.com" className="nl-btn-ghost">
            Talk to sales
          </a>
        </div>
        <p className="mt-7 text-[12px] text-[var(--nl-text-muted)]">
          Pay only for what you use · Cancel anytime · No long-term contracts
        </p>
      </motion.div>
    </section>
  )
}
