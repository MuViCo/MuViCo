import { renderHook } from "@testing-library/react"
import {
  correctDrift,
  useVideoSpanSync,
  SYNC_INTERVAL_MS,
  NUDGE_RATE,
} from "../../components/utils/videoSpanSync"
import type { VideoLike } from "../../components/utils/videoSpanSync"

const video = (overrides: Partial<VideoLike> = {}): VideoLike => ({
  currentTime: 0,
  paused: false,
  seeking: false,
  readyState: 4,
  playbackRate: 1,
  ...overrides,
})

describe("correctDrift", () => {
  test("corrects a follower drifted beyond the threshold", () => {
    const leader = video({ currentTime: 10 })
    const follower = video({ currentTime: 9.5 })

    correctDrift(
      [
        [1, leader],
        [2, follower],
      ],
      0.15
    )

    expect(follower.currentTime).toBe(10)
  })

  test("never seeks a follower whose drift is under the threshold", () => {
    const leader = video({ currentTime: 10 })
    const follower = video({ currentTime: 9.92 })

    correctDrift(
      [
        [1, leader],
        [2, follower],
      ],
      0.15
    )

    expect(follower.currentTime).toBe(9.92)
  })

  test("nudges a follower that is behind instead of seeking it", () => {
    const leader = video({ currentTime: 10 })
    const follower = video({ currentTime: 9.9 })

    correctDrift(
      [
        [1, leader],
        [2, follower],
      ],
      0.5
    )

    expect(follower.currentTime).toBe(9.9)
    expect(follower.playbackRate).toBe(NUDGE_RATE)
  })

  test("nudges a follower that is ahead instead of seeking it", () => {
    const leader = video({ currentTime: 10 })
    const follower = video({ currentTime: 10.1 })

    correctDrift(
      [
        [1, leader],
        [2, follower],
      ],
      0.5
    )

    expect(follower.currentTime).toBe(10.1)
    expect(follower.playbackRate).toBe(1 / NUDGE_RATE)
  })

  test("restores nominal speed once a nudged follower is back in sync", () => {
    const leader = video({ currentTime: 10 })
    const follower = video({ currentTime: 10.01, playbackRate: NUDGE_RATE })

    correctDrift(
      [
        [1, leader],
        [2, follower],
      ],
      0.5
    )

    expect(follower.playbackRate).toBe(1)
  })

  test("resets the nudge when a gross desync forces a seek", () => {
    const leader = video({ currentTime: 10 })
    const follower = video({ currentTime: 2, playbackRate: NUDGE_RATE })

    correctDrift(
      [
        [1, leader],
        [2, follower],
      ],
      0.5
    )

    expect(follower.currentTime).toBe(10)
    expect(follower.playbackRate).toBe(1)
  })

  test("skips a follower that cannot play its next frame", () => {
    const leader = video({ currentTime: 10 })
    const starved = video({ currentTime: 2, readyState: 2 })

    correctDrift(
      [
        [1, leader],
        [2, starved],
      ],
      0.5
    )

    expect(starved.currentTime).toBe(2)
    expect(starved.playbackRate).toBe(1)
  })

  test("leaves a starved follower alone on every tick of a seek loop", () => {
    const leader = video({ currentTime: 10 })
    const starved = video({ currentTime: 2, readyState: 1 })

    for (let tick = 0; tick < 5; tick += 1) {
      leader.currentTime += 1
      correctDrift(
        [
          [1, leader],
          [2, starved],
        ],
        0.5
      )
    }

    expect(starved.currentTime).toBe(2)
  })

  test("still corrects a follower when readyState is unavailable", () => {
    const leader = video({ currentTime: 10 })
    const follower = video({ currentTime: 2, readyState: undefined })

    correctDrift(
      [
        [1, leader],
        [2, follower],
      ],
      0.5
    )

    expect(follower.currentTime).toBe(10)
  })

  test("treats the lowest screen number as the leader regardless of entry order", () => {
    const leader = video({ currentTime: 5 })
    const follower = video({ currentTime: 1 })

    correctDrift(
      [
        [3, follower],
        [1, leader],
      ],
      0.15
    )

    expect(follower.currentTime).toBe(5)
  })

  test("skips a follower that is currently seeking", () => {
    const leader = video({ currentTime: 10 })
    const seekingFollower = video({ currentTime: 2, seeking: true })

    correctDrift(
      [
        [1, leader],
        [2, seekingFollower],
      ],
      0.15
    )

    expect(seekingFollower.currentTime).toBe(2)
  })

  test("does nothing when the leader is paused", () => {
    const leader = video({ currentTime: 10, paused: true })
    const follower = video({ currentTime: 2 })

    correctDrift(
      [
        [1, leader],
        [2, follower],
      ],
      0.15
    )

    expect(follower.currentTime).toBe(2)
  })

  test("does nothing when the leader is seeking", () => {
    const leader = video({ currentTime: 10, seeking: true })
    const follower = video({ currentTime: 2 })

    correctDrift(
      [
        [1, leader],
        [2, follower],
      ],
      0.15
    )

    expect(follower.currentTime).toBe(2)
  })

  test("corrects every follower in a three-screen group against the lowest screen number", () => {
    const leader = video({ currentTime: 7 })
    const followerA = video({ currentTime: 6.5 })
    const followerB = video({ currentTime: 7.6 })

    correctDrift(
      [
        [2, followerA],
        [3, followerB],
        [1, leader],
      ],
      0.15
    )

    expect(followerA.currentTime).toBe(7)
    expect(followerB.currentTime).toBe(7)
  })

  test("does nothing with fewer than two entries", () => {
    const leader = video({ currentTime: 10 })

    expect(() => correctDrift([[1, leader]], 0.15)).not.toThrow()
    expect(leader.currentTime).toBe(10)
  })
})

