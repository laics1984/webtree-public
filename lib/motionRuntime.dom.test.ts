// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { startMotionRuntime } from './motionRuntime'

let frames: Map<number, FrameRequestCallback>
let nextFrame: number
let intersect: IntersectionObserverCallback
let stop: (() => void) | undefined
const observe = vi.fn()
const unobserve = vi.fn()
const disconnect = vi.fn()

function paintFrame() {
  const callbacks = [...frames.values()]
  frames.clear()
  callbacks.forEach((callback) => callback(0))
}

function mount(id: string, top = 100) {
  const el = document.createElement('div')
  el.dataset.wtNodeId = id
  el.style.opacity = '1'
  vi.spyOn(el, 'getBoundingClientRect').mockReturnValue({ top, bottom: top + 100 } as DOMRect)
  document.body.appendChild(el)
  return el
}

function enter(el: HTMLElement) {
  intersect([{ target: el, isIntersecting: true } as IntersectionObserverEntry], {} as IntersectionObserver)
}

beforeEach(() => {
  document.body.innerHTML = ''
  document.head.innerHTML = ''
  frames = new Map()
  nextFrame = 0
  stop = undefined
  vi.useFakeTimers()
  vi.spyOn(window, 'matchMedia').mockReturnValue({ matches: false } as MediaQueryList)
  vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
    frames.set(++nextFrame, callback)
    return nextFrame
  })
  vi.stubGlobal('cancelAnimationFrame', (id: number) => frames.delete(id))
  vi.stubGlobal('IntersectionObserver', class {
    constructor(callback: IntersectionObserverCallback) { intersect = callback }
    observe = observe
    unobserve = unobserve
    disconnect = disconnect
  })
})

afterEach(() => {
  stop?.()
  vi.clearAllTimers()
  vi.useRealTimers()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  vi.clearAllMocks()
})

