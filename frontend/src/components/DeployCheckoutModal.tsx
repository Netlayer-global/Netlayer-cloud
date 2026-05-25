import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CreditCard, Loader2, Lock, ShieldCheck, X } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from './ui/Button'
import { deployOrdersAPI, type DeployOrderResult } from '../api/endpoints'
import { openRazorpayCheckout } from '../lib/razorpay'
import { useAuthStore } from '../store/authStore'

/**
 * Round 22 — pay-per-deploy checkout.
 *
 * Replaces the old "add credit then deploy" two-step flow. Pure direct
 * checkout: customer clicks "Pay & Deploy", Razorpay/Stripe modal opens,
 * payment captures, server deploys.
 *
 * States:
 *   creating → POST /api/deploy-orders, get checkout payload
 *   paying   → Razorpay modal open
 *   verifying → POST /api/deploy-orders/:id/verify-payment
 *   deploying → server moves to PENDING (parent will mount DeployProgress)
 *   error
 */

interface CheckoutSummary {
  planName: string
  region: { city: string; flag: string }
  osName: string
  hostname: string
  amount: number          // subtotal
  tax: number
  total: number
  currency: string
}

interface Props {
  open: boolean
  onClose: () => void
  /** All four config IDs the user just chose in the wizard. */
  config: {
    planId: string
    regionId: string
    osTemplateId: string
    sshKeyId?: string
    hostname?: string
    rootPassword?: string
    // Round 23
    billingCycle?: 'hourly' | 'monthly' | 'yearly'
    raidConfig?: 'raid0' | 'raid1' | 'raid10' | 'raid5' | 'raid6' | 'passthrough'
    customIsoId?: string
  } | null
  /** Pre-computed line summary for display while order is being created. */
  summary: CheckoutSummary | null
  /** Called once payment captures and the server has been pushed to PENDING. */
  onPaid: (serverId: string, orderId: string) => void
}

type Phase = 'idle' | 'creating' | 'paying' | 'verifying' | 'success' | 'error'

