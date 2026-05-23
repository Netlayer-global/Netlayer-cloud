import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Download, Wallet, ArrowDown, ArrowUp } from 'lucide-react'
import { toast } from 'sonner'
import { billingAPI } from '../api/endpoints'
import { paymentAPI } from '../api/admin'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { Skeleton } from '../components/ui/Skeleton'
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
  const [tab, setTab] = useState<'invoices' | 'transactions'>('invoices')
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
                      <button
                        className="h-7 w-7 rounded border border-[#333433] text-[#a0a09e] hover:bg-[#252625] hover:text-[#e8e8e6] flex items-center justify-center cursor-pointer transition-colors"
                        title="Download"
                      >
                        <Download size={12} />
                      </button>
                    </div>
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
        )
      ) : transactions.length === 0 ? (
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
