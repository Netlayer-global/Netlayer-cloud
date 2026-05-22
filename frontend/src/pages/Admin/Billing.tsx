import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Download, MoreHorizontal } from 'lucide-react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import { toast } from 'sonner'
import { adminAPI } from '../../api/admin'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { Input } from '../../components/ui/Input'
import { Modal } from '../../components/ui/Modal'
import { Badge } from '../../components/ui/Badge'
import { Skeleton } from '../../components/ui/Skeleton'
import { Select } from '../../components/ui/Select'
import { Table, THead, TBody, TR, TH, TD, EmptyTable } from '../../components/ui/Table'
import { cn, formatCurrency, formatDate } from '../../lib/utils'

export default function AdminBilling() {
  const qc = useQueryClient()
  const [status, setStatus] = useState('')
  const [tab, setTab] = useState<'invoices' | 'transactions'>('invoices')
  const [markPaid, setMarkPaid] = useState<any | null>(null)
  const [refund, setRefund] = useState<any | null>(null)
  const [openMenu, setOpenMenu] = useState<string | null>(null)

  const { data: stats } = useQuery({ queryKey: ['admin-stats'], queryFn: () => adminAPI.stats() })
  const { data: chart = [] } = useQuery({
    queryKey: ['admin-revenue', '90d'],
    queryFn: () => adminAPI.revenueChart('90d'),
  })
  const { data, isLoading } = useQuery({
    queryKey: ['admin-invoices', status],
    queryFn: () => adminAPI.listInvoices({ status: status || undefined }),
  })

  const invoices = data?.data || []
  const pending = invoices.filter((i: any) => i.status === 'PENDING').length
  const failed = invoices.filter((i: any) => i.status === 'FAILED').length

  return (
    <div className="max-w-7xl mx-auto space-y-5">
      <div>
        <h1 className="text-2xl font-medium text-[#e8e8e6]">Billing</h1>
        <p className="text-sm text-[#a0a09e] mt-1">Invoices, transactions, and revenue.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
        {[
          { label: 'Today', value: stats ? formatCurrency(stats.revenue.today) : '—' },
          { label: 'This month', value: stats ? formatCurrency(stats.revenue.thisMonth) : '—' },
          { label: 'Last month', value: stats ? formatCurrency(stats.revenue.lastMonth) : '—' },
          { label: 'All time', value: stats ? formatCurrency(stats.revenue.total) : '—' },
          { label: 'Pending', value: pending, cls: 'text-amber-400' },
          { label: 'Failed', value: failed, cls: 'text-red-400' },
        ].map((s) => (
          <Card key={s.label}>
            <div className="text-[11px] text-[#6a6a68] uppercase tracking-wide mb-1">{s.label}</div>
            <div className={cn('text-xl font-medium', s.cls || 'text-[#e8e8e6]')}>{s.value}</div>
          </Card>
        ))}
      </div>

      {/* Chart */}
      <Card padding="p-5">
        <h3 className="text-sm font-medium text-[#e8e8e6] mb-4">Revenue (90d)</h3>
        <div className="h-48">
          <ResponsiveContainer>
            <AreaChart data={chart}>
              <defs>
                <linearGradient id="revB" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#e0fe56" stopOpacity={0.5} />
                  <stop offset="100%" stopColor="#e0fe56" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#2a2b2a" strokeDasharray="3 3" />
              <XAxis dataKey="date" stroke="#6a6a68" fontSize={10} tickFormatter={(v) => v.slice(5)} />
              <YAxis stroke="#6a6a68" fontSize={10} />
              <Tooltip
                contentStyle={{ background: '#161716', border: '1px solid #2a2b2a', borderRadius: 6, fontSize: 12 }}
                formatter={(v: any) => [`₹${v.toLocaleString()}`, 'Revenue']}
              />
              <Area type="monotone" dataKey="amount" stroke="#e0fe56" strokeWidth={2} fill="url(#revB)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Tabs + filter */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center bg-[#1e1f1e] border border-[#2a2b2a] rounded-md p-0.5">
          {(['invoices', 'transactions'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                'h-7 px-3 text-xs rounded cursor-pointer transition-colors capitalize',
                tab === t ? 'bg-[#252625] text-[#e8e8e6]' : 'text-[#a0a09e] hover:text-[#e8e8e6]'
              )}
            >
              {t}
            </button>
          ))}
        </div>
        {tab === 'invoices' && (
          <Select value={status} onChange={(e) => setStatus(e.target.value)} className="w-44">
            <option value="">All statuses</option>
            <option value="PAID">Paid</option>
            <option value="PENDING">Pending</option>
            <option value="FAILED">Failed</option>
            <option value="REFUNDED">Refunded</option>
          </Select>
        )}
      </div>

      {tab === 'invoices' ? (
        isLoading ? <Skeleton className="h-64 rounded-lg" /> : invoices.length === 0 ? (
          <EmptyTable message="No invoices." />
        ) : (
          <Table>
            <THead>
              <tr>
                <TH>Invoice</TH>
                <TH>User</TH>
                <TH className="text-right">Amount</TH>
                <TH className="text-right">Tax</TH>
                <TH className="text-right">Total</TH>
                <TH>Status</TH>
                <TH>Method</TH>
                <TH>Created</TH>
                <TH className="w-12"></TH>
              </tr>
            </THead>
            <TBody>
              {invoices.map((inv: any) => (
                <TR key={inv.id}>
                  <TD className="font-mono text-xs">{inv.invoiceNumber.slice(-10).toUpperCase()}</TD>
                  <TD className="text-xs">{inv.user?.email}</TD>
                  <TD className="text-right">{formatCurrency(inv.amount, inv.currency)}</TD>
                  <TD className="text-right text-xs">{formatCurrency(inv.tax, inv.currency)}</TD>
                  <TD className="text-right text-[#e8e8e6]">{formatCurrency(inv.total > 0 ? inv.total : inv.amount, inv.currency)}</TD>
                  <TD>
                    <Badge variant={inv.status === 'PAID' ? 'running' : inv.status === 'PENDING' ? 'pending' : 'error'}>
                      {inv.status.toLowerCase()}
                    </Badge>
                  </TD>
                  <TD className="text-xs">{inv.paymentMethod || '—'}</TD>
                  <TD className="text-xs">{formatDate(inv.createdAt)}</TD>
                  <TD className="text-right relative">
                    <button onClick={() => setOpenMenu(openMenu === inv.id ? null : inv.id)} className="text-[#6a6a68] hover:text-[#e8e8e6] cursor-pointer p-1 rounded hover:bg-[#252625]">
                      <MoreHorizontal size={16} />
                    </button>
                    {openMenu === inv.id && (
                      <>
                        <div className="fixed inset-0 z-10" onClick={() => setOpenMenu(null)} />
                        <div className="absolute right-2 top-full mt-1 bg-[#161716] border border-[#2a2b2a] rounded-md shadow-lg z-20 w-44 py-1">
                          {inv.status === 'PENDING' && (
                            <MenuItem label="Mark as paid" onClick={() => { setMarkPaid(inv); setOpenMenu(null) }} />
                          )}
                          {inv.status === 'PAID' && (
                            <MenuItem label="Refund" danger onClick={() => { setRefund(inv); setOpenMenu(null) }} />
                          )}
                          <MenuItem label="Download PDF" onClick={() => toast.info('PDF generation not configured')} />
                        </div>
                      </>
                    )}
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
        )
      ) : (
        <TransactionsView />
      )}

      <MarkPaidModal invoice={markPaid} onClose={() => setMarkPaid(null)} onSuccess={() => qc.invalidateQueries({ queryKey: ['admin-invoices'] })} />
      <RefundModal invoice={refund} onClose={() => setRefund(null)} onSuccess={() => qc.invalidateQueries({ queryKey: ['admin-invoices'] })} />
    </div>
  )
}

function MenuItem({ label, onClick, danger }: { label: string; onClick: () => void; danger?: boolean }) {
  return (
    <button onClick={onClick} className={cn('w-full text-left px-3 py-1.5 text-xs cursor-pointer transition-colors', danger ? 'text-red-400 hover:bg-red-950/30' : 'text-[#a0a09e] hover:text-[#e8e8e6] hover:bg-[#252625]')}>
      {label}
    </button>
  )
}

function MarkPaidModal({ invoice, onClose, onSuccess }: { invoice: any; onClose: () => void; onSuccess: () => void }) {
  const [paymentId, setPaymentId] = useState('')
  const [note, setNote] = useState('')
  const submit = useMutation({
    mutationFn: () => adminAPI.markInvoicePaid(invoice.id, paymentId || undefined, note || undefined),
    onSuccess: () => { toast.success('Marked as paid'); onSuccess(); onClose() },
    onError: (e: any) => toast.error(e.response?.data?.error || 'Failed'),
  })
  return (
    <Modal
      open={!!invoice}
      onClose={onClose}
      title="Mark as paid"
      description={invoice ? `${invoice.invoiceNumber.slice(-10)} · ${formatCurrency(invoice.total > 0 ? invoice.total : invoice.amount, invoice.currency)}` : ''}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button loading={submit.isPending} onClick={() => submit.mutate()}>Confirm</Button>
        </>
      }
    >
      <div className="space-y-3">
        <Input label="Payment ID (optional)" value={paymentId} onChange={(e) => setPaymentId(e.target.value)} />
        <div>
          <label className="block text-xs text-[#a0a09e] mb-1.5">Note (optional)</label>
          <textarea className="w-full bg-[#1e1f1e] border border-[#333433] rounded-md px-3 py-2 text-sm h-20 focus:border-[#e0fe56] focus:outline-none resize-none" value={note} onChange={(e) => setNote(e.target.value)} />
        </div>
      </div>
    </Modal>
  )
}

