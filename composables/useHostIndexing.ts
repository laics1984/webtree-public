import { getRequestHost } from '~/lib/host'
import { isIndexableHost } from '~/lib/indexing'

/**
 * Whether the current request host may be indexed — true only on client custom
 * domains, false on the platform preview domain.
 *
 * The host and the platform base domain are both fixed for the lifetime of a
 * request, so this is a plain boolean rather than a ref.
 */
export function useHostIndexing(): boolean {
  const config = useRuntimeConfig()

  return isIndexableHost(getRequestHost(), config.public.platformBaseDomain)
}
