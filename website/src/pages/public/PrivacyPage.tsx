import { LandingNav, LandingFooter } from '../../components/landing-v3'
import { LegalDocument } from './_LegalDocument'
import { useSeo } from '../../hooks/useSeo'

const SECTIONS = [
  {
    id: 'collection',
    title: '1. Information we collect',
    body: [
      'When you create an account we collect your name, email address, country, and (optionally) company. When you add credit we collect billing details through our payment providers — we never store full card numbers.',
      'When you use the platform we collect operational data: server IPs, deploy times, usage metrics, audit logs, and the IP address you connect from. This data is required to operate, secure, and bill the service.',
      'When you contact support we keep the message contents to maintain a record of the issue and our response.',
    ],
  },
  {
    id: 'use',
    title: '2. How we use your information',
    body: [
      'To provide the service: provision infrastructure, route traffic, calculate bills, send notifications.',
      'To secure the service: detect abuse, prevent fraud, defend against attacks, comply with legal obligations.',
      'To improve the service: aggregate usage analytics (never tied to identifiable individuals) inform product priorities.',
      'To communicate with you: service updates, security notices, billing receipts. We do not send marketing email without explicit opt-in.',
    ],
  },
  {
    id: 'storage',
    title: '3. Data storage and security',
    body: [
      'All data at rest is encrypted with AES-256. All data in transit uses TLS 1.3 or better.',
      'Primary databases are hosted in our Mumbai region. Backups are encrypted and stored across two regions for redundancy.',
      'Access to production systems is gated behind hardware MFA and logged in our audit trail. We follow the principle of least privilege.',
      'We retain operational logs for 365 days, then irrecoverably delete them.',
    ],
  },
  {
    id: 'rights',
    title: '4. Your rights (GDPR / India PDPB)',
    body: [
      'Access: request a JSON dump of your data via Settings → Privacy or by emailing privacy@netlayer.com.',
      'Rectification: update profile data anytime in Settings.',
      'Deletion: close your account from Settings, or request data deletion at privacy@netlayer.com. We will delete personal data within 30 days, retaining only what we are legally required to keep.',
      'Portability: data export is delivered as machine-readable JSON.',
      'Objection: tell us to stop processing your data for any optional purpose. We will comply within 30 days.',
    ],
  },
  {
    id: 'cookies',
    title: '5. Cookies',
    body: [
      'We use only essential cookies — for authentication and session continuity. We do not run advertising or third-party tracking on our application.',
      'On marketing pages we use first-party analytics to count visits, with no fingerprinting or cross-site tracking.',
    ],
  },
  {
    id: 'sharing',
    title: '6. Third parties',
    body: [
      'We share data only with sub-processors required to operate the service: payment providers (Razorpay, Stripe), email (Resend), SMS (MSG91/Twilio), monitoring (Cloudflare). Each sub-processor is bound by a data processing agreement.',
      'We do not sell personal data. Ever.',
    ],
  },
  {
    id: 'changes',
    title: '7. Changes to this policy',
    body: [
      'We may update this policy as our practices evolve. Material changes will be announced 30 days in advance via email and an in-app banner.',
      'The current version is always available at /legal/privacy.',
    ],
  },
  {
    id: 'contact',
    title: '8. Contact',
    body: [
      'For privacy questions or rights requests, email privacy@netlayer.com. For general support, support@netlayer.com.',
    ],
  },
]

export default function PrivacyPage() {
  useSeo({ title: 'Privacy Policy', description: 'How NetLayer Cloud collects, uses, and protects your data — GDPR and India DPDP aligned.', path: '/legal/privacy' })
  return (
    <div className="nl-v3 min-h-screen">
      <LandingNav />
      <LegalDocument title="Privacy Policy" lastUpdated="May 23, 2026" sections={SECTIONS} />
      <LandingFooter />
    </div>
  )
}
