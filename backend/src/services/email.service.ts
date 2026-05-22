import { Resend } from 'resend'
import logger from '../utils/logger'

interface MinimalUser {
  email: string
  firstName: string
}

const FROM = process.env.RESEND_FROM || 'NetLayer Cloud <noreply@netlayer.com>'

const wrap = (title: string, content: string) => `<!doctype html>
<html><head><meta charset="utf-8"><title>${title}</title></head>
<body style="margin:0;padding:0;background:#0d0e0d;font-family:system-ui,-apple-system,sans-serif;color:#e8e8e6">
  <div style="max-width:600px;margin:0 auto;padding:32px 16px">
    <div style="display:flex;align-items:center;gap:8px;margin-bottom:32px">
      <div style="width:28px;height:28px;background:#e0fe56;border-radius:6px;display:inline-block"></div>
      <span style="font-size:16px;font-weight:600;color:#e8e8e6;vertical-align:middle">NetLayer Cloud</span>
    </div>
    <div style="background:#161716;border:1px solid #2a2b2a;border-radius:12px;padding:32px">${content}</div>
    <p style="color:#6a6a68;font-size:12px;margin-top:24px;text-align:center">© ${new Date().getFullYear()} NetLayer Cloud · <a href="#" style="color:#6a6a68">Unsubscribe</a></p>
  </div>
</body></html>`

const button = (label: string, url: string) =>
  `<a href="${url}" style="display:inline-block;background:#e0fe56;color:#0d0e0d;padding:10px 20px;border-radius:6px;text-decoration:none;font-weight:600;margin-top:16px">${label}</a>`

export class EmailService {
  private mockMode: boolean
  private resend: Resend | null = null

  constructor() {
    this.mockMode = !process.env.RESEND_API_KEY || process.env.EMAIL_MOCK_MODE === 'true'
    if (!this.mockMode) {
      this.resend = new Resend(process.env.RESEND_API_KEY!)
    } else {
      logger.debug('Email: MOCK MODE')
    }
  }

  private async send(to: string, subject: string, html: string): Promise<void> {
    if (this.mockMode || !this.resend) {
      logger.info(`[Email MOCK] To: ${to} | Subject: ${subject}`)
      return
    }
    try {
      await this.resend.emails.send({ from: FROM, to, subject, html })
      logger.info(`Email sent: ${subject} → ${to}`)
    } catch (e: any) {
      logger.error('Email send failed', { error: e.message })
    }
  }

  async sendWelcome(user: MinimalUser, verifyUrl: string) {
    const html = wrap('Welcome to NetLayer',
      `<h2 style="margin:0 0 16px">Hi ${user.firstName}!</h2>
       <p style="color:#a0a09e;line-height:1.6">Welcome to NetLayer Cloud. Verify your email to deploy your first server.</p>
       ${button('Verify email', verifyUrl)}`)
    await this.send(user.email, 'Welcome to NetLayer Cloud!', html)
  }

  async sendEmailVerification(user: MinimalUser, verifyUrl: string) {
    const html = wrap('Verify your email',
      `<h2 style="margin:0 0 16px">Verify your email</h2>
       <p style="color:#a0a09e;line-height:1.6">Click below to confirm your email address.</p>
       ${button('Verify email', verifyUrl)}`)
    await this.send(user.email, 'Verify your NetLayer email', html)
  }

  async sendPasswordReset(user: MinimalUser, resetUrl: string) {
    const html = wrap('Password reset',
      `<h2 style="margin:0 0 16px">Reset your password</h2>
       <p style="color:#a0a09e;line-height:1.6">Hi ${user.firstName}, click below to reset your password. This link expires in 1 hour.</p>
       ${button('Reset password', resetUrl)}
       <p style="color:#6a6a68;font-size:12px;margin-top:16px">If you didn't request this, ignore this email.</p>`)
    await this.send(user.email, 'Reset your NetLayer password', html)
  }

  async sendServerReady(user: MinimalUser, server: { name: string; ipv4: string; hostname: string; plan: string }) {
    const html = wrap('Server ready',
      `<h2 style="margin:0 0 16px">Your server is ready 🚀</h2>
       <p style="color:#a0a09e;line-height:1.6">Hi ${user.firstName}, server <strong style="color:#e8e8e6">${server.name}</strong> (${server.plan}) is online.</p>
       <div style="background:#0d0e0d;border:1px solid #2a2b2a;border-radius:6px;padding:12px;margin:16px 0;font-family:monospace;font-size:13px;color:#e0fe56">ssh root@${server.ipv4}</div>
       ${button('Manage server', `${process.env.FRONTEND_URL}/dashboard/servers`)}`)
    await this.send(user.email, `Your server ${server.name} is ready! 🚀`, html)
  }

