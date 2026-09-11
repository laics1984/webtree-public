import { onMounted, ref, type Ref } from 'vue'

/**
 * The reader's clock, known only once the page is live in their browser.
 *
 * Null during the server render and during the hydrating client render, so
 * both print the same deterministic markup — and a cached copy of the page is
 * never stale. Set on mount, so anything derived from it ("3 hours ago")
 * updates after hydration instead of mismatching it.
 */
export function useHydratedNow(): Readonly<Ref<number | null>> {
  const now = ref<number | null>(null)

  onMounted(() => {
    now.value = Date.now()
  })

  return now
}
