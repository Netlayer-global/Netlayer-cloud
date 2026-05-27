import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Phone, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { phoneOtpAPI, authAPI } from '../api/endpoints'

/**
 * Round 24 — Phone OTP verification page.
 *
 * Two-step flow: enter phone → enter 6-digit code. Mock-mode shows the
 * code in the success toast so dev/test can complete the flow without
 * real SMS credentials.
 */
export default function PhoneVerify() {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [phone, setPhone] = useState('+91')
  const [code, setCode] = useState('')
  const [step, setStep] = useState<'phone' | 'code'>('phone')

  const me = useQuery({
    queryKey: ['me'],
    queryFn: () => authAPI.getMe().then((r: any) => r.data.data),
  })

  const send = useMutation({
    mutationFn: () => phoneOtpAPI.send(phone),
    onSuccess: (r: any) => {
      const dev = r.data.data.devOnlyCode
      if (dev) toast.success(`OTP sent (mock mode): ${dev}`)
      else toast.success('Code sent — check your phone')
      setStep('code')
    },
    onError: (e: any) => toast.error(e.response?.data?.error || 'Failed to send code'),
  })

  const verify = useMutation({
    mutationFn: () => phoneOtpAPI.verify(code),
    onSuccess: () => {
      toast.success('Phone verified')
      qc.invalidateQueries({ queryKey: ['me'] })
      setTimeout(() => navigate('/dashboard/settings'), 800)
    },
    onError: (e: any) => toast.error(e.response?.data?.error || 'Invalid code'),
  })

  if (me.data?.phoneVerified) {
    return (
      <div className="max-w-md mx-auto bg-[#1e1f1e] border border-[#2a2b2a] rounded-lg p-8 text-center">
        <CheckCircle2 size={32} className="mx-auto mb-3 text-[#4ade80]" />
        <h1 className="text-lg font-medium text-[#e8e8e6]">Phone already verified</h1>
        <p className="text-sm text-[#a0a09e] mt-2">Your phone number {me.data.phone} is confirmed.</p>
        <Button onClick={() => navigate('/dashboard/settings')} className="mt-5">Back to settings</Button>
      </div>
    )
  }

  return (
    <div className="max-w-md mx-auto">
      <div className="mb-6">
        <Phone className="mb-3 text-[#e0fe56]" size={28} />
        <h1 className="text-2xl font-medium text-[#e8e8e6]">Verify phone</h1>
        <p className="text-sm text-[#a0a09e] mt-1">
          We send a one-time 6-digit code to confirm your number. Used for security alerts and account recovery.
        </p>
      </div>

      <div className="bg-[#1e1f1e] border border-[#2a2b2a] rounded-lg p-5 space-y-4">
        {step === 'phone' ? (
          <>
            <Input
              label="Phone number (with country code)"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+919876543210"
              type="tel"
            />
            <Button
              className="w-full"
              onClick={() => send.mutate()}
              loading={send.isPending}
              disabled={!/^\+\d{8,15}$/.test(phone)}
            >
              Send verification code
            </Button>
          </>
        ) : (
          <>
            <Input
              label="6-digit code"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="000000"
              className="font-mono text-center text-lg tracking-[0.4em]"
              maxLength={6}
            />
            <div className="flex gap-2">
              <Button
                variant="ghost"
                onClick={() => setStep('phone')}
                disabled={verify.isPending}
              >
                Back
              </Button>
              <Button
                className="flex-1"
                onClick={() => verify.mutate()}
                loading={verify.isPending}
                disabled={code.length !== 6}
              >
                Verify
              </Button>
            </div>
            <button
              type="button"
              className="text-xs text-[#a0a09e] hover:text-[#e8e8e6] cursor-pointer"
              onClick={() => send.mutate()}
              disabled={send.isPending}
            >
              Resend code
            </button>
          </>
        )}
      </div>
    </div>
  )
}
