<script setup lang="ts">
import type { CSSProperties } from 'vue'
import type { PublicBlockNode } from '~/types/public'
import { getNodeClasses, getNodeStyles, getStringField } from '~/lib/blockRuntime'
import { getNodeDomId } from '~/lib/responsiveRuntime'
import { parseVideoEmbed } from '~/lib/videoEmbed'

const props = defineProps<{ node: PublicBlockNode }>()

const nodeClasses = computed(() => getNodeClasses(props.node))
const nodeStyles = computed(() => getNodeStyles(props.node) as CSSProperties)
const nodeDomId = computed(() => getNodeDomId(props.node) || undefined)

const title = computed(() => getStringField(props.node, 'title') || 'Embedded video')
const embed = computed(() => parseVideoEmbed(getStringField(props.node, 'src')))

// Performance: for YouTube we show a thumbnail facade and only load the heavy
// player iframe once the visitor clicks play. Vimeo/other embeds (no derivable
// thumbnail) render the iframe directly.
const activated = ref(false)
const useFacade = computed(() => Boolean(embed.value?.thumbnailUrl) && !activated.value)

const iframeSrc = computed(() => {
  if (!embed.value) return ''
  if (activated.value && embed.value.provider === 'youtube') {
    return `${embed.value.embedUrl}?autoplay=1`
  }
  return embed.value.embedUrl
})
</script>

<template>
  <div
    v-if="embed"
    class="wt-video-block"
    :class="nodeClasses"
    :style="nodeStyles"
    :data-wt-node-id="nodeDomId"
  >
    <div class="wt-video-block__frame">
      <button
        v-if="useFacade"
        type="button"
        class="wt-video-block__facade"
        :style="{ backgroundImage: `url('${embed.thumbnailUrl}')` }"
        :aria-label="`Play video: ${title}`"
        @click="activated = true"
      >
        <span class="wt-video-block__play" aria-hidden="true">
          <svg viewBox="0 0 68 48" width="68" height="48">
            <path
              class="wt-video-block__play-bg"
              d="M66.52 7.74c-.78-2.93-2.49-5.41-5.42-6.19C55.79.13 34 0 34 0S12.21.13 6.9 1.55c-2.93.78-4.63 3.26-5.42 6.19C.06 13.05 0 24 0 24s.06 10.95 1.48 16.26c.78 2.93 2.49 5.41 5.42 6.19C12.21 47.87 34 48 34 48s21.79-.13 27.1-1.55c2.93-.78 4.64-3.26 5.42-6.19C67.94 34.95 68 24 68 24s-.06-10.95-1.48-16.26z"
            />
            <path d="M45 24 27 14v20z" fill="#fff" />
          </svg>
        </span>
      </button>
      <iframe
        v-else
        class="wt-video-block__iframe"
        :src="iframeSrc"
        :title="title"
        loading="lazy"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowfullscreen
      />
    </div>
  </div>
</template>

<style scoped>
.wt-video-block {
  width: 100%;
}

.wt-video-block__frame {
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 9;
  overflow: hidden;
  background: #000;
  border-radius: inherit;
}

.wt-video-block__iframe,
.wt-video-block__facade {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  border: 0;
}

.wt-video-block__facade {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  cursor: pointer;
  background-color: #000;
  background-size: cover;
  background-position: center;
}

.wt-video-block__play {
  display: inline-flex;
}

.wt-video-block__play-bg {
  fill: #212121;
  fill-opacity: 0.8;
  transition: fill-opacity 0.2s ease;
}

.wt-video-block__facade:hover .wt-video-block__play-bg,
.wt-video-block__facade:focus-visible .wt-video-block__play-bg {
  fill: #f00;
  fill-opacity: 1;
}
</style>
