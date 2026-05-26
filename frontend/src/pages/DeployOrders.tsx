import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { CreditCard, X, Receipt } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '../components/ui/Button'
import { deployOrdersAPI } from '../api/endpoints'
import { openRazorpayCheckout } from '../lib/razorpay'
import { useAuthStore } from '../store/authStore'
import { cn, formatCurrency } from '../lib/utils'

/**
 * Round 23 — customer-facing list of pay-per-deploy orders.
 *
 * Lets a user:
 *   - see every checkout they started (paid, pending, expired, cancelled)
 *   - resume a pending order (re-opens Razorpay)
 *   - cancel a pending order (releases the bare-metal stock slot)
 *   - jump to the deployed server when an order has succeeded
 */
export default function DeployOrders() {
  const qc = useQueryClient()
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const [resumingId, setResumingId] = useState<string | null>(null)

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['deploy-orders'],
    queryFn: () => deployOrdersAPI.list().then((r: any) => r.data.data),
    refetchInterval: 30_000,
  })

  const cancel = useMutation({
    mutationFn: (id: string) => deployOrdersAPI.cancel(id),
    onSuccess: () => {
      toast.success('Order cancelled. Stock released.')
      qc.invalidateQueries({ queryKey: ['deploy-orders'] })
    },
    onError: (e: any) => toast.error(e.response?.data?.error || 'Cancel failed'),
  })

  const resume = async (order: any) => {
    if (resumingId) return
    if (order.provider !== 'razorpay') {
      toast.error('Resume from Stripe is not yet supported in the dashboard. Use email checkout link.')
      return
    }
    setResumingId(order.id)
    try {
      await openRazorpayCheckout(
        {
          keyId: import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_mockmode',
          orderId: order.providerOrderId,
          amount: order.total * 100,
          currency: order.currency,
          name: 'NetLayer Cloud',
          description: `Order ${order.id}`,
          prefill: { email: user?.email, contact: user?.phone || '' },
        },
        async (resp) => {
          try {
            const v = await deployOrdersAPI.verifyPayment(order.id, {
              razorpay_payment_id: resp.razorpay_payment_id,
              razorpay_order_id: resp.razorpay_order_id,
              razorpay_signature: resp.razorpay_signature,
            })
            toast.success('Payment captured — server deploying')
            qc.invalidateQueries({ queryKey: ['deploy-orders'] })
            navigate(`/dashboard/servers/${v.data.data.serverId}`)
          } catch (e: any) {
            toast.error(e.response?.data?.error || 'Verification failed')
          } finally {
            setResumingId(null)
          }
        },
        () => setResumingId(null),
      )
    } catch (e: any) {
      toast.error(e.message || 'Failed to open checkout')
      setResumingId(null)
    }
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-medium text-[#e8e8e6]">Deploy orders</h1>
        <p className="text-sm text-[#a0a09e] mt-1">
          Every checkout you started, including resumable pending orders. Pending orders auto-cancel after 24 hours.
        </p>
      </div>

      {isLoading ? (
        <div className="text-sm text-[#a0a09e]">Loading…</div>
      ) : orders.length === 0 ? (
        <div className="bg-[#1e1f1e] border border-[#2a2b2a] rounded-lg p-10 text-center">
          <Receipt size={20} className="mx-auto mb-3 text-[#6a6a68]" />
          <p className="text-sm text-[#a0a09e]">
            No orders yet. Pick a plan and pay to deploy your first server.
          </p>
          <Button
            className="mt-4 cursor-pointer"
            onClick={() => navigate('/dashboard/deploy')}
          >
            Deploy a server
          </Button>
        </div>
      ) : (
        <div className="bg-[#1e1f1e] border border-[#2a2b2a] rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#161716] text-left">
                {['Order', 'Hostname', 'Total', 'Provider', 'Status', 'Created', ''].map((h) => (
                  <th key={h} className="px-4 py-2.5 text-[11px] uppercase tracking-wide text-[#6a6a68] font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {orders.map((o: any) => (
                <tr key={o.id} className="border-t border-[#2a2b2a]">
                  <td className="px-4 py-3">
                    <div className="font-mono text-[11px] text-[#a0a09e]">{o.id.slice(0, 12)}…</div>
                  </td>
                  <td className="px-4 py-3 text-[#e8e8e6] font-mono text-xs">{o.hostname}</td>
                  <td className="px-4 py-3 tabular-nums text-[#e8e8e6]">
                    {formatCurrency(o.total)} <span className="text-[10px] text-[#6a6a68]">{o.currency}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-[11px] uppercase text-[#a0a09e]">{o.provider}</span>
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={o.status} />
                  </td>
                  <td className="px-4 py-3 text-xs text-[#6a6a68]">
                    {new Date(o.createdAt).toLocaleString()}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1.5">
                      {o.status === 'pending' && (
                        <>
                          <Button
                            size="sm"
                            onClick={() => resume(o)}
                            loading={resumingId === o.id}
                          >
                            <CreditCard size={11} className="mr-1" /> Resume
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => { if (confirm('Cancel this order? This releases the reserved stock.')) cancel.mutate(o.id) }}
                            disabled={cancel.isPending}
                          >
                            <X size={11} />
                          </Button>
                        </>
                      )}
                      {o.status === 'paid' && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => navigate(`/dashboard/servers/${o.serverId}`)}
                        >
                          View server
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    pending:   'text-amber-400 bg-amber-950/40 border-amber-900/60',
    paid:      'text-[#4ade80] bg-green-950/40 border-green-900/60',
    failed:    'text-red-400 bg-red-950/40 border-red-900/60',
    expired:   'text-[#6a6a68] bg-[#252625] border-[#2a2b2a]',
    cancelled: 'text-[#6a6a68] bg-[#252625] border-[#2a2b2a]',
  }
  return (
    <span className={cn('inline-flex h-5 px-1.5 items-center rounded border text-[10.5px] font-medium uppercase', map[status] || map.pending)}>
      {status}
    </span>
  )
}
