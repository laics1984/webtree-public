<script setup lang="ts">
import {
  deviceVisibilityClass,
  isWithinBusinessHours,
  matchesPageRule,
  withPageContext,
} from '~/lib/whatsappWidget'
import type { WhatsAppAgent, WhatsAppWidget } from '~/types/public'

/**
 * Site-wide WhatsApp click-to-chat button.
 *
 * Renders an ordinary `<a href="https://wa.me/…">`, which buys three things at
 * once: it works before hydration and without JS, the platform decides between
 * the native app and WhatsApp Web, and the tracking plugin's existing
 * delegated listener counts the click as `whatsapp_click` with no extra wiring
 * (see webtree-cms-api docs/tracking-contract.md).
 *
 * Every `href` arrives built from the API — this component never assembles a
 * phone number. What it owns is presentation: the roster panel, the greeting
 * bubble, opening hours, and route/device gates.
 */
const props = defineProps<{
  widget?: WhatsAppWidget | null
}>()

/** WhatsApp's brand green. Fixed, never themed — see the note in the style block. */
const BRAND_GREEN = '#25D366'

const route = useRoute()

const isRouteAllowed = computed(() =>
  matchesPageRule(props.widget?.visibility, route.path)
)

const agents = computed<WhatsAppAgent[]>(() => props.widget?.agents ?? [])
const hasRoster = computed(() => agents.value.length > 0)

// A roster with no site-level number still needs the panel to be reachable; a
// single number goes straight to the chat.
const isDirectLink = computed(() => !hasRoster.value && Boolean(props.widget?.href))

const deviceClass = computed(() => deviceVisibilityClass(props.widget?.visibility?.devices))

const isOpen = ref(false)
const greetingDismissed = ref(false)

/**
 * Client-only, and deliberately so.
 *
 * The server has no visitor clock and no timezone data guarantee, so deciding
 * this during SSR would either bake one visitor's answer into the cached HTML
 * or mismatch on hydration. `null` until mounted means the button renders in
 * its normal state first and the away treatment appears a tick later — the
 * link itself is never gated on it.
 */
const openState = ref<boolean | null>(null)
let hoursTimer: ReturnType<typeof setInterval> | null = null

function refreshOpenState() {
  openState.value = isWithinBusinessHours(props.widget?.hours)
}

const isAway = computed(() => openState.value === false)

// The page URL the prefill should carry, resolved per route so a visitor who
// navigates before clicking still sends the page they are actually on.
//
// Filled in onMounted, never during setup. The server has no location, so a
// value that appears while hydrating is an attribute mismatch — and Vue keeps
// the server's `href` through those rather than patching them, which silently
// dropped the page context on every first page load. Starting null makes the
// hydration render identical to the server's; the update that follows is an
// ordinary reactive patch, which does land.
const pageUrl = ref<string | null>(null)

function readPageUrl() {
  pageUrl.value = window.location.href
}

function chatHref(href: string): string {
  return withPageContext(href, props.widget?.includePageUrl === true, pageUrl.value)
}

const primaryHref = computed(() =>
  props.widget?.href ? chatHref(props.widget.href) : null
)

const greeting = computed(() => props.widget?.greeting)

const showGreeting = computed(
  () =>
    greeting.value?.enabled === true &&
    !greetingDismissed.value &&
    !isOpen.value &&
    greetingReady.value
)

const greetingReady = ref(false)
let greetingTimer: ReturnType<typeof setTimeout> | null = null

const panelId = useId()

const buttonLabel = computed(() => {
  const label = props.widget?.label?.trim() || 'Chat with us'
  return hasRoster.value ? `${label} — choose who to message` : label
})

function togglePanel() {
  isOpen.value = !isOpen.value
  greetingDismissed.value = true
}

function dismissGreeting() {
  greetingDismissed.value = true
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape' && isOpen.value) {
    isOpen.value = false
    fabEl.value?.focus()
  }
}

const rootEl = ref<HTMLElement | null>(null)
const fabEl = ref<HTMLElement | null>(null)

function onDocumentPointerDown(event: MouseEvent) {
  if (!isOpen.value || !rootEl.value) return
  if (event.target instanceof Node && rootEl.value.contains(event.target)) return
  isOpen.value = false
}

