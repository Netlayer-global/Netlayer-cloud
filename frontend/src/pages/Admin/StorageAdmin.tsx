import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Database, HardDrive } from 'lucide-react'
import { adminPlatformAPI } from '../../api/endpoints'
import { cn } from '../../lib/utils'

const TABS = ['Buckets', 'Volumes'] as const

const formatBytes = (bytes: number) => {
  if (!bytes) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB', 'TB', 'PB']
  let i = 0
  let v = bytes
  while (v >= 1024 && i < units.length - 1) { v /= 1024; i += 1 }
  return `${v.toFixed(v < 10 ? 1 : 0)} ${units[i]}`
}

export default function StorageAdmin() {
  const [tab, setTab] = useState<(typeof TABS)[number]>('Buckets')

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'platform', 'storage'],
    queryFn: () => adminPlatformAPI.storage().then((r: any) => r.data.data),
  })

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-medium text-[#e8e8e6]">Storage</h1>
        <p className="text-sm text-[#a0a09e] mt-1">Object buckets and block volumes across all customers.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <Stat label="Buckets" value={data?.buckets?.length ?? 0} />
        <Stat label="Object data" value={formatBytes(data?.totals?.bytes ?? 0)} mono />
        <Stat label="Volumes" value={data?.volumes?.length ?? 0} />
        <Stat label="Volume data" value={`${data?.totals?.volumeGB ?? 0} GB`} mono />
      </div>

      <div className="flex gap-1 mb-3">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              'h-8 px-3 rounded-md text-xs cursor-pointer transition-colors',
              tab === t ? 'bg-[#252625] text-[#e8e8e6]' : 'text-[#a0a09e] hover:bg-[#1e1f1e] hover:text-[#e8e8e6]'
            )}
          >
            {t}
          </button>
        ))}
      </div>

      {isLoading ? (
        <Card>Loading…</Card>
      ) : tab === 'Buckets' ? (
        <BucketsTable items={data?.buckets || []} />
      ) : (
        <VolumesTable items={data?.volumes || []} />
      )}
    </div>
  )
}

function Stat({ label, value, mono }: { label: string; value: string | number; mono?: boolean }) {
  return (
    <div className="bg-[#1e1f1e] border border-[#2a2b2a] rounded-lg p-4">
      <div className="text-[11px] uppercase tracking-wider text-[#6a6a68]">{label}</div>
      <div className={cn('text-2xl font-medium mt-1 tabular-nums', mono && 'font-mono')}>{value}</div>
    </div>
  )
}

function Card({ children }: { children: React.ReactNode }) {
  return <div className="bg-[#1e1f1e] border border-[#2a2b2a] rounded-lg p-10 text-center text-sm text-[#6a6a68]">{children}</div>
}

function BucketsTable({ items }: { items: any[] }) {
  if (items.length === 0) {
    return <Card><Database size={20} className="mx-auto mb-2 text-[#6a6a68]" />No buckets yet.</Card>
  }
  return (
    <div className="bg-[#1e1f1e] border border-[#2a2b2a] rounded-lg overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-[#161716] text-left">
            {['Bucket', 'Region', 'Owner', 'Visibility', 'Objects', 'Size', 'Created'].map((h) => (
              <th key={h} className="px-4 py-2.5 text-[11px] uppercase tracking-wide text-[#6a6a68] font-medium">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {items.map((b) => (
            <tr key={b.id} className="border-t border-[#2a2b2a]">
              <td className="px-4 py-3 font-mono text-xs text-[#e8e8e6]">{b.name}</td>
              <td className="px-4 py-3 text-[#a0a09e]">{b.region}</td>
              <td className="px-4 py-3 text-xs text-[#a0a09e]">{b.user.email}</td>
              <td className="px-4 py-3 text-xs">{b.isPublic ? 'Public' : 'Private'}</td>
              <td className="px-4 py-3 tabular-nums">{b.objects}</td>
              <td className="px-4 py-3 font-mono text-xs">{formatBytes(b.sizeBytes)}</td>
              <td className="px-4 py-3 text-xs text-[#6a6a68]">{new Date(b.createdAt).toLocaleDateString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function VolumesTable({ items }: { items: any[] }) {
  if (items.length === 0) {
    return <Card><HardDrive size={20} className="mx-auto mb-2 text-[#6a6a68]" />No volumes yet.</Card>
  }
  return (
    <div className="bg-[#1e1f1e] border border-[#2a2b2a] rounded-lg overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-[#161716] text-left">
            {['Volume', 'Size', 'Region', 'Status', 'Owner', 'Attached to', 'Created'].map((h) => (
              <th key={h} className="px-4 py-2.5 text-[11px] uppercase tracking-wide text-[#6a6a68] font-medium">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {items.map((v) => (
            <tr key={v.id} className="border-t border-[#2a2b2a]">
              <td className="px-4 py-3 text-[#e8e8e6] font-medium">{v.name}</td>
              <td className="px-4 py-3 tabular-nums">{v.sizeGB} GB</td>
              <td className="px-4 py-3 text-[#a0a09e]">{v.region}</td>
              <td className="px-4 py-3 text-xs">{v.status}</td>
              <td className="px-4 py-3 text-xs text-[#a0a09e]">{v.user.email}</td>
              <td className="px-4 py-3 text-xs text-[#a0a09e]">{v.server?.name || '—'}</td>
              <td className="px-4 py-3 text-xs text-[#6a6a68]">{new Date(v.createdAt).toLocaleDateString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
