/**
 * Gallery lightbox runtime — makes the tiles of a gallery grid click-to-enlarge
 * and navigable as one set.
 *
 * Driven by the `lightbox: true` marker the section catalog stamps on a gallery
 * grid (`BuilderElement.lightbox`, mirrored in the generator's
 * builder_schema.py). The marker sits on the GRID, not on the individual
 * images: one flag defines both the trigger surface and the navigation order,
 * and the runtime binds a single delegated listener per group rather than one
 * per tile.
 *
 * Execution contract (SSR / SEO / accessibility), same shape as motionRuntime:
 *  - SSR markup is untouched. Everything here runs client-side after hydration,
 *    so crawlers and no-JS visitors get the plain, fully visible tile grid.
 *  - Progressive enhancement only: nothing is hidden or disabled if the runtime
 *    never starts.
 *  - Tiles that are already links (a gallery item pointing at a case-study
 *    page) keep their link — navigation wins over enlargement, so a click never
 *    does two things.
 *  - Interactivity is added to the DOM at runtime (`tabindex`, `role`,
 *    `aria-label`) so keyboard users get the same affordance as pointer users.
 *  - Renderers/deployments that don't know the marker degrade to plain,
 *    non-interactive tiles.
 */
import { getNodeField } from '~/lib/blockRuntime'
import { getNodeDomId } from '~/lib/responsiveRuntime'
import { getNodeChildren, normalizeSchemaNodes } from '~/lib/schema'

export type LightboxSlide = {
  src: string
  alt: string
  /** Editorial caption; falls back to `alt` when the image carries none. */
  caption: string
}

export type LightboxOpenEvent = {
  slides: LightboxSlide[]
  index: number
  /** The tile that opened the viewer — focus returns here on close. */
  trigger: HTMLElement
}

export type LightboxRuntimeOptions = {
  /** DOM ids of the gallery grids to arm (from `collectLightboxGroupIds`). */
  groupIds: string[]
  onOpen: (event: LightboxOpenEvent) => void
}

const GROUP_ATTR = 'data-wt-lightbox-group'
const ITEM_ATTR = 'data-wt-lightbox-item'
const CAPTION_ATTR = 'data-wt-caption'
const STYLE_ELEMENT_ID = 'wt-lightbox-runtime'

/**
 * DOM ids of every node marked as a lightbox gallery group.
 *
 * Nested markers are not collected twice: a marked node's subtree is not
 * re-scanned, so an (unlikely) gallery inside a gallery yields one outer group
 * rather than two overlapping sets.
 */
export function collectLightboxGroupIds(schemas: unknown[]): string[] {
  const ids: string[] = []
  const seen = new Set<string>()

  const visit = (node: unknown) => {
    if (getNodeField(node as Record<string, unknown>, 'lightbox') === true) {
      const nodeId = getNodeDomId(node as Record<string, unknown>)
      if (nodeId && !seen.has(nodeId)) {
        seen.add(nodeId)
        ids.push(nodeId)
      }
      return
    }
    for (const child of getNodeChildren(node as never)) visit(child)
  }

  for (const schema of schemas) {
    for (const node of normalizeSchemaNodes(schema as never)) visit(node)
  }
  return ids
}

/**
 * The enlargeable images inside a group root, in DOM order.
 *
 * Read from the DOM rather than the schema on purpose: the rendered tree is
 * what the visitor actually sees — final CMS-rewritten `src`, real order after
 * `$gridFit`, and nothing that was conditionally dropped.
 */
export function readGroupImages(root: ParentNode): HTMLImageElement[] {
  return Array.from(root.querySelectorAll<HTMLImageElement>('img.wt-image')).filter(
    // A linked tile navigates; enlarging it too would make one click ambiguous.
    (img) => !img.closest('a') && Boolean(img.getAttribute('src'))
  )
}

export function toSlide(img: HTMLImageElement): LightboxSlide {
  const alt = img.getAttribute('alt') || ''
  return {
    src: img.currentSrc || img.getAttribute('src') || '',
    alt,
    caption: img.getAttribute(CAPTION_ATTR) || alt,
  }
}

