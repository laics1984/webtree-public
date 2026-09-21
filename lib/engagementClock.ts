// Engaged time for the first-party tracker — implements "Engaged time" in
// webtree-cms-api/docs/tracking-contract.md.
//
// Counts foreground time only: paused while the tab is hidden, and once the
// visitor has done nothing for IDLE_TIMEOUT_MS — a tab left open on a desk is
// not an hour of reading. Pure timing logic over an injected clock; the
// tracking plugin owns the DOM listeners that drive it.

/** A visible tab with no input for this long stops counting until the next input. */
export const IDLE_TIMEOUT_MS = 5 * 60_000

/** One emission's ceiling — the API clamps to the same value. */
export const MAX_ENGAGEMENT_SECONDS = 1800

export interface EngagementClock {
  /** The visitor did something: pointer, key or scroll. */
  activity(): void
  /** The tab became visible or hidden. */
  setVisible(visible: boolean): void
  /** Whole seconds accrued since the last take(); starts the count over. */
  take(): number
}

export function createEngagementClock(
  visible: boolean,
  now: () => number = Date.now,
  idleTimeoutMs = IDLE_TIMEOUT_MS
): EngagementClock {
  let accruedMs = 0
  let lastActivity = now()
  // Start of the stretch being counted; null while hidden.
  let stretchStart: number | null = visible ? lastActivity : null

  // Credit the open stretch up to `at` — but never past the idle cut-off —
  // and open a new one from `at`.
  function settle(at: number) {
    if (stretchStart === null) {
      return
    }
    const end = Math.min(at, lastActivity + idleTimeoutMs)
    if (end > stretchStart) {
      accruedMs += end - stretchStart
    }
    stretchStart = at
  }

  return {
    activity() {
      const at = now()
      settle(at)
      lastActivity = at
    },
    setVisible(isVisible) {
      const at = now()
      settle(at)
      stretchStart = isVisible ? at : null
      if (isVisible) {
        lastActivity = at
      }
    },
    take() {
      settle(now())
      const seconds = Math.min(Math.round(accruedMs / 1000), MAX_ENGAGEMENT_SECONDS)
      accruedMs = 0
      return seconds
    }
  }
}
