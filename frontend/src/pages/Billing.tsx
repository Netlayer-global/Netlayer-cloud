import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Download, Wallet, ArrowDown, ArrowUp, Calendar, Tag, Clock, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'
import { billingAPI, promoAPI, creditNotesAPI } from '../api/endpoints'
import { paymentAPI } from '../api/admin'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { Skeleton } from '../components/ui/Skeleton'
import { Input } from '../components/ui/Input'
import { Table, THead, TBody, TR, TH, TD, EmptyTable } from '../components/ui/Table'
import { useAuthStore } from '../store/authStore'
import { AddCreditModal } from '../components/billing/AddCreditModal'
import { cn, formatCurrency, formatDate, relativeTime } from '../lib/utils'

const statusToBadge = (status: string) => {
  if (status === 'PAID') return 'running'
  if (status === 'PENDING') return 'pending'
  if (status === 'REFUNDED') return 'preview'
  if (status === 'FAILED') return 'error'
  return 'default'
}

declare global {
  interface Window {
    Razorpay: any
  }
}

const loadRazorpayScript = () =>
  new Promise<boolean>((resolve) => {
    if (window.Razorpay) return resolve(true)
    const s = document.createElement('script')
    s.src = 'https://checkout.razorpay.com/v1/checkout.js'
    s.onload = () => resolve(true)
    s.onerror = () => resolve(false)
    document.body.appendChild(s)
  })

