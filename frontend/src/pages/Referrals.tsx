import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Gift, Copy, Check, Users, Wallet, Clock } from 'lucide-react'
import { toast } from 'sonner'

import { referralAPI } from '../api/infra'
import { Card } from '../components/ui/Card'
import { Skeleton } from '../components/ui/Skeleton'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { Table, THead, TBody, TR, TH, TD, EmptyTable } from '../components/ui/Table'
import { copyToClipboard, formatCurrency, formatDate, relativeTime } from '../lib/utils'

export default function Referrals() {
  const [copied, setCopied] = useState<string | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['referrals'],
    queryFn: () => referralAPI.dashboard().then((r) => r.data.data),
  })

  if (isLoading || !data) {
    return (
      <div className="max-w-5xl mx-auto space-y-4">
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
      </div>
    )
  }

  const link = `${window.location.origin}/register?ref=${data.code}`

  const handleCopy = async (text: string, key: string) => {
    if (await copyToClipboard(text)) {
      setCopied(key)
      toast.success('Copied to clipboard')
      setTimeout(() => setCopied(null), 1500)
    }
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-medium text-[#e8e8e6]">Referrals</h1>
        <p className="text-sm text-[#a0a09e] mt-1">
          Earn {formatCurrency(data.rewardPerReferral)} for every friend who signs up and spends {formatCurrency(data.triggerAmount)}.
        </p>
      </div>

      {/* Hero card */}
      <Card padding="p-6" className="bg-gradient-to-br from-[#e0fe56]/5 to-transparent border-[#e0fe56]/30">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-lg bg-[#e0fe56]/10 border border-[#e0fe56]/30 flex items-center justify-center shrink-0">
            <Gift size={20} className="text-[#e0fe56]" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-medium text-[#e8e8e6]">Your referral link</h2>
            <p className="text-xs text-[#a0a09e] mt-0.5 mb-3">
              Share this link with friends. You both get {formatCurrency(data.rewardPerReferral)} in credit when they spend their first {formatCurrency(data.triggerAmount)}.
            </p>
            <div className="flex flex-col sm:flex-row gap-2">
              <code className="flex-1 px-3 py-2 rounded-md bg-[#0d0e0d] border border-[#2a2b2a] text-xs text-[#e8e8e6] font-mono truncate">
                {link}
              </code>
              <Button onClick={() => handleCopy(link, 'link')} className="shrink-0">
                {copied === 'link' ? <Check size={14} /> : <Copy size={14} />}
                {copied === 'link' ? 'Copied' : 'Copy link'}
              </Button>
            </div>

            <div className="mt-4 flex items-center gap-2 text-xs">
              <span className="text-[#6a6a68]">Or share your code:</span>
              <button
                onClick={() => handleCopy(data.code, 'code')}
                className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-[#0d0e0d] border border-[#2a2b2a] cursor-pointer hover:border-[#e0fe56]/40 transition-colors"
              >
                <code className="font-mono text-[#e0fe56] font-semibold tracking-wider">{data.code}</code>
                {copied === 'code' ? <Check size={11} className="text-emerald-500" /> : <Copy size={11} className="text-[#6a6a68]" />}
              </button>
            </div>
          </div>
        </div>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard icon={Users} label="Total invited" value={data.stats.total.toString()} tint="text-[#4a9eff]" />
        <StatCard icon={Check} label="Rewarded" value={data.stats.rewarded.toString()} tint="text-[#3dd68c]" />
        <StatCard icon={Clock} label="Pending" value={data.stats.pending.toString()} tint="text-[#f0a429]" />
        <StatCard icon={Wallet} label="Total earned" value={formatCurrency(data.stats.totalEarned)} tint="text-[#e0fe56]" />
      </div>

      {/* History */}
      <div>
        <h3 className="text-sm font-medium text-[#e8e8e6] mb-3">Referral history</h3>
        {data.referrals.length === 0 ? (
          <EmptyTable message="No referrals yet. Share your link to start earning." />
        ) : (
          <Table>
            <THead>
              <tr>
                <TH>Friend</TH>
                <TH className="hidden sm:table-cell">Joined</TH>
                <TH>Status</TH>
                <TH className="hidden md:table-cell">Reward</TH>
                <TH className="hidden md:table-cell">Paid</TH>
              </tr>
            </THead>
            <TBody>
              {data.referrals.map((r) => (
                <TR key={r.id}>
                  <TD>
                    <div className="text-[#e8e8e6] font-medium">{r.referee?.name || '—'}</div>
                    <div className="text-[11px] text-[#6a6a68] truncate">{r.referee?.email}</div>
                  </TD>
                  <TD className="hidden sm:table-cell text-xs">
                    {r.referee ? relativeTime(r.referee.joinedAt) : '—'}
                  </TD>
                  <TD>
                    {r.status === 'rewarded' ? (
                      <Badge variant="running">Rewarded</Badge>
                    ) : r.status === 'expired' ? (
                      <Badge variant="error">Expired</Badge>
                    ) : (
                      <Badge variant="building">Pending</Badge>
                    )}
                  </TD>
                  <TD className="hidden md:table-cell font-medium">
                    {r.status === 'rewarded'
                      ? <span className="text-emerald-400">+{formatCurrency(r.reward)}</span>
                      : <span className="text-[#6a6a68]">{formatCurrency(r.reward)}</span>}
                  </TD>
                  <TD className="hidden md:table-cell text-xs">
                    {r.paidAt ? formatDate(r.paidAt) : '—'}
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
        )}
      </div>
    </div>
  )
}

function StatCard({ icon: Icon, label, value, tint }: { icon: any; label: string; value: string; tint: string }) {
  return (
    <Card padding="p-3">
      <Icon size={14} className={tint} />
      <div className="text-[11px] text-[#6a6a68] mt-2">{label}</div>
      <div className="text-xl font-medium text-[#e8e8e6] truncate">{value}</div>
    </Card>
  )
}