onMounted(() => {
  readPageUrl()
  refreshOpenState()
  // Opening hours change on a wall clock, not on interaction. A minute is far
  // finer than any schedule boundary and costs one comparison.
  hoursTimer = setInterval(refreshOpenState, 60_000)

  if (greeting.value?.enabled) {
    greetingTimer = setTimeout(
      () => {
        greetingReady.value = true
      },
      Math.max(0, (greeting.value.delaySeconds ?? 0) * 1000)
    )
  }

  document.addEventListener('keydown', onKeydown)
  document.addEventListener('pointerdown', onDocumentPointerDown, true)
})

onUnmounted(() => {
  if (hoursTimer) clearInterval(hoursTimer)
  if (greetingTimer) clearTimeout(greetingTimer)
  document.removeEventListener('keydown', onKeydown)
  document.removeEventListener('pointerdown', onDocumentPointerDown, true)
})

// A route change can move the visitor to a page the widget is hidden on, and a
// panel left open would be orphaned mid-transition. It also changes which page
// the prefill should name.
watch(
  () => route.fullPath,
  () => {
    isOpen.value = false
    readPageUrl()
  }
)
</script>

<template>
  <div
    v-if="widget && isRouteAllowed"
    ref="rootEl"
    class="wt-wa"
    :class="[`wt-wa--${widget.position}`, deviceClass]"
    :style="{ '--wt-wa-brand': BRAND_GREEN }"
  >
    <!-- Greeting teaser. Purely additive: it never covers the button, and
         dismissing it leaves the link exactly where it was. -->
    <Transition name="wt-wa-fade">
      <div v-if="showGreeting" class="wt-wa__greeting" role="status">
        <button
          type="button"
          class="wt-wa__greeting-close"
          aria-label="Dismiss message"
          @click="dismissGreeting"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <path
              d="M6 6l12 12M18 6L6 18"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
            />
          </svg>
        </button>
        <p class="wt-wa__greeting-title">{{ greeting?.title }}</p>
        <p class="wt-wa__greeting-message">{{ greeting?.message }}</p>
      </div>
    </Transition>

    <!-- Roster panel. Only rendered when there is more than one person to
         reach; a single number needs no chooser. -->
    <Transition name="wt-wa-panel">
      <div
        v-if="hasRoster && isOpen"
        :id="panelId"
        class="wt-wa__panel"
        role="dialog"
        aria-label="Start a WhatsApp chat"
      >
        <div class="wt-wa__panel-head">
          <p class="wt-wa__panel-title">{{ widget.label }}</p>
          <p v-if="isAway" class="wt-wa__panel-note">{{ widget.hours.awayMessage }}</p>
          <p v-else class="wt-wa__panel-note">Pick who you'd like to talk to.</p>
        </div>
        <ul class="wt-wa__agents">
          <li v-for="agent in agents" :key="agent.id">
            <a
              class="wt-wa__agent"
              :href="chatHref(agent.href)"
              target="_blank"
              rel="noopener noreferrer"
            >
              <img
                v-if="agent.avatarUrl"
                class="wt-wa__agent-avatar"
                :src="agent.avatarUrl"
                :alt="''"
                loading="lazy"
                decoding="async"
                width="40"
                height="40"
              />
              <span v-else class="wt-wa__agent-avatar wt-wa__agent-avatar--initial" aria-hidden="true">
                {{ agent.name.slice(0, 1).toUpperCase() }}
              </span>
              <span class="wt-wa__agent-text">
                <span class="wt-wa__agent-name">{{ agent.name }}</span>
                <span v-if="agent.role" class="wt-wa__agent-role">{{ agent.role }}</span>
              </span>
              <svg class="wt-wa__agent-go" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                <path
                  d="M9 6l6 6-6 6"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
            </a>
          </li>
        </ul>
      </div>
    </Transition>

    <!-- The button itself. An anchor when it links straight to a chat (so it
         survives no-JS and is a real link to the browser), a button when it
         opens the roster — the element follows what it actually does. -->
    <component
      :is="isDirectLink ? 'a' : 'button'"
      ref="fabEl"
      class="wt-wa__fab"
      :class="{ 'wt-wa__fab--labeled': widget.displayMode === 'labeled' }"
      v-bind="
        isDirectLink
          ? { href: primaryHref, target: '_blank', rel: 'noopener noreferrer' }
          : { type: 'button', 'aria-expanded': isOpen, 'aria-controls': panelId }
      "
      :aria-label="buttonLabel"
      @click="isDirectLink ? undefined : togglePanel()"
    >
      <span class="wt-wa__icon" aria-hidden="true">
        <svg viewBox="0 0 24 24" focusable="false">
          <path
            fill="currentColor"
            d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"
          />
        </svg>
      </span>
      <span v-if="widget.displayMode === 'labeled'" class="wt-wa__label">{{ widget.label }}</span>
      <!-- Presence dot, only once the client has an answer. Marked decorative:
           the away wording in the panel carries the same fact in text. -->
      <span
        v-if="openState !== null"
        class="wt-wa__status"
        :class="isAway ? 'wt-wa__status--away' : 'wt-wa__status--online'"
        aria-hidden="true"
      />
    </component>
  </div>
