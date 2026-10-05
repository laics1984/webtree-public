import { createEngagementClock } from '~/lib/engagementClock'
import { toGtagEvent, toGtagPageviewEvent } from '~/lib/googleAnalytics'
import { normalizeHost } from '~/lib/host'
import { detailProduct, recentProduct, type ProductBinding, type ProductInterest } from '~/lib/productTracking'

// First-party tracking snippet — implements webtree-cms-api/docs/tracking-contract.md.
// Events batch in memory and post to the same-origin Nitro proxy (/api/public/events),
// which forwards them to the CMS with the visitor's real IP/UA. Fire-and-forget:
// nothing here may throw, retry, or log where a visitor could see it.

type TrackedEventType = 'pageview' | 'cta_click' | 'form_submit' | 'whatsapp_click' | 'scroll_depth' | 'engagement' | 'product_view'

interface TrackedEvent {
  t: TrackedEventType
  p: string
  r?: string
  utm?: { s?: string; m?: string; c?: string }
  v?: number
  m?: Record<string, string>
  ts: number
}

type WtTrack = (type: 'form_submit' | 'cta_click', meta?: Record<string, string>) => void

// Defined by the gtag snippet PublicSiteShell injects when the owner enabled GA.
type GtagWindow = Window & { gtag?: (...args: unknown[]) => void }

const ENDPOINT = '/api/public/events'
const SESSION_KEY = 'wt_sid'
const FLUSH_INTERVAL_MS = 5000
const MAX_BATCH_SIZE = 20
const MAX_QUEUE_SIZE = 100
const MAX_META_LENGTH = 80

const ACTIVITY_EVENTS = ['pointerdown', 'pointermove', 'keydown'] as const

const SID_ALPHABET = 'abcdefghijklmnopqrstuvwxyz0123456789'
const WHATSAPP_HREF_PATTERN = /^(?:https?:\/\/(?:www\.)?(?:wa\.me|api\.whatsapp\.com)\b|whatsapp:)/i

function generateSessionId(): string {
  const bytes = new Uint8Array(20)
  if (window.crypto?.getRandomValues) {
    window.crypto.getRandomValues(bytes)
  } else {
    for (let i = 0; i < bytes.length; i++) {
      bytes[i] = Math.floor(Math.random() * 256)
    }
  }

  let sid = ''
  for (const byte of bytes) {
    sid += SID_ALPHABET[byte % SID_ALPHABET.length]
  }
  return sid
}

function clampMeta(value: string): string {
  return value.slice(0, MAX_META_LENGTH)
}

