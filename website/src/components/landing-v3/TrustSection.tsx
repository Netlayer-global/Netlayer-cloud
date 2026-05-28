import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Award, Award as Sla, BadgeCheck, Eye, Lock, Shield } from 'lucide-react'

/**
 * TrustSection — left column lists six compliance items (SOC 2, ISO,
 * GDPR, PCI, HIPAA, SLA). Right column polls /api/platform/stats every
 * 30s to show a live status card.
 */

const COMPLIANCE = [
  { Icon: BadgeCheck, title: 'SOC 2 Type II',    sub: 'Annual third-party audit' },
  { Icon: Shield,     title: 'ISO 27001',         sub: 'Information security' },
  { Icon: Lock,       title: 'GDPR compliant',    sub: 'Full data subject rights' },
  { Icon: Award,      title: 'PCI DSS Ready',     sub: 'Card-data tokenisation' },
  { Icon: Eye,        title: 'HIPAA Ready',       sub: 'BAA available on request' },
  { Icon: Sla,        title: '99.99% SLA',        sub: 'Backed by service credits' },
]

export function TrustSection() {
  return (
    <section className="py-20 px-4 sm:px-6" style={{ background: 'var(--nl-0)' }}>
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12">
        <div>
          <h2 style={{ fontSize: 28, fontWeight: 600, letterSpacing: '-.02em', lineHeight: 1.15 }}>
            Enterprise-grade security &amp; compliance
          </h2>
          <p className="mt-4" style={{ fontSize: 14, color: 'var(--t-med)' }}>
            Audited yearly. Encrypted everywhere. Designed for regulated workloads.
          </p>
          <div className="mt-8 grid grid-cols-2 gap-3">
            {COMPLIANCE.map((c) => (
              <div key={c.title} className="nl-card p-4">
                <div className="flex items-start gap-3">
                  <div
                    className="w-8 h-8 rounded-md flex items-center justify-center shrink-0"
                    style={{ background: 'var(--brand-d)', border: '1px solid var(--brand-b)' }}
                  >
                    <c.Icon size={14} style={{ color: 'var(--brand)' }} />
                  </div>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 500 }}>{c.title}</div>
                    <div className="mt-0.5" style={{ fontSize: 11, color: 'var(--t-low)' }}>{c.sub}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <PlatformLiveStats />
      </div>
    </section>
  )
}

interface PlatformStats {
  serversDeployedToday: number
  activeServers: number
  regionsOnline: number
  lastDeploySeconds: number | null
  totalUsers: number
  uptimePercent: number
}

function PlatformLiveStats() {
  const [stats, setStats] = useState<PlatformStats | null>(null)
  useEffect(() => {
    const fetchStats = () => {
      const apiUrl = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/$/, '')
      fetch(`${apiUrl}/platform/stats`)
        .then((r) => (r.ok ? r.json() : null))
        .then((j) => j?.data && setStats(j.data))
        .catch(() => undefined)
    }
    fetchStats()
    const t = window.setInterval(fetchStats, 30_000)
    return () => clearInterval(t)
  }, [])

  return (
    <div className="nl-card p-6">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full nl-pulse-dot" style={{ background: 'var(--c-green)' }} />
          <span style={{ fontSize: 14, fontWeight: 500 }}>Platform status</span>
        </div>
        <Link to="/status" style={{ fontSize: 12, color: 'var(--brand)' }}>View status →</Link>
      </div>

      <div className="space-y-3">
        <StatRow label="Servers deployed today" value={stats ? stats.serversDeployedToday.toLocaleString('en-IN') : '—'} />
        <StatRow label="Active servers"          value={stats ? stats.activeServers.toLocaleString('en-IN')        : '—'} />
        <StatRow label="Regions online"          value={stats ? `${stats.regionsOnline}/15`                         : '—'} />
        <StatRow label="Last deploy"             value={stats?.lastDeploySeconds ? `${stats.lastDeploySeconds}s` : '—'} />
        <StatRow label="Uptime (30 days)"        value={stats ? `${stats.uptimePercent.toFixed(2)}%`                : '—'} />
      </div>
    </div>
  )
}

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <div
      className="flex items-center justify-between"
      style={{ padding: '10px 0', borderBottom: '1px solid var(--b-subtle)' }}
    >
      <span style={{ fontSize: 12, color: 'var(--t-low)' }}>{label}</span>
      <span
        style={{
          fontSize: 13,
          color: 'var(--t-hi)',
          fontFamily: 'var(--font-mono)',
          fontWeight: 500,
        }}
      >
        {value}
      </span>
    </div>
  )
}
