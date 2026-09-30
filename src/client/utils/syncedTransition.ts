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
  // A rAF poll looked tempting (it runs on the visual refresh, which is
  // what we're ultimately gating), but browsers throttle -- and can fully
  // suspend -- requestAnimationFrame in a window/tab that isn't the
  // foreground one. A screen popup left open in the background while
  // editing would then never fire its reveal, leaving it stuck on the
  // previous frame. setTimeout keeps firing (short delays aren't subject to
  // the multi-second background clamp) regardless of focus/visibility.
  const delayMs = Math.max(0, timestampMs - Date.now())
  const timeoutId = setTimeout(callback, delayMs)

  return () => {
    clearTimeout(timeoutId)
  }
}