function normalizePath(path: string): string {
  const bare = (path || '/').split(/[?#]/)[0] || '/'
  const normalized = (bare.startsWith('/') ? bare : `/${bare}`).toLowerCase().replace(/\/$/, '')
  return normalized || '/'
}

export default defineNuxtPlugin((nuxtApp) => {
  const noop: WtTrack = () => {}
  const disabled = { provide: { wtTrack: noop, wtConfigureProducts: (_bindings: ProductBinding[]) => {}, wtProductContext: (_element?: Element | null) => ({}) } }

  // Builder preview renders the site inside an iframe — never track it.
  if (window.self !== window.top) {
    return disabled
  }

  const host = normalizeHost(window.location.host)
  if (!host) {
    return disabled
  }

  // sessionStorage may be unavailable (privacy modes); fall back to a
  // per-pageload id rather than disabling tracking.
  let isNewSession = true
  let sid = ''
  try {
    const existing = window.sessionStorage.getItem(SESSION_KEY)
    if (existing && /^[a-z0-9]{8,20}$/.test(existing)) {
      sid = existing
      isNewSession = false
    }
  } catch {}
  if (!sid) {
    sid = generateSessionId()
    try {
      window.sessionStorage.setItem(SESSION_KEY, sid)
    } catch {}
  }

  let currentPath = normalizePath(window.location.pathname)
  const queue: TrackedEvent[] = []
  let productBindings: ProductBinding[] = []
  let interest: ProductInterest | null = null
  const INTEREST_KEY = 'wt_product_interest'
  try { interest = JSON.parse(window.sessionStorage.getItem(INTEREST_KEY) || 'null') } catch {}
  function rememberProduct(productId?: string, path = currentPath) {
    if (!productId) return
    interest = { productId, at: Date.now(), path: normalizePath(path) }
    try { window.sessionStorage.setItem(INTEREST_KEY, JSON.stringify(interest)) } catch {}
  }
  function productAt(element?: Element | null): string | undefined {
    const candidates = productBindings.filter(b => b.path === currentPath.toLowerCase() && b.nodeId !== '')
    for (let node = element; node; node = node.parentElement) {
      const id = node.getAttribute('data-wt-node-id')
      const match = candidates.find(b => b.nodeId === id)
      if (match) return match.productId
    }
    return detailProduct(productBindings, currentPath)
  }
  function productContext(element?: Element | null) {
    const explicit = productAt(element)
    const productId = explicit || recentProduct(interest, Date.now())
    const path = explicit ? currentPath.toLowerCase().replace(/\/$/, '') || '/' : typeof interest?.path === 'string' ? normalizePath(interest.path) : undefined
    return { session_id: sid, ...(productId ? { product_id: productId, ...(path ? { product_path: path } : {}) } : {}) }
  }

  let exposureObserver: IntersectionObserver | null = null
  let mutationObserver: MutationObserver | null = null
  let exposurePath = ''
  let scanFrame = 0
  const exposed = new Set<string>()
  let observed = new WeakSet<Element>()
  function configureProducts(bindings: ProductBinding[]) {
    productBindings = bindings
    if (exposurePath !== currentPath) {
      exposed.clear()
      exposureObserver?.disconnect()
      observed = new WeakSet<Element>()
      exposurePath = currentPath
    }
    if (!exposureObserver && typeof IntersectionObserver !== 'undefined') {
      exposureObserver = new IntersectionObserver(entries => {
        for (const entry of entries) {
          if (!entry.isIntersecting || entry.intersectionRatio < 0.1 || document.visibilityState !== 'visible') continue
          const nodeId = entry.target.getAttribute('data-wt-node-id')
          const binding = productBindings.find(b => b.path === currentPath.toLowerCase() && b.nodeId === nodeId && b.nodeId !== '')
          if (!binding || exposed.has(binding.productId)) continue
          exposed.add(binding.productId)
          rememberProduct(binding.productId)
          enqueue({ t: 'product_view', p: currentPath, m: { productId: binding.productId, nodeId: binding.nodeId }, ts: Date.now() })
        }
      }, { threshold: 0.1 })
    }
    const scan = () => {
      if (scanFrame) return
      scanFrame = window.requestAnimationFrame(() => {
        scanFrame = 0
        const ids = new Set(productBindings.filter(b => b.path === currentPath.toLowerCase() && b.nodeId !== '').map(b => b.nodeId))
        if (!ids.size) return
        for (const element of document.querySelectorAll('[data-wt-node-id]')) {
          if (ids.has(element.getAttribute('data-wt-node-id') || '') && !observed.has(element)) {
            observed.add(element)
            exposureObserver?.observe(element)
          }
        }
      })
    }
    if (!mutationObserver && productBindings.some(b => b.nodeId !== '')) {
      mutationObserver = new MutationObserver(scan)
      mutationObserver.observe(document.body, { childList: true, subtree: true })
    }
    scan()
  }

  function send(events: TrackedEvent[]) {
    const body = JSON.stringify({ host, sid, events })
    try {
      if (navigator.sendBeacon?.(ENDPOINT, body)) {
        return
      }
    } catch {}
    try {
      fetch(ENDPOINT, {
        method: 'POST',
        body,
        keepalive: true,
        headers: { 'Content-Type': 'text/plain' }
      }).catch(noop)
    } catch {}
  }

  function flush() {
    while (queue.length) {
      send(queue.splice(0, MAX_BATCH_SIZE))
    }
  }

  // Every detected event passes through enqueue, so this is the single place
  // the owner's GA property is fed — no second set of listeners.
  function forwardToGoogleAnalytics(event: TrackedEvent) {
    const gtag = (window as GtagWindow).gtag
    if (typeof gtag !== 'function') {
      return
    }
    // config's automatic page_view is disabled, so pageviews are sent
    // explicitly here — the same route-change detection already used for
    // our own first-party analytics feeds GA too, once per navigation.
    if (event.t === 'product_view') return
    const command = event.t === 'pageview' ? toGtagPageviewEvent(event.p) : toGtagEvent(event.t, event.m)
    if (!command) {
      return
    }
    try {
      gtag(...command)
    } catch {}
  }

  function enqueue(event: TrackedEvent, immediate = false) {
    forwardToGoogleAnalytics(event)
    if (queue.length >= MAX_QUEUE_SIZE) {
      return
    }
    queue.push(event)
    if (immediate) {
      flush()
    }
  }

  function externalReferrer(): string {
    const referrer = document.referrer
    if (!referrer) {
      return ''
    }
    try {
      return new URL(referrer).host === window.location.host ? '' : referrer
    } catch {
      return ''
    }
  }

  function landingUtm(): TrackedEvent['utm'] {
    const params = new URLSearchParams(window.location.search)
    const pick = (key: string) => clampMeta((params.get(key) || '').trim()) || undefined
    const utm = { s: pick('utm_source'), m: pick('utm_medium'), c: pick('utm_campaign') }
    return utm.s || utm.m || utm.c ? utm : undefined
  }

  function trackPageview(path: string, landing: boolean) {
    const productId = detailProduct(productBindings, path)
    rememberProduct(productId)
    const event: TrackedEvent = { t: 'pageview', p: path, ...(productId ? { m: { productId } } : {}), ts: Date.now() }
    // Referrer on the first pageview of a session, or whenever it is external.
    const referrer = isNewSession && landing ? document.referrer : externalReferrer()
    if (landing && referrer) {
      event.r = referrer
    }
    if (landing) {
      const utm = landingUtm()
      if (utm) {
        event.utm = utm
      }
    }
    enqueue(event, true)
  }

  // Scroll depth: remember the deepest bucket reached per page visit and emit
  // it once, at route change or final flush — not one event per threshold.
  let maxScrollBucket = 0
  let scrollDepthEmitted = false

  function measureScrollDepth() {
    const scrollHeight = document.documentElement?.scrollHeight || 0
    if (scrollHeight <= 0) {
      return
    }
    const depth = (window.scrollY + window.innerHeight) / scrollHeight
    const bucket = depth >= 0.99 ? 100 : depth >= 0.75 ? 75 : depth >= 0.5 ? 50 : depth >= 0.25 ? 25 : 0
    if (bucket > maxScrollBucket) {
      maxScrollBucket = bucket
    }
  }

  function emitScrollDepth() {
    if (scrollDepthEmitted || !maxScrollBucket) {
      return
    }
    scrollDepthEmitted = true
    enqueue({ t: 'scroll_depth', p: currentPath, v: maxScrollBucket, ts: Date.now() })
  }

  function resetScrollDepth() {
    maxScrollBucket = 0
    scrollDepthEmitted = false
    measureScrollDepth()
  }

  // Engaged time: foreground seconds on the current page, emitted when the
  // visit is left (route change) or put away (tab hidden, page unloading).
  const engagementClock = createEngagementClock(document.visibilityState === 'visible')

  function emitEngagement() {
    const seconds = engagementClock.take()
    if (seconds >= 1) {
      const productId = detailProduct(productBindings, currentPath)
      enqueue({ t: 'engagement', p: currentPath, v: seconds, ...(productId ? { m: { productId } } : {}), ts: Date.now() })
    }
  }

  const markActivity = () => engagementClock.activity()
  for (const type of ACTIVITY_EVENTS) {
    window.addEventListener(type, markActivity, { passive: true })
  }

  window.addEventListener(
    'scroll',
    () => {
      measureScrollDepth()
      markActivity()
    },
    { passive: true }
  )
  measureScrollDepth()

  // One delegated listener covers CTA clicks (data-wt-cta on the element or an
  // ancestor) and WhatsApp links; capture phase so stopPropagation can't hide them.
  document.addEventListener(
    'click',
    (event) => {
      const target = event.target instanceof Element ? event.target : null
      if (!target) {
        return
      }

      const ctaId = target.closest('[data-wt-cta]')?.getAttribute('data-wt-cta')?.trim()
      if (ctaId) {
        enqueue({ t: 'cta_click', p: currentPath, m: { ctaId: clampMeta(ctaId) }, ts: Date.now() })
      }

      const href = target.closest('a[href]')?.getAttribute('href') || ''
      if (WHATSAPP_HREF_PATTERN.test(href)) {
        const context = productContext(target)
        const meta = context.product_id ? { productId: context.product_id } : undefined
        rememberProduct(context.product_id, context.product_path)
        enqueue({ t: 'whatsapp_click', p: currentPath, m: meta, ts: Date.now() }, true)
      }
    },
    true
  )

  const router = useRouter()
  router.afterEach((to) => {
    const nextPath = normalizePath(to.path)
    // Also skips the router's initial navigation — the landing pageview below covers it.
    if (nextPath === currentPath) {
      return
    }
    emitScrollDepth()
    emitEngagement()
    currentPath = nextPath
    resetScrollDepth()
    trackPageview(nextPath, false)
    configureProducts(productBindings)
  })

  window.setInterval(flush, FLUSH_INTERVAL_MS)

  const finalFlush = () => {
    emitScrollDepth()
    emitEngagement()
    flush()
  }
  window.addEventListener('pagehide', finalFlush)
  document.addEventListener('visibilitychange', () => {
    const visible = document.visibilityState === 'visible'
    // Stop (or restart) the clock first, so a hidden tab's flush carries
    // exactly the time up to hiding.
    engagementClock.setVisible(visible)
    if (visible) {
      exposureObserver?.disconnect()
      observed = new WeakSet<Element>()
      configureProducts(productBindings)
    }
    if (!visible) {
      finalFlush()
    }
  })

  // Shell config is installed by mounted components before app:mounted.
  nuxtApp.hook('app:mounted', () => trackPageview(currentPath, true))

  const wtTrack: WtTrack = (type, meta) => {
    const event: TrackedEvent = { t: type, p: currentPath, ts: Date.now() }
    if (meta) {
      const clamped: Record<string, string> = {}
      for (const [key, value] of Object.entries(meta)) {
        clamped[key] = clampMeta(String(value))
      }
      event.m = clamped
    }
    // Conversions are worth a flush of their own — don't wait out the interval.
    enqueue(event, true)
  }

  return { provide: { wtTrack, wtConfigureProducts: configureProducts, wtProductContext: productContext } }
})
