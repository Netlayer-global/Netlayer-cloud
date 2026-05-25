import { useQuery } from '@tanstack/react-query'
import { Globe } from 'lucide-react'
import { adminPlatformAPI } from '../../api/endpoints'

export default function DnsAdmin() {
  const { data: zones = [], isLoading } = useQuery({
    queryKey: ['admin', 'platform', 'dns'],
    queryFn: () => adminPlatformAPI.dns().then((r: any) => r.data.data),
  })

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-medium text-[#e8e8e6]">DNS zones</h1>
        <p className="text-sm text-[#a0a09e] mt-1">All DNS zones across customers.</p>
      </div>

      {isLoading ? (
        <div className="bg-[#1e1f1e] border border-[#2a2b2a] rounded-lg p-10 text-center text-sm text-[#6a6a68]">Loading…</div>
      ) : zones.length === 0 ? (
        <div className="bg-[#1e1f1e] border border-[#2a2b2a] rounded-lg p-10 text-center">
          <Globe size={20} className="mx-auto mb-2 text-[#6a6a68]" />
          <p className="text-sm text-[#a0a09e]">No DNS zones yet.</p>
        </div>
      ) : (
        <div className="bg-[#1e1f1e] border border-[#2a2b2a] rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#161716] text-left">
                {['Domain', 'Status', 'Owner', 'Records', 'Created'].map((h) => (
                  <th key={h} className="px-4 py-2.5 text-[11px] uppercase tracking-wide text-[#6a6a68] font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {zones.map((z: any) => (
                <tr key={z.id} className="border-t border-[#2a2b2a]">
                  <td className="px-4 py-3 font-mono text-xs text-[#e8e8e6]">{z.domain}</td>
                  <td className="px-4 py-3 text-xs">{z.status}</td>
                  <td className="px-4 py-3 text-xs text-[#a0a09e]">{z.user.email}</td>
                  <td className="px-4 py-3 tabular-nums">{z._count?.records ?? 0}</td>
                  <td className="px-4 py-3 text-xs text-[#6a6a68]">{new Date(z.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