describe("useVideoSpanSync", () => {
  beforeEach(() => {
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  test("periodically corrects a registered follower against the leader", () => {
    const leaderVideo = video({ currentTime: 10 })
    const followerVideo = video({ currentTime: 2 })
    const leaderRef = { current: leaderVideo }
    const followerRef = { current: followerVideo }

    renderHook(() => useVideoSpanSync("cue-1", 1, leaderRef, true))
    renderHook(() => useVideoSpanSync("cue-1", 2, followerRef, true))

    jest.advanceTimersByTime(SYNC_INTERVAL_MS)

    expect(followerVideo.currentTime).toBe(10)
  })

  test("does not register or correct anything when inactive", () => {
    const leaderVideo = video({ currentTime: 10 })
    const followerVideo = video({ currentTime: 2 })
    const leaderRef = { current: leaderVideo }
    const followerRef = { current: followerVideo }

    renderHook(() => useVideoSpanSync("cue-2", 1, leaderRef, false))
    renderHook(() => useVideoSpanSync("cue-2", 2, followerRef, false))

    jest.advanceTimersByTime(SYNC_INTERVAL_MS)

    expect(followerVideo.currentTime).toBe(2)
  })

  test("does not register or crash when the video ref is not yet attached", () => {
    const nullRef = { current: null }

    renderHook(() => useVideoSpanSync("cue-null", 1, nullRef, true))

    expect(() => jest.advanceTimersByTime(SYNC_INTERVAL_MS)).not.toThrow()
  })

  test("hands a nudged element back at nominal speed on unmount", () => {
    const leaderVideo = video({ currentTime: 10 })
    const followerVideo = video({ currentTime: 9.9 })
    const leaderRef = { current: leaderVideo }
    const followerRef = { current: followerVideo }

    renderHook(() => useVideoSpanSync("cue-rate", 1, leaderRef, true))
    const { unmount } = renderHook(() =>
      useVideoSpanSync("cue-rate", 2, followerRef, true)
    )

    jest.advanceTimersByTime(SYNC_INTERVAL_MS)
    expect(followerVideo.playbackRate).toBe(NUDGE_RATE)

    unmount()

    expect(followerVideo.playbackRate).toBe(1)
  })

  test("stops correcting once unmounted", () => {
    const leaderVideo = video({ currentTime: 10 })
    const followerVideo = video({ currentTime: 2 })
    const leaderRef = { current: leaderVideo }
    const followerRef = { current: followerVideo }

    const { unmount } = renderHook(() =>
      useVideoSpanSync("cue-3", 2, followerRef, true)
    )
    renderHook(() => useVideoSpanSync("cue-3", 1, leaderRef, true))

    unmount()
    jest.advanceTimersByTime(SYNC_INTERVAL_MS)

    expect(followerVideo.currentTime).toBe(2)
  })
})
