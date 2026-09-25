import {
  CUE_FRAME_GRID,
  CUE_FRAME_PRESETS,
  framesAreEqual,
  FULL_FRAME,
  isFullFrame,
  MIN_FRAME_SIZE,
  moveFrame,
  resizeFrame,
  cueFrameStyle,
  normalizeCueFrame,
} from "../../components/utils/cueFrame"

describe("normalizeCueFrame", () => {
  test("an absent frame means the whole screen", () => {
    expect(normalizeCueFrame(undefined)).toEqual(FULL_FRAME)
    expect(normalizeCueFrame(null)).toEqual(FULL_FRAME)
  })

  test("keeps a well formed frame", () => {
    const frame = { x: 0.25, y: 0.1, width: 0.5, height: 0.4 }
    expect(normalizeCueFrame(frame)).toEqual(frame)
  })

  test("falls back to the whole screen on a partial or broken frame", () => {
    expect(normalizeCueFrame({ x: 0.1 })).toEqual(FULL_FRAME)
    expect(normalizeCueFrame({ x: 0, y: 0, width: 0, height: 1 })).toEqual(
      FULL_FRAME
    )
    expect(normalizeCueFrame({ x: NaN, y: 0, width: 1, height: 1 })).toEqual(
      FULL_FRAME
    )
  })

  test("clamps values into the screen", () => {
    expect(normalizeCueFrame({ x: -0.5, y: 2, width: 3, height: 0.5 })).toEqual(
      { x: 0, y: 1, width: 1, height: 0.5 }
    )
  })
})

describe("cueFrameStyle", () => {
  test("turns a frame into percentages", () => {
    expect(
      cueFrameStyle({ frame: { x: 0.25, y: 0, width: 0.5, height: 1 } })
    ).toEqual({ left: "25%", top: "0%", width: "50%", height: "100%" })
  })

  test("an unframed cue still covers the screen", () => {
    expect(cueFrameStyle(undefined)).toEqual({
      left: "0%",
      top: "0%",
      width: "100%",
      height: "100%",
    })
  })
})

describe("CUE_FRAME_PRESETS", () => {
  test("every preset survives normalization unchanged", () => {
    CUE_FRAME_PRESETS.forEach(({ frame }) => {
      expect(normalizeCueFrame(frame)).toEqual(frame)
    })
  })

  test("the nine anchors are half-size and stay on screen", () => {
    CUE_FRAME_GRID.flat().forEach(({ frame }) => {
      expect(frame.width).toBeCloseTo(0.5)
      expect(frame.height).toBeCloseTo(0.5)
      expect(frame.x + frame.width).toBeLessThanOrEqual(1)
      expect(frame.y + frame.height).toBeLessThanOrEqual(1)
    })
  })

  test("the corners sit flush and the centre is centred", () => {
    const byLabel = Object.fromEntries(
      CUE_FRAME_PRESETS.map((preset) => [preset.label, preset.frame])
    )

    expect(byLabel["Top left"]).toMatchObject({ x: 0, y: 0 })
    expect(byLabel["Bottom right"]).toMatchObject({ x: 0.5, y: 0.5 })
    expect(byLabel["Centre"]).toMatchObject({ x: 0.25, y: 0.25 })
  })

  test("the grid is three rows of three, all distinct", () => {
    expect(CUE_FRAME_GRID).toHaveLength(3)
    CUE_FRAME_GRID.forEach((row) => expect(row).toHaveLength(3))

    const keys = CUE_FRAME_GRID.flat().map(
      ({ frame }) => `${frame.x},${frame.y},${frame.width},${frame.height}`
    )
    expect(new Set(keys).size).toBe(9)
  })

  test("the four corners tile the screen exactly", () => {
    const byLabel = Object.fromEntries(
      CUE_FRAME_PRESETS.map((preset) => [preset.label, preset.frame])
    )
    const corners = [
      "Top left",
      "Top right",
      "Bottom left",
      "Bottom right",
    ].map((label) => byLabel[label])

    const area = corners.reduce(
      (sum, frame) => sum + frame.width * frame.height,
      0
    )
    expect(area).toBeCloseTo(1)
  })

  test("only Full counts as the whole screen", () => {
    const full = CUE_FRAME_PRESETS.filter((preset) => isFullFrame(preset.frame))
    expect(full.map((preset) => preset.label)).toEqual(["Full"])
  })
})

describe("moveFrame", () => {
  const frame = { x: 0.2, y: 0.2, width: 0.4, height: 0.4 }

  test("moves by the given delta", () => {
    const moved = moveFrame(frame, 0.1, -0.1)
    expect(moved.x).toBeCloseTo(0.3)
    expect(moved.y).toBeCloseTo(0.1)
    expect(moved.width).toBeCloseTo(0.4)
    expect(moved.height).toBeCloseTo(0.4)
  })

  test("stops at the screen edges instead of leaving it", () => {
    expect(moveFrame(frame, -1, -1)).toEqual({
      x: 0,
      y: 0,
      width: 0.4,
      height: 0.4,
    })
    expect(moveFrame(frame, 1, 1)).toEqual({
      x: 0.6,
      y: 0.6,
      width: 0.4,
      height: 0.4,
    })
  })

  test("keeps the size while moving", () => {
    const moved = moveFrame(frame, 0.9, 0.9)
    expect(moved.width).toBeCloseTo(frame.width)
    expect(moved.height).toBeCloseTo(frame.height)
  })
})

describe("resizeFrame", () => {
  const frame = { x: 0.2, y: 0.2, width: 0.4, height: 0.4 }

  test("a south-east drag moves only the far edges", () => {
    const resized = resizeFrame(frame, "se", 0.1, 0.1)
    expect(resized.x).toBeCloseTo(0.2)
    expect(resized.y).toBeCloseTo(0.2)
    expect(resized.width).toBeCloseTo(0.5)
    expect(resized.height).toBeCloseTo(0.5)
  })

  test("a north-west drag moves the near edges and keeps the far ones", () => {
    const resized = resizeFrame(frame, "nw", -0.1, -0.1)
    expect(resized.x).toBeCloseTo(0.1)
    expect(resized.y).toBeCloseTo(0.1)
    expect(resized.x + resized.width).toBeCloseTo(0.6)
    expect(resized.y + resized.height).toBeCloseTo(0.6)
  })

  test("never shrinks past the minimum size", () => {
    const resized = resizeFrame(frame, "se", -1, -1)
    expect(resized.width).toBeCloseTo(MIN_FRAME_SIZE)
    expect(resized.height).toBeCloseTo(MIN_FRAME_SIZE)
  })

  test("never grows past the screen", () => {
    const resized = resizeFrame(frame, "se", 1, 1)
    expect(resized.x + resized.width).toBeCloseTo(1)
    expect(resized.y + resized.height).toBeCloseTo(1)
  })

  test("a near-edge drag cannot cross the far edge", () => {
    const resized = resizeFrame(frame, "nw", 1, 1)
    expect(resized.width).toBeCloseTo(MIN_FRAME_SIZE)
    expect(resized.x + resized.width).toBeCloseTo(0.6)
  })
})
