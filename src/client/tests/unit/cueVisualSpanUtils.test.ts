/*
 * Cue visual span unit tests.
 * A cue's visual span runs from its own index up to the index before the next
 * cue in the same lane, or to the end of the timeline when it is the last one.
 */
import {
  buildCueVisualSpanMap,
  getCueVisualSpanFromMap,
} from "../../components/utils/cueVisualSpanUtils"

import type { Cue } from "../../types"

const cue = (overrides: Partial<Cue>): Cue =>
  ({
    _id: "id",
    cueType: "visual",
    index: 0,
    name: "cue",
    screen: 1,
    file: null,
    loop: false,
    continuePlayback: false,
    opacity: 1,
    layer: 0,
    ...overrides,
  }) as Cue

describe("buildCueVisualSpanMap", () => {
  test("spans each cue up to the next one in the same lane", () => {
    const map = buildCueVisualSpanMap(
      [
        cue({ _id: "a", index: 0 }),
        cue({ _id: "b", index: 3 }),
        cue({ _id: "c", index: 7 }),
      ],
      10
    )

    expect(map.get("a")).toBe(3) // 0..2
    expect(map.get("b")).toBe(4) // 3..6
    expect(map.get("c")).toBe(3) // 7..9, to the end of the timeline
  })

  test("keeps lanes independent", () => {
    // Same indexes, different screens: neither cue truncates the other.
    const map = buildCueVisualSpanMap(
      [
        cue({ _id: "s1", index: 0, screen: 1 }),
        cue({ _id: "s2", index: 4, screen: 2 }),
      ],
      8
    )

    expect(map.get("s1")).toBe(8)
    expect(map.get("s2")).toBe(4)
  })

  test("separates layers within the same screen", () => {
    const map = buildCueVisualSpanMap(
      [
        cue({ _id: "l0", index: 0, layer: 0 }),
        cue({ _id: "l1", index: 2, layer: 1 }),
      ],
      6
    )

    expect(map.get("l0")).toBe(6)
    expect(map.get("l1")).toBe(4)
  })

  test("skips cues with no id or a non-integer index or screen", () => {
    const map = buildCueVisualSpanMap(
      [
        cue({ _id: "", index: 0 }),
        cue({ _id: "bad-index", index: NaN }),
        cue({ _id: "bad-screen", screen: NaN }),
        cue({ _id: "good", index: 1 }),
      ],
      5
    )

    expect(map.has("")).toBe(false)
    expect(map.has("bad-index")).toBe(false)
    expect(map.has("bad-screen")).toBe(false)
    expect(map.get("good")).toBe(4)
  })

  test("never returns a span below 1", () => {
    // Two cues on the same index would otherwise compute a span of 0.
    const map = buildCueVisualSpanMap(
      [cue({ _id: "a", index: 2 }), cue({ _id: "b", index: 2 })],
      5
    )

    expect(map.get("a")).toBe(1)
  })
})

describe("getCueVisualSpanFromMap", () => {
  const map = new Map([["a", 4]])

  test("returns the mapped span", () => {
    expect(getCueVisualSpanFromMap({ _id: "a" }, map)).toBe(4)
  })

  test("falls back to 1 for an unknown, missing or absent cue", () => {
    expect(getCueVisualSpanFromMap({ _id: "unknown" }, map)).toBe(1)
    expect(getCueVisualSpanFromMap(null, map)).toBe(1)
    expect(getCueVisualSpanFromMap(undefined, map)).toBe(1)
  })
})
