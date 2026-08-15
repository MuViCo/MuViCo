import {
  buildRowModel,
  dropTargetAt,
  planVisualLayerRemoval,
} from "../../components/utils/screenRowModel"

describe("screenRowModel", () => {
  test("keeps L1 first and appends added visual layers below it", () => {
    const rowModel = buildRowModel(1, [], {}, { "screen-1": 3 })

    expect(rowModel.rows.map((row) => row.label)).toEqual([
      "L1",
      "L2",
      "L3",
      "A1",
    ])
    expect(rowModel.rows[0]).toMatchObject({
      kind: "layer",
      screen: 1,
      layer: 0,
      groupStart: true,
    })
    expect(rowModel.rows[1]).toMatchObject({
      kind: "layer",
      screen: 1,
      layer: 1,
      groupStart: false,
      canRemoveLayer: true,
    })
    expect(rowModel.rows[0].canRemoveLayer).toBe(false)
  })

  test("plans layer removal by deleting target layer cues and shifting upper layers down", () => {
    const cues = [
      { _id: "cue-l1", cueType: "visual", screen: 1, layer: 0, index: 0 },
      { _id: "cue-l2", cueType: "visual", screen: 1, layer: 1, index: 0 },
      { _id: "cue-l3", cueType: "visual", screen: 1, layer: 2, index: 0 },
      { _id: "cue-s2", cueType: "visual", screen: 2, layer: 2, index: 0 },
      { _id: "cue-audio", cueType: "audio", screen: 3, layer: 1, index: 0 },
    ]

    expect(planVisualLayerRemoval(cues, 1, 1)).toEqual({
      removedCueIds: ["cue-l2"],
      shiftedCues: [
        { _id: "cue-l3", cueType: "visual", screen: 1, layer: 1, index: 0 },
      ],
    })
  })

  test("marks non-base visual layers as removable even when occupied", () => {
    const rowModel = buildRowModel(
      1,
      [{ _id: "cue-l2", cueType: "visual", screen: 1, layer: 1, index: 0 }],
      {},
      { "screen-1": 2 }
    )

    expect(rowModel.rows[0]).toMatchObject({
      label: "L1",
      canRemoveLayer: false,
    })
    expect(rowModel.rows[1]).toMatchObject({
      label: "L2",
      canRemoveLayer: true,
    })
  })

  test("maps a drop on L2 to layer 1 for the same screen", () => {
    const rowModel = buildRowModel(1, [], {}, { "screen-1": 2 })

    expect(dropTargetAt(rowModel.rows, 1, "visual", 1)).toEqual({
      screen: 1,
      layer: 1,
    })
  })

  test("maps audio tracks to the global audio screen row", () => {
    const rowModel = buildRowModel(2, [], {}, { audio: 2 })

    expect(dropTargetAt(rowModel.rows, 2, "audio", 2)).toEqual({
      screen: 3,
      layer: 0,
    })
    expect(dropTargetAt(rowModel.rows, 3, "audio", 2)).toEqual({
      screen: 3,
      layer: 1,
    })
  })
})
