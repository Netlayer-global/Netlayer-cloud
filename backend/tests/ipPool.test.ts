import { describe, it, expect } from 'vitest'
import ipPoolService from '../src/services/ipPool.service'

describe('ipPoolService.expandCidr', () => {
  it('returns 14 hosts for /28', () => {
    const ips = ipPoolService.expandCidr('192.168.1.0/28')
    expect(ips.length).toBe(14)
    expect(ips[0]).toBe('192.168.1.1')
    expect(ips[ips.length - 1]).toBe('192.168.1.14')
  })

  it('returns 30 hosts for /27', () => {
    const ips = ipPoolService.expandCidr('103.21.200.0/27')
    expect(ips.length).toBe(30)
    expect(ips[0]).toBe('103.21.200.1')
    expect(ips[29]).toBe('103.21.200.30')
  })

  it('throws on invalid CIDR', () => {
    expect(() => ipPoolService.expandCidr('not-a-cidr')).toThrow()
    expect(() => ipPoolService.expandCidr('192.168.1.0/8')).toThrow()
    expect(() => ipPoolService.expandCidr('192.168.1.0/31')).toThrow()
  })

  it('countUsable matches expand length', () => {
    expect(ipPoolService.countUsable('10.0.0.0/24')).toBe(254)
    expect(ipPoolService.countUsable('10.0.0.0/30')).toBe(2)
  })
})
