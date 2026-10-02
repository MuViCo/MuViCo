import { getLookaheadFrameIndices } from "../../components/utils/showLookaheadUtils"

describe("getLookaheadFrameIndices", () => {
  test("returns the next N frame indices after the current one", () => {
    expect(getLookaheadFrameIndices(3, 10, 2)).toEqual([4, 5])
  })

  test("stops at the last valid frame index", () => {
    expect(getLookaheadFrameIndices(8, 10, 5)).toEqual([9])
  })

  test("returns nothing once already on the last frame", () => {
    expect(getLookaheadFrameIndices(9, 10, 2)).toEqual([])
  })

  test("returns nothing when asked to look ahead zero frames", () => {
    expect(getLookaheadFrameIndices(0, 10, 0)).toEqual([])
  })

  test("returns nothing for an empty or single-frame presentation", () => {
    expect(getLookaheadFrameIndices(0, 0, 2)).toEqual([])
    expect(getLookaheadFrameIndices(0, 1, 2)).toEqual([])
  })
})
