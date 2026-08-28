/*
 * Lane focus helper tests.
 * Covers lane identity, the lane -> screen mapping used by the preview strip,
 * and the span compensation applied to the focus transform.
 */
import {
  LANE_KNIT,
  laneFocusBleed,
  laneFocusLayout,
  laneKey,
  laneScreenFromKey,
} from "../../components/utils/laneFocus"

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

describe("laneFocusLayout", () => {
  // Two screens of three lanes each, then a two-track audio group.
  const groups = [
    { startY: 0, laneCount: 3 },
    { startY: 3, laneCount: 3 },
    { startY: 6, laneCount: 2 },
  ]
  const rowHeight = 60
  const rowGap = 40

  const top = (layout: ReturnType<typeof laneFocusLayout>, y: number) =>
    y * (rowHeight + rowGap) + (layout.offset[y] as number)
  const bottom = (layout: ReturnType<typeof laneFocusLayout>, y: number) =>
    top(layout, y) + rowHeight + (layout.delta[y] as number)
  /** Distance between the bottom of lane y and the top of lane y + 1. */
  const gapBelow = (layout: ReturnType<typeof laneFocusLayout>, y: number) =>
    top(layout, y + 1) - bottom(layout, y)

  test("closes the gap between lanes of the same screen", () => {
    const layout = laneFocusLayout(groups, -1, rowHeight)
    // Both lanes reach towards each other, so they end up 2 x LANE_KNIT closer
    // than the row gap the two grids actually use.
    expect(gapBelow(layout, 0)).toBe(rowGap - 2 * LANE_KNIT)
    expect(gapBelow(layout, 1)).toBe(rowGap - 2 * LANE_KNIT)
  })

  test("leaves the gap at a screen's edge alone", () => {
    const layout = laneFocusLayout(groups, -1, rowHeight)
    // Neither lane reaches across the boundary, so this is the full row gap --
    // the space that reads as the separation between two screens.
    expect(gapBelow(layout, 2)).toBe(rowGap)
    expect(gapBelow(layout, 5)).toBe(rowGap)
  })

  test("keeps a screen's first and last lane on their tracks", () => {
    const layout = laneFocusLayout(groups, -1, rowHeight)
    // The frame is drawn from these, so they must not drift.
    expect(top(layout, 0)).toBe(0)
    expect(bottom(layout, 2)).toBe(2 * (rowHeight + rowGap) + rowHeight)
  })

  test("grows the focused lane by exactly what its siblings give up", () => {
    const layout = laneFocusLayout(groups, 1, rowHeight)
    const unfocused = laneFocusLayout(groups, -1, rowHeight)
    expect((layout.delta[1] as number) - (unfocused.delta[1] as number)).toBe(
      laneFocusBleed(rowHeight)
    )
    // The screen is as tall focused as not, so the ones below do not move.
    expect(bottom(layout, 2)).toBeCloseTo(bottom(unfocused, 2))
  })

  test("holds every gap while a lane is focused", () => {
    const layout = laneFocusLayout(groups, 1, rowHeight)
    // The property the effect exists to preserve: the spacing that separates
    // layers, and the spacing that separates screens, both stay put.
    expect(gapBelow(layout, 0)).toBeCloseTo(rowGap - 2 * LANE_KNIT)
    expect(gapBelow(layout, 1)).toBeCloseTo(rowGap - 2 * LANE_KNIT)
    expect(gapBelow(layout, 2)).toBeCloseTo(rowGap)
  })

  test("does not touch the screens that do not hold focus", () => {
    const layout = laneFocusLayout(groups, 1, rowHeight)
    const unfocused = laneFocusLayout(groups, -1, rowHeight)
    for (let y = 3; y < 8; y += 1) {
      expect(layout.delta[y]).toBe(unfocused.delta[y])
      expect(layout.offset[y]).toBe(unfocused.offset[y])
    }
  })

  test("does nothing for a single-lane group", () => {
    // A collapsed screen has no sibling to reach towards or to borrow height
    // from, so its cell matches its track exactly.
    const layout = laneFocusLayout([{ startY: 0, laneCount: 1 }], 0, rowHeight)
    expect(layout.delta).toEqual([0])
    expect(layout.offset).toEqual([0])
  })
})
