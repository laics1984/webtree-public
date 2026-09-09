import { getNodeStyles } from '~/lib/blockRuntime'
import {
  getNodeChildren,
  getNodeName,
  isBodyRootNode,
  isHeroSectionName,
  withNodeChildren,
} from '~/lib/schema'
import type { PublicBlockNode } from '~/types/public'

/**
 * Clearance for a header that floats over the first section.
 *
 * An overlay header leaves the page flow, so the first section slides up and
 * its BACKGROUND covers the band the header used to occupy. That bleed is the
 * point. What must not come with it is the section's CONTENT: it has to stay
 * where it sat while the header still took a row of its own, instead of
 * sliding up under the bar.
 *
 * How the clearance is spent depends on what makes the section tall, because
 * the same length buys a different amount of movement in each case:
 *  - a full-screen hero already towers over the header — its centred content
 *    clears the bar on its own;
 *  - a hero with a height of its own centres content inside that box, so
 *    growth is split above and below it and has to be doubled;
 *  - a hero as tall as its content has no height to grow at all: the clearance
 *    comes off its top padding and moves the content down 1:1.
 *
 * MIRROR of builder/src/lib/header-overlay-clearance.ts. The builder measures
 * its header and passes pixels; here the header's `minHeight` stands in and
 * the clearance arrives as a CSS length, so the arithmetic is `calc()`.
 * Keep both in lockstep.
 */

// Keep in lockstep with builder src/lib/builder-styles.ts's
// HERO_FULL_MIN_HEIGHT / HERO_BANDED_MIN_HEIGHT.
const HERO_FULL_MIN_HEIGHT = 'min(100dvh, 900px)'
const HERO_BANDED_MIN_HEIGHT = '460px'

export function isHeroHeightFull(
  nodeStyles: Record<string, unknown> | undefined,
  globalHeroMinHeight: string | null | undefined
): boolean {
  // An explicit fixed pixel `height` wins over `minHeight` in the box model —
  // a real full-screen hero relies on a vh-based minHeight with no fixed
  // height set, so any literal px height means this hero isn't full-screen
  // regardless of what minHeight (or its var fallback) says.
  const heightValue = typeof nodeStyles?.height === 'string' ? nodeStyles.height.trim() : ''
  if (/^-?\d*\.?\d+px$/.test(heightValue)) return false

  const minHeight = typeof nodeStyles?.minHeight === 'string' ? nodeStyles.minHeight.trim() : ''
  if (minHeight === HERO_FULL_MIN_HEIGHT) return true
  if (minHeight === HERO_BANDED_MIN_HEIGHT) return false
  if (minHeight.startsWith('var(--builder-hero-min-height')) {
    return !globalHeroMinHeight
  }
  return false
}

function growLengthByLength(value: unknown, extraLength: string): string | undefined {
  if (typeof value === 'number') return `calc(${value}px + ${extraLength})`
  if (typeof value === 'string' && value.trim().length > 0) {
    return `calc(${value.trim()} + ${extraLength})`
  }
  return undefined
}

// Styles and responsiveStyles are read own-field-first, then `props` (see
// blockRuntime's getNodeStyles and responsiveRuntime's getResponsiveSource) —
// so a replacement has to go back where it was read from, or the runtime keeps
// reading the copy that was left alone.
function writeNodeRecord(
  node: PublicBlockNode,
  key: 'styles' | 'responsiveStyles',
  value: Record<string, unknown>
): PublicBlockNode {
  const props = node.props as Record<string, unknown> | undefined
  if (node[key] === undefined && props && typeof props === 'object' && props[key] !== undefined) {
    return { ...node, props: { ...props, [key]: value } }
  }
  return { ...node, [key]: value }
}

function readNodeRecord(
  node: PublicBlockNode,
  key: 'styles' | 'responsiveStyles'
): Record<string, unknown> | undefined {
  const own = node[key]
  if (own && typeof own === 'object' && !Array.isArray(own)) {
    return own as Record<string, unknown>
  }
  const props = node.props as Record<string, unknown> | undefined
  const nested = props?.[key]
  return nested && typeof nested === 'object' && !Array.isArray(nested)
    ? (nested as Record<string, unknown>)
    : undefined
}

function patchNodeStyles(node: PublicBlockNode, patch: Record<string, unknown>): PublicBlockNode {
  return writeNodeRecord(node, 'styles', { ...readNodeRecord(node, 'styles'), ...patch })
}

