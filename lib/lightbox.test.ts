// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  collectLightboxGroupIds,
  readGroupImages,
  startLightboxRuntime,
  stepIndex,
  toSlide,
} from './lightbox'

const node = (overrides: Record<string, unknown>) => ({
  id: 'n1',
  type: 'container',
  styles: {},
  content: [],
  ...overrides,
})

describe('collectLightboxGroupIds', () => {
  it('finds a marked grid nested inside a section', () => {
    const tree = node({
      id: 'section',
      content: [
        node({ id: 'header' }),
        node({ id: 'grid', type: '3Col', lightbox: true }),
      ],
    })
    expect(collectLightboxGroupIds([[tree]])).toEqual(['grid'])
  })

  it('requires the marker to be literally true', () => {
    // Same contract as headerOverlaySafe: a truthy string is not the marker.
    const truthy = node({ id: 'grid', lightbox: 'true' })
    const falsy = node({ id: 'grid2', lightbox: false })
    expect(collectLightboxGroupIds([[truthy, falsy]])).toEqual([])
  })

  it('ignores an unmarked tree entirely', () => {
    expect(collectLightboxGroupIds([[node({ content: [node({ id: 'x' })] })]])).toEqual([])
  })

  it('does not descend into a marked node, so nested markers yield one group', () => {
    const tree = node({
      id: 'outer',
      lightbox: true,
      content: [node({ id: 'inner', lightbox: true })],
    })
    expect(collectLightboxGroupIds([[tree]])).toEqual(['outer'])
  })

  it('walks every supplied schema and de-duplicates ids', () => {
    const grid = node({ id: 'grid', lightbox: true })
    expect(collectLightboxGroupIds([[grid], [grid]])).toEqual(['grid'])
  })
})

const mountGrid = (html: string) => {
  document.body.innerHTML = `<div data-wt-node-id="grid">${html}</div>`
  return document.querySelector<HTMLElement>('[data-wt-node-id="grid"]')!
}

const tile = (src: string, extra = '') =>
  `<div class="wt-image-block"><img class="wt-image" src="${src}" alt="${src} alt" ${extra}/></div>`

// A slide's `src` comes from `currentSrc`, i.e. the URL the browser actually
// resolved — absolute, and what the viewer's own <img> needs.
const resolved = (src: string) => new URL(src, document.baseURI).href

afterEach(() => {
  document.body.innerHTML = ''
  document.getElementById('wt-lightbox-runtime')?.remove()
})

describe('readGroupImages', () => {
  it('returns rendered images in DOM order', () => {
    const root = mountGrid(tile('a.jpg') + tile('b.jpg') + tile('c.jpg'))
    expect(readGroupImages(root).map((i) => i.getAttribute('src'))).toEqual([
      'a.jpg',
      'b.jpg',
      'c.jpg',
    ])
  })

  it('skips linked tiles — navigation wins over enlargement', () => {
    const root = mountGrid(
      tile('a.jpg') +
        `<div class="wt-image-block"><a class="wt-image-link" href="/case-study"><img class="wt-image" src="linked.jpg" alt="linked"/></a></div>` +
        tile('c.jpg')
    )
    expect(readGroupImages(root).map((i) => i.getAttribute('src'))).toEqual(['a.jpg', 'c.jpg'])
  })

  it('skips images with no src', () => {
    const root = mountGrid(tile('a.jpg') + `<img class="wt-image" alt="empty"/>`)
    expect(readGroupImages(root)).toHaveLength(1)
  })
})

describe('toSlide', () => {
  it('prefers an editorial caption over alt text', () => {
    const root = mountGrid(tile('a.jpg', 'data-wt-caption="Opening night"'))
    expect(toSlide(readGroupImages(root)[0])).toEqual({
      src: resolved('a.jpg'),
      alt: 'a.jpg alt',
      caption: 'Opening night',
    })
  })

  it('falls back to alt when no caption is set', () => {
    const root = mountGrid(tile('a.jpg'))
    expect(toSlide(readGroupImages(root)[0]).caption).toBe('a.jpg alt')
  })
})

