import { useQuery } from '@tanstack/react-query'
import { Eye, ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { masqueradeAPI } from '../../api/endpoints'

/**
 * Round 24 — Admin masquerade history.
 *
 * Read-only audit of every "login as user" session: who, when, why,
 * how long, IP. To start a new masquerade, go to /admin/users and click
 * the "Login as" action.
 */
export default function MasqueradeAdmin() {
  const navigate = useNavigate()
  const { data: list = [], isLoading } = useQuery({
    queryKey: ['admin', 'masquerade'],
    queryFn: () => masqueradeAPI.history().then((r: any) => r.data.data),
  })

  return (
    <div className="max-w-6xl mx-auto">
      <button
        onClick={() => navigate('/admin/users')}
        className="text-xs text-[#a0a09e] hover:text-[#e8e8e6] cursor-pointer mb-3 inline-flex items-center gap-1"
      >
        <ArrowLeft size={11} /> Back to users
      </button>

      <div className="mb-6">
        <h1 className="text-2xl font-medium text-[#e8e8e6]">Masquerade history</h1>
        <p className="text-sm text-[#a0a09e] mt-1">
          Every "login as user" session is logged here. Customers can also see when their account was accessed by support.
        </p>
      </div>

      {isLoading ? (
        <div className="text-sm text-[#a0a09e]">Loading…</div>
      ) : list.length === 0 ? (
        <div className="bg-[#1e1f1e] border border-[#2a2b2a] rounded-lg p-10 text-center">
          <Eye size={20} className="mx-auto mb-3 text-[#6a6a68]" />
          <p className="text-sm text-[#a0a09e]">No masquerade sessions yet.</p>
        </div>
      ) : (
        <div className="bg-[#1e1f1e] border border-[#2a2b2a] rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#161716] text-left">
                {['Started', 'Ended', 'Admin', 'Target', 'IP', 'Reason'].map((h) => (
                  <th key={h} className="px-4 py-2.5 text-[11px] uppercase tracking-wide text-[#6a6a68] font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {list.map((m: any) => (
                <tr key={m.id} className="border-t border-[#2a2b2a]">
                  <td className="px-4 py-3 text-xs text-[#a0a09e]">{new Date(m.startedAt).toLocaleString()}</td>
                  <td className="px-4 py-3 text-xs text-[#a0a09e]">
                    {m.endedAt
                      ? `${Math.round((new Date(m.endedAt).getTime() - new Date(m.startedAt).getTime()) / 60000)} min`
                      : <span className="text-amber-400">active</span>}
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-[#e8e8e6]">{m.admin.firstName} {m.admin.lastName}</div>
                    <div className="text-[11px] text-[#a0a09e]">{m.admin.email}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-[#e8e8e6]">{m.target.firstName} {m.target.lastName}</div>
                    <div className="text-[11px] text-[#a0a09e]">{m.target.email}</div>
                  </td>
                  <td className="px-4 py-3 text-[11px] text-[#6a6a68] font-mono">{m.ipAddress || '—'}</td>
                  <td className="px-4 py-3 text-xs text-[#a0a09e] max-w-md">{m.reason}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
