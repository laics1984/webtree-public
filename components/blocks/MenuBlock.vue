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
      const isUtilityMenu =
        nodeSlot === 'utility' || nodeVariant === 'utility-inline'

      if (!isUtilityMenu) {
        return
      }

      utilityItems.push(...resolveMenuItemsForNode(node).filter((item) => item?.visible !== false))
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
  delete styles.color
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

            <div v-if="headerSupplemental.actionLinks.length" class="wt-mobile-menu-actions">
              <NuxtLink
                v-for="actionLink in headerSupplemental.actionLinks"
                :key="actionLink.id"
                class="wt-mobile-menu-action wt-ui-button wt-ui-link"
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
</style>
