<script setup lang="ts">
import type { CSSProperties } from 'vue'
import type { PublicBlockNode, PublicSchemaTree } from '~/types/public'
import {
  getArrayField,
  getNodeClasses,
  getNodeField,
  getNodeStyles,
  getStringField,
  runtimeHeaderOverlayKey,
  runtimeHeaderSchemaKey,
  runtimeMenusKey,
} from '~/lib/blockRuntime'
import { getNodeDomId } from '~/lib/responsiveRuntime'
import { getNodeChildren, normalizeBlockType, normalizeSchemaNodes } from '~/lib/schema'

type RuntimeMenuItem = {
  id?: string
  href?: string | null
  label?: string | null
  target?: string | null
  rel?: string | null
  visible?: boolean
  children?: RuntimeMenuItem[] | null
}

type FlatMenuItem = {
  id: string
  href: string
  label: string
  target?: string | null
  rel?: string | null
  depth: number
}

type HeaderActionLink = {
  id: string
  href: string
  label: string
  target?: string | null
  rel?: string | null
  styles: CSSProperties
}

type ParsedColor = {
  r: number
  g: number
  b: number
}

function expandHexColor(value: string) {
  return value
    .split('')
    .map((character) => character + character)
    .join('')
}

function extractVarFallback(value: string) {
  const match = value.match(/var\(\s*--[^,)]+(?:,\s*([^)]+))?\)/i)
  return match?.[1]?.trim() ?? null
}

function parseColor(value?: string | null): ParsedColor | null {
  if (!value) {
    return null
  }

  const normalized = value.trim()

  if (!normalized) {
    return null
  }

  if (normalized.startsWith('var(')) {
    return parseColor(extractVarFallback(normalized))
  }

  if (normalized.startsWith('#')) {
    const raw = normalized.slice(1)
    const hex = raw.length === 3 ? expandHexColor(raw) : raw.length >= 6 ? raw.slice(0, 6) : ''

    if (hex.length !== 6) {
      return null
    }

    const r = Number.parseInt(hex.slice(0, 2), 16)
    const g = Number.parseInt(hex.slice(2, 4), 16)
    const b = Number.parseInt(hex.slice(4, 6), 16)

    if ([r, g, b].some((channel) => Number.isNaN(channel))) {
      return null
    }

    return { r, g, b }
  }

  if (normalized.startsWith('rgb')) {
    const match = normalized.match(
      /^rgba?\(\s*([0-9.]+)\s*,\s*([0-9.]+)\s*,\s*([0-9.]+)(?:\s*,\s*[0-9.]+\s*)?\)$/i
    )

    if (!match) {
      return null
    }

    return {
      r: Number.parseFloat(match[1]),
      g: Number.parseFloat(match[2]),
      b: Number.parseFloat(match[3]),
    }
  }

  const namedColor = normalized.toLowerCase()

  if (namedColor === 'white') {
    return { r: 255, g: 255, b: 255 }
  }

  if (namedColor === 'black') {
    return { r: 0, g: 0, b: 0 }
  }

  return null
}

function toLinearSrgb(value: number) {
  const channel = value / 255
  return channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4
}

function getRelativeLuminance(value: string) {
  const parsed = parseColor(value)

  if (!parsed) {
    return null
  }

  return (
    0.2126 * toLinearSrgb(parsed.r) +
    0.7152 * toLinearSrgb(parsed.g) +
    0.0722 * toLinearSrgb(parsed.b)
  )
}

function getContrastRatio(foreground: string, background: string) {
  const foregroundLuminance = getRelativeLuminance(foreground)
  const backgroundLuminance = getRelativeLuminance(background)

  if (foregroundLuminance === null || backgroundLuminance === null) {
    return null
  }

  const lighter = Math.max(foregroundLuminance, backgroundLuminance)
  const darker = Math.min(foregroundLuminance, backgroundLuminance)

  return (lighter + 0.05) / (darker + 0.05)
}

function pickAccessibleTextColor(background: string) {
  const candidates = ['#0f172a', '#1e293b', '#334155']

  let bestCandidate = candidates[0]
  let bestRatio = -1

  for (const candidate of candidates) {
    const ratio = getContrastRatio(candidate, background)

    if (ratio === null) {
      continue
    }

    if (ratio > bestRatio) {
      bestCandidate = candidate
      bestRatio = ratio
    }
  }

  return bestCandidate
}

const props = defineProps<{ node: PublicBlockNode }>()

const route = useRoute()
const runtimeMenus = inject(runtimeMenusKey, computed(() => []))
const runtimeHeaderSchema = inject(
  runtimeHeaderSchemaKey,
  computed<PublicSchemaTree | PublicBlockNode[] | null | undefined>(() => null)
)
const runtimeHeaderOverlay = inject(runtimeHeaderOverlayKey, computed(() => false))

const isMobileMenuOpen = ref(false)
const previousBodyOverflow = ref<string | null>(null)

// Desktop dropdown state — at most one flyout open at a time. Timers give
// hover intent: a short delay before opening (so skimming the bar doesn't
// flash flyouts) and a longer one before closing (so the pointer can travel
// from trigger to panel without the flyout vanishing).
const openDropdownKey = ref<string | null>(null)
let dropdownOpenTimer: ReturnType<typeof setTimeout> | null = null
let dropdownCloseTimer: ReturnType<typeof setTimeout> | null = null

