import {
  collectMotionTargets,
  resolveSiteMotionIntensity,
  startMotionRuntime,
} from '~/lib/motionRuntime'

/**
 * Wire the declarative motion runtime to the rendered page. Call once from
 * the site shell with the header/body/footer schemas; re-arms itself when the
 * schemas change (client-side navigation).
 *
 * Server-side this is a no-op — motion never affects SSR markup.
 */
export function useSchemaMotion(sources: {
  schemas: () => unknown[]
  builderStyles: () => unknown
}) {
  if (import.meta.server) return

  let stop: (() => void) | null = null

  const run = () => {
    stop?.()
    stop = null
    const targets = collectMotionTargets(sources.schemas())
    if (targets.length === 0) return
    stop = startMotionRuntime({
      targets,
      intensity: resolveSiteMotionIntensity(sources.builderStyles()),
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
}
