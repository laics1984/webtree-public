<script setup lang="ts">
import type { ContentMetaIconName } from '~/lib/contentMeta'

/**
 * The glyph beside a content item's date, author or location.
 *
 * Geometry is lucide's (0.487.0 — CalendarDays, UserRound, MapPin), the icons
 * the builder canvas draws for these same fields, so the published page shows
 * what the author designed. Inline rather than through the FontAwesome plugin:
 * those glyphs are a different family and would not match the canvas.
 *
 * Decorative — the label beside it carries the meaning. Sized 1em by default
 * so it follows the text; a parent rule may set an exact size instead.
 */
defineOptions({ name: 'ContentMetaIcon' })
defineProps<{ name: ContentMetaIconName }>()
</script>

<template>
  <svg
    class="wt-meta-icon"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
    focusable="false"
  >
    <template v-if="name === 'calendar'">
      <path d="M8 2v4" />
      <path d="M16 2v4" />
      <rect width="18" height="18" x="3" y="4" rx="2" />
      <path d="M3 10h18" />
      <path d="M8 14h.01" />
      <path d="M12 14h.01" />
      <path d="M16 14h.01" />
      <path d="M8 18h.01" />
      <path d="M12 18h.01" />
      <path d="M16 18h.01" />
    </template>
    <template v-else-if="name === 'user'">
      <circle cx="12" cy="8" r="5" />
      <path d="M20 21a8 8 0 0 0-16 0" />
    </template>
    <template v-else>
      <path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0" />
      <circle cx="12" cy="10" r="3" />
    </template>
  </svg>
</template>

<style scoped>
.wt-meta-icon {
  width: 1em;
  height: 1em;
  flex-shrink: 0;
}
</style>