const nodeClasses = computed(() => getNodeClasses(props.node))
const nodeStyles = computed(() => getNodeStyles(props.node))
const nodeDomId = computed(() => getNodeDomId(props.node) || undefined)
const colorMode = computed(() => (getStringField(props.node, 'colorMode') || '').trim().toLowerCase())
const variant = computed(() => (getStringField(props.node, 'variant') || 'header-inline').trim().toLowerCase())
const slot = computed(() => (getStringField(props.node, 'slot') || '').trim().toLowerCase())
const menuLabel = computed(() => getStringField(props.node, 'menuLabel') || 'Site navigation')
const isHeaderPrimaryMenu = computed(() => slot.value === 'primary' || variant.value === 'header-inline')
const isHeaderUtilityMenu = computed(() => slot.value === 'utility' || variant.value === 'utility-inline')
const isFooterColumnsMenu = computed(() => slot.value === 'footer' || variant.value === 'footer-columns')
const isSocialInlineMenu = computed(() => {
  if (slot.value === 'social' || variant.value === 'social-inline') return true
  const vis = visibleItems.value
  if (vis.length === 0) return false
  return vis.every((item) => {
    const key = (item.label || '').trim().toLowerCase()
    return key in SOCIAL_ICON_PATHS
  })
})
const isSocialInHeader = computed(() => {
  if (!isSocialInlineMenu.value) return false
  const id = nodeDomId.value
  if (!id) return false
  const findInTree = (nodes: PublicBlockNode[]): boolean => {
    for (const node of nodes) {
      if (getNodeDomId(node) === id) return true
      if (findInTree(getNodeChildren(node))) return true
    }
    return false
  }
  return findInTree(normalizeSchemaNodes(runtimeHeaderSchema.value))
})
const isOverlayHeader = computed(() => runtimeHeaderOverlay.value)

const items = computed<RuntimeMenuItem[]>(() => resolveMenuItemsForNode(props.node))
const visibleItems = computed(() => items.value.filter((item) => item?.visible !== false))
const flattenedVisibleItems = computed(() => flattenMenuItems(visibleItems.value))

// Grouped footer layout only when at least one item carries children —
// all-flat footer menus keep the plain inline rendering, matching the
// builder's footer-columns flat fallback.
const hasFooterColumnGroups = computed(
  () =>
    isFooterColumnsMenu.value &&
    visibleItems.value.some((item) => visibleChildren(item).length > 0)
)

const headerSupplemental = computed(() => {
  const utilityItems: RuntimeMenuItem[] = []
  const socialItems: RuntimeMenuItem[] = []
  const actionLinks: HeaderActionLink[] = []
  const currentNodeId = nodeDomId.value

  collectHeaderElements(normalizeSchemaNodes(runtimeHeaderSchema.value), (node) => {
    const candidateId = getNodeDomId(node)

    if (candidateId && candidateId === currentNodeId) {
      return
    }

    const type = normalizeBlockType(getStringField(node, 'type'))
    if (type === 'header') {
      return
    }

    if (type === 'menu') {
      const nodeSlot = (getStringField(node, 'slot') || '').trim().toLowerCase()
      const nodeVariant = (getStringField(node, 'variant') || '').trim().toLowerCase()
      const nodeItems = resolveMenuItemsForNode(node).filter((item) => item?.visible !== false)
      const isUtilityMenu =
        nodeSlot === 'utility' || nodeVariant === 'utility-inline'
      const isSocialMenu =
        nodeSlot === 'social' || nodeVariant === 'social-inline' ||
        (nodeItems.length > 0 && nodeItems.every((item) => {
          const key = (item.label || '').trim().toLowerCase()
          return key in SOCIAL_ICON_PATHS
        }))

      if (isSocialMenu) {
        socialItems.push(...nodeItems)
      } else if (isUtilityMenu) {
        utilityItems.push(...nodeItems)
      }
      return
    }

    if (type !== 'link') {
      return
    }

    const href = getStringField(node, 'href') || ''
    const label = getStringField(node, 'innerText', 'label', 'text') || ''

    if (!href.trim() || !label.trim()) {
      return
    }

    actionLinks.push({
      id: candidateId || label,
      href,
      label,
      rel: getStringField(node, 'rel'),
      target: getStringField(node, 'target'),
      styles: getNodeStyles(node),
    })
  })

  return {
    utilityItems,
    socialItems,
    actionLinks,
  }
})

const flattenedUtilityItems = computed(() =>
  flattenMenuItems(headerSupplemental.value.utilityItems)
)

const resolvedStyles = computed(() => {
  if (colorMode.value !== 'auto') {
    return nodeStyles.value
  }

  const styles = { ...nodeStyles.value }
  styles.color = 'var(--wt-footer-ink, inherit)'
  return styles
})

const toggleTextColor = computed(() => {
  if (isOverlayHeader.value) {
    return '#ffffff'
  }

  const preferredColor =
    typeof nodeStyles.value.color === 'string'
      ? nodeStyles.value.color
      : 'var(--wt-color-text, #0f172a)'
  const contrastRatio = getContrastRatio(preferredColor, '#ffffff')

  if (contrastRatio !== null && contrastRatio >= 4.5) {
    return preferredColor
  }

  return pickAccessibleTextColor('#ffffff')
})

