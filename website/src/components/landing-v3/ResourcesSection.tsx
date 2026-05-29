import { Link } from 'react-router-dom'
import { ArrowRight, BookOpen, Code2, Lightbulb } from 'lucide-react'

/**
 * Three-card resource block — Docs / API / Blog. Each card has a small
 * lucide icon, title, blurb and a "Learn more" arrow link. Same card
 * style as ProductsSection so the page feels cohesive.
 */
const RESOURCES = [
  {
    icon: BookOpen,
    title: 'Documentation',
    body: 'Setup guides, networking how-tos, and FAQs for every product.',
    cta: 'Read docs',
    href: '/docs',
  },
  {
    icon: Code2,
    title: 'API & Terraform',
    body: 'OpenAPI 3 spec, signed webhooks, and a first-party Terraform provider.',
    cta: 'See API ref',
    href: '/docs#api',
  },
  {
    icon: Lightbulb,
    title: 'Blog & Insights',
    body: 'Engineering posts, scaling case studies, and product launches.',
    cta: 'Read the blog',
    href: '/blog',
  },
] as const

export function ResourcesSection() {
  return (
    <section
      className="py-16 lg:py-24"
      style={{ background: 'var(--nl-0)' }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto">
          <div className="text-[11px] uppercase tracking-[.22em] mb-3" style={{ color: 'var(--brand)' }}>
            Resources
          </div>
          <h2
            className="tracking-tight leading-[1.12]"
            style={{ fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 500, color: 'var(--t-hi)' }}
          >
            Everything you need to ship.
          </h2>
        </div>

        <div className="mt-12 grid md:grid-cols-3 gap-4 lg:gap-5">
          {RESOURCES.map((r) => (
            <Link
              key={r.title}
              to={r.href}
              className="group flex flex-col p-7 rounded-lg transition-all cursor-pointer"
              style={{
                background: 'var(--nl-1)',
                border: '1px solid var(--b-default)',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--brand-b)')}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--b-default)')}
            >
              <r.icon size={20} style={{ color: 'var(--brand)' }} />
              <h3
                className="mt-4 text-[20px]"
                style={{ color: 'var(--t-hi)', fontWeight: 500, letterSpacing: '-0.005em' }}
              >
                {r.title}
              </h3>
              <p className="mt-2.5 text-[14px] leading-[1.6] flex-1" style={{ color: 'var(--t-med)' }}>
                {r.body}
              </p>
              <span
                className="mt-5 inline-flex items-center gap-1.5 text-[13px] font-medium"
                style={{ color: 'var(--brand)' }}
              >
                {r.cta}
                <ArrowRight
                  size={13}
                  className="transition-transform duration-200 group-hover:translate-x-1"
                />
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
