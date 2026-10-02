import { getLookaheadFrameIndices } from "../../components/utils/showLookaheadUtils"

describe("getLookaheadFrameIndices", () => {
  test("returns the N frames on either side of the current one", () => {
    expect(getLookaheadFrameIndices(3, 10, 2)).toEqual([1, 2, 4, 5])
  })

  test("orders the window outwards-in then forwards", () => {
    expect(getLookaheadFrameIndices(5, 10, 3)).toEqual([2, 3, 4, 6, 7, 8])
  })

  test("stops at the last valid frame index", () => {
    expect(getLookaheadFrameIndices(8, 10, 5)).toEqual([3, 4, 5, 6, 7, 9])
  })

  test("looks only backwards once on the last frame", () => {
    expect(getLookaheadFrameIndices(9, 10, 2)).toEqual([7, 8])
  })

  test("looks only forwards once on the first frame", () => {
    expect(getLookaheadFrameIndices(0, 10, 2)).toEqual([1, 2])
  })

  test("never returns the current frame", () => {
    expect(getLookaheadFrameIndices(4, 10, 3)).not.toContain(4)
  })

  test("returns nothing when asked to look ahead zero frames", () => {
    expect(getLookaheadFrameIndices(0, 10, 0)).toEqual([])
  })

  test("returns nothing for an empty or single-frame presentation", () => {
    expect(getLookaheadFrameIndices(0, 0, 2)).toEqual([])
    expect(getLookaheadFrameIndices(0, 1, 2)).toEqual([])
  })
})