watch(
  () => route.fullPath,
  () => {
    closeMobileMenu()
    closeDropdown()
  }
)

watch(isMobileMenuOpen, (isOpen) => {
  if (!import.meta.client) {
    return
  }

  if (isOpen) {
    previousBodyOverflow.value = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return
  }

  document.body.style.overflow = previousBodyOverflow.value ?? ''
  previousBodyOverflow.value = null
})

onBeforeUnmount(() => {
  if (!import.meta.client) {
    return
  }

  document.body.style.overflow = previousBodyOverflow.value ?? ''
})

function closeMobileMenu() {
  isMobileMenuOpen.value = false
}

function visibleChildren(item: RuntimeMenuItem): RuntimeMenuItem[] {
  // One nesting level only — grandchildren are ignored by design.
  return (item.children ?? []).filter((child) => child && child.visible !== false)
}

function dropdownKey(item: RuntimeMenuItem, index: number) {
  return `${item.id || item.href || item.label || 'item'}:${index}`
}

function isDropdownOpen(key: string) {
  return openDropdownKey.value === key
}

function clearDropdownTimers() {
  if (dropdownOpenTimer) {
    clearTimeout(dropdownOpenTimer)
    dropdownOpenTimer = null
  }
  if (dropdownCloseTimer) {
    clearTimeout(dropdownCloseTimer)
    dropdownCloseTimer = null
  }
}

function scheduleDropdownOpen(key: string) {
  clearDropdownTimers()
  dropdownOpenTimer = setTimeout(() => {
    openDropdownKey.value = key
  }, 80)
}

function scheduleDropdownClose() {
  clearDropdownTimers()
  dropdownCloseTimer = setTimeout(() => {
    openDropdownKey.value = null
  }, 160)
}

function toggleDropdown(key: string) {
  clearDropdownTimers()
  openDropdownKey.value = openDropdownKey.value === key ? null : key
}

function closeDropdown() {
  clearDropdownTimers()
  openDropdownKey.value = null
}

function onDropdownFocusOut(event: FocusEvent) {
  const next = event.relatedTarget
  const container = event.currentTarget
  if (
    container instanceof HTMLElement &&
    next instanceof Node &&
    container.contains(next)
  ) {
    return
  }
  closeDropdown()
}

onBeforeUnmount(() => {
  clearDropdownTimers()
})

function resolveMenuItemsForNode(node: PublicBlockNode | Record<string, unknown>): RuntimeMenuItem[] {
  const directItems = getArrayField<RuntimeMenuItem>(node, 'items')
  if (directItems.length) {
    return directItems
  }

  const explicitMenuId = getStringField(node, 'menuId')
  const nodeSlot = getStringField(node, 'slot')
  const label = getStringField(node, 'menuLabel')
  const menu = runtimeMenus.value.find((entry) => {
    if (explicitMenuId) {
      return entry.id === explicitMenuId
    }

    return (nodeSlot && entry.purpose === nodeSlot) || (label && entry.name === label)
  })

  return Array.isArray(menu?.items) ? menu.items : []
}

function collectHeaderElements(
  nodes: PublicBlockNode[],
  visitor: (node: PublicBlockNode) => void
) {
  for (const node of nodes) {
    if (getNodeField(node, 'visible') === false) {
      continue
    }

    visitor(node)
    collectHeaderElements(getNodeChildren(node), visitor)
  }
}

function flattenMenuItems(items: RuntimeMenuItem[], depth = 0): FlatMenuItem[] {
  const flattened: FlatMenuItem[] = []

  for (const item of items) {
    if (!item || item.visible === false) {
      continue
    }

    const href = typeof item.href === 'string' && item.href.trim() ? item.href : '#'
    const label = typeof item.label === 'string' && item.label.trim() ? item.label : 'Link'

    flattened.push({
      id: typeof item.id === 'string' && item.id.trim() ? item.id : `${depth}:${href}:${label}`,
      href,
      label,
      target: item.target,
      rel: item.rel,
      depth,
    })

    if (Array.isArray(item.children) && item.children.length) {
      flattened.push(...flattenMenuItems(item.children, depth + 1))
    }
  }

  return flattened
}

function getMobileItemStyle(depth: number): CSSProperties {
  return {
    paddingLeft: `${12 + depth * 16}px`,
  }
}

function getActionLinkStyle(actionLink: HeaderActionLink): CSSProperties {
  return {
    backgroundColor:
      typeof actionLink.styles.backgroundColor === 'string'
        ? actionLink.styles.backgroundColor
        : 'var(--builder-button-background, #2563eb)',
    border:
      typeof actionLink.styles.border === 'string'
        ? actionLink.styles.border
        : undefined,
    borderRadius:
      typeof actionLink.styles.borderRadius === 'string' || typeof actionLink.styles.borderRadius === 'number'
        ? actionLink.styles.borderRadius
        : '18px',
    color:
      typeof actionLink.styles.color === 'string'
        ? actionLink.styles.color
        : 'var(--builder-button-text, #ffffff)',
    padding:
      typeof actionLink.styles.padding === 'string' || typeof actionLink.styles.padding === 'number'
        ? actionLink.styles.padding
        : '14px 18px',
    textDecoration: 'none',
  }
}

