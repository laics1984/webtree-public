<script setup lang="ts">
import PublicSiteShell from '~/components/public/PublicSiteShell.vue'
import { fetchPublicSite } from '~/lib/api'
import { getRequestHost } from '~/lib/host'
import type { PublicSiteResponse } from '~/types/public'

const props = defineProps<{ error: { statusCode?: number; statusMessage?: string } }>()

const isNotFound = computed(() => (props.error?.statusCode ?? 500) === 404)
const title = computed(() => (isNotFound.value ? 'Page not found' : 'Something went wrong'))
const message = computed(() =>
  isNotFound.value
    ? "The page you're looking for doesn't exist or may have been moved."
    : props.error?.statusMessage || 'Something went wrong.'
)

const host = getRequestHost()

// Only fetch the site shell for 404s: any other status (e.g. a 502 from the
// CMS API itself) means the shell fetch would likely fail the same way.
const { data: site } = await useAsyncData<PublicSiteResponse | null>(
  () => `error-site:${host}`,
  () => (isNotFound.value ? fetchPublicSite(host) : Promise.resolve(null)),
  { default: () => null }
)

useHead({ title })
</script>

<template>
  <PublicSiteShell v-if="site?.entity && site?.site" :entity="site.entity" :site="site.site">
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
