import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ShieldAlert, Send, CheckCircle2 } from 'lucide-react'
import { LandingNav, LandingFooter, PageHero } from '../../components/landing-v3'
import api from '../../api/client'
import { toast } from 'sonner'
import { useSeo } from '../../hooks/useSeo'

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

const fieldStyle: React.CSSProperties = {
  width: '100%', height: 44, padding: '0 14px', fontSize: 14,
  borderRadius: 'var(--r-md)', background: 'var(--nl-1)',
  border: '1px solid var(--b-strong)', color: 'var(--t-hi)', outline: 'none',
}

export default function AbuseReportPage() {
  useSeo({
    title: 'Report Abuse',
    description: 'Report spam, DDoS, phishing, or other malicious activity originating from NetLayer Cloud. We review every report within 24 hours.',
    path: '/abuse-report',
  })

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
    <div className="nl-v3 min-h-screen">
      <LandingNav />

      <PageHero
        eyebrow="Trust & safety"
        title="Report"
        accent="abuse."
        subtitle="Help us shut down bad actors. We review every report within 24 hours."
      />

      <section style={{ background: 'var(--nl-1)', borderTop: '1px solid var(--b-subtle)' }}>
        <div className="nl-container" style={{ padding: 'clamp(48px,7vw,80px) clamp(20px,4vw,72px)' }}>
          <div style={{ maxWidth: 640, margin: '0 auto' }}>
            <div className="flex justify-center" style={{ marginBottom: 24 }}>
              <span className="inline-flex items-center justify-center" style={{ width: 52, height: 52, borderRadius: 'var(--r-lg)', background: 'var(--c-red-d)', color: 'var(--c-red)' }}>
                <ShieldAlert size={24} />
              </span>
            </div>

            {submitted ? (
              <div className="text-center" style={{ borderRadius: 'var(--r-xl)', background: 'var(--c-green-d)', border: '1px solid var(--c-green)', padding: 'clamp(32px,4vw,44px)' }}>
                <CheckCircle2 size={38} className="mx-auto" style={{ color: 'var(--c-green)', marginBottom: 12 }} />
                <h2 className="nl-head" style={{ fontSize: 20, color: 'var(--t-hi)', marginBottom: 8 }}>Report received</h2>
                <p style={{ fontSize: 14, color: 'var(--t-med)', lineHeight: 1.6 }}>
                  Thank you. Our trust &amp; safety team will investigate within 24 hours.
                  If you provided an email, we'll follow up with the action taken.
                </p>
                <button
                  onClick={() => setSubmitted(false)}
                  className="cursor-pointer"
                  style={{ marginTop: 20, fontSize: 13, color: 'var(--brand)' }}
                >
                  Submit another report
                </button>
              </div>
            ) : (
              <form
                onSubmit={handleSubmit(onSubmit)}
                className="flex flex-col gap-5"
                style={{ borderRadius: 'var(--r-xl)', background: 'var(--nl-2)', border: '1px solid var(--b-default)', padding: 'clamp(24px,3vw,36px)' }}
              >
                <Field label="Type of abuse *" error={errors.type?.message}>
                  <select {...register('type')} style={fieldStyle}>
                    {Object.entries(TYPE_LABELS).map(([v, l]) => (
                      <option key={v} value={v}>{l}</option>
                    ))}
                  </select>
                </Field>

                <Field label="Source IP (optional)" error={errors.serverIp?.message}>
                  <input placeholder="e.g. 103.21.148.92" style={fieldStyle} {...register('serverIp')} />
                </Field>

                <Field label="Your email (optional)" error={errors.reporterEmail?.message}>
                  <input type="email" placeholder="you@example.com — for follow-up only" style={fieldStyle} {...register('reporterEmail')} />
                </Field>

                <Field label="Details *" error={errors.description?.message}>
                  <textarea
                    style={{ ...fieldStyle, height: 128, padding: '12px 14px', resize: 'none' }}
                    placeholder="What did you observe? Logs, headers, screenshot URLs, dates and times in UTC."
                    {...register('description')}
                  />
                </Field>

                <div style={{ borderRadius: 'var(--r-md)', background: 'var(--c-amber-d)', border: '1px solid color-mix(in srgb, var(--c-amber) 28%, transparent)', padding: 12, fontSize: 12.5, color: 'var(--c-amber)' }}>
                  False reports clog our queue and slow down our response to real abuse. Please be specific
                  and only report behaviour you have direct evidence of.
                </div>

                <button type="submit" disabled={submitting} className="nl-btn-primary justify-center" style={{ height: 48, ...(submitting ? { opacity: 0.6 } : {}) }}>
                  <Send size={15} /> {submitting ? 'Submitting…' : 'Submit report'}
                </button>
              </form>
            )}

            <div className="text-center" style={{ marginTop: 28, fontSize: 12.5, color: 'var(--t-low)', lineHeight: 1.9 }}>
              <p>For DMCA / copyright takedowns: <span style={{ color: 'var(--t-med)' }}>dmca@netlayer.com</span></p>
              <p>For law-enforcement requests: <span style={{ color: 'var(--t-med)' }}>le-requests@netlayer.com</span></p>
            </div>
          </div>
        </div>
      </section>

      <LandingFooter />
    </div>
  )
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block nl-mono" style={{ fontSize: 11, letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--t-low)', marginBottom: 8 }}>{label}</label>
      {children}
      {error && <p style={{ fontSize: 12, color: 'var(--c-red)', marginTop: 6 }}>{error}</p>}
    </div>
  )
}
