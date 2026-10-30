import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fetchPublicContentList, fetchPublicPage, fetchPublicResolve } from '~/lib/api'

// A server render: Nuxt's context carries the request being rendered (Nuxt auto-imports stubbed as globals).
const visitorRequest = {
  node: { req: { headers: { 'cf-connecting-ip': '203.0.113.9', 'user-agent': 'Mozilla/5.0' }, socket: { remoteAddress: '10.0.0.1' } } },
}

describe('public reads during a server render', () => {
  const fetch = vi.fn(async () => ({}))

  beforeEach(() => {
    fetch.mockClear()
    vi.stubGlobal('$fetch', fetch)
    vi.stubGlobal('useRuntimeConfig', () => ({ publicApiBase: 'https://api.example', public: {}, rendererProxySecret: 'renderer-key' }))
    vi.stubGlobal('tryUseNuxtApp', () => ({ ssrContext: { event: visitorRequest } }))
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('names the visitor the page is rendered for, so the CMS limits per visitor', async () => {
    await fetchPublicResolve('school.example.com', '/about')

    expect(fetch).toHaveBeenCalledWith('https://api.example/api/public/resolve', {
      params: { host: 'school.example.com', path: '/about' },
      headers: {
        'X-Wt-Client-Ip': '203.0.113.9',
        'X-Wt-User-Agent': 'Mozilla/5.0',
        'X-Wt-Proxy-Key': 'renderer-key',
      },
    })
  })

  it('sends them on every read, listings included', async () => {
    await fetchPublicPage('school.example.com', '/')
    await fetchPublicContentList('school.example.com', 'article', { count: 6 })

    for (const call of fetch.mock.calls as unknown as [string, { headers: Record<string, string> }][]) {
      expect(call[1].headers['X-Wt-Client-Ip']).toBe('203.0.113.9')
    }
    expect(fetch).toHaveBeenCalledTimes(2)
  })

  it('sends none when the call has lost the render (the CMS then counts it per address)', async () => {
    vi.stubGlobal('tryUseNuxtApp', () => null)

    await fetchPublicPage('school.example.com', '/')

    expect(fetch).toHaveBeenCalledWith('https://api.example/api/public/page', {
      params: { host: 'school.example.com', path: '/' },
      headers: {},
    })
  })
})
