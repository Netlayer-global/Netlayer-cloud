import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Boxes, Rocket, Shield } from 'lucide-react'
import { LandingNav, LandingFooter, PageHero } from '../../components/landing-v3'
import api from '../../api/client'
import { cn } from '../../lib/utils'
import { useSeo } from '../../hooks/useSeo'

const DASHBOARD_URL = import.meta.env.VITE_DASHBOARD_URL || 'http://localhost:5173'

/**
 * Marketing site doesn't have auth state — we look for a token in
 * localStorage (set by the dashboard at frontend/) to decide whether
 * to send the user straight to /dashboard/deploy or /register.
 */
const isAuthed = (): boolean => {
  try {
    const raw = localStorage.getItem('nl-auth-storage')
    if (!raw) return false
    const parsed = JSON.parse(raw)
    return !!parsed?.state?.accessToken
  } catch {
    return false
  }
}

interface AppItem {
  id: string
  slug: string
  name: string
  description: string
  logo: string
  category: string
  installs: number
}

const STEPS = [
  { Icon: Boxes,  title: '1. Choose an app',  desc: 'WordPress, Docker, GitLab, Mastodon — the catalog grows weekly.', accent: 'var(--a-lime)' },
  { Icon: Rocket, title: '2. Pick a region',  desc: 'Closest to your users. Plans start at ₹149/mo.', accent: 'var(--a-cyan)' },
  { Icon: Shield, title: '3. Deploy in 60s',  desc: 'Cloud-init takes care of the install. SSH keys baked in.', accent: 'var(--a-violet)' },
]

