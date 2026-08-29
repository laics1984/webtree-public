import { describe, expect, it } from 'vitest'
import { isLocalPlatformRequestHost, isPlatformRequestHost } from '~/lib/host'

const PROD_BASE = 'myfowable.com'
const DEV_BASE = 'localhost:3000'

describe('isPlatformRequestHost', () => {
  it('matches a single label beneath the production base domain', () => {
    expect(isPlatformRequestHost('acme.myfowable.com', PROD_BASE)).toBe(true)
  })

  it('matches a single label beneath the local development base domain', () => {
    expect(isPlatformRequestHost('acme.localhost:3000', DEV_BASE)).toBe(true)
  })

  it('rejects client custom domains', () => {
    expect(isPlatformRequestHost('clientdomain.com', PROD_BASE)).toBe(false)
    expect(isPlatformRequestHost('www.clientdomain.com', PROD_BASE)).toBe(false)
  })

  it('rejects the bare base domain', () => {
    expect(isPlatformRequestHost(PROD_BASE, PROD_BASE)).toBe(false)
  })

  it('rejects hosts more than one label beneath the base domain', () => {
    expect(isPlatformRequestHost('a.b.myfowable.com', PROD_BASE)).toBe(false)
  })

  it('rejects a look-alike domain that merely ends with the base name', () => {
    expect(isPlatformRequestHost('acme.notmyfowable.com', PROD_BASE)).toBe(false)
    expect(isPlatformRequestHost('evilmyfowable.com', PROD_BASE)).toBe(false)
  })

  it('rejects a port mismatch against a ported base domain', () => {
    expect(isPlatformRequestHost('acme.public.localhost:4000', DEV_BASE)).toBe(false)
  })

  it('ignores the port when the request carries none', () => {
    expect(isPlatformRequestHost('acme.public.localhost', DEV_BASE)).toBe(true)
  })

  it('is case and decorator insensitive', () => {
    expect(isPlatformRequestHost('https://ACME.myfowable.com/x', PROD_BASE)).toBe(true)
  })

  it('rejects empty input on either side', () => {
    expect(isPlatformRequestHost('', PROD_BASE)).toBe(false)
    expect(isPlatformRequestHost('acme.myfowable.com', '')).toBe(false)
    expect(isPlatformRequestHost(null, null)).toBe(false)
  })
})

describe('isLocalPlatformRequestHost', () => {
  it('stays restricted to local base domains so canonical resolution is unchanged', () => {
    expect(isLocalPlatformRequestHost('acme.localhost:3000', DEV_BASE)).toBe(true)
    expect(isLocalPlatformRequestHost('acme.myfowable.com', PROD_BASE)).toBe(false)
  })

  it('rejects the bare local base domain', () => {
    expect(isLocalPlatformRequestHost(DEV_BASE, DEV_BASE)).toBe(false)
  })

  it('rejects non-platform local hosts', () => {
    expect(isLocalPlatformRequestHost('a.b.localhost:3000', DEV_BASE)).toBe(false)
    expect(isLocalPlatformRequestHost('clientdomain.test', DEV_BASE)).toBe(false)
  })
})
