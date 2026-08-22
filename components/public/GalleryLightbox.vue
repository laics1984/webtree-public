<script setup lang="ts">
/**
 * Full-screen viewer for a gallery group. Opened by the lightbox runtime
 * (`~/lib/lightbox`), which owns tile detection and click delegation; this
 * component owns presentation, navigation and the accessibility contract.
 *
 * Renders nothing until opened, so pages with a gallery nobody clicks pay only
 * the (tiny) runtime. Never rendered server-side — `open` is false on the
 * server, so the Teleport itself is absent from SSR markup.
 */
import type { LightboxSlide } from '~/lib/lightbox'
import { stepIndex } from '~/lib/lightbox'

const props = defineProps<{
  open: boolean
  slides: LightboxSlide[]
  index: number
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'update:index', value: number): void
}>()

const dialogRef = ref<HTMLElement | null>(null)
const isLoading = ref(true)

const count = computed(() => props.slides.length)
const current = computed<LightboxSlide | null>(() => props.slides[props.index] ?? null)
const hasMultiple = computed(() => count.value > 1)

const go = (delta: number) => {
  if (!hasMultiple.value) return
  emit('update:index', stepIndex(props.index, delta, count.value))
}

const goTo = (next: number) => {
  if (next === props.index || next < 0 || next >= count.value) return
  emit('update:index', next)
}

const close = () => emit('close')

// Everything that isn't the photo or a control reads as backdrop — including
// the caption bar, which is just text floating on it. Anchoring dismissal to
// "not the content" rather than to specific elements means no dead zone where
// a tap looks like it should close the viewer and silently does nothing.
const onBackdropClick = (event: MouseEvent) => {
  const target = event.target as HTMLElement | null
  if (target?.closest?.('.wt-lightbox__image, button')) return
  close()
}

// --- loading + neighbour preload -------------------------------------------
// Only n±1 are warmed. Preloading a whole gallery would compete with the image
// the visitor is actually waiting for.
const preload = (src: string | undefined) => {
  if (!src || typeof window === 'undefined') return
  const img = new window.Image()
  img.src = src
}

watch(
  () => current.value?.src,
  (src) => {
    if (!src) return
    isLoading.value = true
    if (typeof window !== 'undefined') {
      // Already cached (back-and-forth through a set) — don't flash a spinner.
      const probe = new window.Image()
      probe.src = src
      if (probe.complete) isLoading.value = false
    }
    if (count.value > 1) {
      preload(props.slides[stepIndex(props.index, 1, count.value)]?.src)
      preload(props.slides[stepIndex(props.index, -1, count.value)]?.src)
    }
  },
  { immediate: true }
)

// --- keyboard ---------------------------------------------------------------
const FOCUSABLE = 'button:not([disabled]), [href], [tabindex]:not([tabindex="-1"])'

const onKeydown = (event: KeyboardEvent) => {
  if (!props.open) return
  switch (event.key) {
    case 'Escape':
      event.preventDefault()
      close()
      return
    case 'ArrowRight':
      event.preventDefault()
      go(1)
      return
    case 'ArrowLeft':
      event.preventDefault()
      go(-1)
      return
    case 'Home':
      event.preventDefault()
      goTo(0)
      return
    case 'End':
      event.preventDefault()
      goTo(count.value - 1)
      return
    case 'Tab': {
      // Focus trap: the viewer is modal, so Tab must not escape into the page
      // behind it (which is inert but still focusable).
      const root = dialogRef.value
      if (!root) return
      const nodes = Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (el) => el.offsetParent !== null || el === document.activeElement
      )
      if (nodes.length === 0) return
      const first = nodes[0]
      const last = nodes[nodes.length - 1]
      const active = document.activeElement as HTMLElement | null
      if (event.shiftKey && (active === first || !root.contains(active))) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && active === last) {
        event.preventDefault()
        first.focus()
      }
    }
  }
}

// --- touch ------------------------------------------------------------------
// Pointer events rather than touch events so a trackpad drag works too. The
// gesture only commits when horizontal travel clearly dominates, otherwise a
// vertical flick would steal the browser's own scroll/dismiss gesture.
const SWIPE_THRESHOLD = 48
let pointerId: number | null = null
let startX = 0
let startY = 0

