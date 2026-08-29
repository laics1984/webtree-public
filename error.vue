<script setup lang="ts">
import PublicSiteShell from '~/components/public/PublicSiteShell.vue'
import UnconnectedDomainPage from '~/components/public/UnconnectedDomainPage.vue'
import { fetchPublicSite } from '~/lib/api'
import { getRequestHost } from '~/lib/host'
import { getErrorStatusCode } from '~/lib/httpError'
import { NOINDEX_ROBOTS } from '~/lib/indexing'
import type { PublicSiteResponse } from '~/types/public'

const props = defineProps<{ error: { statusCode?: number; statusMessage?: string } }>()

const isNotFound = computed(() => (props.error?.statusCode ?? 500) === 404)

const host = getRequestHost()

/**
 * Why the shell lookup is a three-way answer rather than "did we get a site".
 *
 * `unknown-host` is the only outcome that may render the holding page, and it
 * requires the API to have said so — a 404 from the site endpoint. A shell fetch
 * that merely FAILED (a 502, a timeout, a cold API) must not, because a live
 * customer site would then tell its visitors it is "almost ready" every time the
 * API hiccups on a genuine page-not-found.
 *
 * Only fetched for 404s at all: any other status means the shell fetch would
 * likely fail the same way.
 */
type Shell =
  | { outcome: 'skipped' }
  | { outcome: 'site'; site: PublicSiteResponse }
  | { outcome: 'unknown-host' }
  | { outcome: 'failed' }

const { data: shell } = await useAsyncData<Shell>(
  () => `error-shell:${host}`,
  async (): Promise<Shell> => {
    if (!isNotFound.value) {
      return { outcome: 'skipped' }
    }

    try {
      const site = await fetchPublicSite(host)

      return site?.entity && site?.site ? { outcome: 'site', site } : { outcome: 'unknown-host' }
    } catch (error) {
      return getErrorStatusCode(error) === 404 ? { outcome: 'unknown-host' } : { outcome: 'failed' }
    }
  },
  { default: (): Shell => ({ outcome: 'skipped' }) }
)

const site = computed(() => (shell.value?.outcome === 'site' ? shell.value.site : null))
const hasSite = computed(() => site.value !== null)

/**
 * A hostname that resolves to nothing here: a domain mid-setup, a stale CNAME,
 * or the platform base domain itself. Gets the Fowable holding page rather than
 * a "Page not found" whose "Go home" link points back at the same dead host.
 */
const isUnconnectedDomain = computed(() => shell.value?.outcome === 'unknown-host')

const title = computed(() => {
  if (isUnconnectedDomain.value) return 'This domain is almost ready'
  return isNotFound.value ? 'Page not found' : 'Something went wrong'
})

const message = computed(() =>
  isNotFound.value
    ? "The page you're looking for doesn't exist or may have been moved."
    : props.error?.statusMessage || 'Something went wrong.'
)

// Nuxt renders the error page through its own entry, bypassing app.vue, so the
// host baseline has to be repeated here. The holding page is never indexable
// whatever the host says: it is the same content on every unrecognised name.
useHead({
  title,
  meta: useHostIndexing() && !isUnconnectedDomain.value
    ? []
    : [{ name: 'robots', content: NOINDEX_ROBOTS }],
})
</script>

<template>
  <PublicSiteShell v-if="hasSite" :entity="site!.entity" :site="site!.site">
    <div class="wt-error-page">
      <p class="wt-error-code">
        {{ error?.statusCode || 500 }}
      </p>
      <h1 class="wt-error-title">
        {{ title }}
      </h1>
      <p class="wt-error-message">
        {{ message }}
      </p>
      <NuxtLink class="wt-error-link" to="/">
        Go home
      </NuxtLink>
    </div>
  </PublicSiteShell>

  <UnconnectedDomainPage v-else-if="isUnconnectedDomain" />

  <main v-else class="wt-error-page wt-error-page--bare">
    <p class="wt-error-code">
      {{ error?.statusCode || 500 }}
    </p>
    <h1 class="wt-error-title">
      {{ title }}
    </h1>
    <p class="wt-error-message">
      {{ message }}
    </p>
    <NuxtLink class="wt-error-link" to="/">
      Go home
    </NuxtLink>
  </main>
</template>

<style scoped>
.wt-error-page {
  max-width: 40rem;
  margin: 0 auto;
  padding: 6rem 1.5rem;
  text-align: center;
}

.wt-error-page--bare {
  text-align: left;
}

.wt-error-code {
  margin: 0 0 0.75rem;
  color: var(--wt-color-muted, #6b7280);
  font-size: 0.875rem;
  letter-spacing: 0.08em;
}

.wt-error-title {
  margin: 0 0 1rem;
  color: var(--wt-color-text, #111827);
  font-size: clamp(2rem, 5vw, 3rem);
  font-family: var(--wt-font-heading, inherit);
}

.wt-error-message {
  margin: 0 0 1.5rem;
  color: var(--wt-color-text, #4b5563);
  line-height: 1.6;
}

.wt-error-link {
  color: var(--wt-color-primary, #2563eb);
  text-decoration: none;
}
</style>
