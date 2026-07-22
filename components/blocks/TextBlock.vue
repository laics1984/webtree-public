<script setup lang="ts">
import { getNodeClasses, getNodeStyles, getStringField } from '~/lib/blockRuntime'
import { getNodeDomId } from '~/lib/responsiveRuntime'

const props = defineProps<{ node: Record<string, any> }>()
const html = computed(() => getStringField(props.node, 'html', 'innerText', 'text') || '')
const htmlTag = computed(() => getStringField(props.node, 'htmlTag') || 'div')
const nodeClasses = computed(() => getNodeClasses(props.node))
const nodeStyles = computed(() => getNodeStyles(props.node))
const nodeDomId = computed(() => getNodeDomId(props.node) || undefined)

// Progressive "show more" for clamped text (e.g. team-member bios marked with
// `wt-clamp`). The element ships a static line-clamp (inline style) so it is
// truncated server-side and in builds without this script; on the client we
// measure overflow and, when the content is actually cut off, add a toggle that
// removes the clamp. No clamp class → unchanged single-div render.
const isClamp = computed(() => /\bwt-clamp\b/.test(nodeClasses.value))
const textEl = ref<HTMLElement | null>(null)
const mounted = ref(false)
const expanded = ref(false)
const overflowing = ref(false)

const clampStyles = computed(() => {
  if (!expanded.value) return nodeStyles.value
  // Expanded: lift the line-clamp so the full bio shows.
  return { ...nodeStyles.value, WebkitLineClamp: 'unset', overflow: 'visible' }
})

function measure() {
  const el = textEl.value
  if (!el) return
  overflowing.value = el.scrollHeight - el.clientHeight > 1
}

onMounted(() => {
  if (!isClamp.value) return
  mounted.value = true
  nextTick(measure)
  // Re-measure once web fonts settle (line count can shift).
  const fonts = (document as any).fonts
  if (fonts?.ready?.then) fonts.ready.then(() => nextTick(measure))
})
</script>

<template>
  <div v-if="isClamp" class="wt-clamp-wrap">
    <component
      :is="htmlTag"
      ref="textEl"
      class="wt-text"
      :class="nodeClasses"
      :style="clampStyles"
      :data-wt-node-id="nodeDomId"
      v-html="html"
    />
    <button
      v-if="mounted && overflowing"
      type="button"
      class="wt-clamp-toggle"
      :aria-expanded="expanded"
      @click="expanded = !expanded"
    >
      {{ expanded ? 'Show less' : 'Show more' }}
    </button>
  </div>
  <component
    :is="htmlTag"
    v-else
    class="wt-text"
    :class="nodeClasses"
    :style="nodeStyles"
    :data-wt-node-id="nodeDomId"
    v-html="html"
  />
</template>

<style scoped>
.wt-text { margin: 0; color: var(--wt-footer-ink, var(--builder-color-text, var(--wt-color-text))); }

.wt-clamp-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
}

.wt-clamp-toggle {
  margin-top: 6px;
  padding: 0;
  border: 0;
  background: none;
  font: inherit;
  font-size: 0.8125em;
  font-weight: 600;
  color: var(--builder-color-primary, var(--wt-color-primary, currentColor));
  cursor: pointer;
}
.wt-clamp-toggle:hover { text-decoration: underline; }
</style>
