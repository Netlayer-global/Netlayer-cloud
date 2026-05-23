import { useState, useEffect } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { CreditCard, Wallet, Check } from 'lucide-react'

import { paymentAPI } from '../../api/admin'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { cn, formatCurrency } from '../../lib/utils'

const PRESETS = [500, 1000, 2500, 5000, 10000, 25000]

/**
 * Loads Razorpay's checkout.js once and caches the promise.
 * The `Razorpay` global is already declared in pages/Billing.tsx, so we
 * just reference window.Razorpay via a local cast here.
 */
let razorpayLoadPromise: Promise<boolean> | null = null
function loadRazorpay(): Promise<boolean> {
  if (typeof window === 'undefined') return Promise.resolve(false)
  if ((window as any).Razorpay) return Promise.resolve(true)
  if (razorpayLoadPromise) return razorpayLoadPromise

  razorpayLoadPromise = new Promise<boolean>((resolve) => {
    const s = document.createElement('script')
    s.src = 'https://checkout.razorpay.com/v1/checkout.js'
    s.async = true
    s.onload = () => resolve(true)
    s.onerror = () => resolve(false)
    document.head.appendChild(s)
  })
  return razorpayLoadPromise
}

interface Props {
  open: boolean
  onClose: () => void
  /** When INSUFFICIENT_BALANCE triggered this, show how much extra is needed. */
  shortfall?: number
  /** Pre-fill the amount input. */
  initialAmount?: number
  /** Called once the customer's balance has actually been credited. */
  onSuccess?: () => void
  /** Customer details for prefill in checkout. */
  user?: { firstName?: string; lastName?: string; email?: string; phone?: string | null }
}

export function AddCreditModal({ open, onClose, shortfall, initialAmount, onSuccess, user }: Props) {
  const qc = useQueryClient()
  const [amount, setAmount] = useState<number>(
    initialAmount ?? (shortfall ? Math.max(500, Math.ceil(shortfall / 100) * 100) : 1000)
  )
  const [done, setDone] = useState(false)

  useEffect(() => {
    if (initialAmount !== undefined) setAmount(initialAmount)
    else if (shortfall !== undefined && shortfall > 0) {
      setAmount(Math.max(500, Math.ceil(shortfall / 100) * 100))
    }
  }, [initialAmount, shortfall])

  const mutation = useMutation({
    mutationFn: async (amt: number) => {
      const order = await paymentAPI.topup(amt)

      if (order.provider === 'razorpay') {
        const ok = await loadRazorpay()
        if (!ok) throw new Error('Could not load Razorpay checkout')
        return new Promise<void>((resolve, reject) => {
          const rzp = new (window as any).Razorpay({
            key: order.key,
            amount: Math.round(order.amount * 100),
            currency: order.currency,
            order_id: order.orderId,
            name: 'NetLayer Cloud',
            description: 'Wallet top-up',
            prefill: {
              name: `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || undefined,
              email: user?.email,
              contact: user?.phone || undefined,
            },
            theme: { color: '#0070f3' },
            handler: async (response: any) => {
              try {
                // Server-side signature verification
                await import('../../api/client').then((m) =>
                  m.default.post('/billing/verify-razorpay', {
                    razorpay_order_id:   response.razorpay_order_id,
                    razorpay_payment_id: response.razorpay_payment_id,
                    razorpay_signature:  response.razorpay_signature,
                    invoiceId: order.invoiceId,
                  })
                )
                resolve()
              } catch (e: any) {
                reject(new Error(e.response?.data?.error || 'Verification failed'))
              }
            },
            modal: {
              ondismiss: () => reject(new Error('Payment cancelled')),
              escape: true,
            },
          })
          rzp.open()
        })
      }

      // Stripe — frontend would mount Stripe.js here. Out of scope of this
      // round; surface a clear error.
      throw new Error('Stripe top-up coming soon. For now please pay in INR.')
    },
    onSuccess: () => {
      toast.success('Wallet topped up')
      setDone(true)
      qc.invalidateQueries({ queryKey: ['me'] })
      qc.invalidateQueries({ queryKey: ['transactions'] })
      qc.invalidateQueries({ queryKey: ['invoices'] })
      onSuccess?.()
    },
    onError: (e: any) => {
      toast.error(e?.message || 'Top-up failed')
    },
  })

  return (
    <Modal
      open={open}
      onClose={() => { onClose(); setDone(false) }}
      title="Add credit to wallet"
      description={
        shortfall && shortfall > 0
          ? `You're short by ${formatCurrency(shortfall)} for this deploy. Add credit and try again.`
          : 'Pay only what you use. Funds remain in your wallet until consumed.'
      }
      size="md"
      footer={
        done ? (
          <Button onClick={() => { onClose(); setDone(false) }}>Done</Button>
        ) : (
          <>
            <Button variant="secondary" onClick={onClose}>Cancel</Button>
            <Button
              loading={mutation.isPending}
              disabled={!amount || amount < 100}
              onClick={() => mutation.mutate(amount)}
            >
              <CreditCard size={14} /> Pay {formatCurrency(amount)}
            </Button>
          </>
        )
      }
    >
      {done ? (
        <div className="text-center py-6">
          <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto mb-4">
            <Check size={20} className="text-emerald-400" />
          </div>
          <h3 className="text-base font-medium text-[#e8e8e6]">Wallet topped up</h3>
          <p className="text-sm text-[#a0a09e] mt-1">Your balance has been updated.</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-2">
            {PRESETS.map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setAmount(v)}
                className={cn(
                  'h-10 rounded-md text-sm font-medium transition-colors cursor-pointer',
                  amount === v
                    ? 'bg-[#e0fe56] text-[#0d0e0d]'
                    : 'bg-[#1e1f1e] border border-[#2a2b2a] text-[#a0a09e] hover:text-white hover:border-[#333433]'
                )}
              >
                ₹{v.toLocaleString('en-IN')}
              </button>
            ))}
          </div>
          <Input
            label="Or enter a custom amount"
            type="number"
            min={100}
            max={1_000_000}
            step={100}
            value={amount}
            onChange={(e) => setAmount(parseInt(e.target.value || '0', 10))}
          />
          <div className="text-xs text-[#a0a09e] flex items-start gap-2 p-3 rounded-md bg-[#1e1f1e] border border-[#2a2b2a]">
            <Wallet size={14} className="text-[#e0fe56] shrink-0 mt-0.5" />
            <div>
              Funds are credited to your wallet immediately on payment. We charge per-hour as your servers run; you can withdraw any unused balance after closing the account.
            </div>
          </div>
        </div>
      )}
    </Modal>
  )
}
