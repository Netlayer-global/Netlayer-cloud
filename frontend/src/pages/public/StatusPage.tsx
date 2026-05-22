import { useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { CheckCircle2, AlertTriangle, AlertOctagon, Wrench, Clock, ArrowRight } from 'lucide-react'
import { TopNav } from '../../components/landing/TopNav'
import { Footer } from '../../components/landing/Footer'
import api from '../../api/client'
import { getSocket } from '../../lib/socket'
import { cn, formatDate, relativeTime } from '../../lib/utils'

interface IncidentUpdate {
  message: string
  status: string
  ts: string
}

interface Incident {
  id: string
  title: string
  status: 'investigating' | 'identified' | 'monitoring' | 'resolved'
  impact: 'minor' | 'major' | 'critical' | 'maintenance'
  affectedServices: string[]
  affectedRegions: string[]
  updates: IncidentUpdate[]
  resolvedAt: string | null
  createdAt: string
  updatedAt: string
}

interface StatusSummary {
  overall: 'operational' | 'degraded' | 'major_outage' | 'maintenance'
  services: { name: string; status: string }[]
  regions: { slug: string; status: string }[]
  incidents: Incident[]
}

const REGION_LABELS: Record<string, { city: string; flag: string }> = {
  mumbai: { city: 'Mumbai', flag: '🇮🇳' },
  delhi: { city: 'Delhi', flag: '🇮🇳' },
  singapore: { city: 'Singapore', flag: '🇸🇬' },
  tokyo: { city: 'Tokyo', flag: '🇯🇵' },
  seoul: { city: 'Seoul', flag: '🇰🇷' },
  sydney: { city: 'Sydney', flag: '🇦🇺' },
  frankfurt: { city: 'Frankfurt', flag: '🇩🇪' },
  london: { city: 'London', flag: '🇬🇧' },
  paris: { city: 'Paris', flag: '🇫🇷' },
  amsterdam: { city: 'Amsterdam', flag: '🇳🇱' },
  'new-york': { city: 'New York', flag: '🇺🇸' },
  chicago: { city: 'Chicago', flag: '🇺🇸' },
  'los-angeles': { city: 'Los Angeles', flag: '🇺🇸' },
  'sao-paulo': { city: 'São Paulo', flag: '🇧🇷' },
  dubai: { city: 'Dubai', flag: '🇦🇪' },
}

const STATUS_META: Record<string, { label: string; cls: string; icon: any }> = {
  operational:   { label: 'All Systems Operational',    cls: 'bg-green-500/10 text-green-400 border-green-500/20',  icon: CheckCircle2 },
  degraded:      { label: 'Degraded Performance',        cls: 'bg-amber-500/10 text-amber-400 border-amber-500/20', icon: AlertTriangle },
  major_outage:  { label: 'Major Outage',                cls: 'bg-red-500/10 text-red-400 border-red-500/20',       icon: AlertOctagon },
  maintenance:   { label: 'Scheduled Maintenance',       cls: 'bg-blue-500/10 text-blue-400 border-blue-500/20',    icon: Wrench },
}

const IMPACT_DOT: Record<string, string> = {
  operational:   'bg-green-400',
  degraded:      'bg-amber-400',
  major_outage:  'bg-red-400',
  maintenance:   'bg-blue-400',
}

export default function StatusPage() {
  const qc = useQueryClient()

  const { data: summary, isLoading } = useQuery({
    queryKey: ['status-summary'],
    queryFn: () => api.get('/status/summary').then((r) => r.data.data as StatusSummary),
    refetchInterval: 30_000,
  })

  // Live updates via socket
  useEffect(() => {
    const sock = getSocket()
    const onUpdate = () => qc.invalidateQueries({ queryKey: ['status-summary'] })
    sock.on('status:update', onUpdate)
    return () => { sock.off('status:update', onUpdate) }
  }, [qc])

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white antialiased">
      <TopNav />
      <main className="pt-24 pb-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          {/* Overall banner */}
          <OverallBanner summary={summary} loading={isLoading} />

          {/* Services */}
          <section className="mt-10">
            <h2 className="text-xs uppercase tracking-widest text-gray-500 font-semibold mb-4">Services</h2>
            <div className="rounded-xl border border-white/[0.06] bg-[#111] divide-y divide-white/[0.04]">
              {(summary?.services || []).map((s) => (
                <div key={s.name} className="px-4 py-3 flex items-center justify-between">
                  <span className="text-sm text-white">{s.name}</span>
                  <StatusPill status={s.status} />
                </div>
              ))}
            </div>
          </section>

          {/* Regions */}
          <section className="mt-8">
            <h2 className="text-xs uppercase tracking-widest text-gray-500 font-semibold mb-4">Regions</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {(summary?.regions || []).map((r) => (
                <div
                  key={r.slug}
                  className="px-3 py-2 rounded-lg border border-white/[0.06] bg-[#111] flex items-center gap-2"
                >
                  <span className="text-base">{REGION_LABELS[r.slug]?.flag ?? '🌐'}</span>
                  <span className="flex-1 text-sm text-white truncate">
                    {REGION_LABELS[r.slug]?.city ?? r.slug}
                  </span>
                  <span className={cn('w-1.5 h-1.5 rounded-full', IMPACT_DOT[r.status] || 'bg-gray-500')} />
                </div>
              ))}
            </div>
          </section>

          {/* Active incidents */}
          {summary && summary.incidents.length > 0 && (
            <section className="mt-12">
              <h2 className="text-xs uppercase tracking-widest text-gray-500 font-semibold mb-4">Active incidents</h2>
              <div className="space-y-3">
                {summary.incidents.map((inc) => <IncidentCard key={inc.id} incident={inc} />)}
              </div>
            </section>
          )}

          {/* Past incidents (read-only history) */}
          <PastIncidents />

          <p className="mt-12 text-center text-xs text-gray-600">
            Live updates pushed via WebSocket · auto-refresh every 30s
          </p>
        </div>
      </main>
      <Footer />
    </div>
  )
}

