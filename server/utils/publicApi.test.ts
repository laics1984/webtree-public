import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { H3Event } from 'h3'
import { fetchPublicApi } from './publicApi'

describe('public reads proxied for the browser', () => {
  const fetch = vi.fn(async () => ({ ok: true }))

  beforeEach(() => {
    fetch.mockClear()
    vi.stubGlobal('$fetch', fetch)
    vi.stubGlobal('useRuntimeConfig', () => ({ publicApiBase: 'https://api.example', rendererProxySecret: 'renderer-key' }))
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('forwards the read with the visitor behind the request', async () => {
    const event = {
      node: { req: { headers: { 'cf-connecting-ip': '198.51.100.4', 'user-agent': 'Safari' }, socket: { remoteAddress: '10.0.0.1' } } },
    } as unknown as H3Event

    await expect(fetchPublicApi(event, 'page', { host: 'school.example.com', path: '/' })).resolves.toEqual({ ok: true })

    expect(fetch).toHaveBeenCalledWith('https://api.example/api/public/page', {
      params: { host: 'school.example.com', path: '/' },
      headers: {
        'X-Wt-Client-Ip': '198.51.100.4',
        'X-Wt-User-Agent': 'Safari',
        'X-Wt-Proxy-Key': 'renderer-key',
      },
    })
  })
})
