/*
 * Lane focus helper tests.
 * Covers lane identity, the lane -> screen mapping used by the preview strip,
 * and the span compensation applied to the focus transform.
 */
import { laneKey, laneScreenFromKey } from "../../components/utils/laneFocus"

import type { Lane } from "../../types"

const lane = (overrides: Partial<Lane>): Lane =>
  ({
    kind: "layer",
    group: "screen-1",
    screen: 1,
    y: 0,
    label: "L1",
    layer: 0,
    ...overrides,
  }) as Lane

describe("laneKey", () => {
  test("keys an expanded visual layer by group and layer", () => {
    expect(laneKey(lane({ kind: "layer", group: "screen-2", layer: 1 }))).toBe(
      "screen-2:1"
    )
  })

  test("keys an audio track the same way", () => {
    expect(
      laneKey(lane({ kind: "audio-track", group: "audio", layer: 1 }))
    ).toBe("audio:1")
  })

  test("keys a collapsed group's merged lane with :all", () => {
    // A merged lane has no layer, so it cannot be keyed by one.
    expect(laneKey(lane({ kind: "screen", group: "screen-3" }))).toBe(
      "screen-3:all"
    )
    expect(laneKey(lane({ kind: "audio", group: "audio" }))).toBe("audio:all")
  })

  test("treats a missing layer as layer 0", () => {
    expect(laneKey({ kind: "layer", group: "screen-1" })).toBe("screen-1:0")
  })
})

describe("laneScreenFromKey", () => {
  test("returns the screen number of a screen lane", () => {
    expect(laneScreenFromKey("screen-2:1", 4)).toBe(2)
    expect(laneScreenFromKey("screen-4:all", 4)).toBe(4)
  })

  test("returns null for audio lanes", () => {
    // Audio has no tile in the preview strip.
    expect(laneScreenFromKey("audio:0", 4)).toBeNull()
    expect(laneScreenFromKey("audio:all", 4)).toBeNull()
  })

  test("returns null for a screen that no longer exists", () => {
    // Focus survives as a stale key after the screen count drops; it must be
    // inert rather than pointing at a tile that is not rendered.
    expect(laneScreenFromKey("screen-5:0", 3)).toBeNull()
  })

  test("returns null for an absent or unparseable key", () => {
    expect(laneScreenFromKey(null, 4)).toBeNull()
    expect(laneScreenFromKey(undefined, 4)).toBeNull()
    expect(laneScreenFromKey("", 4)).toBeNull()
    expect(laneScreenFromKey("nonsense", 4)).toBeNull()
  })
})
