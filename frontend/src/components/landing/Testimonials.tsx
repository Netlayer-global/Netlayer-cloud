import { Star } from 'lucide-react'

interface Testimonial {
  initials: string
  bg: string
  name: string
  role: string
  company: string
  quote: string
  rating: number
}

const TESTIMONIALS: Testimonial[] = [
  {
    initials: 'PR',
    bg: 'from-[#0070f3] to-[#00d4ff]',
    name: 'Priya Raman',
    role: 'CTO',
    company: 'BharatBuilds',
    rating: 5,
    quote:
      'We moved 80 servers from a US provider to NetLayer Mumbai. p99 dropped from 230 ms to 8 ms for our Indian users. Setup took an afternoon.',
  },
  {
    initials: 'JM',
    bg: 'from-purple-500 to-pink-500',
    name: 'Jordan Mehta',
    role: 'Founder',
    company: 'Saturn Labs',
    rating: 5,
    quote:
      'The CLI feels like git. Terraform provider works. The Razorpay integration just worked. Hard to ask for more from a cloud provider.',
  },
  {
    initials: 'AK',
    bg: 'from-orange-500 to-red-500',
    name: 'Aarav Kapoor',
    role: 'Head of Infra',
    company: 'OneCart',
    rating: 5,
    quote:
      'Hourly billing actually means hourly. Bare metal in 4 minutes. Their support replied to a P1 in under 5 minutes at 2 am IST.',
  },
]

export function Testimonials() {
  return (
    <section className="py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight text-white">
            Loved by developers
          </h2>
          <p className="mt-4 text-gray-400 text-lg">
            Real teams, real workloads, real numbers.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          {TESTIMONIALS.map((t) => (
            <article
              key={t.name}
              className="bg-[#111] border border-white/[0.06] rounded-xl p-6 flex flex-col hover:border-white/[0.15] transition-colors"
            >
              <div className="flex items-center gap-1 mb-4 text-[#00d4ff]">
                {Array.from({ length: t.rating }).map((_, i) => (
                  <Star key={i} size={14} fill="currentColor" />
                ))}
              </div>
              <p className="text-[15px] text-gray-200 leading-relaxed flex-1">
                "{t.quote}"
              </p>
              <div className="flex items-center gap-3 mt-6 pt-5 border-t border-white/[0.06]">
                <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${t.bg} flex items-center justify-center text-white text-sm font-semibold`}>
                  {t.initials}
                </div>
                <div>
                  <div className="text-sm text-white font-medium">{t.name}</div>
                  <div className="text-xs text-gray-500">{t.role} · {t.company}</div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
