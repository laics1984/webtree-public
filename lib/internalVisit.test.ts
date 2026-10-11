import { describe, expect, it } from 'vitest'
import { isInternalVisit } from './internalVisit'

function memoryStorage() {
  const data = new Map<string, string>()
  return {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => { data.set(key, value) },
    removeItem: (key: string) => { data.delete(key) },
  }
}

describe('isInternalVisit', () => {
  it('a normal visit is tracked', () => {
    expect(isInternalVisit('', memoryStorage())).toBe(false)
    expect(isInternalVisit('?utm_source=fowable-offer', memoryStorage())).toBe(false)
  })

  it('the console preview link stops tracking and is remembered for later visits', () => {
    const storage = memoryStorage()
    expect(isInternalVisit('?wt_internal=1', storage)).toBe(true)
    expect(isInternalVisit('', storage)).toBe(true)
    expect(isInternalVisit('?utm_source=fowable-offer', storage)).toBe(true)
  })

  it('wt_internal=0 turns tracking back on', () => {
    const storage = memoryStorage()
    isInternalVisit('?wt_internal=1', storage)
    expect(isInternalVisit('?wt_internal=0', storage)).toBe(false)
    expect(isInternalVisit('', storage)).toBe(false)
  })

  it('a storage that refuses still honours the flag on this page, and never throws', () => {
    const refusing = {
      getItem: () => { throw new Error('denied') },
      setItem: () => { throw new Error('denied') },
      removeItem: () => { throw new Error('denied') },
    }
    expect(isInternalVisit('?wt_internal=1', refusing)).toBe(true)
    expect(isInternalVisit('', refusing)).toBe(false)
    expect(isInternalVisit('?wt_internal=1', null)).toBe(true)
  })
})
