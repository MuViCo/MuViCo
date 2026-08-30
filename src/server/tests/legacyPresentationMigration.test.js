const {
  normalizeCue,
  normalizePresentation,
  summarizeMigration,
} = require("../utils/legacyPresentationMigration")

describe("legacy presentation migration", () => {
  test("adds missing layered timeline defaults to legacy visual cues", () => {
    const result = normalizeCue({ index: 0, screen: 1, name: "Legacy" }, 3)

    expect(result.cue).toEqual(
      expect.objectContaining({
        cueType: "visual",
        screen: 1,
        layer: 0,
        opacity: 1,
        continuePlayback: false,
      })
    )
    expect(result.changes).toEqual([
      "cueType",
      "layer",
      "opacity",
      "continuePlayback",
    ])
  })

  test("normalizes legacy audio cues to the synthetic audio row", () => {
    const result = normalizeCue(
      {
        index: 0,
        screen: 3,
        cueType: "audio",
        layer: 1,
        opacity: 1,
        continuePlayback: true,
      },
      4
    )

    expect(result.cue.screen).toBe(5)
    expect(result.cue.layer).toBe(1)
    expect(result.cue.continuePlayback).toBe(true)
    expect(result.changes).toEqual(["screen"])
  })

  test("resets invalid layer and opacity values", () => {
    const result = normalizeCue(
      {
        index: 0,
        screen: 1,
        cueType: "visual",
        layer: 8,
        opacity: 2,
        continuePlayback: false,
      },
      2
    )

    expect(result.cue.layer).toBe(0)
    expect(result.cue.opacity).toBe(1)
    expect(result.changes).toEqual(["layer", "opacity"])
  })

  test("resets a non-integer layer even when it is within range", () => {
    const result = normalizeCue(
      {
        index: 0,
        screen: 1,
        cueType: "visual",
        layer: 1.5,
        opacity: 1,
        continuePlayback: false,
      },
      2
    )

    expect(result.cue.layer).toBe(0)
    expect(result.changes).toEqual(["layer"])
  })

  test("keeps already-normalized cues unchanged", () => {
    const result = normalizeCue(
      {
        index: 0,
        screen: 1,
        cueType: "visual",
        layer: 0,
        opacity: 0.5,
        continuePlayback: false,
      },
      2
    )

    expect(result.changes).toEqual([])
  })

  test("normalizes a full presentation and reports duplicate slots", () => {
    const presentation = {
      _id: "presentation-1",
      screenCount: 2,
      cues: [
        { index: 0, screen: 1, name: "A" },
        { index: 0, screen: 1, name: "B" },
      ],
    }

    const result = normalizePresentation(presentation)

    expect(result.changed).toBe(true)
    expect(result.changedFields).toEqual([
      "continuePlayback",
      "cueType",
      "layer",
      "opacity",
    ])
    expect(result.duplicateSlots).toBe(1)
  })

  test("summarizes migration results", () => {
    const results = [
      normalizePresentation({
        _id: "presentation-1",
        screenCount: 2,
        cues: [{ index: 0, screen: 1 }],
      }),
      normalizePresentation({
        _id: "presentation-2",
        screenCount: 2,
        cues: [
          {
            index: 0,
            screen: 1,
            cueType: "visual",
            layer: 0,
            opacity: 1,
            continuePlayback: false,
          },
        ],
      }),
    ]

    expect(summarizeMigration(results)).toEqual({
      presentations: 2,
      cues: 2,
      changedPresentations: 1,
      duplicateSlots: 0,
      changedFields: {
        continuePlayback: 1,
        cueType: 1,
        layer: 1,
        opacity: 1,
      },
    })
  })
})
