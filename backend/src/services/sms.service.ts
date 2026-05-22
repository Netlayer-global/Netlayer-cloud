import axios from 'axios'
import logger from '../utils/logger'

type Provider = 'twilio' | 'msg91' | 'mock'

export class SmsService {
  private provider: Provider
  private mockMode: boolean

  constructor() {
    this.provider = ((process.env.SMS_PROVIDER as Provider) || 'mock')
    this.mockMode = this.provider === 'mock'
    if (this.mockMode) logger.debug('SMS: MOCK MODE')
  }

  async send(phone: string, message: string): Promise<void> {
    if (this.mockMode) {
      logger.info(`[SMS MOCK] ${phone} | ${message}`)
      return
    }
    try {
      if (this.provider === 'twilio') {
        const sid = process.env.TWILIO_ACCOUNT_SID!
        const token = process.env.TWILIO_AUTH_TOKEN!
        const from = process.env.TWILIO_FROM!
        await axios.post(
          `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`,
          new URLSearchParams({ To: phone, From: from, Body: message }).toString(),
          {
            auth: { username: sid, password: token },
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          }
        )
      } else if (this.provider === 'msg91') {
        await axios.post(
          'https://api.msg91.com/api/v5/flow/',
          { mobiles: phone, sender: process.env.MSG91_SENDER || 'NETLYR', message },
          { headers: { authkey: process.env.MSG91_API_KEY!, 'Content-Type': 'application/json' } }
        )
      }
    } catch (e: any) {
      logger.error('SMS send failed', { error: e.message })
    }
  }

  async sendOTP(phone: string, otp: string): Promise<void> {
    await this.send(phone, `Your NetLayer OTP is: ${otp}. Valid for 10 minutes.`)
  }

  async sendServerReady(phone: string, serverName: string, ip: string): Promise<void> {
    await this.send(phone, `NetLayer: Server ${serverName} is ready! IP: ${ip}`)
  }

  async sendPaymentSuccess(phone: string, amount: string): Promise<void> {
    await this.send(phone, `NetLayer: Payment of ${amount} received. Thank you!`)
  }

  async sendLowBalance(phone: string, balance: string): Promise<void> {
    await this.send(phone, `NetLayer: Low balance alert! Current balance: ${balance}`)
  }

  async sendMaintenanceAlert(phone: string, region: string, time: string): Promise<void> {
    await this.send(phone, `NetLayer: Scheduled maintenance in ${region} at ${time}`)
  }

  static async testCredentials(
    provider: string,
    config: any,
    testPhone: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      if (provider === 'twilio') {
        await axios.post(
          `https://api.twilio.com/2010-04-01/Accounts/${config.accountSid}/Messages.json`,
          new URLSearchParams({
            To: testPhone,
            From: config.from,
            Body: 'NetLayer SMS integration test',
          }).toString(),
          {
            auth: { username: config.accountSid, password: config.authToken },
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            timeout: 10_000,
          }
        )
        return { success: true }
      }
      if (provider === 'msg91') {
        await axios.post(
          'https://api.msg91.com/api/v5/flow/',
          { mobiles: testPhone, sender: config.senderId, message: 'NetLayer SMS test' },
          {
            headers: { authkey: config.apiKey, 'Content-Type': 'application/json' },
            timeout: 10_000,
          }
        )
        return { success: true }
      }
      return { success: false, error: 'Unsupported provider' }
    } catch (e: any) {
      return { success: false, error: e.response?.data?.message || e.message }
    }
  }
}

export default new SmsService()