const onPointerDown = (event: PointerEvent) => {
  if (!hasMultiple.value || event.pointerType === 'mouse') return
  pointerId = event.pointerId
  startX = event.clientX
  startY = event.clientY
}

const onPointerUp = (event: PointerEvent) => {
  if (pointerId === null || event.pointerId !== pointerId) return
  pointerId = null
  const dx = event.clientX - startX
  const dy = event.clientY - startY
  if (Math.abs(dx) < SWIPE_THRESHOLD || Math.abs(dx) <= Math.abs(dy)) return
  go(dx < 0 ? 1 : -1)
}

// --- scroll lock + focus lifecycle -----------------------------------------
let restoreFocusTo: HTMLElement | null = null
let previousBodyOverflow = ''
let previousBodyPaddingRight = ''

const lockScroll = () => {
  const body = document.body
  previousBodyOverflow = body.style.overflow
  previousBodyPaddingRight = body.style.paddingRight
  // Compensate the scrollbar so the page behind doesn't jump sideways.
  const gap = window.innerWidth - document.documentElement.clientWidth
  if (gap > 0) body.style.paddingRight = `${gap}px`
  body.style.overflow = 'hidden'
}

const unlockScroll = () => {
  document.body.style.overflow = previousBodyOverflow
  document.body.style.paddingRight = previousBodyPaddingRight
}

watch(
  () => props.open,
  async (open, wasOpen) => {
    if (open === wasOpen) return
    if (open) {
      restoreFocusTo = (document.activeElement as HTMLElement | null) ?? null
      lockScroll()
      document.addEventListener('keydown', onKeydown)
      await nextTick()
      dialogRef.value?.focus()
    } else {
      document.removeEventListener('keydown', onKeydown)
      unlockScroll()
      // Return focus to the tile that opened the viewer, so keyboard users
      // resume where they left off instead of at the top of the document.
      restoreFocusTo?.focus?.()
      restoreFocusTo = null
    }
  }
)

onBeforeUnmount(() => {
  if (!props.open) return
  document.removeEventListener('keydown', onKeydown)
  unlockScroll()
})
</script>

<template>
  <Teleport v-if="open && current" to="body">
    <div
      ref="dialogRef"
      class="wt-lightbox"
      role="dialog"
      aria-modal="true"
      :aria-label="`Image viewer, ${index + 1} of ${count}`"
      tabindex="-1"
      @click="onBackdropClick"
      @pointerdown="onPointerDown"
      @pointerup="onPointerUp"
      @pointercancel="pointerId = null"
    >
      <button type="button" class="wt-lightbox__close" aria-label="Close image viewer" @click="close">
        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <path d="M6 6l12 12M18 6L6 18" />
        </svg>
      </button>

      <button
        v-if="hasMultiple"
        type="button"
        class="wt-lightbox__nav wt-lightbox__nav--prev"
        aria-label="Previous image"
        @click="go(-1)"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <path d="M15 5l-7 7 7 7" />
        </svg>
      </button>

      <div class="wt-lightbox__stage">
        <div v-if="isLoading" class="wt-lightbox__spinner" aria-hidden="true" />
        <Transition name="wt-lightbox-fade">
          <img
            :key="current.src"
            class="wt-lightbox__image"
            :src="current.src"
            :alt="current.alt"
            decoding="async"
            @load="isLoading = false"
            @error="isLoading = false"
          />
        </Transition>
      </div>

      <button
        v-if="hasMultiple"
        type="button"
        class="wt-lightbox__nav wt-lightbox__nav--next"
        aria-label="Next image"
        @click="go(1)"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <path d="M9 5l7 7-7 7" />
        </svg>
      </button>

      <div class="wt-lightbox__bar" aria-live="polite">
        <p
          v-if="current.caption"
          class="wt-lightbox__caption"
          :aria-hidden="current.caption === current.alt ? 'true' : undefined"
        >
          {{ current.caption }}
        </p>
        <p v-if="hasMultiple" class="wt-lightbox__counter">{{ index + 1 }} / {{ count }}</p>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.wt-lightbox {
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: grid;
  grid-template-columns: auto 1fr auto;
  grid-template-rows: 1fr auto;
  align-items: center;
  gap: clamp(4px, 2vw, 20px);
  padding: clamp(12px, 3vw, 32px);
  background: rgba(9, 9, 11, 0.94);
  backdrop-filter: blur(6px);
  /* The viewer is its own world — don't inherit the section's body font size. */
  font-family: var(--wt-font-body, Inter, Arial, sans-serif);
  overscroll-behavior: contain;
  touch-action: pan-y;
}

