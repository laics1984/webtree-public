import { describe, expect, it } from 'vitest'
import { getErrorStatusCode, getUpstreamErrorKind, isNotFoundError } from './httpError'

/**
 * The two shapes a failed public-runtime fetch really arrives in.
 *
 * SSR calls the API directly, so `$fetch` rejects with the Laravel body on
 * `data`. A client-side call goes through the Nitro proxy in
 * `server/api/public/*`, which answers with its own envelope. A dispatcher that
 * reads only one of them serves 502 for every unknown URL.
 */
function directApiError(statusCode: number, body: unknown) {
  return { statusCode, statusMessage: 'Not Found', data: body }
}

function proxiedError(statusCode: number) {
  return {
    statusCode,
    statusMessage: 'Not Found',
    data: { error: true, url: '/api/public/resolve', statusCode, message: 'Server Error' },
  }
}

describe('getErrorStatusCode', () => {
  it('reads the status from the top level', () => {
    expect(getErrorStatusCode(directApiError(404, { kind: 'notFound' }))).toBe(404)
  })

  it('reads the status nested in a proxy envelope with none of its own', () => {
    expect(getErrorStatusCode({ data: { statusCode: 404 } })).toBe(404)
  })

  it('treats an unreadable error as a server error, not a missing page', () => {
    expect(getErrorStatusCode(undefined)).toBe(500)
    expect(getErrorStatusCode('boom')).toBe(500)
    expect(getErrorStatusCode({})).toBe(500)
  })
})

describe('getUpstreamErrorKind', () => {
  it('reads the resolver kind off the API body', () => {
    expect(getUpstreamErrorKind(directApiError(404, { kind: 'notFound' }))).toBe('notFound')
  })

  it('reads the resolver kind when a proxy nested the body one level down', () => {
    expect(getUpstreamErrorKind({ data: { statusCode: 404, data: { kind: 'notFound' } } })).toBe('notFound')
  })

  it('has no kind to report for an envelope that carries none', () => {
    expect(getUpstreamErrorKind(proxiedError(404))).toBeNull()
    expect(getUpstreamErrorKind(undefined)).toBeNull()
  })
})

describe('isNotFoundError', () => {
  it('is a 404 for the API shape SSR sees', () => {
    expect(isNotFoundError(directApiError(404, { kind: 'notFound' }))).toBe(true)
  })

  it('is a 404 for the proxy envelope a client-side navigation sees', () => {
    expect(isNotFoundError(proxiedError(404))).toBe(true)
  })

  it('is a 404 on the resolver kind alone, even if the status was rewritten', () => {
    expect(isNotFoundError({ statusCode: 500, data: { kind: 'notFound' } })).toBe(true)
  })

  it('leaves a genuine upstream failure a failure', () => {
    expect(isNotFoundError(directApiError(502, { message: 'Bad gateway' }))).toBe(false)
    expect(isNotFoundError({ statusCode: 500 })).toBe(false)
  })

  it('leaves an unreadable error a failure rather than deindexing a live URL', () => {
    expect(isNotFoundError(undefined)).toBe(false)
    expect(isNotFoundError(new Error('socket hang up'))).toBe(false)
  })
})
