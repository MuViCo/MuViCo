import { useEffect } from "react"
import type { RefObject } from "react"

export const SYNC_INTERVAL_MS = 1000
// Writing currentTime flushes the decoder, so a seek costs more than the
// drift it corrects -- on software-decoded streams the recovery outlasts
// this interval and every tick then seeks again. Only gross desync is
// worth a seek; anything smaller is absorbed by playbackRate.
export const DRIFT_THRESHOLD_SECONDS = 0.5
// Below this the offset is imperceptible on adjacent screens.
export const NUDGE_THRESHOLD_SECONDS = 0.05
// 2% off nominal speed is inaudible and invisible, and closes a 150ms gap
// in a few seconds without touching the decoder.
export const NUDGE_RATE = 1.02
// A video needs at least HAVE_FUTURE_DATA to play the next frame.
const HAVE_FUTURE_DATA = 3

export interface VideoLike {
  currentTime: number
  paused: boolean
  seeking: boolean
  readyState?: number
  playbackRate?: number
}

type SpanGroup = Map<number, VideoLike>

const groups = new Map<string, SpanGroup>()

const setRate = (video: VideoLike, rate: number): void => {
  if (video.playbackRate === undefined || video.playbackRate === rate) return
  video.playbackRate = rate
}

// A follower that cannot play its next frame is already behind by
// construction; seeking it flushes what little it has buffered and widens
// the gap, which is what turns a single late frame into a seek loop.
const isStarved = (video: VideoLike): boolean =>
  typeof video.readyState === "number" && video.readyState < HAVE_FUTURE_DATA

export const correctDrift = (
  entries: [number, VideoLike][],
  thresholdSeconds: number
): void => {
  if (entries.length < 2) return

  const ordered = [...entries].sort((a, b) => a[0] - b[0])
  const [, leader] = ordered[0]
  if (leader.paused || leader.seeking) return

  for (const [, follower] of ordered.slice(1)) {
    if (follower.seeking) continue
    if (isStarved(follower)) {
      setRate(follower, 1)
      continue
    }

    const drift = follower.currentTime - leader.currentTime
    const distance = Math.abs(drift)

    if (distance > thresholdSeconds) {
      follower.currentTime = leader.currentTime
      setRate(follower, 1)
    } else if (distance > NUDGE_THRESHOLD_SECONDS) {
      setRate(follower, drift < 0 ? NUDGE_RATE : 1 / NUDGE_RATE)
    } else {
      setRate(follower, 1)
    }
  }
}

export const useVideoSpanSync = (
  cueId: string,
  screenNumber: number,
  videoRef: RefObject<VideoLike | null>,
  active: boolean
): void => {
  useEffect(() => {
    if (!active) return
    const video = videoRef.current
    if (!video) return

    let group = groups.get(cueId)
    if (!group) {
      group = new Map()
      groups.set(cueId, group)
    }
    group.set(screenNumber, video)

    return () => {
      // The element outlives the group when a cue is swapped, so hand it
      // back at nominal speed rather than whatever the last nudge left.
      setRate(video, 1)
      const currentGroup = groups.get(cueId)
      currentGroup?.delete(screenNumber)
      if (currentGroup?.size === 0) {
        groups.delete(cueId)
      }
    }
  }, [cueId, screenNumber, active, videoRef])

  useEffect(() => {
    if (!active) return

    const interval = setInterval(() => {
      const group = groups.get(cueId)
      if (!group) return
      correctDrift([...group.entries()], DRIFT_THRESHOLD_SECONDS)
    }, SYNC_INTERVAL_MS)

    return () => clearInterval(interval)
  }, [cueId, active])
}