function RefundModal({ invoice, onClose, onSuccess }: { invoice: any; onClose: () => void; onSuccess: () => void }) {
  const [reason, setReason] = useState('')
  const submit = useMutation({
    mutationFn: () => adminAPI.refundInvoice(invoice.id, reason),
    onSuccess: () => { toast.success('Refund processed'); onSuccess(); onClose() },
    onError: (e: any) => toast.error(e.response?.data?.error || 'Failed'),
  })
  return (
    <Modal
      open={!!invoice}
      onClose={onClose}
      title="Process refund"
      description={invoice ? `Refund ${formatCurrency(invoice.total > 0 ? invoice.total : invoice.amount, invoice.currency)}` : ''}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button variant="danger" disabled={!reason} loading={submit.isPending} onClick={() => submit.mutate()}>Refund</Button>
        </>
      }
    >
      <div>
        <label className="block text-xs text-[#a0a09e] mb-1.5">Reason</label>
        <textarea className="w-full bg-[#1e1f1e] border border-[#333433] rounded-md px-3 py-2 text-sm h-24 focus:border-[#e0fe56] focus:outline-none resize-none" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Why is this being refunded?" />
      </div>
    </Modal>
  )
}

function TransactionsView() {
  // Use the user-side endpoint via admin filter through invoices/users; quick view using activity feed
  // Fallback view: list transactions of a selected user later. For now show recent invoice payments.
  const { data: invoices = [], isLoading } = useQuery({
    queryKey: ['admin-invoices', 'PAID'],
    queryFn: () => adminAPI.listInvoices({ status: 'PAID' }).then((r) => r.data || []),
  })

  if (isLoading) return <Skeleton className="h-64 rounded-lg" />
  if (invoices.length === 0) return <EmptyTable message="No transactions yet." />

  return (
    <Table>
      <THead>
        <tr>
          <TH>Reference</TH>
          <TH>User</TH>
          <TH>Type</TH>
          <TH className="text-right">Amount</TH>
          <TH>Method</TH>
          <TH>Date</TH>
        </tr>
      </THead>
      <TBody>
        {invoices.map((i: any) => (
          <TR key={i.id}>
            <TD className="font-mono text-xs">{i.invoiceNumber.slice(-10)}</TD>
            <TD className="text-xs">{i.user?.email}</TD>
            <TD><Badge variant="running">credit</Badge></TD>
            <TD className="text-right text-[#e8e8e6]">{formatCurrency(i.total > 0 ? i.total : i.amount, i.currency)}</TD>
            <TD className="text-xs">{i.paymentMethod || '—'}</TD>
            <TD className="text-xs">{i.paidAt ? formatDate(i.paidAt) : formatDate(i.createdAt)}</TD>
          </TR>
        ))}
      </TBody>
    </Table>
  )
}
