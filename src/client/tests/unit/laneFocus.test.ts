/*
 * Lane focus helper tests.
 * Covers lane identity, the lane -> screen mapping used by the preview strip,
 * and the span compensation applied to the focus transform.
 */
import {
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
  const rowGap = 8

  /** Distance between the bottom of lane y and the top of lane y + 1. */
  const gapBelow = (layout: ReturnType<typeof laneFocusLayout>, y: number) => {
    const top = (row: number) =>
      row * (rowHeight + rowGap) + (layout.offset[row] as number)
    const bottom = top(y) + rowHeight + (layout.delta[y] as number)
    return top(y + 1) - bottom
  }

  test("leaves every lane alone when nothing is focused", () => {
    const layout = laneFocusLayout(groups, -1, rowHeight)
    expect(layout.delta.every((d) => d === 0)).toBe(true)
    expect(layout.offset.every((o) => o === 0)).toBe(true)
  })

  test("grows the focused lane by exactly what its siblings give up", () => {
    const layout = laneFocusLayout(groups, 1, rowHeight)
    expect(layout.delta[1]).toBe(laneFocusBleed(rowHeight))
    // The group is as tall focused as not, so the screens below do not move.
    const groupDelta = layout.delta.slice(0, 3).reduce((a, b) => a + b, 0)
    expect(groupDelta).toBeCloseTo(0)
  })

  test("keeps consecutive lanes exactly one row gap apart", () => {
    const layout = laneFocusLayout(groups, 1, rowHeight)
    // This is the property the effect exists to preserve: the spacing that
    // separates layers stays the spacing that separates layers.
    for (let y = 0; y < 2; y += 1) {
      expect(gapBelow(layout, y)).toBeCloseTo(rowGap)
    }
  })

  test("does not touch the groups that do not hold focus", () => {
    const layout = laneFocusLayout(groups, 1, rowHeight)
    for (let y = 3; y < 8; y += 1) {
      expect(layout.delta[y]).toBe(0)
      expect(layout.offset[y]).toBe(0)
    }
  })

  test("does nothing for a single-lane group", () => {
    // A collapsed screen has no sibling to borrow the height from, so the
    // focus is carried by colour alone rather than by resizing the group.
    const layout = laneFocusLayout([{ startY: 0, laneCount: 1 }], 0, rowHeight)
    expect(layout.delta).toEqual([0])
    expect(layout.offset).toEqual([0])
  })
})
