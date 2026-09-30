import { useEffect } from "react"
import type { RefObject } from "react"

export const SYNC_INTERVAL_MS = 1000
export const DRIFT_THRESHOLD_SECONDS = 0.15

export interface VideoLike {
  currentTime: number
  paused: boolean
  seeking: boolean
}

type SpanGroup = Map<number, VideoLike>

const groups = new Map<string, SpanGroup>()

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
    if (
      Math.abs(follower.currentTime - leader.currentTime) > thresholdSeconds
    ) {
      follower.currentTime = leader.currentTime
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