function OverallBanner({ summary, loading }: { summary?: StatusSummary; loading: boolean }) {
  const status = summary?.overall ?? 'operational'
  const meta = STATUS_META[status] ?? STATUS_META.operational
  const Icon = meta.icon

  return (
    <div className={cn('rounded-2xl border px-6 py-8 text-center', meta.cls)}>
      <Icon size={36} className="mx-auto mb-3" />
      <h1 className="text-2xl sm:text-3xl font-semibold">{meta.label}</h1>
      <p className="mt-2 text-sm opacity-80">
        {loading ? 'Checking…' : `Last refreshed ${new Date().toLocaleTimeString()}`}
      </p>
    </div>
  )
}

function StatusPill({ status }: { status: string }) {
  const meta = STATUS_META[status] ?? STATUS_META.operational
  return (
    <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border', meta.cls)}>
      <span className={cn('w-1.5 h-1.5 rounded-full', IMPACT_DOT[status] || 'bg-gray-500')} />
      {status === 'major_outage' ? 'Outage' : status === 'maintenance' ? 'Maintenance' : status === 'degraded' ? 'Degraded' : 'Operational'}
    </span>
  )
}

function IncidentCard({ incident }: { incident: Incident }) {
  const impactCls =
    incident.impact === 'critical' ? 'border-red-500/30' :
    incident.impact === 'major' ? 'border-red-500/20' :
    incident.impact === 'maintenance' ? 'border-blue-500/30' :
    'border-amber-500/30'
  return (
    <article className={cn('rounded-xl bg-[#111] border p-5', impactCls)}>
      <div className="flex items-start justify-between gap-3 mb-2">
        <h3 className="text-base font-semibold text-white">{incident.title}</h3>
        <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full border border-white/[0.1] text-gray-300 shrink-0">
          {incident.status.replace('_', ' ')}
        </span>
      </div>
      <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500 mb-4">
        <span>{relativeTime(incident.createdAt)}</span>
        {incident.affectedServices.length > 0 && (
          <>
            <span>·</span>
            <span>Affects: {incident.affectedServices.join(', ')}</span>
          </>
        )}
      </div>

      {incident.updates.length > 0 && (
        <div className="space-y-3 border-l border-white/[0.08] pl-4 ml-1">
          {incident.updates.slice().reverse().map((u, i) => (
            <div key={i}>
              <div className="text-[10px] uppercase tracking-wider text-[#0070f3] font-semibold">{u.status}</div>
              <p className="text-sm text-gray-300 mt-1 leading-relaxed">{u.message}</p>
              <div className="text-[11px] text-gray-600 mt-1 flex items-center gap-1">
                <Clock size={11} /> {formatDate(u.ts)}
              </div>
            </div>
          ))}
        </div>
      )}
    </article>
  )
}

function PastIncidents() {
  const { data: incidents = [] } = useQuery<Incident[]>({
    queryKey: ['status-history'],
    queryFn: () => api.get('/status/incidents?limit=10').then((r) => r.data.data),
  })
  const resolved = incidents.filter((i) => i.resolvedAt)
  if (resolved.length === 0) return null
  return (
    <section className="mt-12">
      <h2 className="text-xs uppercase tracking-widest text-gray-500 font-semibold mb-4">Past incidents</h2>
      <div className="rounded-xl border border-white/[0.06] bg-[#111] divide-y divide-white/[0.04]">
        {resolved.map((inc) => (
          <div key={inc.id} className="px-4 py-3 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="text-sm text-white truncate">{inc.title}</div>
              <div className="text-xs text-gray-500 mt-0.5">
                {formatDate(inc.createdAt)}
                {inc.resolvedAt && <> · resolved {relativeTime(inc.resolvedAt)}</>}
              </div>
            </div>
            <ArrowRight size={14} className="text-gray-600 shrink-0" />
          </div>
        ))}
      </div>
    </section>
  )
}
