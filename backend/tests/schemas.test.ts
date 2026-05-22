import { describe, it, expect } from 'vitest'
import {
  RegisterInput,
  LoginInput,
  StrongPassword,
  ServerCreateInput,
  FirewallRuleInput,
  IpV4,
  Cidr,
  AdjustBalanceInput,
  RoleCreateInput,
  AnnouncementCreateInput,
} from '../src/schemas'

describe('schemas/primitives', () => {
  it('IpV4 accepts valid', () => {
    expect(IpV4.safeParse('1.2.3.4').success).toBe(true)
    expect(IpV4.safeParse('255.255.255.255').success).toBe(true)
  })

  it('IpV4 rejects invalid', () => {
    expect(IpV4.safeParse('256.1.1.1').success).toBe(false)
    expect(IpV4.safeParse('1.2.3').success).toBe(false)
    expect(IpV4.safeParse('not-an-ip').success).toBe(false)
  })

  it('Cidr accepts valid', () => {
    expect(Cidr.safeParse('10.0.0.0/8').success).toBe(true)
    expect(Cidr.safeParse('192.168.1.0/24').success).toBe(true)
    expect(Cidr.safeParse('103.21.148.0/24').success).toBe(true)
  })

  it('Cidr rejects invalid', () => {
    expect(Cidr.safeParse('10.0.0.0').success).toBe(false)
    expect(Cidr.safeParse('10.0.0.0/33').success).toBe(false)
  })

  it('StrongPassword enforces min 8 + uppercase + digit', () => {
    expect(StrongPassword.safeParse('short1A').success).toBe(false) // too short
    expect(StrongPassword.safeParse('alllowercase1').success).toBe(false) // no uppercase
    expect(StrongPassword.safeParse('NoDigitsHere!').success).toBe(false) // no digit
    expect(StrongPassword.safeParse('Valid12345').success).toBe(true)
  })
})

describe('schemas/auth', () => {
  it('RegisterInput rejects bad email', () => {
    const r = RegisterInput.safeParse({
      email: 'not-an-email',
      password: 'Valid12345',
      firstName: 'A',
      lastName: 'B',
    })
    expect(r.success).toBe(false)
  })

  it('RegisterInput accepts well-formed input', () => {
    const r = RegisterInput.safeParse({
      email: 'test@example.com',
      password: 'Valid12345',
      firstName: 'Jane',
      lastName: 'Doe',
    })
    expect(r.success).toBe(true)
  })

  it('LoginInput trims down to email + password', () => {
    const r = LoginInput.safeParse({
      email: 'test@example.com',
      password: 'anything',
    })
    expect(r.success).toBe(true)
  })
})

describe('schemas/server', () => {
  it('ServerCreateInput requires the four core ids', () => {
    const r = ServerCreateInput.safeParse({
      name: 'web-1',
      planId: 'cmpgse4kr0017iwj55m6h14qx',
      regionId: 'cmpgse3v40006iwj5ehlw124k',
      osTemplateId: 'cmpgse3wp000kiwj5pioobe69',
    })
    expect(r.success).toBe(true)
  })

  it('ServerCreateInput rejects empty name', () => {
    const r = ServerCreateInput.safeParse({
      name: '',
      planId: 'cmpgse4kr0017iwj55m6h14qx',
      regionId: 'cmpgse3v40006iwj5ehlw124k',
      osTemplateId: 'cmpgse3wp000kiwj5pioobe69',
    })
    expect(r.success).toBe(false)
  })
})

describe('schemas/firewall', () => {
  it('FirewallRuleInput coerces port string → number', () => {
    const r = FirewallRuleInput.safeParse({
      direction: 'INBOUND',
      protocol: 'TCP',
      portFrom: '22',
      portTo: '22',
      sourceIp: '0.0.0.0/0',
    })
    expect(r.success).toBe(true)
    if (r.success) {
      expect(r.data.portFrom).toBe(22)
      expect(r.data.action).toBe('ACCEPT')
    }
  })

  it('FirewallRuleInput rejects out-of-range port', () => {
    const r = FirewallRuleInput.safeParse({
      direction: 'INBOUND',
      protocol: 'TCP',
      portFrom: 99999,
    })
    expect(r.success).toBe(false)
  })
})

describe('schemas/admin', () => {
  it('AdjustBalanceInput requires positive amount', () => {
    expect(
      AdjustBalanceInput.safeParse({ amount: -10, reason: 'x', type: 'credit' }).success
    ).toBe(false)
    expect(
      AdjustBalanceInput.safeParse({ amount: 10, reason: 'refund', type: 'credit' }).success
    ).toBe(true)
  })

  it('RoleCreateInput requires snake_case name', () => {
    expect(
      RoleCreateInput.safeParse({ name: 'My Role', displayName: 'X', permissions: [] }).success
    ).toBe(false)
    expect(
      RoleCreateInput.safeParse({ name: 'reseller_pro', displayName: 'X', permissions: [] }).success
    ).toBe(true)
  })

  it('AnnouncementCreateInput defaults are sane', () => {
    const r = AnnouncementCreateInput.safeParse({ title: 't', message: 'm' })
    expect(r.success).toBe(true)
  })
})