.wt-lightbox:focus {
  outline: none;
}

.wt-lightbox__stage {
  position: relative;
  grid-column: 2;
  grid-row: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  min-width: 0;
  min-height: 0;
}

.wt-lightbox__image {
  max-width: 100%;
  max-height: 100%;
  width: auto;
  height: auto;
  object-fit: contain;
  border-radius: 6px;
  box-shadow: 0 24px 70px rgba(0, 0, 0, 0.5);
  /* Absolute so the outgoing and incoming frames overlap during the crossfade
     instead of briefly stacking and resizing the stage. */
  position: absolute;
  inset: 0;
  margin: auto;
}

.wt-lightbox__spinner {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  border: 3px solid rgba(255, 255, 255, 0.22);
  border-top-color: rgba(255, 255, 255, 0.85);
  animation: wt-lightbox-spin 720ms linear infinite;
}

@keyframes wt-lightbox-spin {
  to {
    transform: rotate(360deg);
  }
}

.wt-lightbox__close,
.wt-lightbox__nav {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  /* 44px is the minimum comfortable touch target. */
  width: 44px;
  height: 44px;
  padding: 0;
  border: 0;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
  cursor: pointer;
  transition: background 160ms ease, transform 160ms ease;
}

.wt-lightbox__close:hover,
.wt-lightbox__nav:hover {
  background: rgba(255, 255, 255, 0.22);
}

.wt-lightbox__close:focus-visible,
.wt-lightbox__nav:focus-visible {
  outline: 3px solid #fff;
  outline-offset: 2px;
}

.wt-lightbox__close svg,
.wt-lightbox__nav svg {
  width: 22px;
  height: 22px;
  fill: none;
  stroke: currentColor;
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.wt-lightbox__close {
  position: absolute;
  top: clamp(12px, 3vw, 28px);
  right: clamp(12px, 3vw, 28px);
  z-index: 1;
}

.wt-lightbox__nav--prev {
  grid-column: 1;
  grid-row: 1;
}

.wt-lightbox__nav--next {
  grid-column: 3;
  grid-row: 1;
}

.wt-lightbox__bar {
  grid-column: 1 / -1;
  grid-row: 2;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding-top: clamp(10px, 2vw, 18px);
  text-align: center;
  color: rgba(255, 255, 255, 0.92);
}

.wt-lightbox__caption {
  margin: 0;
  max-width: 70ch;
  font-size: clamp(0.875rem, 1.6vw, 1rem);
  line-height: 1.5;
}

.wt-lightbox__counter {
  margin: 0;
  font-size: 0.8125rem;
  font-variant-numeric: tabular-nums;
  letter-spacing: 0.06em;
  color: rgba(255, 255, 255, 0.66);
}

.wt-lightbox-fade-enter-active,
.wt-lightbox-fade-leave-active {
  transition: opacity 220ms ease;
}

.wt-lightbox-fade-enter-from,
.wt-lightbox-fade-leave-to {
  opacity: 0;
}

/* Phones: the arrows would crowd the photo, so drop them onto the bar and let
   swipe be the primary gesture. */
@media (max-width: 640px) {
  .wt-lightbox {
    grid-template-columns: 1fr;
    grid-template-rows: 1fr auto;
  }

  .wt-lightbox__stage {
    grid-column: 1;
  }

  .wt-lightbox__nav {
    grid-column: 1;
    grid-row: 2;
    align-self: end;
  }

  .wt-lightbox__nav--prev {
    justify-self: start;
  }

  .wt-lightbox__nav--next {
    justify-self: end;
  }

  .wt-lightbox__bar {
    grid-column: 1;
    grid-row: 2;
    padding-inline: 52px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .wt-lightbox-fade-enter-active,
  .wt-lightbox-fade-leave-active,
  .wt-lightbox__close,
  .wt-lightbox__nav {
    transition: none;
  }

  .wt-lightbox__spinner {
    animation-duration: 2s;
  }
}
</style>
