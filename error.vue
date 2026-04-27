<script setup lang="ts">
defineProps<{ error: { statusCode?: number; statusMessage?: string } }>()
</script>

<template>
  <main class="wt-error-page">
    <p class="wt-error-code">
      {{ error?.statusCode || 500 }}
    </p>
    <h1 class="wt-error-title">
      {{ error?.statusCode === 404 ? 'Page not found' : 'Something went wrong' }}
    </h1>
    <p class="wt-error-message">
      {{ error?.statusCode === 404 ? 'The published page for this host and path could not be found.' : (error?.statusMessage || 'Something went wrong.') }}
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
}

.wt-error-code {
  margin: 0 0 0.75rem;
  color: #6b7280;
  font-size: 0.875rem;
  letter-spacing: 0.08em;
}

.wt-error-title {
  margin: 0 0 1rem;
  color: #111827;
  font-size: clamp(2rem, 5vw, 3rem);
}

.wt-error-message {
  margin: 0 0 1.5rem;
  color: #4b5563;
  line-height: 1.6;
}

.wt-error-link {
  color: #2563eb;
  text-decoration: none;
}
</style>
