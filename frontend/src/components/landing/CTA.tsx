import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'

export function CTA() {
  return (
    <section className="py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-gradient-to-br from-[#0a0a0a] via-[#0d1525] to-[#0a0a0a] p-10 sm:p-16">
          {/* Glow */}
          <div className="absolute inset-0 -z-10 pointer-events-none">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] rounded-full bg-[#0070f3]/20 blur-[100px]" />
            <div className="absolute bottom-0 right-1/4 w-[400px] h-[300px] rounded-full bg-[#00d4ff]/15 blur-[80px]" />
          </div>
          {/* Subtle grid */}
          <div
            className="absolute inset-0 opacity-[0.04] pointer-events-none"
            style={{
              backgroundImage:
                'linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)',
              backgroundSize: '40px 40px',
            }}
          />

          <div className="relative max-w-2xl mx-auto text-center">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight text-white">
              Start building today
            </h2>
            <p className="mt-5 text-lg text-gray-300">
              Deploy your first server in 60 seconds.
              <br className="hidden sm:block" />
              <span className="text-white">$100 free credit</span> for new accounts.
            </p>

            <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
              <Link
                to="/register"
                className="inline-flex items-center gap-2 h-12 px-6 rounded-lg text-[15px] font-medium text-[#0a0a0a] bg-white hover:bg-gray-100 shadow-[0_8px_32px_rgba(255,255,255,0.15)] transition-all cursor-pointer"
              >
                Create Free Account
                <ArrowRight size={16} />
              </Link>
              <a
                href="mailto:sales@netlayer.com"
                className="inline-flex items-center gap-1 h-12 px-5 rounded-lg text-[15px] font-medium text-white hover:bg-white/[0.06] border border-white/[0.12] transition-colors cursor-pointer"
              >
                Talk to Sales
                <ArrowRight size={14} />
              </a>
            </div>

            <p className="mt-6 text-xs text-gray-500">No credit card required · Cancel anytime</p>
          </div>
        </div>
      </div>
    </section>
  )
}
