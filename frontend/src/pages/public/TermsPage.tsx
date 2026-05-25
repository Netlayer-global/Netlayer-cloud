import { LandingNav, LandingFooter } from '../Landing'
import { LegalDocument } from './_LegalDocument'

const SECTIONS = [
  {
    id: 'acceptance',
    title: '1. Acceptance',
    body: [
      'By creating a NetLayer Cloud account or using our services, you agree to these Terms of Service. If you don\'t agree, don\'t use the service.',
      'If you accept on behalf of an organisation, you represent that you have authority to bind that organisation.',
    ],
  },
  {
    id: 'service',
    title: '2. Service description',
    body: [
      'NetLayer Cloud provides on-demand cloud infrastructure: virtual machines, bare metal, block and object storage, managed databases, networking, and related services.',
      'Specific service-level commitments are listed in our SLA (section 6). Services not covered by an explicit SLA are provided on a best-effort basis.',
    ],
  },
  {
    id: 'account',
    title: '3. Account responsibilities',
    body: [
      'You are responsible for keeping your credentials secure. Activity carried out from your account is attributed to you.',
      'You agree not to share API keys or passwords with anyone outside your team.',
      'Notify us immediately at security@netlayer.com if you believe your account has been compromised.',
    ],
  },
  {
    id: 'aup',
    title: '4. Acceptable use',
    body: [
      'No illegal activity. No spam (commercial or otherwise). No port-scanning of third parties without prior authorisation. No malware hosting or distribution. No DDoS — incoming or outgoing.',
      'No content that infringes intellectual property, exploits minors, or constitutes hate speech, harassment, or doxing.',
      'We respond to abuse reports filed at /abuse-report. Investigations may include suspending the offending resource pending review.',
    ],
  },
  {
    id: 'billing',
    title: '5. Billing',
    body: [
      'NetLayer Cloud is prepaid. Add credit to your wallet via Razorpay (India) or Stripe (international). Wallet is debited per-second for compute, per-GB for storage, and per-GB for network egress.',
      'Detailed pricing is at /pricing. We may change pricing with 30 days\' notice for existing customers; new pricing applies to existing wallets only after the notice period.',
      'Unused wallet credit is fully refundable to the original payment method on request.',
      'Indian customers receive GST-compliant tax invoices. International customers receive VAT/GST invoices per local rules.',
    ],
  },
  {
    id: 'sla',
    title: '6. Service-level agreement',
    body: [
      'We commit to 99.99% uptime for compute and 99.95% uptime for managed databases, measured monthly and excluding scheduled maintenance announced 72h in advance.',
      'If we miss the SLA in any month, eligible customers receive credit equal to 10× the prorated downtime, applied automatically to the next invoice. Maximum monthly credit is 50% of the affected service\'s monthly bill.',
      'SLA credits are your sole and exclusive remedy for downtime.',
    ],
  },
  {
    id: 'termination',
    title: '7. Termination',
    body: [
      'You can close your account anytime from Settings. Data is retained for 14 days after closure, then irrecoverably deleted.',
      'We may suspend or terminate accounts that violate these terms, fail to pay, or place the platform at risk. We give written notice except for emergencies (active abuse, security incidents).',
    ],
  },
  {
    id: 'liability',
    title: '8. Limitation of liability',
    body: [
      'To the maximum extent allowed by law, our liability for any claim arising out of these terms or the service is capped at the lesser of (a) the amount you paid us in the 12 months before the claim, or (b) ₹50,000.',
      'We are not liable for indirect, incidental, special, or consequential damages — including loss of profits, data, or business opportunity — even if we\'ve been advised of the possibility.',
    ],
  },
  {
    id: 'governing',
    title: '9. Governing law',
    body: [
      'These terms are governed by the laws of India. Disputes are subject to the exclusive jurisdiction of the courts at Mumbai.',
      'For customers in the European Union, applicable consumer-protection laws of your country of residence apply where they cannot be derogated from by contract.',
    ],
  },
  {
    id: 'contact',
    title: '10. Contact',
    body: [
      'For legal questions, contact legal@netlayer.com. For abuse reports, abuse@netlayer.com or /abuse-report. For billing disputes, billing@netlayer.com.',
    ],
  },
]

export default function TermsPage() {
  return (
    <div className="nl-v3 min-h-screen">
      <LandingNav />
      <LegalDocument title="Terms of Service" lastUpdated="May 23, 2026" sections={SECTIONS} />
      <LandingFooter />
    </div>
  )
}