function growTopPadding(
  styles: Record<string, unknown> | undefined,
  clearanceLength: string
): Record<string, unknown> {
  return {
    ...styles,
    paddingTop: growLengthByLength(styles?.paddingTop, clearanceLength) ?? clearanceLength,
  }
}

// A breakpoint that states its own top padding OVERRIDES the grown base one —
// and the responsive stylesheet emits those rules `!important`, so it would
// drop the clearance again on that device. Breakpoints that state none inherit
// the grown base and are left alone.
function growResponsiveTopPadding(
  node: PublicBlockNode,
  clearanceLength: string
): PublicBlockNode {
  const responsive = readNodeRecord(node, 'responsiveStyles')
  if (!responsive) return node

  let changed = false
  const grown: Record<string, unknown> = { ...responsive }

  for (const breakpoint of ['mobile', 'tablet'] as const) {
    const styles = responsive[breakpoint]
    if (styles && typeof styles === 'object' && !Array.isArray(styles)) {
      const record = styles as Record<string, unknown>
      if (record.paddingTop !== undefined) {
        grown[breakpoint] = growTopPadding(record, clearanceLength)
        changed = true
      }
    }
  }

  return changed ? writeNodeRecord(node, 'responsiveStyles', grown) : node
}

/**
 * One section, spaced for the header floating over it.
 *
 * Only a hero pays the clearance out of its HEIGHT — centring content in a
 * taller box is a hero's own convention, and forcing it on a band that never
 * centred its content would move that content off where the author put it.
 * Everything else takes it as top padding.
 */
export function applyHeaderOverlayClearance(
  node: PublicBlockNode,
  clearanceLength: string,
  globalHeroMinHeight?: string | null
): PublicBlockNode {
  const styles = getNodeStyles(node)
  const isHero = isHeroSectionName(getNodeName(node))

  if (isHero && isHeroHeightFull(styles, globalHeroMinHeight)) {
    return patchNodeStyles(node, { justifyContent: 'center' })
  }

  // Centring splits added height evenly above and below the content, so only
  // half of any growth actually pushes content down. Grow by 2x the clearance
  // for the centred content's top edge to move down by the whole of it.
  const heightGrowth = `calc((${clearanceLength}) * 2)`
  const height = isHero ? growLengthByLength(styles.height, heightGrowth) : undefined
  const minHeight = isHero ? growLengthByLength(styles.minHeight, heightGrowth) : undefined

  if (height !== undefined || minHeight !== undefined) {
    return patchNodeStyles(node, {
      justifyContent: 'center',
      ...(height !== undefined ? { height } : {}),
      ...(minHeight !== undefined ? { minHeight } : {}),
    })
  }

  // No height to grow — a section this size is exactly as tall as its content,
  // so growing nothing is what used to leave its heading sitting under the bar.
  return growResponsiveTopPadding(patchNodeStyles(node, growTopPadding(styles, clearanceLength)), clearanceLength)
}

/**
 * The tree as it should render under an overlay header. Returns the nodes
 * unchanged when there is no clearance to spend, so callers can pass a whole
 * schema through unconditionally.
 */
export function withHeaderOverlayClearance(
  nodes: PublicBlockNode[],
  clearanceLength: string | null | undefined,
  globalHeroMinHeight?: string | null
): PublicBlockNode[] {
  if (!clearanceLength || nodes.length === 0) return nodes

  // The served body wraps its sections in a `__body` root, so the section that
  // slides under the header is one level in. Spacing the wrapper instead is
  // what made this a no-op on every published page.
  if (nodes.length === 1 && isBodyRootNode(nodes[0])) {
    const sections = getNodeChildren(nodes[0])
    if (sections.length === 0) return nodes

    const spaced = withHeaderOverlayClearance(sections, clearanceLength, globalHeroMinHeight)
    return spaced === sections ? nodes : [withNodeChildren(nodes[0], spaced)]
  }

  // The section under the bar is the FIRST one, whatever it is: a sub-page
  // opens with its breadcrumb, and pushing the hero below it down does
  // nothing for the breadcrumb the header is actually covering.
  const spacedSection = applyHeaderOverlayClearance(
    nodes[0],
    clearanceLength,
    globalHeroMinHeight
  )
  if (spacedSection === nodes[0]) return nodes

  const next = nodes.slice()
  next[0] = spacedSection
  return next
}
