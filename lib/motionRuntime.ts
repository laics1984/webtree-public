/**
 * Declarative motion runtime — executes `motion` annotations carried by
 * schema nodes (`BuilderElement.motion`, written by the section catalog and,
 * later, the builder's Motion panel).
 *
 * The preset ids and timing parameters mirror the registry of record in the
 * builder repo (`builder/src/lib/motion-presets.ts`). Keep the two in
 * lockstep — same precedent as the section-catalog TS/Python pair.
 *
 * Execution contract (SSR / SEO / accessibility):
 *  - SSR markup is never hidden. Initial "pending" states are applied by JS
 *    only, so crawlers and no-JS visitors always see the full content.
 *  - Elements already inside the viewport when the runtime starts are
 *    skipped entirely — above-the-fold content (including the LCP element)
 *    never animates on initial load.
 *  - `prefers-reduced-motion: reduce` turns the runtime into a no-op.
 *  - Unknown preset ids are ignored (forward compatibility: new presets can
 *    ship catalog-first without breaking older deployments).
 *  - The `gsap` tier (parallax) is loaded as a lazy chunk only when a page
 *    actually uses such a preset; the default css tier ships zero deps.
 */
import { getNodeField } from '~/lib/blockRuntime'
import { getNodeDomId } from '~/lib/responsiveRuntime'
import { getNodeChildren, normalizeSchemaNodes } from '~/lib/schema'

export type MotionIntensity = 'off' | 'subtle' | 'balanced' | 'expressive'

export type MotionAnnotation = {
  preset: string
  delay?: number
  duration?: number
  stagger?: number
  intensity?: MotionIntensity
}

export type MotionTarget = {
  nodeId: string
  motion: MotionAnnotation
}

type PresetDef = {
  tier: 'css' | 'gsap'
  duration: number
  distance?: number
  scaleFrom?: number
  easing: string
  transformFrom?: (distance: number) => string
}

const DEFAULT_EASING = 'cubic-bezier(0.22, 1, 0.36, 1)'

// Lockstep with builder/src/lib/motion-presets.ts.
const PRESETS: Record<string, PresetDef> = {
  fade: { tier: 'css', duration: 0.7, easing: DEFAULT_EASING },
  rise: {
    tier: 'css',
    duration: 0.65,
    distance: 24,
    easing: DEFAULT_EASING,
    transformFrom: (d) => `translateY(${d}px)`,
  },
  'scale-in': {
    tier: 'css',
    duration: 0.7,
    scaleFrom: 0.96,
    easing: DEFAULT_EASING,
  },
  'slide-left': {
    tier: 'css',
    duration: 0.65,
    distance: 32,
    easing: DEFAULT_EASING,
    transformFrom: (d) => `translateX(${d}px)`,
  },
  'slide-right': {
    tier: 'css',
    duration: 0.65,
    distance: 32,
    easing: DEFAULT_EASING,
    transformFrom: (d) => `translateX(-${d}px)`,
  },
  'parallax-drift': { tier: 'gsap', duration: 0, distance: 80, easing: 'none' },
}

const INTENSITY_FACTORS: Record<
  Exclude<MotionIntensity, 'off'>,
  { distance: number; duration: number }
> = {
  subtle: { distance: 0.6, duration: 0.85 },
  balanced: { distance: 1, duration: 1 },
  expressive: { distance: 1.4, duration: 1.15 },
}

const INTENSITY_VALUES = new Set(['off', 'subtle', 'balanced', 'expressive'])

export function getNodeMotion(node: unknown): MotionAnnotation | null {
  const value = getNodeField(node as Record<string, unknown>, 'motion')
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  const record = value as Record<string, unknown>
  if (typeof record.preset !== 'string' || !record.preset.trim()) return null

  const annotation: MotionAnnotation = { preset: record.preset.trim() }
  if (typeof record.delay === 'number' && record.delay >= 0) annotation.delay = record.delay
  if (typeof record.duration === 'number' && record.duration > 0) annotation.duration = record.duration
  if (typeof record.stagger === 'number' && record.stagger > 0) annotation.stagger = record.stagger
  if (typeof record.intensity === 'string' && INTENSITY_VALUES.has(record.intensity)) {
    annotation.intensity = record.intensity as MotionIntensity
  }
  return annotation
}

/** Site-wide intensity from the builderStyles payload (`motion.intensity`). */
export function resolveSiteMotionIntensity(builderStyles: unknown): MotionIntensity {
  if (builderStyles && typeof builderStyles === 'object' && !Array.isArray(builderStyles)) {
    const motion = (builderStyles as Record<string, unknown>).motion
    if (motion && typeof motion === 'object' && !Array.isArray(motion)) {
      const intensity = (motion as Record<string, unknown>).intensity
      if (typeof intensity === 'string' && INTENSITY_VALUES.has(intensity)) {
        return intensity as MotionIntensity
      }
    }
  }
  return 'balanced'
}

