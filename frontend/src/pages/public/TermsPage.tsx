import { TopNav } from '../../components/landing/TopNav'
import { Footer } from '../../components/landing/Footer'

const SECTIONS = [
  {
    h: '1. Acceptance',
    body: (
      <p>
        By creating a NetLayer Cloud account or using the services, you accept these terms. If you're
        accepting on behalf of a company, you represent that you have authority to bind it.
      </p>
    ),
  },
  {
    h: '2. The services',
    body: (
      <p>
        NetLayer Cloud provides cloud infrastructure including virtual servers, block storage, object
        storage, load balancers, managed databases, DNS hosting, and adjacent services. We offer the
        services on an as-available basis backed by the SLA published at our pricing page.
      </p>
    ),
  },
  {
    h: '3. Your account',
    body: (
      <>
        <p>You agree to:</p>
        <ul className="list-disc ml-6 space-y-1 mt-3">
          <li>Provide accurate registration information and keep it current.</li>
          <li>Maintain the security of your password, API keys, and 2FA secrets.</li>
          <li>Be responsible for all activity on your account, whether you authorised it or not.</li>
          <li>Notify us immediately at <a href="mailto:security@netlayer.com" className="text-[#00d4ff] hover:underline">security@netlayer.com</a> if you suspect unauthorised access.</li>
        </ul>
      </>
    ),
  },
  {
    h: '4. Acceptable use',
    body: (
      <>
        <p>You may not use the services to:</p>
        <ul className="list-disc ml-6 space-y-1 mt-3">
          <li>Send unsolicited bulk email (spam) or operate phishing infrastructure.</li>
          <li>Mine cryptocurrency without an explicit signed agreement with us.</li>
          <li>Distribute malware, run command-and-control servers, or attack other systems.</li>
          <li>Host content that is illegal in your jurisdiction or in India where our control plane operates.</li>
          <li>Violate applicable laws including export controls and sanctions.</li>
        </ul>
        <p className="mt-3">
          Reports of abuse can be sent to <a href="mailto:abuse@netlayer.com" className="text-[#00d4ff] hover:underline">abuse@netlayer.com</a> or via the public abuse-report form. We may suspend or terminate accounts that breach this policy.
        </p>
      </>
    ),
  },
  {
    h: '5. Pricing and billing',
    body: (
      <>
        <p>
          Charges are calculated based on the resources you provision. Hourly meters apply for partial
          months and unused time is automatically credited.
        </p>
        <p className="mt-3">
          Invoices are issued in your local currency where supported (INR, USD, EUR, GBP, SGD, AUD). Taxes
          are added at the statutory rate of your billing country (GST in India, VAT in EU/UK, GST in
          Singapore).
        </p>
        <p className="mt-3">
          Payment is due on receipt. Accounts more than 14 days overdue may be suspended; accounts more
          than 30 days overdue may have data deleted in line with our data retention policy.
        </p>
      </>
    ),
  },
  {
    h: '6. Refunds and credits',
    body: (
      <p>
        Pre-paid balances are non-refundable except where required by local law. SLA credits will be
        applied automatically to the next invoice for any month that fails to meet the published uptime
        target.
      </p>
    ),
  },
  {
    h: '7. Your data',
    body: (
      <>
        <p>
          You retain all rights to your data. We need a license only to host, transmit, and back it up
          to provide the services to you.
        </p>
        <p className="mt-3">
          You're responsible for backups, encryption keys, and any compliance obligations specific to your
          data (HIPAA, PCI, etc.). We provide the tooling; we don't audit what you put on it.
        </p>
      </>
    ),
  },
  {
    h: '8. Termination',
    body: (
      <p>
        Either party can terminate the relationship at any time. On termination we will retain your data
        for 30 days to allow a final export, then permanently delete it.
      </p>
    ),
  },
  {
    h: '9. Warranties and liability',
    body: (
      <>
        <p>
          The services are provided on an as-available basis. To the maximum extent permitted by law, we
          disclaim implied warranties of merchantability, fitness for a particular purpose, and
          non-infringement.
        </p>
        <p className="mt-3">
          Our aggregate liability under these terms will not exceed the fees you paid us in the 12 months
          preceding the event giving rise to the claim. We will not be liable for lost profits, lost data,
          or consequential damages.
        </p>
      </>
    ),
  },
  {
    h: '10. Governing law',
    body: (
      <p>
        These terms are governed by the laws of India. The courts of Mumbai have exclusive jurisdiction
        over disputes arising under or in connection with these terms.
      </p>
    ),
  },
  {
    h: '11. Contact',
    body: (
      <p>
        Questions about these terms? Email{' '}
        <a href="mailto:legal@netlayer.com" className="text-[#00d4ff] hover:underline">legal@netlayer.com</a>.
      </p>
    ),
  },
]

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white antialiased">
      <TopNav />

      <article className="pt-32 pb-20 px-4 sm:px-6 max-w-3xl mx-auto">
        <div className="text-xs text-gray-500 mb-2">Effective: 23 May 2026</div>
        <h1 className="text-[40px] leading-[1.1] font-semibold tracking-tight mb-6">Terms of service</h1>
        <p className="text-gray-400 leading-relaxed mb-12">
          These terms govern your use of NetLayer Cloud. Read them. They are also short, on purpose.
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
