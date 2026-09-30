import { renderHook } from "@testing-library/react"
import {
  correctDrift,
  useVideoSpanSync,
  SYNC_INTERVAL_MS,
} from "../../components/utils/videoSpanSync"
import type { VideoLike } from "../../components/utils/videoSpanSync"

const video = (overrides: Partial<VideoLike> = {}): VideoLike => ({
  currentTime: 0,
  paused: false,
  seeking: false,
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

  test("leaves a follower alone when drift is under the threshold", () => {
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