/** Walk header/body/footer schemas and collect nodes carrying motion. */
export function collectMotionTargets(schemas: unknown[]): MotionTarget[] {
  const targets: MotionTarget[] = []

  const visit = (node: unknown) => {
    const motion = getNodeMotion(node)
    if (motion && PRESETS[motion.preset]) {
      const nodeId = getNodeDomId(node as Record<string, unknown>)
      if (nodeId) targets.push({ nodeId, motion })
    }
    for (const child of getNodeChildren(node as never)) visit(child)
  }

  for (const schema of schemas) {
    for (const node of normalizeSchemaNodes(schema as never)) visit(node)
  }
  return targets
}

const STYLE_ELEMENT_ID = 'wt-motion-runtime'

const RUNTIME_CSS = `
[data-wt-motion-state] { will-change: opacity, transform; }
[data-wt-motion-state="pending"] {
  opacity: 0;
  transform: var(--wt-motion-from, none);
}
[data-wt-motion-state="play"] {
  opacity: 1;
  transform: none;
  transition:
    opacity var(--wt-motion-duration, 0.65s) var(--wt-motion-easing, ${DEFAULT_EASING}),
    transform var(--wt-motion-duration, 0.65s) var(--wt-motion-easing, ${DEFAULT_EASING});
  transition-delay: var(--wt-motion-delay, 0s);
}
`

function ensureRuntimeStylesheet() {
  if (document.getElementById(STYLE_ELEMENT_ID)) return
  const style = document.createElement('style')
  style.id = STYLE_ELEMENT_ID
  style.textContent = RUNTIME_CSS
  document.head.appendChild(style)
}

function isInViewport(el: Element): boolean {
  const rect = el.getBoundingClientRect()
  return rect.top < window.innerHeight && rect.bottom > 0
}

type RevealEntry = {
  el: HTMLElement
  delay: number
  duration: number
}

function applyPendingState(entry: RevealEntry, preset: PresetDef, distance: number) {
  const { el, delay, duration } = entry
  const transforms: string[] = []
  if (preset.transformFrom && distance > 0) transforms.push(preset.transformFrom(distance))
  if (preset.scaleFrom !== undefined) transforms.push(`scale(${preset.scaleFrom})`)

  if (transforms.length > 0) el.style.setProperty('--wt-motion-from', transforms.join(' '))
  el.style.setProperty('--wt-motion-duration', `${duration}s`)
  el.style.setProperty('--wt-motion-easing', preset.easing)
  if (delay > 0) el.style.setProperty('--wt-motion-delay', `${delay}s`)
  el.dataset.wtMotionState = 'pending'
}

function clearMotionState(el: HTMLElement) {
  delete el.dataset.wtMotionState
  el.style.removeProperty('--wt-motion-from')
  el.style.removeProperty('--wt-motion-duration')
  el.style.removeProperty('--wt-motion-easing')
  el.style.removeProperty('--wt-motion-delay')
}

export type MotionRuntimeOptions = {
  targets: MotionTarget[]
  intensity?: MotionIntensity
}

/**
 * Start the runtime against the current DOM. Client-only. Returns a stop
 * function that disconnects observers and restores element state.
 */
