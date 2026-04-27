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

const nodeClasses = computed(() => getNodeClasses(props.node))
const nodeStyles = computed(() => getNodeStyles(props.node))
const nodeDomId = computed(() => getNodeDomId(props.node) || undefined)
const colorMode = computed(() => (getStringField(props.node, 'colorMode') || '').trim().toLowerCase())
const variant = computed(() => (getStringField(props.node, 'variant') || 'header-inline').trim().toLowerCase())
const slot = computed(() => (getStringField(props.node, 'slot') || '').trim().toLowerCase())
const menuLabel = computed(() => getStringField(props.node, 'menuLabel') || 'Site navigation')
const isHeaderPrimaryMenu = computed(() => slot.value === 'primary' || variant.value === 'header-inline')
const isHeaderUtilityMenu = computed(() => slot.value === 'utility' || variant.value === 'utility-inline')
const isOverlayHeader = computed(() => runtimeHeaderOverlay.value)

const items = computed<RuntimeMenuItem[]>(() => resolveMenuItemsForNode(props.node))
const visibleItems = computed(() => items.value.filter((item) => item?.visible !== false))
const flattenedVisibleItems = computed(() => flattenMenuItems(visibleItems.value))

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
