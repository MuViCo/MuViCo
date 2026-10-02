import { useEffect } from "react"
import type { RefObject } from "react"

export const SYNC_INTERVAL_MS = 1000
// A seek flushes the decoder, so it costs more than the drift it corrects.
// Only gross desync is worth one; the rest is absorbed by playbackRate.
export const DRIFT_THRESHOLD_SECONDS = 0.5
// Below this the offset is invisible on adjacent screens.
export const NUDGE_THRESHOLD_SECONDS = 0.05
// 2% off nominal is imperceptible and never touches the decoder.
export const NUDGE_RATE = 1.02
// Below this a video cannot play its next frame.
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

// Seeking a follower that is already starved widens the gap it is meant to
// close -- that is what turns one late frame into a seek loop.
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
      // The element outlives the group, so hand it back at nominal speed.
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
