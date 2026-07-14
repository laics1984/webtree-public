import { normalizeHost } from '~/lib/host'

// First-party tracking snippet — implements webtree-cms-api/docs/tracking-contract.md.
// Events batch in memory and post to the same-origin Nitro proxy (/api/public/events),
// which forwards them to the CMS with the visitor's real IP/UA. Fire-and-forget:
// nothing here may throw, retry, or log where a visitor could see it.

type TrackedEventType = 'pageview' | 'cta_click' | 'form_submit' | 'whatsapp_click' | 'scroll_depth'

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

const ENDPOINT = '/api/public/events'
const SESSION_KEY = 'wt_sid'
const FLUSH_INTERVAL_MS = 5000
const MAX_BATCH_SIZE = 20
const MAX_QUEUE_SIZE = 100
const MAX_META_LENGTH = 80

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
  return bare.startsWith('/') ? bare : `/${bare}`
}

export default defineNuxtPlugin((nuxtApp) => {
  const noop: WtTrack = () => {}

  // Builder preview renders the site inside an iframe — never track it.
  if (window.self !== window.top) {
    return { provide: { wtTrack: noop } }
  }

  const host = normalizeHost(window.location.host)
  if (!host) {
    return { provide: { wtTrack: noop } }
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

  function enqueue(event: TrackedEvent, immediate = false) {
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
    const event: TrackedEvent = { t: 'pageview', p: path, ts: Date.now() }
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

  window.addEventListener('scroll', measureScrollDepth, { passive: true })
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
        enqueue({ t: 'whatsapp_click', p: currentPath, ts: Date.now() })
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
    currentPath = nextPath
    resetScrollDepth()
    trackPageview(nextPath, false)
  })

  window.setInterval(flush, FLUSH_INTERVAL_MS)

  const finalFlush = () => {
    emitScrollDepth()
    flush()
  }
  window.addEventListener('pagehide', finalFlush)
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      finalFlush()
    }
  })

  trackPageview(currentPath, true)

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

  return { provide: { wtTrack } }
})
