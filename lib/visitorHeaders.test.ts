import { describe, expect, it } from 'vitest'
import { visitorHeaders, visitorHeadersFrom } from '~/lib/visitorHeaders'

describe('visitor headers for the CMS', () => {
  it("names the visitor by Cloudflare's connecting IP and proves it with the key", () => {
    expect(
      visitorHeaders({ connectingIp: '198.51.100.7', remoteAddress: '10.0.0.1', userAgent: 'Mozilla/5.0', geo: 'country=MY', proxyKey: 'k' })
    ).toEqual({
      'X-Wt-Client-Ip': '198.51.100.7',
      'X-Wt-User-Agent': 'Mozilla/5.0',
      'X-Wt-Geo': 'country=MY',
      'X-Wt-Proxy-Key': 'k',
    })
  })

  it('falls back to the socket address locally, and sends no key it does not have', () => {
    expect(visitorHeaders({ remoteAddress: '127.0.0.1', userAgent: '', geo: null, proxyKey: '' })).toEqual({
      'X-Wt-Client-Ip': '127.0.0.1',
    })
  })
})

describe('visitor headers from the request being answered', () => {
  const request = (headers: Record<string, string | string[]>, remoteAddress = '10.0.0.1') => ({
    node: { req: { headers, socket: { remoteAddress } } },
  })

  it("reads Cloudflare's connecting IP and the user agent, never X-Forwarded-For", () => {
    const event = request({ 'cf-connecting-ip': '203.0.113.9', 'user-agent': 'Mozilla/5.0', 'x-forwarded-for': '6.6.6.6' })

    expect(visitorHeadersFrom(event, 'k', 'country=MY')).toEqual({
      'X-Wt-Client-Ip': '203.0.113.9',
      'X-Wt-User-Agent': 'Mozilla/5.0',
      'X-Wt-Geo': 'country=MY',
      'X-Wt-Proxy-Key': 'k',
    })
  })

  it('uses the first value of a repeated header, and the socket address without Cloudflare', () => {
    expect(visitorHeadersFrom(request({ 'user-agent': ['First/1.0', 'Second/2.0'] }, '127.0.0.1'), '')).toEqual({
      'X-Wt-Client-Ip': '127.0.0.1',
      'X-Wt-User-Agent': 'First/1.0',
    })
  })
})