export default function MarketplacePage() {
  useSeo({
    title: 'Marketplace',
    description: 'One-click app deployments — WordPress, Docker, GitLab, and more, pre-configured by our team. Deploy in 60 seconds with full root access.',
    path: '/marketplace',
  })

  const authed = isAuthed()
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<string>('all')

  const { data: apps = [] } = useQuery({
    queryKey: ['marketplace', 'public'],
    queryFn: () => api.get<{ data: AppItem[] }>('/marketplace').then((r) => r.data.data),
    staleTime: 5 * 60_000,
  })

  const categories = useMemo(() => {
    const set = new Set<string>()
    apps.forEach((a) => a.category && set.add(a.category))
    return ['all', ...Array.from(set).sort()]
  }, [apps])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return apps.filter((a) => {
      if (category !== 'all' && a.category !== category) return false
      if (!q) return true
      return (
        a.name.toLowerCase().includes(q) ||
        a.description.toLowerCase().includes(q) ||
        a.category.toLowerCase().includes(q)
      )
    })
  }, [apps, query, category])

  const targetFor = (slug: string) => (authed ? `${DASHBOARD_URL}/dashboard/deploy?app=${slug}` : `${DASHBOARD_URL}/register?app=${slug}`)

  return (
    <div className="nl-v3 min-h-screen">
      <LandingNav />

      <PageHero
        eyebrow="Marketplace"
        title="One-click apps in"
        accent="60 seconds."
        subtitle="Production-ready stacks pre-configured by our team. Deploy with a single click, customise with full root access."
      />

      {/* Search + filter */}
      <section style={{ background: 'var(--nl-1)', borderTop: '1px solid var(--b-subtle)' }}>
        <div className="nl-container" style={{ padding: 'clamp(40px,5vw,56px) clamp(20px,4vw,72px) 0' }}>
          <div
            className="flex items-center gap-3 px-4 h-12 mx-auto"
            style={{ background: 'var(--nl-2)', border: '1px solid var(--b-default)', borderRadius: 'var(--r-lg)', maxWidth: 460 }}
          >
            <Search size={16} style={{ color: 'var(--t-low)' }} />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search WordPress, Docker, GitLab…"
              className="flex-1 bg-transparent border-none outline-none"
              style={{ color: 'var(--t-hi)', fontSize: 14 }}
            />
          </div>

          <div className="flex flex-wrap justify-center gap-2" style={{ marginTop: 24 }}>
            {categories.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCategory(c)}
                className={cn('h-8 px-3.5 rounded-full cursor-pointer transition-colors capitalize')}
                style={{
                  fontSize: 12.5,
                  background: category === c ? 'var(--brand-d)' : 'var(--nl-2)',
                  color: category === c ? 'var(--brand)' : 'var(--t-med)',
                  border: `1px solid ${category === c ? 'var(--brand-b)' : 'var(--b-default)'}`,
                }}
              >
                {c === 'all' ? 'All' : c}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* App grid */}
      <section style={{ background: 'var(--nl-1)' }}>
        <div className="nl-container" style={{ padding: 'clamp(32px,4vw,48px) clamp(20px,4vw,72px) clamp(56px,8vw,96px)' }}>
          {filtered.length === 0 ? (
            <div className="text-center" style={{ borderRadius: 'var(--r-xl)', border: '1px solid var(--b-default)', background: 'var(--nl-2)', padding: 48, fontSize: 14, color: 'var(--t-low)' }}>
              No apps match "{query}".
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              <AnimatePresence>
                {filtered.map((app) => (
                  <motion.a
                    key={app.id}
                    href={targetFor(app.slug)}
                    layout
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.96 }}
                    transition={{ duration: 0.15 }}
                    className="group block text-center cursor-pointer"
                    style={{ borderRadius: 'var(--r-xl)', border: '1px solid var(--b-default)', background: 'var(--nl-2)', padding: 20 }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--brand-b)' }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--b-default)' }}
                  >
                    <div
                      className="mx-auto flex items-center justify-center"
                      style={{ width: 48, height: 48, borderRadius: 'var(--r-lg)', marginBottom: 12, fontSize: 24, background: 'var(--nl-3)', border: '1px solid var(--b-default)' }}
                    >
                      {app.logo || '📦'}
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--t-hi)' }}>{app.name}</div>
                    <div className="nl-mono" style={{ marginTop: 4, fontSize: 10, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--t-low)' }}>
                      {app.category}
                    </div>
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity" style={{ marginTop: 12, fontSize: 11, color: 'var(--brand)' }}>
                      Deploy →
                    </div>
                  </motion.a>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </section>

      {/* How it works */}
      <section style={{ background: 'var(--nl-0)', borderTop: '1px solid var(--b-subtle)' }}>
        <div className="nl-container" style={{ padding: 'clamp(56px,8vw,96px) clamp(20px,4vw,72px)' }}>
          <div className="text-center max-w-2xl mx-auto" style={{ marginBottom: 'clamp(32px,4vw,48px)' }}>
            <div className="nl-eyebrow" style={{ marginBottom: 16, color: 'var(--brand)' }}>How it works</div>
            <h2 className="nl-display" style={{ fontSize: 'clamp(28px,4vw,48px)', color: 'var(--t-hi)' }}>From browse to running</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {STEPS.map((s) => (
              <div key={s.title} style={{ borderRadius: 'var(--r-xl)', border: '1px solid var(--b-default)', background: 'var(--nl-2)', padding: 'clamp(24px,3vw,32px)' }}>
                <span
                  className="inline-flex items-center justify-center"
                  style={{ width: 46, height: 46, borderRadius: 'var(--r-lg)', background: 'color-mix(in srgb, ' + s.accent + ' 12%, transparent)', border: '1px solid color-mix(in srgb, ' + s.accent + ' 28%, transparent)', marginBottom: 16 }}
                >
                  <s.Icon size={21} style={{ color: s.accent }} />
                </span>
                <div className="nl-head" style={{ fontSize: 16, color: 'var(--t-hi)', marginBottom: 8 }}>{s.title}</div>
                <div style={{ fontSize: 13.5, color: 'var(--t-med)', lineHeight: 1.65 }}>{s.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <LandingFooter />
    </div>
  )
}
