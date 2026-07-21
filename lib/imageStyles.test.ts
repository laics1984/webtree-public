import { describe, expect, it } from 'vitest'
import { getImageElementStyles, getImageWrapperStyles } from './imageStyles'

describe('getImageWrapperStyles', () => {
  it('clips rounded image wrappers so the child bitmap follows the radius', () => {
    expect(
      getImageWrapperStyles({
        width: '112px',
        height: '112px',
        borderRadius: '9999px',
        objectFit: 'cover',
        objectPosition: 'center',
      })
    ).toEqual({
      width: '112px',
      height: '112px',
      borderRadius: '9999px',
      overflow: 'hidden',
    })
  })

  it('keeps explicit wrapper overflow values', () => {
    expect(
      getImageWrapperStyles({
        borderRadius: '24px',
        overflow: 'visible',
      }).overflow
    ).toBe('visible')
  })
})

describe('getImageElementStyles', () => {
  it('puts image-fit styles and radius on the img element', () => {
    expect(
      getImageElementStyles({
        borderRadius: '9999px',
        objectFit: 'cover',
        objectPosition: 'top',
      })
    ).toEqual({
      objectFit: 'cover',
      objectPosition: 'top',
      borderRadius: '9999px',
    })
  })
})
