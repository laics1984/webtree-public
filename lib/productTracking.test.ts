import { describe, expect, it } from 'vitest'
import { detailProduct, recentProduct, PRODUCT_INTEREST_TTL_MS } from './productTracking'

const id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
describe('product tracking context', () => {
  it('uses detail-page bindings and never promotes a shared block to a full page view', () => {
    const bindings = [{ productId: id, path: '/products/a', nodeId: '' }, { productId: 'shared', path: '/services', nodeId: 'card' }]
    expect(detailProduct(bindings, '/Products/A/')).toBe(id)
    expect(detailProduct(bindings, '/services')).toBeUndefined()
    expect(detailProduct(bindings, '/unknown')).toBeUndefined()
  })
  it('expires interest after 30 minutes and ignores malformed or future state', () => {
    const now = 2_000_000
    expect(recentProduct({ productId: id, at: now - 100 }, now)).toBe(id)
    expect(recentProduct({ productId: id, at: now - PRODUCT_INTEREST_TTL_MS }, now)).toBeUndefined()
    expect(recentProduct({ productId: id, at: now + 1 }, now)).toBeUndefined()
    expect(recentProduct({ productId: 'invalid', at: now }, now)).toBeUndefined()
    expect(recentProduct(null, now)).toBeUndefined()
  })
})
