import { Star } from 'lucide-react'

/**
 * TestimonialsSection — three customer quotes in a 3-up grid.
 * Static data for now; can be wired to a CMS or Blog model later.
 */

const TESTIMONIALS = [
  {
    quote:
      "The 30-second deploy time is not marketing copy. I timed it. NetLayer beats every other provider I've used on raw speed.",
    name: 'Rahul Sharma',
    title: 'CTO',
    company: 'TechStartup India',
  },
  {
    quote:
      "Finally an Indian cloud provider that doesn't compromise on performance. The Mumbai region latency is exceptional.",
    name: 'Priya Nair',
    title: 'DevOps Lead',
    company: 'FinTech Corp',
  },
  {
    quote:
      'The Terraform provider and CLI work exactly as documented. That alone puts NetLayer ahead of half the market.',
    name: 'Amit Patel',
    title: 'SRE',
    company: 'SaaS Company',
  },
]

export function TestimonialsSection() {
  return (
    <section className="py-20 px-4 sm:px-6" style={{ background: 'var(--nl-1)' }}>
      <div className="max-w-7xl mx-auto">
        <h2
          className="text-center"
          style={{ fontSize: 28, fontWeight: 600, letterSpacing: '-.02em' }}
        >
          What developers say
        </h2>
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-4">
          {TESTIMONIALS.map((t) => (
            <figure key={t.name} className="nl-card p-6 flex flex-col gap-4">
              <div className="flex gap-0.5" style={{ color: 'var(--c-amber)' }}>
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} size={13} fill="currentColor" />
                ))}
              </div>
              <blockquote
                style={{
                  fontSize: 14,
                  color: 'var(--t-med)',
                  lineHeight: 1.6,
                  fontStyle: 'italic',
                }}
              >
                "{t.quote}"
              </blockquote>
              <figcaption
                className="flex items-center gap-3 mt-auto pt-4"
                style={{ borderTop: '1px solid var(--b-subtle)' }}
              >
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center text-[11px] font-semibold"
                  style={{
                    background: 'var(--brand-d)',
                    color: 'var(--brand)',
                    border: '1px solid var(--brand-b)',
                  }}
                >
                  {t.name.split(' ').map((p) => p[0]).join('').toUpperCase()}
                </div>
                <div>
                  <div style={{ fontSize: 13, color: 'var(--t-hi)' }}>{t.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--t-low)' }}>
                    {t.title} · {t.company}
                  </div>
                </div>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  )
}
