import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Calendar, Clock, ArrowRight, Cpu, Shield, Sparkles, Rocket, BookOpen } from 'lucide-react'
import { LandingNav, LandingFooter, PageHero } from '../../components/landing-v3'
import { blogAPI, type BlogPostSummary } from '../../api/endpoints'
import { useSeo } from '../../hooks/useSeo'

const formatDate = (s: string) =>
  new Date(s).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })

const CATEGORY_META: Record<string, { icon: any; color: string }> = {
  product:        { icon: Sparkles, color: 'var(--a-violet)' },
  engineering:    { icon: Cpu,      color: 'var(--a-amber)' },
  infrastructure: { icon: Shield,   color: 'var(--a-cyan)' },
  guides:         { icon: BookOpen, color: 'var(--a-blue)' },
  announcements:  { icon: Rocket,   color: 'var(--a-lime)' },
}

export default function BlogPage() {
  useSeo({
    title: 'Blog',
    description: 'Engineering deep-dives, product launches, and the occasional postmortem — written by the team who runs the NetLayer platform.',
    path: '/blog',
  })

  const { data: posts = [], isLoading } = useQuery<BlogPostSummary[]>({
    queryKey: ['blog', 'list'],
    queryFn: () => blogAPI.list({ limit: 50 }).then((r) => r.data.data),
  })

  return (
    <div className="nl-v3 min-h-screen">
      <LandingNav />

      <PageHero
        eyebrow="Blog"
        title="Notes from"
        accent="the cloud."
        subtitle="Engineering deep-dives, product launches, and the occasional postmortem. Written by the team who runs the platform."
      />

      <section style={{ background: 'var(--nl-1)', borderTop: '1px solid var(--b-subtle)' }}>
        <div className="nl-container" style={{ padding: 'clamp(48px,7vw,80px) clamp(20px,4vw,72px)' }}>
          <div style={{ maxWidth: 880, margin: '0 auto' }}>
            {isLoading && (
              <div className="flex flex-col gap-4">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="animate-pulse" style={{ borderRadius: 'var(--r-xl)', border: '1px solid var(--b-default)', background: 'var(--nl-2)', padding: 24 }}>
                    <div style={{ height: 16, width: 96, background: 'var(--nl-4)', borderRadius: 4, marginBottom: 12 }} />
                    <div style={{ height: 24, width: '66%', background: 'var(--nl-4)', borderRadius: 4, marginBottom: 12 }} />
                    <div style={{ height: 16, width: '100%', background: 'var(--nl-3)', borderRadius: 4 }} />
                  </div>
                ))}
              </div>
            )}

            {!isLoading && posts.length === 0 && (
              <div className="text-center" style={{ borderRadius: 'var(--r-xl)', border: '1px solid var(--b-default)', background: 'var(--nl-2)', padding: 40, fontSize: 14, color: 'var(--t-med)' }}>
                No posts yet. Check back soon.
              </div>
            )}

            <div className="flex flex-col gap-4">
              {posts.map((p) => {
                const meta = CATEGORY_META[p.category] || CATEGORY_META.engineering
                const Icon = meta.icon
                return (
                  <Link
                    key={p.slug}
                    to={`/blog/${p.slug}`}
                    className="group block cursor-pointer transition-all"
                    style={{ borderRadius: 'var(--r-xl)', border: '1px solid var(--b-default)', background: 'var(--nl-2)', padding: 'clamp(22px,2.6vw,28px)' }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--brand-b)' }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--b-default)' }}
                  >
                    <div className="flex items-start gap-5">
                      <div
                        className="shrink-0 flex items-center justify-center"
                        style={{ width: 48, height: 48, borderRadius: 'var(--r-lg)', background: 'color-mix(in srgb, ' + meta.color + ' 12%, transparent)', border: '1px solid color-mix(in srgb, ' + meta.color + ' 28%, transparent)' }}
                      >
                        <Icon size={20} style={{ color: meta.color }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 flex-wrap" style={{ fontSize: 12, color: 'var(--t-low)', marginBottom: 8 }}>
                          <span className="nl-mono" style={{ letterSpacing: '.08em', textTransform: 'uppercase', color: meta.color }}>{p.category}</span>
                          <span className="flex items-center gap-1"><Calendar size={11} /> {formatDate(p.publishedAt)}</span>
                          <span className="flex items-center gap-1"><Clock size={11} /> {p.readMinutes} min read</span>
                        </div>
                        <h2 className="nl-head transition-colors" style={{ fontSize: 20, color: 'var(--t-hi)', marginBottom: 8 }}>
                          {p.title}
                        </h2>
                        <p style={{ fontSize: 14, color: 'var(--t-med)', lineHeight: 1.65 }}>{p.excerpt}</p>
                        <div className="inline-flex items-center gap-1 transition-transform group-hover:translate-x-0.5" style={{ marginTop: 12, fontSize: 12.5, color: 'var(--brand)' }}>
                          Read article <ArrowRight size={12} />
                        </div>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>

            {/* subscribe */}
            <div className="text-center relative overflow-hidden" style={{ marginTop: 48, borderRadius: 'var(--r-2xl)', border: '1px solid var(--brand-b)', background: 'var(--nl-2)', padding: 'clamp(32px,4vw,44px)' }}>
              <h3 className="nl-head" style={{ fontSize: 19, color: 'var(--t-hi)', marginBottom: 8 }}>Get new posts in your inbox</h3>
              <p style={{ fontSize: 14, color: 'var(--t-med)', maxWidth: 440, margin: '0 auto 20px' }}>
                One email when we publish. No marketing fluff — just engineering and product writing.
              </p>
              <form
                className="flex gap-2"
                style={{ maxWidth: 440, margin: '0 auto' }}
                onSubmit={(e) => { e.preventDefault(); alert('Subscribed (demo).') }}
              >
                <input
                  type="email"
                  required
                  placeholder="you@example.com"
                  className="flex-1 px-3.5 outline-none"
                  style={{ height: 46, borderRadius: 'var(--r-md)', background: 'var(--nl-1)', border: '1px solid var(--b-strong)', color: 'var(--t-hi)', fontSize: 14 }}
                />
                <button type="submit" className="nl-btn-primary">Subscribe</button>
              </form>
            </div>
          </div>
        </div>
      </section>

      <LandingFooter />
    </div>
  )
}