  async sendServerDown(user: MinimalUser, server: { name: string; ipv4: string }) {
    const html = wrap('Server down',
      `<h2 style="margin:0 0 16px;color:#f87171">Server alert</h2>
       <p style="color:#a0a09e;line-height:1.6">We detected that <strong>${server.name}</strong> (${server.ipv4}) is not responding. Our team is investigating.</p>`)
    await this.send(user.email, `🔴 Server ${server.name} is down`, html)
  }

  async sendServerDeleted(user: MinimalUser, serverName: string) {
    const html = wrap('Server deleted',
      `<h2 style="margin:0 0 16px">Server deleted</h2>
       <p style="color:#a0a09e;line-height:1.6">Your server <strong>${serverName}</strong> has been permanently deleted.</p>`)
    await this.send(user.email, `Server ${serverName} deleted`, html)
  }

  async sendInvoiceCreated(user: MinimalUser, invoice: { id: string; amount: number; dueDate: Date }) {
    const html = wrap('New invoice',
      `<h2 style="margin:0 0 16px">New invoice</h2>
       <p style="color:#a0a09e;line-height:1.6">Invoice <strong>${invoice.id}</strong> for ₹${invoice.amount} is due on ${invoice.dueDate.toDateString()}.</p>
       ${button('Pay invoice', `${process.env.FRONTEND_URL}/dashboard/billing`)}`)
    await this.send(user.email, `Invoice ${invoice.id.slice(-8)} — ₹${invoice.amount}`, html)
  }

  async sendPaymentSuccess(user: MinimalUser, invoice: { id: string; amount: number }) {
    const html = wrap('Payment received',
      `<h2 style="margin:0 0 16px;color:#4ade80">Payment received ✓</h2>
       <p style="color:#a0a09e;line-height:1.6">Thanks for your payment of <strong>₹${invoice.amount}</strong>. Invoice ${invoice.id} is now paid.</p>`)
    await this.send(user.email, `Payment received — ₹${invoice.amount}`, html)
  }

  async sendPaymentFailed(user: MinimalUser, invoice: { id: string; amount: number }) {
    const html = wrap('Payment failed',
      `<h2 style="margin:0 0 16px;color:#f87171">Payment failed</h2>
       <p style="color:#a0a09e;line-height:1.6">Payment for invoice <strong>${invoice.id}</strong> (₹${invoice.amount}) failed. Please retry.</p>
       ${button('Retry payment', `${process.env.FRONTEND_URL}/dashboard/billing`)}`)
    await this.send(user.email, `Payment failed — invoice ${invoice.id.slice(-8)}`, html)
  }

  async sendAccountSuspended(user: MinimalUser, reason: string) {
    const html = wrap('Account suspended',
      `<h2 style="margin:0 0 16px;color:#f87171">Account suspended</h2>
       <p style="color:#a0a09e;line-height:1.6">Reason: ${reason}. Contact support if you believe this is a mistake.</p>`)
    await this.send(user.email, 'Your NetLayer account is suspended', html)
  }

  async sendAccountActivated(user: MinimalUser) {
    const html = wrap('Account activated',
      `<h2 style="margin:0 0 16px;color:#4ade80">Welcome back!</h2>
       <p style="color:#a0a09e;line-height:1.6">Your NetLayer account has been re-activated.</p>`)
    await this.send(user.email, 'Your NetLayer account is active', html)
  }

  async sendLowBalance(user: MinimalUser, balance: number) {
    const html = wrap('Low balance',
      `<h2 style="margin:0 0 16px;color:#fbbf24">Low balance alert</h2>
       <p style="color:#a0a09e;line-height:1.6">Your NetLayer balance is <strong>₹${balance.toFixed(2)}</strong>. Top up to avoid service interruption.</p>
       ${button('Add funds', `${process.env.FRONTEND_URL}/dashboard/billing`)}`)
    await this.send(user.email, 'Low balance alert', html)
  }

  async sendTicketReply(user: MinimalUser, ticketSubject: string, replyText: string) {
    const html = wrap('Ticket reply',
      `<h2 style="margin:0 0 16px">Re: ${ticketSubject}</h2>
       <blockquote style="border-left:2px solid #e0fe56;padding-left:12px;color:#a0a09e">${replyText.replace(/\n/g, '<br>')}</blockquote>
       ${button('View ticket', `${process.env.FRONTEND_URL}/dashboard/tickets`)}`)
    await this.send(user.email, `Re: ${ticketSubject}`, html)
  }

  async sendCustomEmail(to: string, subject: string, html: string) {
    await this.send(to, subject, wrap(subject, html))
  }

  static async testCredentials(apiKey: string, testTo: string): Promise<{ success: boolean; error?: string }> {
    try {
      const r = new Resend(apiKey)
      await r.emails.send({
        from: FROM,
        to: testTo,
        subject: 'NetLayer test email',
        html: wrap('Test', '<p>This is a NetLayer integration test email.</p>'),
      })
      return { success: true }
    } catch (e: any) {
      return { success: false, error: e.message }
    }
  }
}

export default new EmailService()