function isExternalHref(href?: string | null) {
  return typeof href === 'string' && /^(https?:)?\/\//.test(href)
}

const SOCIAL_ICON_PATHS: Record<string, string> = {
  facebook: 'M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073c0 6.026 4.388 11.022 10.125 11.927v-8.437H7.078v-3.49h3.047V9.413c0-3.025 1.792-4.697 4.533-4.697 1.313 0 2.686.236 2.686.236v2.971h-1.513c-1.49 0-1.956.93-1.956 1.886v2.264h3.328l-.532 3.49h-2.796v8.437C19.612 23.095 24 18.1 24 12.073',
  instagram: 'M12 2.163c3.204 0 3.584.012 4.85.07 1.17.054 1.805.249 2.228.415.56.217.96.477 1.38.896.42.42.679.82.896 1.38.166.422.36 1.057.415 2.227.058 1.266.07 1.646.07 4.85s-.012 3.584-.07 4.849c-.054 1.17-.249 1.805-.415 2.228a3.72 3.72 0 0 1-.896 1.38 3.72 3.72 0 0 1-1.38.896c-.423.166-1.058.36-2.228.415-1.266.058-1.646.07-4.85.07s-3.584-.012-4.849-.07c-1.17-.054-1.805-.249-2.228-.415a3.72 3.72 0 0 1-1.38-.896 3.72 3.72 0 0 1-.896-1.38c-.166-.423-.36-1.058-.415-2.228C2.175 15.584 2.163 15.204 2.163 12s.012-3.584.07-4.849c.054-1.17.249-1.805.415-2.228.217-.56.477-.96.896-1.38a3.72 3.72 0 0 1 1.38-.896c.423-.166 1.058-.36 2.228-.415C8.416 2.175 8.796 2.163 12 2.163M12 0C8.741 0 8.333.014 7.053.072 5.775.131 4.903.333 4.14.63a5.88 5.88 0 0 0-2.126 1.384A5.88 5.88 0 0 0 .63 4.14C.333 4.903.131 5.775.072 7.053.014 8.333 0 8.741 0 12s.014 3.667.072 4.947c.059 1.278.261 2.15.558 2.913a5.88 5.88 0 0 0 1.384 2.126A5.88 5.88 0 0 0 4.14 23.37c.763.297 1.635.499 2.913.558C8.333 23.986 8.741 24 12 24s3.667-.014 4.947-.072c1.278-.059 2.15-.261 2.913-.558a5.88 5.88 0 0 0 2.126-1.384 5.88 5.88 0 0 0 1.384-2.126c.297-.763.499-1.635.558-2.913C23.986 15.667 24 15.259 24 12s-.014-3.667-.072-4.947c-.059-1.278-.261-2.15-.558-2.913a5.88 5.88 0 0 0-1.384-2.126A5.88 5.88 0 0 0 19.86.63C19.097.333 18.225.131 16.947.072 15.667.014 15.259 0 12 0m0 5.838a6.163 6.163 0 1 0 0 12.325 6.163 6.163 0 0 0 0-12.325M12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8m6.406-10.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881',
  x: 'M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z',
  twitter: 'M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z',
  linkedin: 'M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065m1.782 13.019H3.555V9h3.564zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0z',
  youtube: 'M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.546 12 3.546 12 3.546s-7.505 0-9.377.504A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.504 9.376.504 9.376.504s7.505 0 9.377-.504a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814M9.545 15.568V8.432L15.818 12z',
  tiktok: 'M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z',
  pinterest: 'M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.162-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738a.36.36 0 0 1 .083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.631-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12.017 24c6.624 0 11.99-5.367 11.99-11.988C24.007 5.367 18.641.001 12.017.001z',
  github: 'M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12',
  whatsapp: 'M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z',
  telegram: 'M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.016 8.297c-.1.62-1.728 8.49-2.44 11.264-.301 1.175-.895 1.568-1.469 1.608-1.248.086-2.196-.825-3.405-1.617-1.892-1.24-2.96-2.012-4.796-3.224-2.122-1.4-.746-2.17.463-3.428.317-.33 5.827-5.34 5.934-5.796.013-.057.025-.27-.1-.382s-.31-.037-.443-.022c-.189.022-3.2 2.034-9.032 5.974-.854.587-1.628.873-2.322.858-.765-.017-2.234-.433-3.327-.788-1.34-.436-2.405-.666-2.313-1.406.048-.385.577-.78 1.587-1.184 6.218-2.708 10.362-4.494 12.434-5.357 5.925-2.465 7.156-2.893 7.957-2.907.176-.003.571.041.827.249.216.175.275.411.304.577.029.166.065.543.036.838z',
  threads: 'M12.186 24h-.007c-3.581-.024-6.334-1.205-8.184-3.509C2.35 18.44 1.5 15.586 1.472 12.01v-.017c.03-3.579.879-6.43 2.525-8.482C5.845 1.205 8.6.024 12.18 0h.014c2.746.02 5.043.725 6.826 2.098 1.677 1.29 2.858 3.13 3.509 5.467l-2.773.776c-1.003-3.593-3.473-5.382-7.553-5.416-2.754.02-4.799.946-6.076 2.751-1.2 1.696-1.818 4.13-1.839 7.233v.12c.07 6.37 3.26 9.908 8.89 9.966.086-.001 3.202-.076 5.303-1.478V16.73h-4.66v-2.678h7.593v7.83C19.854 23.1 16.418 24 12.186 24zm2.789-8.793c2.141.104 3.748 1.144 4.063 3.592.016.126-.09.234-.217.234h-.001l-1.063-.006a.216.216 0 0 1-.213-.183c-.259-1.615-1.251-2.386-2.679-2.386-1.857 0-2.907 1.37-2.907 3.305 0 1.934 1.05 3.305 2.907 3.305 1.267 0 2.218-.586 2.596-1.773a.216.216 0 0 1 .206-.152l1.075.006c.13.001.228.121.198.247-.439 1.856-1.835 2.925-4.075 2.925-2.654 0-4.19-1.946-4.19-4.558 0-2.612 1.536-4.558 4.19-4.558l.11.002',
}