describe('entrance lifecycle', () => {
  it('plays a visible hero after a painted start state and honours its delay', () => {
    const title = mount('hero-title')
    stop = startMotionRuntime({ targets: [{ nodeId: 'hero-title', motion: { preset: 'slide-left', delay: 0.25 } }] })
    expect(title.dataset.wtMotionState).toBe('pending')
    expect(title.style.getPropertyValue('--wt-motion-from')).toBe('translateX(32px)')
    expect(title.style.getPropertyValue('--wt-motion-delay')).toBe('0.25s')
    expect(observe).not.toHaveBeenCalled()
    paintFrame()
    expect(title.dataset.wtMotionState).toBe('pending')
    paintFrame()
    expect(title.dataset.wtMotionState).toBe('play')
    vi.advanceTimersByTime(1099)
    expect(title.dataset.wtMotionState).toBe('play')
    vi.advanceTimersByTime(1)
    expect(title.dataset.wtMotionState).toBeUndefined()
    expect(title.style.cssText).toBe('opacity: 1;')
  })

  it('waits for offscreen content and reveals it only once', () => {
    const el = mount('lower', 3000)
    stop = startMotionRuntime({ targets: [{ nodeId: 'lower', motion: { preset: 'rise' } }] })
    expect(observe).toHaveBeenCalledWith(el)
    paintFrame()
    paintFrame()
    expect(el.dataset.wtMotionState).toBe('pending')
    enter(el)
    enter(el)
    paintFrame()
    paintFrame()
    expect(el.dataset.wtMotionState).toBe('play')
    expect(unobserve).toHaveBeenCalledTimes(1)
    expect(vi.getTimerCount()).toBe(1)
  })

  it('preserves authored opacity and transforms through playback and cleanup', () => {
    const el = mount('styled')
    el.style.opacity = '0.6'
    el.style.transform = 'rotate(5deg)'
    const original = el.style.cssText
    stop = startMotionRuntime({ targets: [{ nodeId: 'styled', motion: { preset: 'slide-left' } }] })
    expect(el.style.getPropertyValue('--wt-motion-opacity')).toBe('0.6')
    expect(el.style.getPropertyValue('--wt-motion-to')).toBe('rotate(5deg)')
    expect(el.style.getPropertyValue('--wt-motion-from')).toBe('translateX(32px) rotate(5deg)')
    expect(getComputedStyle(el).opacity).toBe('0')
    paintFrame()
    paintFrame()
    stop()
    expect(el.style.cssText).toBe(original)
    expect(el.dataset.wtMotionState).toBeUndefined()
  })

  it('measures nested entrances before transforming their ancestors', () => {
    const parent = mount('parent')
    const title = mount('title')
    parent.appendChild(title)
    vi.mocked(title.getBoundingClientRect).mockImplementation(() => ({
      top: parent.dataset.wtMotionState ? 3000 : 120,
      bottom: parent.dataset.wtMotionState ? 3100 : 220,
    } as DOMRect))
    stop = startMotionRuntime({ targets: ['parent', 'title'].map((nodeId) => ({ nodeId, motion: { preset: 'rise' } })) })
    expect(observe).not.toHaveBeenCalled()
    paintFrame()
    paintFrame()
    expect(parent.dataset.wtMotionState).toBe('play')
    expect(title.dataset.wtMotionState).toBe('play')
  })

  it.each([0, 1])('cancels a reveal when disposed after %i frames', (painted) => {
    const el = mount('cancelled')
    stop = startMotionRuntime({ targets: [{ nodeId: 'cancelled', motion: { preset: 'rise' } }] })
    if (painted) paintFrame()
    const queued = [...frames.values()]
    stop()
    expect(frames.size).toBe(0)
    queued.forEach((callback) => callback(0))
    paintFrame()
    expect(el.dataset.wtMotionState).toBeUndefined()
    expect(el.style.cssText).toBe('opacity: 1;')
    expect(vi.getTimerCount()).toBe(0)
  })

  it('cancels completion timers when navigation interrupts playback', () => {
    const el = mount('navigated')
    stop = startMotionRuntime({ targets: [{ nodeId: 'navigated', motion: { preset: 'fade', delay: 1 } }] })
    paintFrame()
    paintFrame()
    stop()
    expect(vi.getTimerCount()).toBe(0)
    expect(el.dataset.wtMotionState).toBeUndefined()
    expect(el.style.cssText).toBe('opacity: 1;')
  })

  it('reveals all content when IntersectionObserver is unavailable', () => {
    vi.stubGlobal('IntersectionObserver', undefined)
    const hero = mount('hero')
    const lower = mount('lower', 3000)
    stop = startMotionRuntime({ targets: ['hero', 'lower'].map((nodeId) => ({ nodeId, motion: { preset: 'fade' } })) })
    paintFrame()
    paintFrame()
    expect(hero.dataset.wtMotionState).toBe('play')
    expect(lower.dataset.wtMotionState).toBe('play')
  })

  it('retains stagger delays and element intensity for visible groups', () => {
    const group = mount('group')
    group.innerHTML = '<div></div><div></div><div></div>'
    stop = startMotionRuntime({ targets: [{ nodeId: 'group', motion: { preset: 'rise', delay: 0.1, stagger: 0.08, intensity: 'subtle' } }] })
    const children = [...group.children] as HTMLElement[]
    expect(children.map((el) => el.style.getPropertyValue('--wt-motion-delay'))).toEqual(['0.1s', '0.18s', '0.26s'])
    const distance = children[0].style.getPropertyValue('--wt-motion-from').replace('translateY(', '')
    expect(Number.parseFloat(distance)).toBeCloseTo(14.4)
    paintFrame()
    paintFrame()
    expect(children.every((el) => el.dataset.wtMotionState === 'play')).toBe(true)
    stop()
    expect(children.every((el) => el.style.cssText === '')).toBe(true)
  })

  it.each(['site-off', 'element-off', 'reduced-motion'])('keeps content static for %s', (reason) => {
    const el = mount('static')
    if (reason === 'reduced-motion') vi.mocked(window.matchMedia).mockReturnValue({ matches: true } as MediaQueryList)
    stop = startMotionRuntime({
      intensity: reason === 'site-off' ? 'off' : 'balanced',
      targets: [{ nodeId: 'static', motion: { preset: 'rise', intensity: reason === 'element-off' ? 'off' : undefined } }],
    })
    expect(el.dataset.wtMotionState).toBeUndefined()
    expect(el.style.cssText).toBe('opacity: 1;')
    expect(frames.size).toBe(0)
    expect(observe).not.toHaveBeenCalled()
  })
})