</template>

<style>
/* WhatsApp's brand green (#25D366) is fixed rather than themed. People tap this
   button because they recognise it before they read it, and a site-tinted
   version costs exactly the recognition that makes it work. The contrast is
   also known-good: white on #25D366 clears WCAG AA at this weight and size,
   which a per-site accent could not promise. */
.wt-wa {
  position: fixed;
  bottom: max(20px, env(safe-area-inset-bottom, 0px));
  /* Above page content and the sticky header, below the gallery lightbox
     (9999) — a widget must never sit on top of a modal. */
  z-index: 900;
  display: flex;
  flex-direction: column;
  gap: 12px;
  pointer-events: none;
}

.wt-wa > * {
  pointer-events: auto;
}

.wt-wa--bottom-right {
  right: max(20px, env(safe-area-inset-right, 0px));
  align-items: flex-end;
}

.wt-wa--bottom-left {
  left: max(20px, env(safe-area-inset-left, 0px));
  align-items: flex-start;
}

/* Device rules as media queries, not script: the widget is server-rendered, so
   a JS viewport check would flash the wrong state on hydration. */
@media (min-width: 768px) {
  .wt-wa--mobile-only {
    display: none;
  }
}

@media (max-width: 767px) {
  .wt-wa--desktop-only {
    display: none;
  }
}

/* --- the button ---------------------------------------------------------- */

.wt-wa__fab {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 10px;
  /* 56px square keeps the icon-only form well past the 44px minimum touch
     target, and the labeled form inherits the same height. */
  min-height: 56px;
  min-width: 56px;
  padding: 0;
  justify-content: center;
  border: 0;
  border-radius: 999px;
  background: var(--wt-wa-brand);
  color: #ffffff;
  font-family: inherit;
  font-size: 15px;
  font-weight: 600;
  line-height: 1;
  text-decoration: none;
  cursor: pointer;
  box-shadow: 0 6px 20px rgba(15, 23, 42, 0.22);
  transition: transform 160ms ease, box-shadow 160ms ease, filter 160ms ease;
}

.wt-wa__fab--labeled {
  padding: 0 22px 0 18px;
}

.wt-wa__fab:hover {
  filter: brightness(1.05);
  box-shadow: 0 10px 26px rgba(15, 23, 42, 0.28);
}

.wt-wa__fab:active {
  transform: scale(0.97);
}

/* Visible focus on the brand surface, not the page behind it: a white ring
   with a dark outer edge reads against both. */
.wt-wa__fab:focus-visible,
.wt-wa__greeting-close:focus-visible,
.wt-wa__agent:focus-visible {
  outline: 2px solid #ffffff;
  outline-offset: 2px;
  box-shadow: 0 0 0 4px rgba(15, 23, 42, 0.45);
}

.wt-wa__icon {
  display: inline-flex;
  width: 28px;
  height: 28px;
  flex: 0 0 auto;
}

.wt-wa__icon svg {
  width: 100%;
  height: 100%;
}

.wt-wa__label {
  white-space: nowrap;
}

.wt-wa__status {
  position: absolute;
  top: 4px;
  right: 4px;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  border: 2px solid var(--wt-wa-brand);
}

.wt-wa__status--online {
  background: #4ade80;
}

.wt-wa__status--away {
  background: #cbd5f5;
}

/* --- greeting teaser ------------------------------------------------------ */

