// performance.now() has a distinct time origin per popup window, so it
// can't coordinate a visual change across windows -- Date.now() is used
// instead.
export const TRANSITION_SYNC_BUFFER_MS = 100

export type CancelSchedule = () => void

export const scheduleAt = (
  timestampMs: number,
  callback: () => void
): CancelSchedule => {
  const delayMs = Math.max(0, timestampMs - Date.now())
  const timeoutId = setTimeout(callback, delayMs)

  return () => {
    clearTimeout(timeoutId)
  }
}
