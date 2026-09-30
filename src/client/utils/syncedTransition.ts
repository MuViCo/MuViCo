// Show mode renders each screen in its own popup window (Screen.tsx,
// `window.open`). `performance.now()` has a distinct time origin per
// document, so it cannot be used to coordinate a visual change across
// windows -- `Date.now()` (epoch-based, shared across all windows on the
// same machine) is used instead.
//
// A short buffer lets every popup receive the new cue data and mount its
// media (image/video) ahead of time, hidden, before all windows reveal the
// change at the same wall-clock instant.
export const TRANSITION_SYNC_BUFFER_MS = 100

export type CancelSchedule = () => void

export const scheduleAt = (
  timestampMs: number,
  callback: () => void
): CancelSchedule => {
  let frameId: number | null = null
  let cancelled = false

  const tick = () => {
    if (cancelled) return
    if (Date.now() >= timestampMs) {
      callback()
      return
    }
    frameId = requestAnimationFrame(tick)
  }

  frameId = requestAnimationFrame(tick)

  return () => {
    cancelled = true
    if (frameId !== null) cancelAnimationFrame(frameId)
  }
}
