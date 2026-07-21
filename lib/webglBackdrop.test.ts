// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest'
import { mountWebglBackdrops } from './webglBackdrop'

// happy-dom has no WebGL: getContext('webgl') returns null. These tests pin
// the degrade contract — setup failure must leave the host exactly as it was.
describe('mountWebglBackdrops (no WebGL available)', () => {
  it('removes the layer and restores host styles when setup fails', () => {
    const host = document.createElement('div')
    document.body.appendChild(host)

    const kill = mountWebglBackdrops([{ el: host, presetId: 'aurora', energy: 1 }])

    expect(host.querySelector('.wt-webgl-backdrop')).toBeNull()
    expect(host.style.position).toBe('')
    expect(host.style.isolation).toBe('')
    expect(() => kill()).not.toThrow()
  })

  it('ignores unknown preset ids', () => {
    const host = document.createElement('div')
    document.body.appendChild(host)

    const kill = mountWebglBackdrops([
      { el: host, presetId: 'not-a-backdrop', energy: 1 },
    ])

    expect(host.querySelector('.wt-webgl-backdrop')).toBeNull()
    expect(() => kill()).not.toThrow()
  })
})
