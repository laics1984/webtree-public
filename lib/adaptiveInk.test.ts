// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest'
import {
  type BandRect,
  bandOfElement,
  inkClassForBand,
  pickBandAtY,
  probeY,
} from './adaptiveInk'

const rect = (top: number, bottom: number, band: 'light' | 'dark'): BandRect => ({
  top,
  bottom,
  band,
})

const el = (className: string) => {
  const node = document.createElement('section')
  node.className = className
  return node
}

describe('bandOfElement', () => {
  it('reads the generator marker', () => {
    expect(bandOfElement(el('wt-band-dark'))).toBe('dark')
    expect(bandOfElement(el('wt-band-light'))).toBe('light')
  })

  it('ignores a section carrying neither', () => {
    expect(bandOfElement(el('wt-clamp'))).toBeNull()
  })

  it('reads the marker among other classes', () => {
    expect(bandOfElement(el('builder-column-cell wt-band-dark'))).toBe('dark')
  })
})

describe('pickBandAtY', () => {
  const page = [rect(-400, 100, 'dark'), rect(100, 600, 'light'), rect(600, 1200, 'dark')]

  it('takes the section covering the probe', () => {
    expect(pickBandAtY(page, 50)).toBe('dark')
    expect(pickBandAtY(page, 300)).toBe('light')
    expect(pickBandAtY(page, 900)).toBe('dark')
  })

  it('flips exactly at the seam — the incoming section wins', () => {
    expect(pickBandAtY(page, 99)).toBe('dark')
    expect(pickBandAtY(page, 100)).toBe('light')
  })

  it('holds the last section below the end of the page (the footer)', () => {
    expect(pickBandAtY(page, 5000)).toBe('dark')
  })

  it('holds the first section above the start (the overlay gap)', () => {
    expect(pickBandAtY(page, -900)).toBe('dark')
  })

  it('is null only when there is nothing marked', () => {
    expect(pickBandAtY([], 0)).toBeNull()
  })

  it('handles a single-section page at every probe', () => {
    const one = [rect(0, 800, 'light')]
    expect(pickBandAtY(one, -10)).toBe('light')
    expect(pickBandAtY(one, 400)).toBe('light')
    expect(pickBandAtY(one, 9999)).toBe('light')
  })

  it('lets a later section win when two overlap the probe', () => {
    // Negative margins / shaped dividers can overlap adjacent sections; the
    // one further down the document is the one drawn on top.
    const overlapping = [rect(0, 500, 'light'), rect(400, 900, 'dark')]
    expect(pickBandAtY(overlapping, 450)).toBe('dark')
  })
})

describe('probeY', () => {
  it('probes the header midline, not its top edge', () => {
    // The pill sits inset from the top of its own root, so its top edge can
    // still be over the previous section after the bar has moved on.
    expect(probeY({ top: 12, height: 60 })).toBe(42)
  })
})

describe('inkClassForBand', () => {
  it('names the ink, not the band it came from', () => {
    expect(inkClassForBand('dark')).toBe('wt-page-header--ink-light')
    expect(inkClassForBand('light')).toBe('wt-page-header--ink-dark')
  })

  it('asks for no class when the band is unknown', () => {
    expect(inkClassForBand(null)).toBeNull()
  })
})
