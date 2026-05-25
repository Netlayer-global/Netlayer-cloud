/**
 * Lazy-loads the Razorpay checkout.js bundle. Cached so multiple modals
 * (AddCreditModal + DeployCheckoutModal) don't fetch it twice.
 */
let razorpayLoadPromise: Promise<boolean> | null = null

export function loadRazorpay(): Promise<boolean> {
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

export interface RazorpayCheckoutOptions {
  keyId: string
  orderId: string
  amount: number          // in paise (smallest unit)
  currency: string
  name: string
  description: string
  prefill?: { email?: string; contact?: string }
  theme?: { color?: string }
  notes?: Record<string, string>
}

export interface RazorpaySuccessHandler {
  (response: {
    razorpay_payment_id: string
    razorpay_order_id: string
    razorpay_signature: string
  }): void
}

export async function openRazorpayCheckout(
  opts: RazorpayCheckoutOptions,
  onSuccess: RazorpaySuccessHandler,
  onDismiss?: () => void
) {
  const ok = await loadRazorpay()
  if (!ok) throw new Error('Failed to load Razorpay checkout')

  const Razorpay = (window as any).Razorpay
  const rzp = new Razorpay({
    key: opts.keyId,
    order_id: opts.orderId,
    amount: opts.amount,
    currency: opts.currency,
    name: opts.name,
    description: opts.description,
    prefill: opts.prefill,
    theme: opts.theme || { color: '#e0fe56' },
    notes: opts.notes,
    handler: onSuccess,
    modal: { ondismiss: onDismiss },
  })
  rzp.open()
}