function socialIconPath(label?: string | null): string {
  const key = (label || '').trim().toLowerCase()
  return SOCIAL_ICON_PATHS[key] || SOCIAL_ICON_PATHS.x || ''
}

const socialIconSize = computed(() => {
  const raw = getStringField(props.node, 'iconSize')
  if (raw) {
    const n = Number.parseFloat(raw)
    if (!Number.isNaN(n) && n > 0) return n
  }
  return 20
})

const socialIconColor = computed(() => {
  return getStringField(props.node, 'iconColor') || null
})

const socialIconStyles = computed(() => {
  const size = socialIconSize.value
  const pad = Math.max(4, Math.round(size * 0.35))
  const styles: CSSProperties = {
    '--wt-social-icon-size': `${size}px`,
    '--wt-social-icon-pad': `${pad}px`,
  } as CSSProperties
  if (socialIconColor.value) {
    styles['--wt-social-icon-color'] = socialIconColor.value
  }
  return styles
})
</script>

<template>
  <div
    v-if="isHeaderPrimaryMenu"
    class="wt-menu-shell wt-menu-shell--header-primary"
    :class="nodeClasses"
    :style="resolvedStyles"
    :data-wt-node-id="nodeDomId"
  >
    <nav class="wt-menu wt-menu--desktop">
      <template v-for="(item, index) in visibleItems" :key="item.href || item.label">
        <div
          v-if="visibleChildren(item).length"
          class="wt-menu-item--dropdown"
          :class="{ 'wt-menu-item--open': isDropdownOpen(dropdownKey(item, index)) }"
          @mouseenter="scheduleDropdownOpen(dropdownKey(item, index))"
          @mouseleave="scheduleDropdownClose()"
          @focusout="onDropdownFocusOut"
          @keydown.escape.stop="closeDropdown()"
        >
          <span class="wt-menu-item__trigger">
            <NuxtLink
              class="wt-menu-link wt-ui-link"
              :to="item.href || '#'"
              :target="item.target || undefined"
              :rel="item.rel || undefined"
              :external="isExternalHref(item.href)"
              @click="closeDropdown()"
            >
              {{ item.label }}
            </NuxtLink>
            <button
              type="button"
              class="wt-menu-caret"
              :aria-expanded="isDropdownOpen(dropdownKey(item, index))"
              :aria-controls="`wt-menu-flyout-${nodeDomId || 'menu'}-${index}`"
              :aria-label="`${item.label} submenu`"
              @click.prevent="toggleDropdown(dropdownKey(item, index))"
            >
              <span class="wt-menu-caret__icon" aria-hidden="true" />
            </button>
          </span>
          <div
            v-show="isDropdownOpen(dropdownKey(item, index))"
            :id="`wt-menu-flyout-${nodeDomId || 'menu'}-${index}`"
            class="wt-menu-flyout"
            :class="{ 'wt-menu-flyout--overlay': isOverlayHeader }"
          >
            <NuxtLink
              v-for="child in visibleChildren(item)"
              :key="child.id || child.href || child.label"
              class="wt-menu-flyout__link"
              :to="child.href || '#'"
              :target="child.target || undefined"
              :rel="child.rel || undefined"
              :external="isExternalHref(child.href)"
              @click="closeDropdown()"
            >
              {{ child.label }}
            </NuxtLink>
          </div>
        </div>
        <NuxtLink
          v-else
          class="wt-menu-link wt-ui-link"
          :to="item.href || '#'"
          :target="item.target || undefined"
          :rel="item.rel || undefined"
          :external="isExternalHref(item.href)"
        >
          {{ item.label }}
        </NuxtLink>
      </template>
    </nav>

    <div class="wt-header-menu-toggle">
      <button
        type="button"
        class="wt-header-menu-toggle__button wt-ui-button wt-ui-menu-button"
        :style="{ color: toggleTextColor, borderColor: isOverlayHeader ? 'rgba(255,255,255,0.24)' : 'rgba(148,163,184,0.35)' }"
        :aria-expanded="isMobileMenuOpen"
        :aria-label="`Open ${menuLabel}`"
        @click="isMobileMenuOpen = true"
      >
        <span class="wt-header-menu-toggle__bars" aria-hidden="true">
          <span />
          <span />
          <span />
        </span>
        <span>Menu</span>
      </button>
    </div>

    <Teleport to="body">
      <div
        v-if="isMobileMenuOpen"
        class="wt-mobile-menu-sheet"
        :class="{ 'wt-mobile-menu-sheet--overlay': isOverlayHeader }"
        @click.self="closeMobileMenu"
      >
        <div
          class="wt-mobile-menu-sheet__surface wt-ui-sheet"
          :class="{ 'wt-ui-sheet--overlay': isOverlayHeader }"
        >
          <div class="wt-mobile-menu-sheet__top">
            <button
              type="button"
              class="wt-mobile-menu-sheet__close wt-ui-button wt-ui-menu-button"
              :aria-label="`Close ${menuLabel}`"
              @click="closeMobileMenu"
            >
              <span class="wt-mobile-menu-sheet__close-mark" aria-hidden="true">X</span>
              <span>Close</span>
            </button>
          </div>

          <div class="wt-mobile-menu-sheet__body">
            <nav class="wt-mobile-menu-list" :aria-label="menuLabel">
              <NuxtLink
                v-for="item in flattenedVisibleItems"
                :key="`${item.id}:${item.depth}`"
                class="wt-mobile-menu-link wt-ui-link wt-ui-divider-link"
                :style="getMobileItemStyle(item.depth)"
                :to="item.href"
                :target="item.target || undefined"
                :rel="item.rel || undefined"
                :external="isExternalHref(item.href)"
                @click="closeMobileMenu"
              >
                {{ item.label }}
              </NuxtLink>
            </nav>

            <div v-if="flattenedUtilityItems.length" class="wt-mobile-menu-section">
              <p class="wt-mobile-menu-section__title">Utility</p>
              <nav class="wt-mobile-menu-list" aria-label="Utility links">
                <NuxtLink
                  v-for="item in flattenedUtilityItems"
                  :key="`utility:${item.id}:${item.depth}`"
                  class="wt-mobile-menu-link wt-mobile-menu-link--secondary wt-ui-link wt-ui-divider-link"
                  :style="getMobileItemStyle(item.depth)"
                  :to="item.href"
                  :target="item.target || undefined"
                  :rel="item.rel || undefined"
                  :external="isExternalHref(item.href)"
                  @click="closeMobileMenu"
                >
                  {{ item.label }}
                </NuxtLink>
              </nav>
            </div>

            <div v-if="headerSupplemental.socialItems.length" class="wt-mobile-menu-section">
              <p class="wt-mobile-menu-section__title">Follow us</p>
              <nav class="wt-mobile-menu-social" aria-label="Social links">
                <a
                  v-for="item in headerSupplemental.socialItems"
                  :key="`social:${item.id || item.href}`"
                  class="wt-mobile-menu-social__icon"
                  :href="item.href || '#'"
                  target="_blank"
                  rel="noopener noreferrer"
                  :aria-label="item.label || 'Social link'"
                  @click="closeMobileMenu"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    class="wt-mobile-menu-social__svg"
                    aria-hidden="true"
                  >
                    <path :d="socialIconPath(item.label)" />
                  </svg>
                </a>
              </nav>
            </div>

            <div v-if="headerSupplemental.actionLinks.length" class="wt-mobile-menu-actions">
              <NuxtLink
                v-for="actionLink in headerSupplemental.actionLinks"
                :key="actionLink.id"
                class="wt-mobile-menu-action wt-ui-button wt-ui-link"
                :data-wt-cta="actionLink.id"
                :to="actionLink.href"
                :target="actionLink.target || undefined"
                :rel="actionLink.rel || undefined"
                :external="isExternalHref(actionLink.href)"
                :style="getActionLinkStyle(actionLink)"
                @click="closeMobileMenu"
              >
                {{ actionLink.label }}
              </NuxtLink>
            </div>
          </div>
        </div>
      </div>
    </Teleport>
  </div>

  <nav
    v-else-if="hasFooterColumnGroups"
    class="wt-footer-columns"
    :class="nodeClasses"
    :style="resolvedStyles"
    :data-wt-node-id="nodeDomId"
    :aria-label="menuLabel"
  >
    <div
      v-for="(group, index) in visibleItems"
      :key="group.id || group.href || group.label || index"
      class="wt-footer-columns__group"
      :class="{ 'wt-footer-columns__group--has-children': visibleChildren(group).length > 0 }"
    >
      <NuxtLink
        v-if="group.href"
        class="wt-footer-columns__heading wt-ui-link"
        :to="group.href"
        :target="group.target || undefined"
        :rel="group.rel || undefined"
        :external="isExternalHref(group.href)"
      >
        {{ group.label }}
      </NuxtLink>
      <span v-else class="wt-footer-columns__heading">{{ group.label }}</span>

      <ul v-if="visibleChildren(group).length" class="wt-footer-columns__list">
        <li v-for="child in visibleChildren(group)" :key="child.id || child.href || child.label">
          <NuxtLink
            class="wt-menu-link wt-ui-link"
            :to="child.href || '#'"
            :target="child.target || undefined"
            :rel="child.rel || undefined"
            :external="isExternalHref(child.href)"
          >
            {{ child.label }}
          </NuxtLink>
        </li>
      </ul>
    </div>
  </nav>

  <nav
    v-else-if="isSocialInlineMenu"
    class="wt-social-menu"
    :class="[nodeClasses, { 'wt-social-menu--header': isSocialInHeader }]"
    :style="{ ...resolvedStyles, ...socialIconStyles }"
    :data-wt-node-id="nodeDomId"
    aria-label="Social links"
  >
    <a
      v-for="item in visibleItems"
      :key="item.href || item.label"
      class="wt-social-icon"
      :href="item.href || '#'"
      :target="item.target || '_blank'"
      :rel="item.rel || 'noopener noreferrer'"
      :aria-label="item.label || 'Social link'"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="currentColor"
        class="wt-social-icon__svg"
        aria-hidden="true"
      >
        <path :d="socialIconPath(item.label)" />
      </svg>
    </a>
  </nav>

  <nav
    v-else
    class="wt-menu"
    :class="[nodeClasses, { 'wt-menu--hide-mobile': isHeaderUtilityMenu }]"
    :style="resolvedStyles"
    :data-wt-node-id="nodeDomId"
  >
    <NuxtLink
      v-for="item in visibleItems"
      :key="item.href || item.label"
      class="wt-menu-link wt-ui-link"
      :to="item.href || '#'"
      :target="item.target || undefined"
      :rel="item.rel || undefined"
      :external="isExternalHref(item.href)"
    >
      {{ item.label }}
    </NuxtLink>
  </nav>
