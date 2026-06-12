import { describe, expect, it } from 'vitest'
import {
  collectMotionTargets,
  getNodeMotion,
  resolveSiteMotionIntensity,
} from './motionRuntime'

const node = (overrides: Record<string, unknown>) => ({
  id: 'n1',
  type: 'container',
  styles: {},
  content: [],
  ...overrides,
})

describe('getNodeMotion', () => {
  it('reads a valid annotation', () => {
    expect(
      getNodeMotion(node({ motion: { preset: 'rise', stagger: 0.08, delay: 0.1 } }))
    ).toEqual({ preset: 'rise', stagger: 0.08, delay: 0.1 })
  })

  it('rejects missing or empty presets', () => {
    expect(getNodeMotion(node({}))).toBeNull()
    expect(getNodeMotion(node({ motion: { preset: '  ' } }))).toBeNull()
    expect(getNodeMotion(node({ motion: 'rise' }))).toBeNull()
  })

  it('drops invalid params but keeps the preset', () => {
    expect(
      getNodeMotion(
        node({ motion: { preset: 'fade', delay: -1, stagger: 0, intensity: 'extreme' } })
      )
    ).toEqual({ preset: 'fade' })
  })
})

describe('collectMotionTargets', () => {
  it('collects annotated nodes from nested schemas, skipping unknown presets', () => {
    const schema = [
      node({
        id: 'root',
        content: [
          node({ id: 'a', motion: { preset: 'rise' } }),
          node({
            id: 'b',
            content: [node({ id: 'c', motion: { preset: 'not-a-preset' } })],
          }),
          node({ id: 'd', motion: { preset: 'scale-in' } }),
        ],
      }),
    ]

    expect(collectMotionTargets([schema, null, undefined])).toEqual([
      { nodeId: 'a', motion: { preset: 'rise' } },
      { nodeId: 'd', motion: { preset: 'scale-in' } },
    ])
  })

  it('skips annotated nodes without an id', () => {
    const schema = [node({ id: undefined, motion: { preset: 'fade' } })]
    expect(collectMotionTargets([schema])).toEqual([])
  })

  it('collects webgl backdrop presets', () => {
    const schema = [
      node({ id: 'hero', motion: { preset: 'aurora' } }),
      node({ id: 'cta', motion: { preset: 'silk' } }),
    ]
    expect(collectMotionTargets([schema])).toEqual([
      { nodeId: 'hero', motion: { preset: 'aurora' } },
      { nodeId: 'cta', motion: { preset: 'silk' } },
    ])
  })
})

describe('resolveSiteMotionIntensity', () => {
  it('defaults to balanced', () => {
    expect(resolveSiteMotionIntensity(undefined)).toBe('balanced')
    expect(resolveSiteMotionIntensity({})).toBe('balanced')
    expect(resolveSiteMotionIntensity({ motion: { intensity: 'loud' } })).toBe('balanced')
  })

  it('honours a configured intensity', () => {
    expect(resolveSiteMotionIntensity({ motion: { intensity: 'off' } })).toBe('off')
    expect(resolveSiteMotionIntensity({ motion: { intensity: 'expressive' } })).toBe('expressive')
  })
})
