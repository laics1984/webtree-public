import { describe, expect, it } from 'vitest'
import { visitorHeaders } from '~/lib/visitorHeaders'

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
