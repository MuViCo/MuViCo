/*
 * Lane focus helper tests.
 * Covers lane identity, the lane -> screen mapping used by the preview strip,
 * and the span compensation applied to the focus transform.
 */
import {
  LANE_FOCUS_SCALE,
  focusTransform,
  laneFocusBleed,
  laneFocusShift,
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

describe("focusTransform", () => {
  const columnWidth = 150
  const gap = 10

  test("scales a single-frame cue uniformly", () => {
    expect(focusTransform(1, columnWidth, gap)).toBe(
      `scale(${LANE_FOCUS_SCALE}, ${LANE_FOCUS_SCALE})`
    )
  })

  test("holds the horizontal overhang constant as the span grows", () => {
    // The point of the compensation: a wide cue must not grow proportionally,
    // or it would overlap its lane neighbours.
    const overhang = (span: number) => {
      const width = span * columnWidth + Math.max(span - 1, 0) * gap
      const scaleX = Number(
        /scale\(([\d.]+),/.exec(focusTransform(span, columnWidth, gap))![1]
      )
      return width * (scaleX - 1)
    }

    // Sub-pixel tolerance: scaleX is deliberately rounded to four decimals, and
    // on a ten-frame cue that rounding is worth about 0.07px. Proportional
    // scaling, which is what this guards against, would put the overhang past
    // 300px.
    const single = overhang(1)
    expect(overhang(2)).toBeCloseTo(single, 0)
    expect(overhang(10)).toBeCloseTo(single, 0)
    expect(single).toBeCloseTo((LANE_FOCUS_SCALE - 1) * columnWidth, 0)
  })

  test("always scales vertically by the full factor", () => {
    for (const span of [1, 2, 3, 10]) {
      expect(focusTransform(span, columnWidth, gap)).toContain(
        `, ${LANE_FOCUS_SCALE})`
      )
    }
  })

  test("falls back to a uniform scale for a zero-width span", () => {
    expect(focusTransform(0, columnWidth, gap)).toBe(
      `scale(${LANE_FOCUS_SCALE}, ${LANE_FOCUS_SCALE})`
    )
  })
})

describe("laneFocusShift", () => {
  const rowHeight = 100

  test("does not move anything when nothing is focused", () => {
    expect(laneFocusShift(0, -1, rowHeight)).toBe(0)
    expect(laneFocusShift(5, -1, rowHeight)).toBe(0)
  })

  test("leaves the focused lane where it is", () => {
    expect(laneFocusShift(3, 3, rowHeight)).toBe(0)
  })

  test("pushes lanes above up and lanes below down", () => {
    const half = laneFocusBleed(rowHeight) / 2

    expect(laneFocusShift(2, 3, rowHeight)).toBe(-half)
    expect(laneFocusShift(4, 3, rowHeight)).toBe(half)
  })

  test("shifts every neighbour by the same amount, near or far", () => {
    // A uniform split keeps the lanes evenly spaced; only the gap either side
    // of the focused lane opens up.
    expect(laneFocusShift(0, 3, rowHeight)).toBe(
      laneFocusShift(2, 3, rowHeight)
    )
    expect(laneFocusShift(9, 3, rowHeight)).toBe(
      laneFocusShift(4, 3, rowHeight)
    )
  })

  test("bleed matches the height the scale adds", () => {
    expect(laneFocusBleed(rowHeight)).toBeCloseTo(
      rowHeight * (LANE_FOCUS_SCALE - 1),
      5
    )
  })
})
