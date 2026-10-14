// Visits from Fowable staff are not the lead's visits. The Fowable console opens
// demos with `?wt_internal=1` (its Preview link): that browser is then remembered
// per site (localStorage is per host) and never tracked there again, so first
// opened / last seen and view counts on the console's Prospects page are the
// lead's alone. `?wt_internal=0` undoes it, for testing tracking itself.

export const INTERNAL_PARAM = 'wt_internal'
export const INTERNAL_KEY = 'wt_internal'

type FlagStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>

/**
 * Whether this browser should not be tracked on this site. Never throws: a
 * storage that refuses (privacy modes) still honours the flag on this page.
 */
export function isInternalVisit(search: string, storage: FlagStorage | null): boolean {
  let param: string | null = null
  try {
    param = new URLSearchParams(search).get(INTERNAL_PARAM)
  } catch {}

  if (param === '1') {
    try { storage?.setItem(INTERNAL_KEY, '1') } catch {}
    return true
  }

  if (param === '0') {
    try { storage?.removeItem(INTERNAL_KEY) } catch {}
    return false
  }

  try {
    return storage?.getItem(INTERNAL_KEY) === '1'
  } catch {
    return false
  }
}