export default function Billing() {
  const qc = useQueryClient()
  const { user } = useAuthStore()
  const [tab, setTab] = useState<'invoices' | 'transactions' | 'credit-notes'>('invoices')
  const [addCreditOpen, setAddCreditOpen] = useState(false)

  const { data: usage, isLoading: usageLoading } = useQuery({
    queryKey: ['usage'],
    queryFn: () => billingAPI.getUsage().then((r) => r.data.data),
  })
  const { data: invoices = [], isLoading: invoicesLoading } = useQuery({
    queryKey: ['invoices'],
    queryFn: () => billingAPI.getInvoices().then((r) => r.data.data),
  })
  const { data: transactions = [] } = useQuery({
    queryKey: ['transactions'],
    queryFn: () => paymentAPI.getTransactions(),
    enabled: tab === 'transactions',
  })

  const payFromBalance = useMutation({
    mutationFn: (id: string) => billingAPI.payInvoice(id),
    onSuccess: (res: any) => {
      if (res.data?.message === 'Invoice paid from balance') {
        toast.success('Invoice paid from balance')
      }
      qc.invalidateQueries({ queryKey: ['invoices'] })
      qc.invalidateQueries({ queryKey: ['usage'] })
    },
    onError: (e: any) => toast.error(e.response?.data?.error || 'Payment failed'),
  })

  const handlePay = async (invoice: any) => {
    // Try balance first
    try {
      const balanceResult = await billingAPI.payInvoice(invoice.id)
      if ((balanceResult as any).data?.message === 'Invoice paid from balance') {
        toast.success('Paid from balance')
        qc.invalidateQueries({ queryKey: ['invoices'] })
        qc.invalidateQueries({ queryKey: ['usage'] })
        return
      }
    } catch {
      // Fall through to gateway flow
    }

    // Gateway flow
    try {
      const order = await paymentAPI.createOrder(invoice.id)
      if (order.provider === 'razorpay') {
        const ok = await loadRazorpayScript()
        if (!ok) {
          toast.error('Failed to load Razorpay')
          return
        }
        const rzp = new window.Razorpay({
          key: order.key,
          amount: order.amount * 100,
          currency: order.currency,
          name: 'NetLayer Cloud',
          description: `Invoice ${invoice.invoiceNumber || invoice.id.slice(-8)}`,
          order_id: order.orderId,
          prefill: {
            name: `${user?.firstName} ${user?.lastName}`,
            email: user?.email,
          },
          theme: { color: '#e0fe56' },
          handler: async (response: any) => {
            try {
              await paymentAPI.verifyRazorpay({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                invoiceId: invoice.id,
              })
              toast.success('Payment successful')
              qc.invalidateQueries({ queryKey: ['invoices'] })
              qc.invalidateQueries({ queryKey: ['usage'] })
              qc.invalidateQueries({ queryKey: ['transactions'] })
            } catch (e: any) {
              toast.error(e.response?.data?.error || 'Verification failed')
            }
          },
          modal: {
            ondismiss: () => toast.info('Payment cancelled'),
          },
        })
        rzp.open()
      } else {
        // Stripe — minimal: open Stripe-hosted payment link page (would normally use Elements)
        toast.info('Stripe checkout requires Stripe Elements integration in your hosted page.')
        console.info('Stripe order:', order)
      }
    } catch (e: any) {
      toast.error(e.response?.data?.error || 'Failed to start payment')
    }
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-medium text-[#e8e8e6]">Usage & billing</h1>
        <p className="text-sm text-[#a0a09e] mt-1">Manage your account balance and invoices.</p>
      </div>

      {usageLoading ? (
        <Card padding="p-5"><Skeleton className="h-20" /></Card>
      ) : (
        <Card padding="p-5" className="border-l-2 border-l-[#e0fe56]">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 text-xs text-[#6a6a68] uppercase tracking-wide mb-2">
                <Wallet size={12} />
                Account balance
              </div>
              <div className="text-3xl font-medium text-[#e8e8e6]">
                {formatCurrency(usage?.balance || 0, user?.currency || 'INR')}
              </div>
            </div>
            <Button onClick={() => setAddCreditOpen(true)}><Plus size={14} /> Add funds</Button>
          </div>
        </Card>
      )}

      {/* Round 19: cost forecast + promo redeem (side-by-side on desktop) */}
      <div className="grid md:grid-cols-2 gap-4">
        <ForecastCard usage={usage} loading={usageLoading} />
        <PromoCard onRedeemed={() => qc.invalidateQueries({ queryKey: ['usage'] })} />
      </div>

      <Card padding="p-5">
        <h2 className="text-sm font-medium text-[#e8e8e6] mb-4">This month</h2>
        {usageLoading ? (
          <Skeleton className="h-32" />
        ) : usage?.items.length === 0 ? (
          <p className="text-sm text-[#6a6a68]">No usage this month.</p>
        ) : (
          <Table>
            <THead>
              <tr>
                <TH>Server</TH><TH>Plan</TH><TH>Region</TH>
                <TH className="text-right">Days</TH><TH className="text-right">Amount</TH>
              </tr>
            </THead>
            <TBody>
              {usage?.items.map((i) => (
                <TR key={i.serverId}>
                  <TD className="text-[#e8e8e6]">{i.serverName}</TD>
                  <TD>{i.plan}</TD>
                  <TD>{i.region}</TD>
                  <TD className="text-right">{i.days}</TD>
                  <TD className="text-right text-[#e8e8e6]">{formatCurrency(i.amount)}</TD>
                </TR>
              ))}
              <TR>
                <TD colSpan={4} className="text-right font-medium text-[#a0a09e]">Total estimated</TD>
                <TD className="text-right text-[#e0fe56] font-medium">{formatCurrency(usage?.total || 0)}</TD>
              </TR>
            </TBody>
          </Table>
        )}
      </Card>

      <div className="flex items-center bg-[#1e1f1e] border border-[#2a2b2a] rounded-md p-0.5 w-fit">
        {(['invoices', 'transactions', 'credit-notes'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              'h-7 px-3 text-xs rounded cursor-pointer transition-colors capitalize',
              tab === t ? 'bg-[#252625] text-[#e8e8e6]' : 'text-[#a0a09e] hover:text-[#e8e8e6]'
            )}
          >
            {t.replace('-', ' ')}
          </button>
        ))}
      </div>

      {tab === 'invoices' ? (
        invoicesLoading ? (
          <Skeleton className="h-40" />
        ) : invoices.length === 0 ? (
          <EmptyTable message="No invoices yet." />
        ) : (
          <Table>
            <THead>
              <tr>
                <TH>Invoice</TH><TH>Date</TH>
                <TH className="text-right">Amount</TH>
                <TH>Status</TH>
                <TH className="w-40 text-right">Actions</TH>
              </tr>
            </THead>
            <TBody>
              {invoices.map((inv) => (
                <TR key={inv.id}>
                  <TD className="font-mono text-xs text-[#e8e8e6]">
                    #{(inv.invoiceNumber || inv.id).slice(-8).toUpperCase()}
                  </TD>
                  <TD>{formatDate(inv.createdAt)}</TD>
                  <TD className="text-right text-[#e8e8e6]">
                    {formatCurrency(inv.total && inv.total > 0 ? inv.total : inv.amount, inv.currency)}
                  </TD>
                  <TD><Badge variant={statusToBadge(inv.status)}>{inv.status.toLowerCase()}</Badge></TD>
                  <TD className="text-right">
                    <div className="flex justify-end gap-2">
                      {inv.status === 'PENDING' && (
                        <Button size="sm" onClick={() => handlePay(inv)}>Pay now</Button>
                      )}
                      <a
                        href={`/api/billing/invoices/${inv.id}/pdf`}
                        download={`NL-${inv.invoiceNumber || inv.id}.pdf`}
                        target="_blank"
                        rel="noreferrer"
                        className="h-7 w-7 rounded border border-[#333433] text-[#a0a09e] hover:bg-[#252625] hover:text-[#e8e8e6] flex items-center justify-center cursor-pointer transition-colors"
                        title="Download PDF"
                      >
                        <Download size={12} />
                      </a>
                    </div>
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
        )
      ) : tab === 'transactions' ? (
        transactions.length === 0 ? (
          <EmptyTable message="No transactions yet." />
        ) : (
          <Table>
          <THead>
            <tr>
              <TH>Type</TH><TH>Description</TH>
              <TH className="text-right">Amount</TH>
              <TH className="text-right">Balance after</TH>
              <TH>When</TH>
            </tr>
          </THead>
          <TBody>
            {transactions.map((t: any) => (
              <TR key={t.id}>
                <TD>
                  {t.type === 'credit' ? (
                    <span className="text-[#4ade80] flex items-center gap-1"><ArrowDown size={12} /> credit</span>
                  ) : (
                    <span className="text-red-400 flex items-center gap-1"><ArrowUp size={12} /> debit</span>
                  )}
                </TD>
                <TD className="text-xs">{t.description}</TD>
                <TD className="text-right text-[#e8e8e6]">{formatCurrency(t.amount, t.currency)}</TD>
                <TD className="text-right text-xs text-[#a0a09e]">{formatCurrency(t.balanceAfter, t.currency)}</TD>
                <TD className="text-xs">{relativeTime(t.createdAt)}</TD>
              </TR>
            ))}
          </TBody>
        </Table>
        )
      ) : (
        <CreditNotesPanel />
      )}

      <AddCreditModal
        open={addCreditOpen}
        onClose={() => setAddCreditOpen(false)}
        user={user || undefined}
        onSuccess={() => setAddCreditOpen(false)}
      />
    </div>
  )
}

/* ════════════════════════════════════════════════════════════
   Round 19 — Cost forecast + Promo redeem cards
   ════════════════════════════════════════════════════════════ */

function ForecastCard({ usage, loading }: { usage: any; loading: boolean }) {
  if (loading) {
    return <Card padding="p-5"><Skeleton className="h-32" /></Card>
  }
  const forecast = usage?.forecastMonthEnd ?? 0
  const dayOfMonth = usage?.dayOfMonth ?? new Date().getDate()
  const daysInMonth = dayOfMonth + (usage?.daysRemaining ?? 30 - dayOfMonth)
  const runway = usage?.creditRunwayDays
  const lowBalance = !!usage?.lowBalanceWarning
  const dailyAvg = forecast > 0 ? Math.round(forecast / daysInMonth) : 0

  const runwayColor =
    runway == null ? 'text-[#a0a09e]' :
    runway > 30 ? 'text-[#4ade80]' :
    runway >= 15 ? 'text-amber-400' :
    'text-red-400'

  return (
    <Card padding="p-5">
      <div className="flex items-center gap-2 text-xs text-[#6a6a68] uppercase tracking-wide mb-2">
        <Calendar size={12} />
        Cost forecast
      </div>
      <div className="text-2xl font-medium text-[#e8e8e6] tabular-nums">
        {formatCurrency(forecast, usage?.currency || 'INR')}
      </div>
      <div className="text-xs text-[#a0a09e] mt-1">
        Based on {formatCurrency(dailyAvg, usage?.currency || 'INR')}/day current spend
      </div>

      <div className="mt-4">
        <div className="flex items-center justify-between text-[11px] text-[#6a6a68] mb-1.5">
          <span>Day {dayOfMonth} of {daysInMonth}</span>
          <span>{Math.round((dayOfMonth / daysInMonth) * 100)}%</span>
        </div>
        <div className="h-1 rounded-full bg-[#252625] overflow-hidden">
          <div
            className="h-full bg-[#e0fe56] rounded-full transition-[width]"
            style={{ width: `${(dayOfMonth / daysInMonth) * 100}%` }}
          />
        </div>
      </div>

      <div className="mt-4 flex items-center gap-2 text-xs">
        <Clock size={12} className="text-[#6a6a68]" />
        <span className="text-[#a0a09e]">Balance covers</span>
        <span className={cn('font-medium tabular-nums', runwayColor)}>
          {runway != null ? `${runway} days` : '∞'}
        </span>
      </div>

      {lowBalance && (
        <div className="mt-3 flex items-start gap-2 px-3 py-2 rounded-md bg-amber-950/30 border border-amber-900/60 text-xs text-amber-300">
          <AlertTriangle size={12} className="shrink-0 mt-0.5" />
          <span>Balance may run out before month end. Consider topping up.</span>
        </div>
      )}
    </Card>
  )
}

function PromoCard({ onRedeemed }: { onRedeemed: () => void }) {
  const [code, setCode] = useState('')
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const redeem = useMutation({
    mutationFn: () => promoAPI.redeem(code.trim().toUpperCase()),
    onSuccess: (r: any) => {
      const d = r.data.data
      setSuccess(`${d.message}. New balance: ${formatCurrency(d.newBalance)}`)
      setError(null)
      setCode('')
      onRedeemed()
      toast.success(d.message)
    },
    onError: (e: any) => {
      setError(e.response?.data?.error || 'Could not redeem code')
      setSuccess(null)
    },
  })

  return (
    <Card padding="p-5">
      <div className="flex items-center gap-2 text-xs text-[#6a6a68] uppercase tracking-wide mb-2">
        <Tag size={12} />
        Promo code
      </div>

      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="text-sm text-[#e0fe56] hover:underline cursor-pointer"
        >
          Have a promo code? →
        </button>
      ) : (
        <div className="flex gap-2">
          <Input
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="WELCOME500"
            className="font-mono w-48 h-9"
            onKeyDown={(e) => e.key === 'Enter' && code.trim() && redeem.mutate()}
          />
          <Button size="sm" onClick={() => redeem.mutate()} loading={redeem.isPending} disabled={!code.trim()}>
            Apply
          </Button>
        </div>
      )}

      {success && (
        <div className="mt-3 px-3 py-2 rounded-md bg-green-950/30 border border-green-900/60 text-xs text-[#4ade80]">
          {success}
        </div>
      )}
      {error && (
        <div className="mt-3 px-3 py-2 rounded-md bg-red-950/30 border border-red-900/60 text-xs text-red-300">
          {error}
        </div>
      )}

      {!success && !error && (
        <p className="text-xs text-[#6a6a68] mt-3">
          Codes give credit instantly. Try <code className="text-[#e8e8e6] font-mono">WELCOME500</code> if you haven't already.
        </p>
      )}
    </Card>
  )
}


/* ════════════════════════════════════════════════════════════
   Round 20 — Credit notes panel (customer view)
   ════════════════════════════════════════════════════════════ */

function CreditNotesPanel() {
  const { data: cns = [], isLoading } = useQuery({
    queryKey: ['credit-notes'],
    queryFn: () => creditNotesAPI.list().then((r) => r.data.data),
  })

  if (isLoading) return <Skeleton className="h-32" />
  if (cns.length === 0) return <EmptyTable message="No credit notes yet. Refunds and adjustments will appear here." />

  return (
    <Table>
      <THead>
        <tr>
          <TH>CN Number</TH>
          <TH>Against invoice</TH>
          <TH>Reason</TH>
          <TH className="text-right">Amount</TH>
          <TH>Issued</TH>
          <TH className="w-20 text-right">PDF</TH>
        </tr>
      </THead>
      <TBody>
        {cns.map((cn: any) => (
          <TR key={cn.id}>
            <TD className="font-mono text-xs text-[#e8e8e6]">{cn.creditNoteNumber}</TD>
            <TD className="font-mono text-xs">{cn.invoice?.invoiceNumber || '—'}</TD>
            <TD className="text-xs uppercase tracking-wide">{cn.reason}</TD>
            <TD className="text-right tabular-nums text-[#e8e8e6]">
              {formatCurrency(cn.total, cn.currency)}
            </TD>
            <TD className="text-xs">{formatDate(cn.createdAt)}</TD>
            <TD className="text-right">
              <a
                href={creditNotesAPI.pdfUrl(cn.id)}
                download
                target="_blank"
                rel="noreferrer"
                className="h-7 w-7 rounded border border-[#333433] text-[#a0a09e] hover:bg-[#252625] hover:text-[#e8e8e6] inline-flex items-center justify-center cursor-pointer transition-colors"
                title="Download PDF"
              >
                <Download size={12} />
              </a>
            </TD>
          </TR>
        ))}
      </TBody>
    </Table>
  )
}