export function startMotionRuntime(options: MotionRuntimeOptions): () => void {
  const noop = () => {}
  if (typeof window === 'undefined' || typeof document === 'undefined') return noop
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return noop

  const intensity = options.intensity ?? 'balanced'
  if (intensity === 'off') return noop

  const timeouts = new Set<ReturnType<typeof setTimeout>>()
  const pendingElements = new Set<HTMLElement>()
  const parallaxTargets: Array<{ el: HTMLElement; motion: MotionAnnotation }> = []
  let stopped = false
  let killParallax: (() => void) | null = null

  ensureRuntimeStylesheet()

  const groups: Array<{ trigger: HTMLElement; entries: RevealEntry[] }> = []

  for (const target of options.targets) {
    const el = document.querySelector<HTMLElement>(
      `[data-wt-node-id="${CSS.escape(target.nodeId)}"]`
    )
    if (!el) continue

    const preset = PRESETS[target.motion.preset]
    if (!preset) continue

    if (preset.tier === 'gsap') {
      parallaxTargets.push({ el, motion: target.motion })
      continue
    }

    // Above-the-fold content never animates on load: no flash, no LCP impact.
    if (isInViewport(el)) continue

    const elementIntensity = target.motion.intensity ?? intensity
    if (elementIntensity === 'off') continue
    const factors = INTENSITY_FACTORS[elementIntensity]
    const duration = (target.motion.duration ?? preset.duration) * factors.duration
    const distance = (preset.distance ?? 0) * factors.distance
    const baseDelay = target.motion.delay ?? 0

    const stagger = target.motion.stagger
    const children =
      stagger && el.children.length > 1
        ? (Array.from(el.children).filter((c) => c instanceof HTMLElement) as HTMLElement[])
        : null

    const entries: RevealEntry[] = (children ?? [el]).map((element, index) => ({
      el: element,
      delay: baseDelay + (children && stagger ? index * stagger : 0),
      duration,
    }))

    for (const entry of entries) {
      applyPendingState(entry, preset, distance)
      pendingElements.add(entry.el)
    }
    groups.push({ trigger: el, entries })
  }

  let observer: IntersectionObserver | null = null

  const reveal = (entries: RevealEntry[]) => {
    requestAnimationFrame(() => {
      for (const entry of entries) {
        entry.el.dataset.wtMotionState = 'play'
        const settle = setTimeout(
          () => {
            clearMotionState(entry.el)
            pendingElements.delete(entry.el)
          },
          (entry.delay + entry.duration) * 1000 + 200
        )
        timeouts.add(settle)
      }
    })
  }

  if (groups.length > 0) {
    if (typeof IntersectionObserver === 'undefined') {
      for (const group of groups) reveal(group.entries)
    } else {
      const groupByTrigger = new Map(groups.map((g) => [g.trigger, g] as const))
      observer = new IntersectionObserver(
        (observed) => {
          for (const entry of observed) {
            if (!entry.isIntersecting) continue
            const group = groupByTrigger.get(entry.target as HTMLElement)
            if (!group) continue
            observer?.unobserve(entry.target)
            reveal(group.entries)
          }
        },
        { rootMargin: '0px 0px -10% 0px', threshold: 0.1 }
      )
      for (const group of groups) observer.observe(group.trigger)
    }
  }

  if (parallaxTargets.length > 0) {
    void loadParallax(parallaxTargets, intensity).then((kill) => {
      if (stopped) kill?.()
      else killParallax = kill
    })
  }

  return () => {
    stopped = true
    observer?.disconnect()
    for (const timeout of timeouts) clearTimeout(timeout)
    for (const el of pendingElements) clearMotionState(el)
    pendingElements.clear()
    killParallax?.()
    killParallax = null
  }
}

/**
 * GSAP tier: background parallax drift. Loaded as a lazy chunk only when the
 * page carries a `parallax-drift` annotation. Prefers the section/container
 * photo layer (scaled up so the drift never reveals edges); falls back to a
 * subtle drift of the element itself.
 */
async function loadParallax(
  targets: Array<{ el: HTMLElement; motion: MotionAnnotation }>,
  intensity: MotionIntensity
): Promise<(() => void) | null> {
  let gsapModule: typeof import('gsap')
  let scrollTriggerModule: typeof import('gsap/ScrollTrigger')
  try {
    ;[gsapModule, scrollTriggerModule] = await Promise.all([
      import('gsap'),
      import('gsap/ScrollTrigger'),
    ])
  } catch {
    return null
  }

  const { gsap } = gsapModule
  const { ScrollTrigger } = scrollTriggerModule
  gsap.registerPlugin(ScrollTrigger)

  const factors = intensity === 'off' ? null : INTENSITY_FACTORS[intensity]
  if (!factors) return null

  const tweens: Array<{ kill: () => void }> = []
  for (const { el, motion } of targets) {
    const elementIntensity = motion.intensity ?? intensity
    if (elementIntensity === 'off') continue
    const distance =
      (PRESETS['parallax-drift'].distance ?? 80) * INTENSITY_FACTORS[elementIntensity].distance

    const photoLayer = el.querySelector<HTMLElement>(
      '.wt-section__bg-photo, .wt-container-block__bg-photo'
    )
    const driftTarget = photoLayer ?? el
    if (photoLayer) gsap.set(photoLayer, { scale: 1.15 })

    tweens.push(
      gsap.fromTo(
        driftTarget,
        { y: photoLayer ? -distance : 0 },
        {
          y: photoLayer ? distance : -distance * 0.4,
          ease: 'none',
          scrollTrigger: {
            trigger: el,
            start: 'top bottom',
            end: 'bottom top',
            scrub: true,
          },
        }
      )
    )
  }

  return () => {
    for (const tween of tweens) tween.kill()
  }
}
