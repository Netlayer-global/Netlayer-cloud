import { TopNav } from '../../components/landing/TopNav'
import { Footer } from '../../components/landing/Footer'

const SECTIONS = [
  {
    h: 'Information we collect',
    body: (
      <>
        <p>We collect the minimum information needed to provide and operate the NetLayer Cloud platform:</p>
        <ul className="list-disc ml-6 space-y-1 mt-3">
          <li><strong>Account information:</strong> name, email, password (hashed with bcrypt), and optional phone number.</li>
          <li><strong>Billing information:</strong> tax-residency country, GSTIN/VAT number where applicable, and payment-method metadata. Card numbers and CVVs are never stored on our servers — they live with our payment processor (Razorpay or Stripe).</li>
          <li><strong>Usage data:</strong> server activity, API calls, IP addresses for audit logs, and operational metrics required to bill you and to debug platform issues.</li>
          <li><strong>Support communications:</strong> tickets you open and emails you send to support.</li>
        </ul>
      </>
    ),
  },
  {
    h: 'How we use your information',
    body: (
      <>
        <p>We use your information to:</p>
        <ul className="list-disc ml-6 space-y-1 mt-3">
          <li>Provision, operate, and bill for the services you use.</li>
          <li>Detect and prevent abuse, fraud, and security incidents.</li>
          <li>Comply with legal obligations including tax reporting (GST in India, VAT in the EU/UK, GST in Singapore).</li>
          <li>Send transactional emails (deploy notifications, invoices, password resets). We will only email you about marketing if you've explicitly opted in.</li>
        </ul>
      </>
    ),
  },
  {
    h: 'How we share your information',
    body: (
      <>
        <p>We share your information only with:</p>
        <ul className="list-disc ml-6 space-y-1 mt-3">
          <li><strong>Payment processors</strong> (Razorpay, Stripe) to charge your saved payment methods.</li>
          <li><strong>Email and SMS providers</strong> (Resend, Twilio, MSG91) to deliver transactional messages.</li>
          <li><strong>Infrastructure subprocessors</strong> (datacentre operators, DDoS scrubbing networks) as required to run your servers.</li>
          <li><strong>Law enforcement</strong> only with a valid legal request and only the minimum data required to comply.</li>
        </ul>
        <p className="mt-3">We do not sell your data. Ever.</p>
      </>
    ),
  },
  {
    h: 'Where your data lives',
    body: (
      <p>
        Customer data is stored in the region you deploy to. Account metadata (login, billing, tickets) is
        stored in our primary control plane in Mumbai. We replicate to a secondary region (Singapore) for
        disaster recovery. We do not store data in any region you haven't explicitly chosen.
      </p>
    ),
  },
  {
    h: 'Your rights',
    body: (
      <>
        <p>You can at any time:</p>
        <ul className="list-disc ml-6 space-y-1 mt-3">
          <li>Export your account data through the dashboard or API.</li>
          <li>Delete your account, which permanently removes all servers, volumes, and personal data within 30 days.</li>
          <li>Request a copy of all data we hold about you by emailing <a href="mailto:privacy@netlayer.com" className="text-[#00d4ff] hover:underline">privacy@netlayer.com</a>.</li>
          <li>Object to processing for marketing purposes by clicking unsubscribe in any email.</li>
        </ul>
      </>
    ),
  },
  {
    h: 'Cookies',
    body: (
      <p>
        We use a single first-party authentication cookie (HTTP-only, Secure, SameSite=Lax) to keep you
        signed in. We do not use third-party tracking cookies or advertising pixels.
      </p>
    ),
  },
  {
    h: 'Security',
    body: (
      <p>
        Passwords are hashed with bcrypt (cost factor 12). API keys are hashed with SHA-256 and we never
        store the raw key. All traffic is TLS 1.2+. Internal services authenticate to each other with
        short-lived JWTs. We rotate signing keys quarterly.
      </p>
    ),
  },
  {
    h: 'Changes to this policy',
    body: (
      <p>
        We'll email all account holders at least 30 days before any material change to this policy.
        The current version is always available at this URL.
      </p>
    ),
  },
  {
    h: 'Contact',
    body: (
      <p>
        Questions? Email <a href="mailto:privacy@netlayer.com" className="text-[#00d4ff] hover:underline">privacy@netlayer.com</a>{' '}
        or write to NetLayer Cloud Pvt. Ltd., Mumbai, India.
      </p>
    ),
  },
]

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white antialiased">
      <TopNav />

      <article className="pt-32 pb-20 px-4 sm:px-6 max-w-3xl mx-auto">
        <div className="text-xs text-gray-500 mb-2">Effective: 23 May 2026</div>
        <h1 className="text-[40px] leading-[1.1] font-semibold tracking-tight mb-6">Privacy policy</h1>
        <p className="text-gray-400 leading-relaxed mb-12">
          Your privacy matters. This page describes what we collect, what we do with it, and what your
          rights are. We try to be plain about it; legal language is kept where actually required.
        </p>

        <div className="space-y-10">
          {SECTIONS.map((s) => (
            <section key={s.h}>
              <h2 className="text-xl font-semibold text-white mb-3">{s.h}</h2>
              <div className="text-sm text-gray-300 leading-relaxed space-y-2">{s.body}</div>
            </section>
          ))}
        </div>
      </article>

      <Footer />
    </div>
  )
}
