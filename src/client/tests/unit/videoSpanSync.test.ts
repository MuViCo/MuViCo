import { correctDrift } from "../../components/utils/videoSpanSync"
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