.wt-wa__greeting {
  position: relative;
  max-width: min(272px, calc(100vw - 48px));
  padding: 14px 34px 14px 16px;
  border-radius: 16px;
  background: var(--wt-color-surface, #ffffff);
  color: var(--wt-color-text, #111827);
  box-shadow: 0 10px 30px rgba(15, 23, 42, 0.18);
  border: 1px solid rgba(15, 23, 42, 0.08);
}

.wt-wa__greeting-title {
  margin: 0 0 2px;
  font-size: 14px;
  font-weight: 700;
}

.wt-wa__greeting-message {
  margin: 0;
  font-size: 13px;
  line-height: 1.45;
  opacity: 0.8;
}

.wt-wa__greeting-close {
  position: absolute;
  top: 6px;
  right: 6px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  /* Visually 24px, but padded out to a 44px hit area so the dismiss control is
     not the one thing on the widget that is hard to tap. */
  width: 24px;
  height: 24px;
  padding: 0;
  border: 0;
  border-radius: 50%;
  background: transparent;
  color: inherit;
  opacity: 0.5;
  cursor: pointer;
}

.wt-wa__greeting-close::after {
  content: '';
  position: absolute;
  inset: -10px;
}

.wt-wa__greeting-close:hover {
  opacity: 1;
}

.wt-wa__greeting-close svg {
  width: 14px;
  height: 14px;
}

/* --- roster panel --------------------------------------------------------- */

.wt-wa__panel {
  width: min(300px, calc(100vw - 40px));
  max-height: min(60vh, 420px);
  overflow-y: auto;
  border-radius: 18px;
  background: var(--wt-color-surface, #ffffff);
  color: var(--wt-color-text, #111827);
  box-shadow: 0 16px 44px rgba(15, 23, 42, 0.24);
  border: 1px solid rgba(15, 23, 42, 0.08);
}

.wt-wa__panel-head {
  padding: 16px 18px 12px;
  background: var(--wt-wa-brand);
  color: #ffffff;
}

.wt-wa__panel-title {
  margin: 0;
  font-size: 15px;
  font-weight: 700;
}

.wt-wa__panel-note {
  margin: 4px 0 0;
  font-size: 12.5px;
  line-height: 1.45;
  opacity: 0.9;
}

.wt-wa__agents {
  margin: 0;
  padding: 6px;
  list-style: none;
}

.wt-wa__agent {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border-radius: 12px;
  color: inherit;
  text-decoration: none;
  transition: background-color 140ms ease;
}

.wt-wa__agent:hover {
  background: rgba(37, 211, 102, 0.1);
}

.wt-wa__agent-avatar {
  width: 40px;
  height: 40px;
  flex: 0 0 auto;
  border-radius: 50%;
  object-fit: cover;
  background: rgba(37, 211, 102, 0.15);
}

.wt-wa__agent-avatar--initial {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  color: #0b7a3f;
}

.wt-wa__agent-text {
  display: flex;
  min-width: 0;
  flex-direction: column;
  flex: 1 1 auto;
}

.wt-wa__agent-name {
  font-size: 14px;
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.wt-wa__agent-role {
  font-size: 12px;
  opacity: 0.65;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.wt-wa__agent-go {
  width: 18px;
  height: 18px;
  flex: 0 0 auto;
  opacity: 0.4;
}

/* --- transitions ---------------------------------------------------------- */

.wt-wa-fade-enter-active,
.wt-wa-fade-leave-active,
.wt-wa-panel-enter-active,
.wt-wa-panel-leave-active {
  transition: opacity 180ms ease, transform 180ms ease;
}

.wt-wa-fade-enter-from,
.wt-wa-fade-leave-to,
.wt-wa-panel-enter-from,
.wt-wa-panel-leave-to {
  opacity: 0;
  transform: translateY(8px);
}

@media (prefers-reduced-motion: reduce) {
  .wt-wa__fab,
  .wt-wa-fade-enter-active,
  .wt-wa-fade-leave-active,
  .wt-wa-panel-enter-active,
  .wt-wa-panel-leave-active {
    transition: none;
  }

  .wt-wa-fade-enter-from,
  .wt-wa-fade-leave-to,
  .wt-wa-panel-enter-from,
  .wt-wa-panel-leave-to {
    transform: none;
  }

  .wt-wa__fab:active {
    transform: none;
  }
}
</style>
