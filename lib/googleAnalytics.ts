// Google Analytics (GA4) for the owner's own property — see
// webtree-cms-api/specs/public-site-api.md (`site.googleAnalytics`).
//
// Page views are left to gtag itself: its default config sends the landing
// page_view, and GA4 Enhanced Measurement (on by default) sends one per SPA
// history change. Sending our own as well would double-count every navigation,
// so only the conversions GA cannot see on its own are forwarded.

// Keep in lockstep with GoogleAnalyticsConfig::MEASUREMENT_ID_PATTERN. Checked
// again here because the ID is interpolated into a script.
const MEASUREMENT_ID_PATTERN = /^G-[A-Z0-9]{4,20}$/

export type GtagCommand = [command: 'event', name: string, params: Record<string, string>]

// First-party event type → GA4 event name. `form_submit` maps to GA's
// recommended `generate_lead` (markable as a key event) and so never collides
// with Enhanced Measurement's own, less reliable, `form_submit`.
const FORWARDED_EVENTS: Readonly<Record<string, string>> = {
  cta_click: 'cta_click',
  form_submit: 'generate_lead',
  whatsapp_click: 'whatsapp_click'
}

export function isValidMeasurementId(id: unknown): id is string {
  return typeof id === 'string' && MEASUREMENT_ID_PATTERN.test(id)
}

export function buildGtagScripts(measurementId: string) {
  if (!isValidMeasurementId(measurementId)) {
    return []
  }

  return [
    {
      key: 'wt-ga-loader',
      src: `https://www.googletagmanager.com/gtag/js?id=${measurementId}`,
      async: true
    },
    {
      key: 'wt-ga-init',
      children:
        'window.dataLayer=window.dataLayer||[];' +
        'function gtag(){dataLayer.push(arguments);}' +
        // Never configure inside the builder preview iframe: without a config
        // gtag sends nothing, same rule as the first-party tracker.
        'if(window.self===window.top){' +
        "gtag('js',new Date());" +
        `gtag('config','${measurementId}');` +
        '}'
    }
  ]
}

function toSnakeCase(key: string): string {
  return key.replace(/[A-Z]/g, (char) => `_${char.toLowerCase()}`)
}

/** The gtag command for a first-party event, or null when GA should not get it. */
export function toGtagEvent(type: string, meta?: Record<string, string>): GtagCommand | null {
  const name = FORWARDED_EVENTS[type]
  if (!name) {
    return null
  }

  const params: Record<string, string> = {}
  for (const [key, value] of Object.entries(meta ?? {})) {
    params[toSnakeCase(key)] = value
  }

  return ['event', name, params]
}
