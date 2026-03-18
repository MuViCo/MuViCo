import {
  resolveCueSwapPlacement,
} from "../../components/utils/cuePlacementController"
import { buildCueCellMap } from "../../components/utils/cueGridUtils"

describe("cuePlacementController", () => {
  it("resolves same-screen mixed-width swap using left-most valid target slot", () => {
    const selectedCue = {
      _id: "selected",
      index: 0,
      screen: 1,
      cueWidth: 1,
      cueType: "visual",
    }
    const targetCue = {
      _id: "target",
      index: 3,
      screen: 1,
      cueWidth: 2,
      cueType: "visual",
    }
    const blockingCue = {
      _id: "blocking",
      index: 6,
      screen: 1,
      cueWidth: 2,
      cueType: "visual",
    }

    const cues = [selectedCue, targetCue, blockingCue]
    const cueByGridCell = buildCueCellMap(cues)

    const result = resolveCueSwapPlacement({
      selectedCue,
      targetCue,
      selectedCueNextIndex: targetCue.index,
      targetCueNextIndex: selectedCue.index,
      indexCount: 10,
      cueByGridCell,
    })

    expect(result.ok).toBe(true)
    expect(result.newSelectedCue.index).toBe(3)
    expect(result.newTargetCue.index).toBe(0)
  })

  it("returns no-valid-target-slot when same-screen swap cannot place target cue", () => {
    const selectedCue = {
      _id: "selected",
      index: 0,
      screen: 1,
      cueWidth: 2,
      cueType: "visual",
    }
    const targetCue = {
      _id: "target",
      index: 2,
      screen: 1,
      cueWidth: 3,
      cueType: "visual",
    }
    const blockingCue = {
      _id: "blocking",
      index: 5,
      screen: 1,
      cueWidth: 2,
      cueType: "visual",
    }

    const cueByGridCell = buildCueCellMap([selectedCue, targetCue, blockingCue])

    const result = resolveCueSwapPlacement({
      selectedCue,
      targetCue,
      selectedCueNextIndex: targetCue.index,
      targetCueNextIndex: selectedCue.index,
      indexCount: 7,
      cueByGridCell,
    })

    expect(result).toEqual({
      ok: false,
      reason: "no-valid-target-slot",
    })
  })

  it("returns out-of-bounds-or-overlap when selected cue target index is outside bounds", () => {
    const selectedCue = {
      _id: "selected",
      index: 4,
      screen: 1,
      cueWidth: 3,
      cueType: "visual",
    }
    const targetCue = {
      _id: "target",
      index: 1,
      screen: 2,
      cueWidth: 1,
      cueType: "visual",
    }

    const cueByGridCell = buildCueCellMap([selectedCue, targetCue])

    const result = resolveCueSwapPlacement({
      selectedCue,
      targetCue,
      selectedCueNextIndex: 4,
      targetCueNextIndex: 1,
      indexCount: 6,
      cueByGridCell,
    })

    expect(result).toEqual({
      ok: false,
      reason: "out-of-bounds-or-overlap",
    })
  })

  it("returns audio-type-mismatch when swapping audio with non-audio", () => {
    const selectedCue = {
      _id: "selected",
      index: 0,
      screen: 3,
      cueWidth: 1,
      cueType: "audio",
    }
    const targetCue = {
      _id: "target",
      index: 1,
      screen: 3,
      cueWidth: 1,
      cueType: "visual",
    }

    const cueByGridCell = buildCueCellMap([selectedCue, targetCue])

    const result = resolveCueSwapPlacement({
      selectedCue,
      targetCue,
      selectedCueNextIndex: 1,
      targetCueNextIndex: 0,
      indexCount: 6,
      cueByGridCell,
    })

    expect(result).toEqual({
      ok: false,
      reason: "audio-type-mismatch",
    })
  })

  it("resolves valid cross-screen swap", () => {
    const selectedCue = {
      _id: "selected",
      index: 1,
      screen: 1,
      cueWidth: 2,
      cueType: "visual",
    }
    const targetCue = {
      _id: "target",
      index: 4,
      screen: 2,
      cueWidth: 1,
      cueType: "visual",
    }

    const cueByGridCell = buildCueCellMap([selectedCue, targetCue])

    const result = resolveCueSwapPlacement({
      selectedCue,
      targetCue,
      selectedCueNextIndex: 4,
      targetCueNextIndex: 1,
      indexCount: 10,
      cueByGridCell,
    })

    expect(result.ok).toBe(true)
    expect(result.newSelectedCue).toEqual(expect.objectContaining({
      screen: 2,
      index: 4,
    }))
    expect(result.newTargetCue).toEqual(expect.objectContaining({
      screen: 1,
      index: 1,
    }))
  })
})
