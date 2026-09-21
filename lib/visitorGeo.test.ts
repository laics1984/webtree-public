import { describe, expect, it } from 'vitest'
import { encodeVisitorGeo } from './visitorGeo'

describe('encodeVisitorGeo', () => {
  it('encodes the parts the API keeps as one header-safe string', () => {
    const header = encodeVisitorGeo({
      country: 'MY',
      region: 'Selangor',
      city: 'Petaling Jaya',
      latitude: '3.10730',
      longitude: '101.60670'
    })

    expect(header).toBe('country=MY&region=Selangor&city=Petaling+Jaya&lat=3.10730&lng=101.60670')
  })

  it('percent-encodes non-ASCII names, which raw header values cannot carry', () => {
    const header = encodeVisitorGeo({ country: 'VN', city: 'Đà Nẵng' }) ?? ''

    expect(header).toMatch(/^[\x20-\x7E]+$/)
    expect(new URLSearchParams(header).get('city')).toBe('Đà Nẵng')
  })

  it('omits parts Cloudflare did not resolve', () => {
    expect(encodeVisitorGeo({ country: 'SG', city: '', latitude: null })).toBe('country=SG')
  })

  it.each([[undefined], [null], [{}], [{ country: 'T1' }], [{ country: 'my' }]])(
    'sends nothing without a usable country: %j',
    (cf) => {
      expect(encodeVisitorGeo(cf)).toBeNull()
    }
  )
})