</template>

<style scoped>
.wt-menu-shell {
  min-width: 0;
  color: inherit;
}

.wt-menu {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
  color: inherit;
}

.wt-menu-link {
  color: inherit;
  text-decoration: none;
}

/* Grouped footer navigation — CSS multi-column rather than a grid. A grid
   couples row heights across columns, so a tall multi-link group inflates its
   whole row and leaves big gaps below the single-link items beside it.
   Multi-column packs each column independently: bare links stack tightly and
   only true groups (with children) take extra separation below. */
.wt-footer-columns {
  column-count: 1;
  column-gap: 2.5rem;
  color: inherit;
}

@media (min-width: 768px) {
  .wt-footer-columns {
    column-count: 2;
  }
}

@media (min-width: 1280px) {
  .wt-footer-columns {
    column-count: 3;
  }
}

.wt-footer-columns__group {
  break-inside: avoid;
  margin-bottom: 0.5rem;
}

.wt-footer-columns__group--has-children {
  margin-bottom: 1.5rem;
}

.wt-footer-columns__heading {
  display: block;
  font-weight: 600;
  color: inherit;
  text-decoration: none;
}

.wt-footer-columns__group--has-children .wt-footer-columns__heading {
  margin-bottom: 0.5rem;
}

.wt-footer-columns__list {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
  margin: 0;
  padding: 0;
  list-style: none;
  opacity: 0.85;
}

