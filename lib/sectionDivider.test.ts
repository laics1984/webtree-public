import { describe, expect, it } from 'vitest'

import {
  DEFAULT_DIVIDER_COLOR,
  getDividerColor,
  getDividerHeight,
  getDividerPath,
  getDividerTransform,
  getNodeDivider,
  hasNodeDivider,
} from './sectionDivider'

describe('getNodeDivider', () => {
  it('returns null when there is no divider field', () => {
    expect(getNodeDivider({ type: 'section' })).toBeNull()
    expect(getNodeDivider(null)).toBeNull()
  })

  it('drops edges with unknown shapes', () => {
    expect(
      getNodeDivider({ divider: { bottom: { shape: 'spiral' } } })
    ).toBeNull()
  })

  it('normalizes a renderable edge', () => {
    const divider = getNodeDivider({
      divider: { bottom: { shape: 'wave', height: 90, flipX: true } },
    })
    expect(divider?.bottom).toMatchObject({ shape: 'wave', height: 90, flipX: true })
    expect(divider?.top).toBeNull()
    expect(hasNodeDivider({ divider: { bottom: { shape: 'wave' } } })).toBe(true)
  })
})

describe('edge resolution', () => {
  it('falls back to the shape default height and clamps out-of-range values', () => {
    expect(getDividerHeight({ shape: 'slant' })).toBe(80)
    expect(getDividerHeight({ shape: 'wave', height: 5 })).toBe(8)
    expect(getDividerHeight({ shape: 'wave', height: 9999 })).toBe(400)
  })

  it('defaults the color to the page background token', () => {
    expect(getDividerColor({ shape: 'curve' })).toBe(DEFAULT_DIVIDER_COLOR)
    expect(getDividerColor({ shape: 'curve', color: '#ff0000' })).toBe('#ff0000')
  })

  it('orients the path for top edges and horizontal flips', () => {
    expect(getDividerTransform('bottom', false)).toBe('scale(1, 1)')
    expect(getDividerTransform('top', false)).toBe('scale(1, -1)')
    expect(getDividerTransform('bottom', true)).toBe('scale(-1, 1)')
    expect(getDividerTransform('top', true)).toBe('scale(-1, -1)')
  })

  it('exposes a path for every known shape', () => {
    for (const shape of ['slant', 'curve', 'wave', 'peak'] as const) {
      expect(getDividerPath({ shape })).not.toBe('')
    }
  })
})
