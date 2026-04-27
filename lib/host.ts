interface ParsedHost {
  host: string
  hostname: string
  port: string
}

function readServerRequestHost(): string {
  const event = useRequestEvent()

  if (!event) {
    return ''
  }

  const forwardedHost = event.node.req.headers['x-forwarded-host']
  const host = event.node.req.headers.host

  return String(
    (Array.isArray(forwardedHost) ? forwardedHost[0] : forwardedHost)
    || (Array.isArray(host) ? host[0] : host)
    || ''
  )
}

function firstForwardedValue(value?: string | null): string {
  return (value || '').split(',')[0]?.trim() || ''
}

function stripOriginDecorators(value: string): string {
  const candidate = value.trim()

  if (!candidate) {
    return ''
  }

  if (candidate.includes('://')) {
    try {
      return new URL(candidate).host
    } catch {
      return ''
    }
  }

  return candidate.replace(/[/?#].*$/, '')
}

function parseHost(value?: string | null): ParsedHost {
  const candidate = stripOriginDecorators(firstForwardedValue(value))
    .toLowerCase()
    .replace(/^\.+|\.+$/g, '')

  if (!candidate) {
    return {
      host: '',
      hostname: '',
      port: ''
    }
  }

  if (candidate.startsWith('[')) {
    const closingBracket = candidate.indexOf(']')
    const hostname = closingBracket >= 0 ? candidate.slice(0, closingBracket + 1) : candidate
    const remainder = closingBracket >= 0 ? candidate.slice(closingBracket + 1) : ''
    const port = remainder.startsWith(':') ? remainder.slice(1).replace(/[^\d].*$/, '') : ''

    return {
      host: port ? `${hostname}:${port}` : hostname,
      hostname,
      port
    }
  }

  const portMatch = candidate.match(/^(.*?)(?::(\d+))?$/)
  const hostname = (portMatch?.[1] || candidate).replace(/^\.+|\.+$/g, '')
  const port = portMatch?.[2] || ''

  return {
    host: hostname ? (port ? `${hostname}:${port}` : hostname) : '',
    hostname,
    port
  }
}

function isLocalHostname(hostname: string): boolean {
  return hostname === 'localhost' || hostname.endsWith('.localhost')
}

export function normalizeHost(value?: string | null): string {
  return parseHost(value).host
}

export function normalizeHostname(value?: string | null): string {
  return parseHost(value).hostname
}

export function preferRequestHost(candidateHost?: string | null, requestHost?: string | null): string {
  const candidate = parseHost(candidateHost)
  const request = parseHost(requestHost)

  if (!candidate.host) {
    return request.host
  }

  if (!request.port) {
    return candidate.host
  }

  if (!candidate.port && candidate.hostname === request.hostname) {
    return request.host
  }

  return candidate.host
}

export function isLocalPlatformRequestHost(requestHost?: string | null, platformBaseDomain?: string | null): boolean {
  const request = parseHost(requestHost)
  const platformBase = parseHost(platformBaseDomain)

  if (!request.hostname || !platformBase.hostname || !isLocalHostname(platformBase.hostname)) {
    return false
  }

  if (platformBase.port && request.port && platformBase.port !== request.port) {
    return false
  }

  const suffix = `.${platformBase.hostname}`

  if (!request.hostname.endsWith(suffix)) {
    return false
  }

  const prefix = request.hostname.slice(0, -suffix.length)
  return prefix.length > 0 && !prefix.includes('.')
}

export function getRequestHost(): string {
  if (import.meta.server) {
    return normalizeHost(readServerRequestHost())
  }

  return normalizeHost(window.location.host)
}

export function mergeVaryHeader(existing: string | null | undefined, values: string | string[]): string {
  const incoming = Array.isArray(values) ? values : [values]
  const merged = new Map<string, string>()

  for (const entry of [existing || '', ...incoming]) {
    for (const token of entry.split(',')) {
      const normalized = token.trim()
      if (!normalized) {
        continue
      }

      merged.set(normalized.toLowerCase(), normalized)
    }
  }

  return Array.from(merged.values()).join(', ')
}