.wt-menu-item--dropdown {
  position: relative;
  display: inline-flex;
  align-items: center;
}

.wt-menu-item__trigger {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
}

.wt-menu-caret {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.25rem;
  height: 1.25rem;
  padding: 0;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: inherit;
  cursor: pointer;
}

.wt-menu-caret__icon {
  display: block;
  width: 0.5rem;
  height: 0.5rem;
  border-right: 1.5px solid currentColor;
  border-bottom: 1.5px solid currentColor;
  transform: rotate(45deg) translateY(-15%);
  transition: transform 0.15s ease;
}

.wt-menu-item--open .wt-menu-caret__icon {
  transform: rotate(225deg) translateY(-15%);
}

.wt-menu-flyout {
  position: absolute;
  top: calc(100% + 6px);
  left: 50%;
  transform: translateX(-50%);
  z-index: 150;
  display: flex;
  min-width: 200px;
  max-width: 280px;
  flex-direction: column;
  padding: 0.5rem;
  border-radius: 12px;
  background: var(--wt-color-surface, #ffffff);
  color: var(--wt-color-text, #0f172a);
  box-shadow: 0 12px 32px rgba(15, 23, 42, 0.16), 0 0 0 1px rgba(148, 163, 184, 0.18);
}

.wt-menu-flyout--overlay {
  background: rgba(15, 23, 42, 0.92);
  color: #ffffff;
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.32), 0 0 0 1px rgba(255, 255, 255, 0.12);
  backdrop-filter: blur(8px);
}

.wt-menu-flyout__link {
  display: block;
  padding: 0.5rem 0.75rem;
  border-radius: 8px;
  color: inherit;
  font-size: 0.925rem;
  text-decoration: none;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.wt-menu-flyout__link:hover,
.wt-menu-flyout__link:focus-visible {
  background: rgba(148, 163, 184, 0.16);
}

.wt-menu-flyout--overlay .wt-menu-flyout__link:hover,
.wt-menu-flyout--overlay .wt-menu-flyout__link:focus-visible {
  background: rgba(255, 255, 255, 0.12);
}

.wt-header-menu-toggle {
  display: none;
}

.wt-header-menu-toggle__button,
.wt-mobile-menu-sheet__close {
  display: inline-flex;
  min-height: 44px;
  align-items: center;
  justify-content: center;
  gap: 0.625rem;
  padding: 0.625rem 1rem;
}

.wt-header-menu-toggle__bars {
  display: inline-flex;
  flex-direction: column;
  gap: 3px;
}

.wt-header-menu-toggle__bars > span {
  display: block;
  width: 14px;
  height: 2px;
  border-radius: 999px;
  background: currentColor;
}

.wt-mobile-menu-sheet {
  position: fixed;
  inset: 0;
  z-index: 140;
  background: rgba(15, 23, 42, 0.22);
  backdrop-filter: blur(8px);
}

.wt-mobile-menu-sheet__surface {
  display: flex;
  height: 100dvh;
  flex-direction: column;
}

.wt-mobile-menu-sheet__top {
  display: flex;
  justify-content: flex-end;
  padding: 1rem 1rem 0;
}

.wt-mobile-menu-sheet--overlay .wt-mobile-menu-sheet__close {
  border-color: rgba(255, 255, 255, 0.18);
  color: #ffffff;
  box-shadow: none;
}

.wt-mobile-menu-sheet__body {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 1.5rem;
  overflow-y: auto;
  padding: 0.75rem 1rem 1.5rem;
}

.wt-mobile-menu-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.wt-mobile-menu-link,
.wt-mobile-menu-action {
  display: block;
  padding: 0.875rem 0.75rem;
  color: inherit;
  font-size: 0.95rem;
  font-weight: 600;
}

.wt-mobile-menu-link--secondary {
  opacity: 0.76;
}

.wt-mobile-menu-sheet--overlay .wt-mobile-menu-link {
  border-bottom-color: rgba(255, 255, 255, 0.12);
}

.wt-mobile-menu-section {
  display: flex;
  flex-direction: column;
  gap: 0.625rem;
}

.wt-mobile-menu-section__title {
  margin: 0;
  padding: 0 0.75rem;
  font-size: 0.6875rem;
  font-weight: 700;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  opacity: 0.6;
}

.wt-mobile-menu-actions {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.wt-mobile-menu-action {
  text-align: center;
  font-weight: 700;
}

@media (min-width: 1024px) {
  .wt-mobile-menu-sheet {
    display: none;
  }

  .wt-menu-shell--header-primary {
    display: flex;
    flex: 1;
    align-items: center;
    justify-content: center;
  }

  .wt-menu-shell--header-primary > .wt-menu--desktop {
    min-width: 0;
    justify-content: inherit;
  }
}

@media (max-width: 1023.98px) {
  .wt-menu-shell--header-primary {
    display: flex;
    flex: 0 0 auto;
    width: auto;
    max-width: 100%;
    margin-left: auto;
    align-items: center;
    justify-content: flex-end;
    align-self: center;
    justify-self: end;
  }

  .wt-menu-shell--header-primary > .wt-menu--desktop {
    display: none;
  }

  .wt-header-menu-toggle {
    display: flex;
    width: auto;
    max-width: 100%;
    margin-left: auto;
    align-items: center;
    justify-content: flex-end;
    align-self: center;
    justify-self: end;
  }

  .wt-menu--hide-mobile {
    display: none;
  }
}

/* ── Social inline icons ─────────────────────────────────────────────── */

.wt-social-menu {
  --_icon-size: var(--wt-social-icon-size, 20px);
  --_icon-pad: var(--wt-social-icon-pad, 7px);
  --_icon-color: var(--wt-social-icon-color, currentColor);
  display: flex;
  align-items: center;
  gap: calc(var(--_icon-pad) * 1.15);
  flex-wrap: wrap;
  color: inherit;
}

.wt-social-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: calc(var(--_icon-size) + var(--_icon-pad) * 2);
  height: calc(var(--_icon-size) + var(--_icon-pad) * 2);
  padding: var(--_icon-pad);
  border-radius: 50%;
  color: var(--_icon-color);
  background: color-mix(in srgb, var(--_icon-color) 8%, transparent);
  text-decoration: none;
  transition: background-color 0.15s ease, opacity 0.15s ease;
  opacity: 0.88;
}

.wt-social-icon:hover,
.wt-social-icon:focus-visible {
  background-color: color-mix(in srgb, var(--_icon-color) 16%, transparent);
  opacity: 1;
}

@media (max-width: 1023.98px) {
  .wt-social-menu--header {
    display: none;
  }
}

.wt-social-icon:focus-visible {
  outline: 2px solid var(--_icon-color);
  outline-offset: 2px;
}

.wt-social-icon__svg {
  width: var(--_icon-size);
  height: var(--_icon-size);
  flex-shrink: 0;
  fill: currentColor;
}

/* ── Mobile drawer social icons ──────────────────────────────────────── */

.wt-mobile-menu-social {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
  padding: 0 0.75rem;
}

.wt-mobile-menu-social__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  color: inherit;
  background: rgba(148, 163, 184, 0.08);
  text-decoration: none;
  transition: background-color 0.15s ease;
}

.wt-mobile-menu-social__icon:hover,
.wt-mobile-menu-social__icon:focus-visible {
  background: rgba(148, 163, 184, 0.18);
}

.wt-mobile-menu-sheet--overlay .wt-mobile-menu-social__icon {
  background: rgba(255, 255, 255, 0.08);
}

.wt-mobile-menu-sheet--overlay .wt-mobile-menu-social__icon:hover,
.wt-mobile-menu-sheet--overlay .wt-mobile-menu-social__icon:focus-visible {
  background: rgba(255, 255, 255, 0.16);
}

.wt-mobile-menu-social__svg {
  width: 22px;
  height: 22px;
  flex-shrink: 0;
  fill: currentColor;
}
</style>
