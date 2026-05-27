import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ShieldCheck, CheckCircle2, XCircle } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '../../components/ui/Button'
import { kycAPI } from '../../api/endpoints'
import { cn } from '../../lib/utils'

const STATUS_COLOR: Record<string, string> = {
  pending:  'text-amber-400 bg-amber-950/40 border-amber-900/60',
  approved: 'text-[#4ade80] bg-green-950/40 border-green-900/60',
  rejected: 'text-red-400 bg-red-950/40 border-red-900/60',
}

export default function KycReview() {
  const qc = useQueryClient()
  const { data: list = [], isLoading } = useQuery({
    queryKey: ['admin', 'kyc'],
    queryFn: () => kycAPI.adminList().then((r: any) => r.data.data),
  })

  const approve = useMutation({
    mutationFn: (userId: string) => kycAPI.adminApprove(userId),
    onSuccess: () => { toast.success('KYC approved'); qc.invalidateQueries({ queryKey: ['admin', 'kyc'] }) },
    onError: (e: any) => toast.error(e.response?.data?.error || 'Failed'),
  })

  const reject = useMutation({
    mutationFn: ({ userId, reason }: { userId: string; reason: string }) => kycAPI.adminReject(userId, reason),
    onSuccess: () => { toast.success('KYC rejected'); qc.invalidateQueries({ queryKey: ['admin', 'kyc'] }) },
    onError: (e: any) => toast.error(e.response?.data?.error || 'Failed'),
  })

  const pending = list.filter((u: any) => u.kycStatus === 'pending')
  const reviewed = list.filter((u: any) => u.kycStatus !== 'pending')

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-medium text-[#e8e8e6]">KYC review</h1>
        <p className="text-sm text-[#a0a09e] mt-1">
          Review customer-submitted PAN + Aadhaar + address proof. Required for India compliance + Razorpay activation.
        </p>
      </div>

      {isLoading ? (
        <div className="text-sm text-[#a0a09e]">Loading…</div>
      ) : (
        <>
          <Section title={`Pending review (${pending.length})`}>
            {pending.length === 0 ? (
              <Empty />
            ) : (
              <KycTable
                rows={pending}
                onApprove={(u) => approve.mutate(u.id)}
                onReject={(u) => {
                  const reason = prompt(`Reject ${u.email}'s KYC. Reason:`)
                  if (reason && reason.length >= 3) reject.mutate({ userId: u.id, reason })
                }}
              />
            )}
          </Section>

          <Section title={`Reviewed (${reviewed.length})`} className="mt-6">
            {reviewed.length === 0 ? (
              <Empty />
            ) : (
              <KycTable rows={reviewed} reviewed />
            )}
          </Section>
        </>
      )}
    </div>
  )
}

function Section({ title, children, className }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      <div className="text-xs uppercase tracking-wide text-[#6a6a68] mb-2.5">{title}</div>
      {children}
    </div>
  )
}

function Empty() {
  return (
    <div className="bg-[#1e1f1e] border border-[#2a2b2a] rounded-lg p-8 text-center">
      <ShieldCheck size={20} className="mx-auto mb-2 text-[#6a6a68]" />
      <p className="text-xs text-[#a0a09e]">Nothing here.</p>
    </div>
  )
}

function KycTable({
  rows, onApprove, onReject, reviewed,
}: {
  rows: any[]
  onApprove?: (u: any) => void
  onReject?: (u: any) => void
  reviewed?: boolean
}) {
  return (
    <div className="bg-[#1e1f1e] border border-[#2a2b2a] rounded-lg overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-[#161716] text-left">
            {['Customer', 'PAN', 'Status', 'Submitted', 'Reason', ''].map((h) => (
              <th key={h} className="px-4 py-2.5 text-[11px] uppercase tracking-wide text-[#6a6a68] font-medium">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((u: any) => (
            <tr key={u.id} className="border-t border-[#2a2b2a]">
              <td className="px-4 py-3">
                <div className="text-[#e8e8e6]">{u.firstName} {u.lastName}</div>
                <div className="text-[11px] text-[#a0a09e]">{u.email}</div>
              </td>
              <td className="px-4 py-3 font-mono text-xs text-[#a0a09e]">{u.kycPanNumber}</td>
              <td className="px-4 py-3">
                <span className={cn('inline-flex h-5 px-1.5 items-center rounded border text-[10.5px] font-medium uppercase', STATUS_COLOR[u.kycStatus])}>
                  {u.kycStatus}
                </span>
              </td>
              <td className="px-4 py-3 text-xs text-[#6a6a68]">{u.kycSubmittedAt ? new Date(u.kycSubmittedAt).toLocaleString() : '—'}</td>
              <td className="px-4 py-3 text-xs text-[#a0a09e] max-w-xs truncate">{u.kycRejectReason || '—'}</td>
              <td className="px-4 py-3">
                {!reviewed && (
                  <div className="flex justify-end gap-1.5">
                    <Button size="sm" onClick={() => onApprove?.(u)}>
                      <CheckCircle2 size={11} className="mr-1" /> Approve
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => onReject?.(u)}>
                      <XCircle size={11} className="mr-1" /> Reject
                    </Button>
                  </div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
