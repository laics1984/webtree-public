import {
  collectLightboxGroupIds,
  startLightboxRuntime,
  type LightboxSlide,
} from '~/lib/lightbox'

/**
 * Wire the gallery lightbox runtime to the rendered page. Call once from the
 * site shell with the header/body/footer schemas; re-arms itself when the
 * schemas change (client-side navigation).
 *
 * Server-side this is a no-op — the tiles render as plain images and the viewer
 * is never part of SSR markup.
 */
export function useSchemaLightbox(sources: { schemas: () => unknown[] }) {
  const open = ref(false)
  const slides = ref<LightboxSlide[]>([])
  const index = ref(0)

  const close = () => {
    open.value = false
  }

  if (import.meta.server) {
    return { open, slides, index, close }
  }

  let stop: (() => void) | null = null

  const run = () => {
    stop?.()
    stop = null
    // Navigating away from the page the viewer was opened on must not leave it
    // floating over the new one.
    close()
    const groupIds = collectLightboxGroupIds(sources.schemas())
    if (groupIds.length === 0) return
    stop = startLightboxRuntime({
      groupIds,
      onOpen: (event) => {
        slides.value = event.slides
        index.value = event.index
        open.value = true
      },
    })
  }

  onMounted(() => {
    nextTick(run)
  })

  watch(
    () => sources.schemas(),
    () => {
      nextTick(run)
    }
  )

  onBeforeUnmount(() => {
    stop?.()
    stop = null
  })

  return { open, slides, index, close }
}
