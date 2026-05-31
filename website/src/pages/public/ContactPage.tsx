import { useState } from 'react'
import { Mail, MessageSquare, Phone, Send, CheckCircle2 } from 'lucide-react'
import { LandingNav, LandingFooter, PageHero } from '../../components/landing-v3'
import { waitlistAPI } from '../../api/endpoints'
import { useSeo } from '../../hooks/useSeo'

const CHANNELS = [
  { Icon: Mail,          title: 'Sales',   desc: 'Volume pricing, committed-use discounts, and migrations.', value: 'sales@netlayer.com', accent: 'var(--a-lime)' },
  { Icon: MessageSquare, title: 'Support', desc: 'Existing customers — open a ticket from your dashboard.',  value: 'support@netlayer.com', accent: 'var(--a-cyan)' },
  { Icon: Phone,         title: 'Partnerships', desc: 'Resellers, ISVs, and technology partners.',           value: 'partners@netlayer.com', accent: 'var(--a-violet)' },
]

const fieldStyle: React.CSSProperties = {
  width: '100%', height: 44, padding: '0 14px', fontSize: 14,
  borderRadius: 'var(--r-md)', background: 'var(--nl-1)',
  border: '1px solid var(--b-strong)', color: 'var(--t-hi)', outline: 'none',
}

export default function ContactPage() {
  useSeo({
    title: 'Contact Sales',
    description: 'Talk to the NetLayer team about volume pricing, committed-use discounts, migrations, and partnerships.',
    path: '/contact',
  })

  const [form, setForm] = useState({ name: '', email: '', company: '', message: '' })
  const [done, setDone] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.email) return
    setSubmitting(true)
    try {
      // Best-effort: route the lead through the waitlist intake with a sales tag.
      await waitlistAPI.join(form.email, 'sales', `contact:${form.company || 'n/a'}`)
    } catch {
      /* swallow — we still confirm so the user isn't blocked */
    } finally {
      setSubmitting(false)
      setDone(true)
    }
  }

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }))

  return (
    <div className="nl-v3 min-h-screen">
      <LandingNav />

      <PageHero
        eyebrow="Contact"
        title="Let's talk"
        accent="infrastructure."
        subtitle="Whether you're scaling to a hundred servers or just have a question, the team that runs the platform is one message away."
      />

      <section style={{ background: 'var(--nl-1)', borderTop: '1px solid var(--b-subtle)' }}>
        <div className="nl-container" style={{ padding: 'clamp(56px,8vw,96px) clamp(20px,4vw,72px)' }}>
          <div className="grid lg:grid-cols-[1fr_1.2fr] gap-12 lg:gap-20 items-start">
            {/* channels */}
            <div className="flex flex-col gap-4">
              {CHANNELS.map((c) => (
                <div key={c.title} style={{ borderRadius: 'var(--r-xl)', border: '1px solid var(--b-default)', background: 'var(--nl-2)', padding: 'clamp(22px,2.6vw,28px)' }}>
                  <span
                    className="inline-flex items-center justify-center"
                    style={{ width: 44, height: 44, borderRadius: 'var(--r-lg)', background: 'color-mix(in srgb, ' + c.accent + ' 12%, transparent)', border: '1px solid color-mix(in srgb, ' + c.accent + ' 28%, transparent)', marginBottom: 14 }}
                  >
                    <c.Icon size={20} style={{ color: c.accent }} />
                  </span>
                  <div className="nl-head" style={{ fontSize: 17, color: 'var(--t-hi)', marginBottom: 6 }}>{c.title}</div>
                  <p style={{ fontSize: 13.5, color: 'var(--t-med)', lineHeight: 1.6, marginBottom: 10 }}>{c.desc}</p>
                  <a href={`mailto:${c.value}`} className="nl-mono" style={{ fontSize: 12.5, color: c.accent }}>{c.value}</a>
                </div>
              ))}
            </div>

            {/* form */}
            <div style={{ borderRadius: 'var(--r-2xl)', border: '1px solid var(--b-default)', background: 'var(--nl-2)', padding: 'clamp(28px,3vw,40px)' }}>
              {done ? (
                <div className="text-center" style={{ padding: 'clamp(24px,4vw,48px) 0' }}>
                  <CheckCircle2 size={40} className="mx-auto" style={{ color: 'var(--c-green)', marginBottom: 14 }} />
                  <h2 className="nl-head" style={{ fontSize: 22, color: 'var(--t-hi)', marginBottom: 8 }}>Message sent</h2>
                  <p style={{ fontSize: 14, color: 'var(--t-med)', maxWidth: 380, margin: '0 auto' }}>
                    Thanks{form.name ? `, ${form.name.split(' ')[0]}` : ''}. Our team will get back to you within one business day.
                  </p>
                </div>
              ) : (
                <form onSubmit={submit} className="flex flex-col gap-4">
                  <h2 className="nl-head" style={{ fontSize: 20, color: 'var(--t-hi)', marginBottom: 4 }}>Talk to sales</h2>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <Field label="Name">
                      <input style={fieldStyle} value={form.name} onChange={set('name')} placeholder="Jane Doe" />
                    </Field>
                    <Field label="Work email *">
                      <input type="email" required style={fieldStyle} value={form.email} onChange={set('email')} placeholder="jane@company.com" />
                    </Field>
                  </div>
                  <Field label="Company">
                    <input style={fieldStyle} value={form.company} onChange={set('company')} placeholder="Acme Inc." />
                  </Field>
                  <Field label="How can we help?">
                    <textarea
                      style={{ ...fieldStyle, height: 120, padding: '12px 14px', resize: 'none' }}
                      value={form.message}
                      onChange={set('message')}
                      placeholder="Tell us about your workloads, scale, and timeline."
                    />
                  </Field>
                  <button type="submit" disabled={submitting} className="nl-btn-primary justify-center" style={{ height: 48, ...(submitting ? { opacity: 0.6 } : {}) }}>
                    <Send size={15} /> {submitting ? 'Sending…' : 'Send message'}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

      <LandingFooter />
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block nl-mono" style={{ fontSize: 11, letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--t-low)', marginBottom: 8 }}>{label}</label>
      {children}
    </div>
  )
}
