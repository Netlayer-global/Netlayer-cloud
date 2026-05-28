import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Boxes, Rocket, Shield } from 'lucide-react'
import { LandingNav, LandingFooter } from '../../components/landing-v3'
import api from '../../api/client'
import { cn } from '../../lib/utils'

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
  { Icon: Boxes,  title: '1. Choose an app',  desc: 'WordPress, Docker, GitLab, Mastodon — the catalog grows weekly.' },
  { Icon: Rocket, title: '2. Pick a region',  desc: 'Closest to your users. Plans start at ₹149/mo.' },
  { Icon: Shield, title: '3. Deploy in 60s',  desc: 'Cloud-init takes care of the install. SSH keys baked in.' },
]

export default function MarketplacePage() {
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

  const targetFor = (slug: string) => (authed ? `/dashboard/deploy?app=${slug}` : `/register?app=${slug}`)

  return (
    <div className="nl-v3 min-h-screen">
      <LandingNav />

      <section className="pt-28 pb-12 px-4 sm:px-6 max-w-5xl mx-auto text-center">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <span
            className="inline-block px-3 h-7 leading-7 rounded-full text-xs"
            style={{ border: '1px solid var(--brand-b)', background: 'var(--brand-d)', color: 'var(--brand)' }}
          >
            Marketplace
          </span>
          <h1
            className="mt-6 font-semibold tracking-tight"
            style={{ fontSize: 'clamp(36px, 5vw, 56px)', lineHeight: 1.05 }}
          >
            One-click apps in 60 seconds
          </h1>
          <p className="mt-5 text-lg max-w-2xl mx-auto" style={{ color: 'var(--t-med)' }}>
            Production-ready stacks pre-configured by our team. Deploy with a single click,
            customise with full root access.
          </p>
        </motion.div>
      </section>

      {/* Search + filter */}
      <section className="px-4 sm:px-6 max-w-5xl mx-auto">
        <div
          className="flex items-center gap-3 px-4 h-11 rounded-lg max-w-md mx-auto"
          style={{ background: 'var(--nl-2)', border: '1px solid var(--b-default)' }}
        >
          <Search size={16} style={{ color: 'var(--t-low)' }} />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search WordPress, Docker, GitLab…"
            className="flex-1 bg-transparent border-none outline-none text-sm"
            style={{ color: 'var(--t-hi)' }}
          />
        </div>

        <div className="mt-6 flex flex-wrap justify-center gap-2">
          {categories.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCategory(c)}
              className={cn(
                'h-8 px-3 rounded-full text-xs cursor-pointer transition-colors capitalize'
              )}
              style={{
                background: category === c ? 'var(--brand-d)' : 'var(--nl-2)',
                color: category === c ? 'var(--brand)' : 'var(--t-med)',
                border: `1px solid ${category === c ? 'var(--brand-b)' : 'var(--b-default)'}`,
              }}
            >
              {c === 'all' ? 'All' : c}
            </button>
          ))}
        </div>
      </section>

      {/* App grid */}
      <section className="py-12 px-4 sm:px-6 max-w-6xl mx-auto">
        {filtered.length === 0 ? (
          <div className="nl-card p-12 text-center text-sm" style={{ color: 'var(--t-low)' }}>
            No apps match "{query}".
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            <AnimatePresence>
              {filtered.map((app) => (
                <motion.div
                  key={app.id}
                  layout
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  transition={{ duration: 0.15 }}
                >
                  <Link to={targetFor(app.slug)} className="block group">
                    <div className="nl-card nl-card-hover p-5 text-center cursor-pointer h-full">
                      <div
                        className="w-12 h-12 rounded-xl mx-auto mb-3 flex items-center justify-center text-2xl"
                        style={{ background: 'var(--nl-3)', border: '1px solid var(--b-default)' }}
                      >
                        {app.logo || '📦'}
                      </div>
                      <div className="text-sm font-medium" style={{ color: 'var(--t-hi)' }}>{app.name}</div>
                      <div className="mt-1 text-[11px] uppercase tracking-wider" style={{ color: 'var(--t-low)' }}>
                        {app.category}
                      </div>
                      <div
                        className="mt-3 text-[11px] opacity-0 group-hover:opacity-100 transition-opacity"
                        style={{ color: 'var(--brand)' }}
                      >
                        Deploy →
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </section>

      {/* How it works */}
      <section className="py-16 px-4 sm:px-6 max-w-5xl mx-auto" style={{ borderTop: '1px solid var(--b-subtle)' }}>
        <div className="text-center mb-10">
          <span className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--brand)' }}>How it works</span>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight">From browse to running</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {STEPS.map((s) => (
            <div key={s.title} className="nl-card p-5">
              <s.Icon size={20} style={{ color: 'var(--brand)' }} />
              <div className="mt-3 text-sm font-medium" style={{ color: 'var(--t-hi)' }}>{s.title}</div>
              <div className="mt-1 text-xs leading-relaxed" style={{ color: 'var(--t-med)' }}>{s.desc}</div>
            </div>
          ))}
        </div>
      </section>

      <LandingFooter />
    </div>
  )
}