describe('startLightboxRuntime', () => {
  it('arms tiles with keyboard-reachable button semantics', () => {
    mountGrid(tile('a.jpg') + tile('b.jpg'))
    const stop = startLightboxRuntime({ groupIds: ['grid'], onOpen: vi.fn() })

    const first = document.querySelector<HTMLImageElement>('img')!
    expect(first.getAttribute('role')).toBe('button')
    expect(first.getAttribute('tabindex')).toBe('0')
    expect(first.getAttribute('data-wt-lightbox-item')).toBe('0')
    expect(first.getAttribute('aria-label')).toContain('1 of 2')

    stop()
  })

  it('opens at the clicked tile with the whole group as slides', () => {
    mountGrid(tile('a.jpg') + tile('b.jpg') + tile('c.jpg'))
    const onOpen = vi.fn()
    const stop = startLightboxRuntime({ groupIds: ['grid'], onOpen })

    const second = document.querySelectorAll<HTMLImageElement>('img')[1]
    second.dispatchEvent(new MouseEvent('click', { bubbles: true }))

    expect(onOpen).toHaveBeenCalledTimes(1)
    const event = onOpen.mock.calls[0][0]
    expect(event.index).toBe(1)
    expect(event.trigger).toBe(second)
    expect(event.slides.map((s: { src: string }) => s.src)).toEqual([
      resolved('a.jpg'),
      resolved('b.jpg'),
      resolved('c.jpg'),
    ])

    stop()
  })

  it('focuses the tile it opened from, so close can return focus there', () => {
    mountGrid(tile('a.jpg') + tile('b.jpg'))
    const stop = startLightboxRuntime({ groupIds: ['grid'], onOpen: vi.fn() })

    const second = document.querySelectorAll<HTMLImageElement>('img')[1]
    second.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    expect(document.activeElement).toBe(second)

    stop()
  })

  it('opens on Enter and Space', () => {
    mountGrid(tile('a.jpg') + tile('b.jpg'))
    const onOpen = vi.fn()
    const stop = startLightboxRuntime({ groupIds: ['grid'], onOpen })
    const first = document.querySelector<HTMLImageElement>('img')!

    first.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }))
    first.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }))

    expect(onOpen).toHaveBeenCalledTimes(2)
    stop()
  })

  it('leaves modified clicks to the browser', () => {
    mountGrid(tile('a.jpg') + tile('b.jpg'))
    const onOpen = vi.fn()
    const stop = startLightboxRuntime({ groupIds: ['grid'], onOpen })

    document
      .querySelector<HTMLImageElement>('img')!
      .dispatchEvent(new MouseEvent('click', { bubbles: true, metaKey: true }))

    expect(onOpen).not.toHaveBeenCalled()
    stop()
  })

  it('does not arm a lone image — an unnavigable viewer is not a gallery', () => {
    mountGrid(tile('a.jpg'))
    const onOpen = vi.fn()
    const stop = startLightboxRuntime({ groupIds: ['grid'], onOpen })

    const only = document.querySelector<HTMLImageElement>('img')!
    only.dispatchEvent(new MouseEvent('click', { bubbles: true }))

    expect(only.hasAttribute('data-wt-lightbox-item')).toBe(false)
    expect(onOpen).not.toHaveBeenCalled()
    stop()
  })

  it('ignores group ids with no element on the page', () => {
    mountGrid(tile('a.jpg') + tile('b.jpg'))
    expect(() =>
      startLightboxRuntime({ groupIds: ['missing'], onOpen: vi.fn() })()
    ).not.toThrow()
  })

  it('teardown unbinds and strips every runtime attribute', () => {
    mountGrid(tile('a.jpg') + tile('b.jpg'))
    const onOpen = vi.fn()
    startLightboxRuntime({ groupIds: ['grid'], onOpen })()

    const first = document.querySelector<HTMLImageElement>('img')!
    expect(first.hasAttribute('data-wt-lightbox-item')).toBe(false)
    expect(first.hasAttribute('role')).toBe(false)
    expect(first.hasAttribute('tabindex')).toBe(false)
    expect(
      document.querySelector('[data-wt-lightbox-group]')
    ).toBeNull()

    first.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    expect(onOpen).not.toHaveBeenCalled()
  })
})

describe('stepIndex', () => {
  it('wraps in both directions', () => {
    expect(stepIndex(2, 1, 3)).toBe(0)
    expect(stepIndex(0, -1, 3)).toBe(2)
    expect(stepIndex(0, 1, 3)).toBe(1)
  })

  it('is safe on an empty set', () => {
    expect(stepIndex(0, 1, 0)).toBe(0)
  })
})
