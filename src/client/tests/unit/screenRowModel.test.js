import {
  buildRowModel,
  groupLanes,
  dropTargetAt,
  getCueRow,
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

  test("collapses the audio group into a single merged row", () => {
    const cues = [
      { _id: "a1", cueType: "audio", layer: 0, index: 0 },
      { _id: "a2", cueType: "audio", layer: 1, index: 0 },
    ]
    const rowModel = buildRowModel(1, cues, { audio: true })

    const audioRow = rowModel.rows.find((row) => row.kind === "audio")
    expect(audioRow).toMatchObject({
      group: "audio",
      collapsed: true,
      count: 2,
      label: "Audio",
      groupStart: true,
    })
    expect(rowModel.cueY["a1"]).toBe(audioRow.y)
    expect(rowModel.cueY["a2"]).toBe(audioRow.y)
  })

  test("resolves a cue's row from the cueY map or falls back to its screen", () => {
    const cueY = { "cue-1": 4 }

    expect(getCueRow({ _id: "cue-1", screen: 2 }, cueY)).toBe(4)
    expect(getCueRow({ _id: "missing", screen: 3 }, cueY)).toBe(2)
    expect(getCueRow({ _id: "missing" }, cueY)).toBe(0)
  })

  test("returns an empty plan when the target layer is not a positive integer", () => {
    const cues = [
      { _id: "cue-l1", cueType: "visual", screen: 1, layer: 0, index: 0 },
    ]

    expect(planVisualLayerRemoval(cues, 1, 0)).toEqual({
      removedCueIds: [],
      shiftedCues: [],
    })
    expect(planVisualLayerRemoval(cues, 1, -1)).toEqual({
      removedCueIds: [],
      shiftedCues: [],
    })
    expect(planVisualLayerRemoval(cues, 1, 1.5)).toEqual({
      removedCueIds: [],
      shiftedCues: [],
    })
  })
})

describe("groupLanes", () => {
  test("collapses each screen's lanes into one group", () => {
    const { rows } = buildRowModel(2, [], {}, { "screen-1": 2, "screen-2": 1 })
    const groups = groupLanes(rows)

    expect(groups.map((group) => [group.group, group.laneCount])).toEqual([
      ["screen-1", 2],
      ["screen-2", 1],
      ["audio", 1],
    ])
  })

  test("records where each group starts so overlays can be positioned", () => {
    const { rows } = buildRowModel(2, [], {}, { "screen-1": 3, "screen-2": 2 })
    const groups = groupLanes(rows)

    expect(groups.map((group) => group.startY)).toEqual([0, 3, 5])
    // startY + laneCount of the last group must cover every row.
    const last = groups[groups.length - 1]
    expect(last.startY + last.laneCount).toBe(rows.length)
  })

  test("labels an expanded screen with its screen name, not its first layer", () => {
    const { rows } = buildRowModel(1, [], {}, {})
    const [screenGroup] = groupLanes(rows)

    // The group-start lane's own label is "L1"; screenLabel carries "Screen 1".
    expect(screenGroup.label).toBe("Screen 1")
    expect(screenGroup.collapsed).toBe(false)
  })

  test("marks a collapsed group and keeps its single merged lane", () => {
    const { rows } = buildRowModel(1, [], { "screen-1": true }, {})
    const [screenGroup] = groupLanes(rows)

    expect(screenGroup.collapsed).toBe(true)
    expect(screenGroup.laneCount).toBe(1)
    expect(screenGroup.label).toBe("Screen 1")
  })

  test("returns nothing for an empty row list", () => {
    expect(groupLanes([])).toEqual([])
  })
})
