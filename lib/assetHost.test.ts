import { describe, expect, it } from 'vitest'
import { ASSET_HOST, LEGACY_ASSET_HOST, resolveAssetHostRedirect } from '~/lib/assetHost'

describe('resolveAssetHostRedirect', () => {
  it('redirects the legacy asset host to the new one', () => {
    expect(resolveAssetHostRedirect(LEGACY_ASSET_HOST, '/storage/photo.jpg'))
      .toBe(`https://${ASSET_HOST}/storage/photo.jpg`)
  })

  it('carries the query string across', () => {
    expect(resolveAssetHostRedirect(LEGACY_ASSET_HOST, '/storage/photo.jpg?w=800&fit=cover'))
      .toBe(`https://${ASSET_HOST}/storage/photo.jpg?w=800&fit=cover`)
  })

  it('leaves already-encoded keys alone rather than double-escaping them', () => {
    expect(resolveAssetHostRedirect(LEGACY_ASSET_HOST, '/storage/my%20photo%2Fv2.jpg'))
      .toBe(`https://${ASSET_HOST}/storage/my%20photo%2Fv2.jpg`)
  })

  it('ignores the port and casing the host arrives with', () => {
    expect(resolveAssetHostRedirect(`ASSET.MyFowable.com:443`, '/a.png'))
      .toBe(`https://${ASSET_HOST}/a.png`)
  })

  it('falls back to the root for a missing or relative path', () => {
    expect(resolveAssetHostRedirect(LEGACY_ASSET_HOST, '')).toBe(`https://${ASSET_HOST}/`)
    expect(resolveAssetHostRedirect(LEGACY_ASSET_HOST, null)).toBe(`https://${ASSET_HOST}/`)
    expect(resolveAssetHostRedirect(LEGACY_ASSET_HOST, 'storage/a.png')).toBe(`https://${ASSET_HOST}/`)
  })

  it('leaves every other host alone', () => {
    expect(resolveAssetHostRedirect(ASSET_HOST, '/a.png')).toBeNull()
    expect(resolveAssetHostRedirect('acme.public.myfowable.com', '/')).toBeNull()
    expect(resolveAssetHostRedirect('clientdomain.com', '/')).toBeNull()
    // A look-alike must not match: the check is on the whole hostname.
    expect(resolveAssetHostRedirect('notasset.myfowable.com', '/')).toBeNull()
    expect(resolveAssetHostRedirect('asset.myfowable.com.evil.test', '/')).toBeNull()
  })

  it('fails closed on a missing host', () => {
    expect(resolveAssetHostRedirect('', '/a.png')).toBeNull()
    expect(resolveAssetHostRedirect(null, '/a.png')).toBeNull()
    expect(resolveAssetHostRedirect(undefined, '/a.png')).toBeNull()
  })

  it('refuses to redirect a host to itself, or to nowhere', () => {
    expect(resolveAssetHostRedirect('a.test', '/x', 'a.test', 'a.test')).toBeNull()
    expect(resolveAssetHostRedirect('a.test', '/x', 'a.test', '')).toBeNull()
    expect(resolveAssetHostRedirect('a.test', '/x', '', 'b.test')).toBeNull()
  })
})
