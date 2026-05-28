import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ShieldAlert, Send, CheckCircle2 } from 'lucide-react'
import { TopNav } from '../../components/landing/TopNav'
import { Footer } from '../../components/landing/Footer'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'
import { Button } from '../../components/ui/Button'
import api from '../../api/client'
import { toast } from 'sonner'

const schema = z.object({
  type: z.enum(['spam', 'ddos', 'phishing', 'bruteforce', 'other']),
  serverIp: z
    .string()
    .regex(
      /^(25[0-5]|2[0-4]\d|[01]?\d?\d)(\.(25[0-5]|2[0-4]\d|[01]?\d?\d)){3}$/,
      'Must be a valid IPv4 address'
    )
    .optional()
    .or(z.literal('')),
  reporterEmail: z.string().email('Valid email required').optional().or(z.literal('')),
  description: z.string().min(20, 'Please give us at least 20 characters of detail').max(5000),
})

type FormData = z.infer<typeof schema>

const TYPE_LABELS: Record<FormData['type'], string> = {
  spam: 'Spam (email / SMS / forum)',
  ddos: 'DDoS attack',
  phishing: 'Phishing site',
  bruteforce: 'Brute-force / credential stuffing',
  other: 'Other malicious activity',
}

export default function AbuseReportPage() {
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { type: 'spam' },
  })

  const onSubmit = async (data: FormData) => {
    setSubmitting(true)
    try {
      await api.post('/abuse', data)
      setSubmitted(true)
      reset()
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to submit report')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white antialiased">
      <TopNav />
      <main className="pt-24 pb-16">
        <div className="max-w-2xl mx-auto px-4 sm:px-6">
          <header className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-red-500/10 text-red-400 mb-4">
              <ShieldAlert size={22} />
            </div>
            <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight">
              Report abuse
            </h1>
            <p className="mt-3 text-gray-400">
              Help us shut down bad actors. We review every report within 24 hours.
            </p>
          </header>

          {submitted ? (
            <div className="rounded-xl bg-green-500/10 border border-green-500/30 p-8 text-center">
              <CheckCircle2 size={36} className="mx-auto text-green-400 mb-3" />
              <h2 className="text-xl font-semibold text-white">Report received</h2>
              <p className="mt-2 text-sm text-gray-300">
                Thank you. Our trust &amp; safety team will investigate within 24 hours.
                If you provided an email, we'll follow up with the action taken.
              </p>
              <button
                onClick={() => setSubmitted(false)}
                className="mt-5 inline-flex items-center gap-1.5 text-xs text-[#00d4ff] hover:text-white cursor-pointer"
              >
                Submit another report
              </button>
            </div>
          ) : (
            <form
              onSubmit={handleSubmit(onSubmit)}
              className="bg-[#111] border border-white/[0.06] rounded-xl p-6 sm:p-8 space-y-5"
            >
              <Select
                label="Type of abuse *"
                error={errors.type?.message}
                {...register('type')}
              >
                {Object.entries(TYPE_LABELS).map(([v, l]) => (
                  <option key={v} value={v}>{l}</option>
                ))}
              </Select>

              <Input
                label="Source IP (optional)"
                placeholder="e.g. 103.21.148.92"
                error={errors.serverIp?.message}
                {...register('serverIp')}
              />

              <Input
                label="Your email (optional)"
                type="email"
                placeholder="you@example.com — for follow-up only"
                error={errors.reporterEmail?.message}
                {...register('reporterEmail')}
              />

              <div>
                <label className="block text-xs text-gray-400 mb-1.5">Details *</label>
                <textarea
                  className="w-full bg-[#1e1f1e] border border-[#333] text-white placeholder-gray-600 rounded-md px-3 py-2 text-sm h-32 focus:border-[#0070f3] focus:outline-none transition-colors resize-none"
                  placeholder="What did you observe? Logs, headers, screenshots URLs, dates and times in UTC."
                  {...register('description')}
                />
                {errors.description?.message && (
                  <p className="text-xs text-red-400 mt-1">{errors.description.message}</p>
                )}
              </div>

              <div className="bg-amber-500/[0.05] border border-amber-500/20 rounded-md p-3 text-xs text-amber-300">
                False reports clog our queue and slow down our response to real abuse. Please be specific
                and only report behaviour you have direct evidence of.
              </div>

              <Button type="submit" loading={submitting} size="lg" className="w-full">
                <Send size={14} /> Submit report
              </Button>
            </form>
          )}

          <div className="mt-8 text-xs text-gray-500 text-center space-y-1">
            <p>For DMCA / copyright takedowns: <span className="text-gray-300">dmca@netlayer.com</span></p>
            <p>For law-enforcement requests: <span className="text-gray-300">le-requests@netlayer.com</span> (PGP key in /docs/legal)</p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