export function DeployCheckoutModal({ open, onClose, config, summary, onPaid }: Props) {
  const user = useAuthStore((s) => s.user)
  const [phase, setPhase] = useState<Phase>('idle')
  const [order, setOrder] = useState<DeployOrderResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Reset on each open
  useEffect(() => {
    if (open) {
      setPhase('idle')
      setOrder(null)
      setError(null)
    }
  }, [open])

  if (!open) return null

  const startCheckout = async () => {
    if (!config) return
    try {
      setPhase('creating')
      setError(null)
      const r = await deployOrdersAPI.create(config)
      const o = r.data.data
      setOrder(o)
      setPhase('paying')

      if (o.provider === 'razorpay') {
        await openRazorpayCheckout(
          {
            keyId: o.checkout.keyId,
            orderId: o.checkout.orderId,
            amount: o.checkout.amount,
            currency: o.checkout.currency,
            name: o.checkout.name,
            description: o.checkout.description,
            prefill: o.checkout.prefill,
          },
          async (response) => {
            // Payment captured — now verify on the server.
            try {
              setPhase('verifying')
              const v = await deployOrdersAPI.verifyPayment(o.orderId, {
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_signature: response.razorpay_signature,
              })
              setPhase('success')
              setTimeout(() => {
                onPaid(v.data.data.serverId, o.orderId)
              }, 1200)
            } catch (e: any) {
              setError(e.response?.data?.error || 'Payment verification failed')
              setPhase('error')
            }
          },
          () => {
            // User dismissed Razorpay — keep order in DB (resumable),
            // close modal so they can retry from the wizard.
            setPhase('idle')
            toast.info('Checkout closed. Order saved — click Deploy to resume.')
            onClose()
          }
        )
      } else {
        // Stripe path — would launch Stripe Elements here. For now show
        // unsupported message; will wire in a follow-up.
        setError('Stripe checkout not wired in this environment yet. Use INR / Razorpay.')
        setPhase('error')
      }
    } catch (e: any) {
      setError(e.response?.data?.error || 'Could not start checkout')
      setPhase('error')
    }
  }

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[70] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className="w-full max-w-md bg-[#1e1f1e] border border-[#2a2b2a] rounded-xl shadow-2xl overflow-hidden"
          initial={{ y: 12, scale: 0.97, opacity: 0 }}
          animate={{ y: 0, scale: 1, opacity: 1 }}
          exit={{ y: 12, scale: 0.97, opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <div className="border-b border-[#2a2b2a] px-5 h-12 flex items-center justify-between">
            <div className="flex items-center gap-2 text-[#e8e8e6] text-sm font-medium">
              <Lock size={14} className="text-[#e0fe56]" />
              Secure checkout
            </div>
            {phase !== 'paying' && phase !== 'verifying' && phase !== 'success' && (
              <button onClick={onClose} className="text-[#6a6a68] hover:text-[#e8e8e6] cursor-pointer">
                <X size={16} />
              </button>
            )}
          </div>

          <div className="p-5">
            {summary && phase !== 'success' && (
              <div className="rounded-lg bg-[#161716] border border-[#2a2b2a] p-4 mb-4 space-y-2">
                <Row label="Plan" value={summary.planName} />
                <Row label="Region" value={`${summary.region.flag} ${summary.region.city}`} />
                <Row label="OS" value={summary.osName} />
                <Row label="Hostname" value={summary.hostname} mono />
                <div className="border-t border-[#2a2b2a] my-2" />
                <Row label="Subtotal" value={fmt(summary.amount, summary.currency)} />
                {summary.tax > 0 && <Row label="Tax (GST 18%)" value={fmt(summary.tax, summary.currency)} />}
                <div className="flex items-center justify-between pt-2 border-t border-[#2a2b2a]">
                  <span className="text-sm text-[#e8e8e6] font-medium">Total due now</span>
                  <span className="text-xl text-[#e0fe56] font-semibold tabular-nums">
                    {fmt(summary.total, summary.currency)}
                  </span>
                </div>
                <p className="text-[11px] text-[#6a6a68] pt-1">
                  First month upfront. Server runs for 30 days. Renew before expiry to keep it.
                </p>
              </div>
            )}

            {phase === 'idle' && (
              <Button
                size="lg"
                className="w-full"
                onClick={startCheckout}
                disabled={!config || !summary}
              >
                <CreditCard size={14} className="mr-2" />
                Pay {summary ? fmt(summary.total, summary.currency) : ''} & Deploy
              </Button>
            )}

            {phase === 'creating' && (
              <Status icon={<Loader2 className="animate-spin" />} label="Creating order…" />
            )}
            {phase === 'paying' && (
              <Status icon={<CreditCard />} label="Complete payment in the popup window" muted />
            )}
            {phase === 'verifying' && (
              <Status icon={<Loader2 className="animate-spin" />} label="Verifying payment…" />
            )}
            {phase === 'success' && (
              <div className="text-center py-6">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 12 }}
                  className="w-14 h-14 rounded-full bg-[#e0fe56] mx-auto mb-3 flex items-center justify-center text-[#0d0e0d]"
                >
                  <ShieldCheck size={28} strokeWidth={2.5} />
                </motion.div>
                <h3 className="text-base font-semibold text-[#e8e8e6]">Payment confirmed</h3>
                <p className="text-sm text-[#a0a09e] mt-1">Starting deployment…</p>
              </div>
            )}
            {phase === 'error' && (
              <div className="space-y-3">
                <div className="px-3 py-2 rounded-md bg-red-950/30 border border-red-900/60 text-xs text-red-300">
                  {error}
                </div>
                <Button size="lg" className="w-full" onClick={startCheckout}>
                  Try again
                </Button>
              </div>
            )}

            <div className="mt-4 flex items-center justify-center gap-1.5 text-[11px] text-[#6a6a68]">
              <Lock size={11} />
              <span>Powered by Razorpay · {user?.country === 'IN' ? 'UPI / Card / NetBanking' : 'Card payment'}</span>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between text-xs">
      <span className="text-[#a0a09e]">{label}</span>
      <span className={`text-[#e8e8e6] ${mono ? 'font-mono' : ''}`}>{value}</span>
    </div>
  )
}

function Status({ icon, label, muted }: { icon: React.ReactNode; label: string; muted?: boolean }) {
  return (
    <div className={`flex items-center gap-3 justify-center py-6 ${muted ? 'text-[#a0a09e]' : 'text-[#e8e8e6]'}`}>
      <span className="text-[#e0fe56]" style={{ width: 20, height: 20 }}>{icon}</span>
      <span className="text-sm">{label}</span>
    </div>
  )
}

function fmt(n: number, currency: string) {
  const sym: Record<string, string> = { INR: '₹', USD: '$', EUR: '€', GBP: '£' }
  return `${sym[currency] || currency + ' '}${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}
