export interface ProductBinding { productId: string; path: string; nodeId: string }
export interface ProductInterest { productId: string; at: number; path?: string }
export const PRODUCT_INTEREST_TTL_MS = 30 * 60 * 1000

export function detailProduct(bindings: ProductBinding[], path: string): string | undefined {
  const normalized = path.toLowerCase().replace(/\/$/, '') || '/'
  return bindings.find(b => b.path === normalized && b.nodeId === '')?.productId
}

export function recentProduct(value: unknown, now: number): string | undefined {
  if (!value || typeof value !== 'object') return undefined
  const interest = value as ProductInterest
  return typeof interest.productId === 'string' && /^[a-f0-9-]{36}$/i.test(interest.productId)
    && Number.isFinite(interest.at) && interest.at <= now && now - interest.at < PRODUCT_INTEREST_TTL_MS
    ? interest.productId : undefined
}
