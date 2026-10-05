// @vitest-environment happy-dom
import { expect, it, vi } from 'vitest'

it('shares product context across page views, shared-page exposure, enquiry context and WhatsApp clicks', async () => {
  vi.useFakeTimers()
  const productId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
  const sharedId = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'
  window.history.replaceState(null, '', '/products/a')
  const hooks: Record<string, () => void> = {}
  let routeChanged: (to: { path: string }) => void = () => {}
  let intersect: (entries: any[]) => void = () => {}
  const observed: Element[] = []
  const events: any[] = []
  vi.stubGlobal('defineNuxtPlugin', (setup: any) => setup)
  vi.stubGlobal('useRouter', () => ({ afterEach: (handler: any) => { routeChanged = handler } }))
  vi.stubGlobal('IntersectionObserver', class {
    constructor(callback: any) { intersect = callback }
    observe(element: Element) { observed.push(element) }
    disconnect() {}
  })
  vi.stubGlobal('MutationObserver', class { observe() {} })
  Object.defineProperty(navigator, 'sendBeacon', { configurable: true, value: (_url: string, body: string) => { events.push(...JSON.parse(body).events); return true } })
  const plugin = (await import('./tracking.client')).default as any
  const { provide } = plugin({ hook: (name: string, handler: any) => { hooks[name] = handler } })
  const bindings = [
    { productId, path: '/products/a', nodeId: '' },
    { productId: sharedId, path: '/services', nodeId: 'card-b' },
  ]
  provide.wtConfigureProducts(bindings)
  hooks['app:mounted']()
  expect(events.filter(e => e.t === 'pageview')).toHaveLength(1)
  expect(events[0].m.productId).toBe(productId)
  expect(provide.wtProductContext().product_id).toBe(productId)

  routeChanged({ path: '/services' })
  document.body.innerHTML = '<section data-wt-node-id="card-b"><form><button>Enquire</button></form></section><a href="https://wa.me/60123456789">WhatsApp</a>'
  provide.wtConfigureProducts(bindings)
  await vi.advanceTimersByTimeAsync(25)
  const card = document.querySelector('section')!
  expect(observed).toContain(card)
  intersect([{ target: card, isIntersecting: true, intersectionRatio: 0.7 }])
  intersect([{ target: card, isIntersecting: true, intersectionRatio: 0.7 }])
  await vi.advanceTimersByTimeAsync(5000)
  expect(events.filter(e => e.t === 'product_view')).toHaveLength(1)
  expect(events.find(e => e.t === 'product_view').m.productId).toBe(sharedId)
  expect(provide.wtProductContext(document.querySelector('form')).product_id).toBe(sharedId)
  routeChanged({ path: '/contact' })
  document.querySelector('a')!.dispatchEvent(new MouseEvent('click', { bubbles: true }))
  expect(events.find(e => e.t === 'whatsapp_click').m.productId).toBe(sharedId)
  expect(events.filter(e => e.t === 'pageview').at(-1).m).toBeUndefined()
  const context = provide.wtProductContext()
  expect(context.product_path).toBe('/services')
  expect(context.session_id).toMatch(/^[a-z0-9]{20}$/)
  vi.clearAllTimers()
  vi.useRealTimers()
  vi.unstubAllGlobals()
})
