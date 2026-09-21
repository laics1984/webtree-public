// Visitor location for the first-party tracking proxy — implements "Visitor
// location" in webtree-cms-api/docs/tracking-contract.md.
//
// Cloudflare geolocates every request for free (request.cf, surfaced by Nitro
// as event.context.cf). The proxy forwards the parts the API keeps as one
// URL-encoded header; the API validates and rounds each part, so this stays a
// plain encoder.

/** The subset of Cloudflare's IncomingRequestCfProperties this needs. */
export interface EdgeGeo {
  country?: string | null
  region?: string | null
  city?: string | null
  latitude?: string | number | null
  longitude?: string | number | null
}

/** `country=MY&region=…&city=…&lat=…&lng=…`, or null when the country is unknown. */
export function encodeVisitorGeo(cf: EdgeGeo | null | undefined): string | null {
  const country = typeof cf?.country === 'string' ? cf.country : ''
  if (!/^[A-Z]{2}$/.test(country)) {
    return null
  }

  const params = new URLSearchParams({ country })
  const parts: [key: string, value: unknown][] = [
    ['region', cf?.region],
    ['city', cf?.city],
    ['lat', cf?.latitude],
    ['lng', cf?.longitude]
  ]

  for (const [key, value] of parts) {
    if ((typeof value === 'string' && value !== '') || typeof value === 'number') {
      params.set(key, String(value))
    }
  }

  return params.toString()
}