// Pointer affordance + a visible focus ring for keyboard users. Injected rather
// than shipped in a stylesheet so pages without a gallery pay nothing.
const RUNTIME_CSS = `
[${ITEM_ATTR}] { cursor: zoom-in; }
[${ITEM_ATTR}]:focus-visible {
  outline: 3px solid var(--builder-color-primary, #2563eb);
  outline-offset: 3px;
}
@media (hover: hover) {
  [${ITEM_ATTR}] { transition: opacity 200ms ease, transform 200ms ease; }
  [${ITEM_ATTR}]:hover { opacity: 0.92; transform: scale(1.015); }
}
@media (prefers-reduced-motion: reduce) {
  [${ITEM_ATTR}] { transition: none; }
  [${ITEM_ATTR}]:hover { transform: none; }
}
`

function ensureRuntimeStylesheet() {
  if (document.getElementById(STYLE_ELEMENT_ID)) return
  const style = document.createElement('style')
  style.id = STYLE_ELEMENT_ID
  style.textContent = RUNTIME_CSS
  document.head.appendChild(style)
}

/**
 * Arm every group. Returns a teardown that unbinds listeners and strips the
 * runtime-added attributes, so a client-side navigation leaves no residue.
 */
export function startLightboxRuntime(options: LightboxRuntimeOptions): () => void {
  const noop = () => {}
  if (typeof window === 'undefined' || typeof document === 'undefined') return noop

  const cleanups: Array<() => void> = []
  let armed = false

  for (const groupId of options.groupIds) {
    const root = document.querySelector<HTMLElement>(
      `[data-wt-node-id="${CSS.escape(groupId)}"]`
    )
    if (!root) continue

    const images = readGroupImages(root)
    // A single image is not a gallery — an enlarge affordance that can't be
    // navigated is just a click that swallows itself. Leave it as a plain tile.
    if (images.length < 2) continue

    if (!armed) {
      ensureRuntimeStylesheet()
      armed = true
    }

    root.setAttribute(GROUP_ATTR, '')
    images.forEach((img, index) => {
      img.setAttribute(ITEM_ATTR, String(index))
      img.setAttribute('role', 'button')
      img.setAttribute('tabindex', '0')
      img.setAttribute(
        'aria-label',
        `${img.getAttribute('alt') || `Image ${index + 1}`} — enlarge (${index + 1} of ${images.length})`
      )
    })

    // One delegated listener per group, not one per tile. Slides are re-read on
    // open so a lazily-swapped `src` is picked up at the moment it's needed.
    const open = (target: EventTarget | null) => {
      const img = (target as HTMLElement | null)?.closest?.(
        `img[${ITEM_ATTR}]`
      ) as HTMLImageElement | null
      if (!img || !root.contains(img)) return false
      const current = readGroupImages(root)
      const index = current.indexOf(img)
      if (index < 0) return false
      // Focus the tile before handing off: the viewer restores focus to
      // whatever was active when it opened, and browsers disagree about
      // whether clicking a tabindex'd element focuses it (Safari does not).
      // Focusing here makes "close returns you to the photo you opened" hold
      // for pointer users too, not just keyboard ones.
      img.focus?.()
      options.onOpen({ slides: current.map(toSlide), index, trigger: img })
      return true
    }

    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0) return
      // Let ctrl/cmd/shift-click keep their browser meanings.
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
      if (open(event.target)) event.preventDefault()
    }

    const onKeydown = (event: KeyboardEvent) => {
      if (event.key !== 'Enter' && event.key !== ' ' && event.key !== 'Spacebar') return
      if (open(event.target)) event.preventDefault()
    }

    root.addEventListener('click', onClick)
    root.addEventListener('keydown', onKeydown)

    cleanups.push(() => {
      root.removeEventListener('click', onClick)
      root.removeEventListener('keydown', onKeydown)
      root.removeAttribute(GROUP_ATTR)
      for (const img of images) {
        img.removeAttribute(ITEM_ATTR)
        img.removeAttribute('role')
        img.removeAttribute('tabindex')
        img.removeAttribute('aria-label')
      }
    })
  }

  if (cleanups.length === 0) return noop
  return () => {
    for (const cleanup of cleanups) cleanup()
    cleanups.length = 0
  }
}

/** Wrap-around step used by both the overlay and its tests. */
export function stepIndex(index: number, delta: number, count: number): number {
  if (count <= 0) return 0
  return (((index + delta) % count) + count) % count
}
