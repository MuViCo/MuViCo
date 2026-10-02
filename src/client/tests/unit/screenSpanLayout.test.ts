import {
  computeScreenSpanLayout,
  screenBoxesFromRatios,
  spanMediaStyle,
  DEFAULT_SCREEN_WIDTH,
  SPAN_POSITIONS,
} from "../../components/utils/screenSpanLayout"

// Two 800x600 screens side by side: a 1600x600 canvas, ratio 8/3.
const boxes = (height = 600) => ({
  1: { width: 800, height },
  2: { width: 800, height },
})

const layoutOf = (
  mediaAspectRatio: number,
  options: Parameters<typeof computeScreenSpanLayout>[3] & {
    canvasHeight?: number
  } = {}
) => {
  const { canvasHeight = 600, ...rest } = options
  return computeScreenSpanLayout(
    [1, 2],
    boxes(canvasHeight),
    mediaAspectRatio,
    rest
  )
}

describe("computeScreenSpanLayout", () => {
  describe("canvas", () => {
    test("splits the canvas by each screen's known width, in screen-number order", () => {
      const layout = computeScreenSpanLayout(
        [2, 1, 3],
        {
          1: { width: 1000, height: 600 },
          2: { width: 500, height: 600 },
          3: { width: 1500, height: 600 },
        },
        2
      )

      expect(layout.canvasWidth).toBe(3000)
      expect(layout.canvasHeight).toBe(600)
      expect(layout.boxes[1].left).toBe(0)
      expect(layout.boxes[2].left).toBe(1000)
      expect(layout.boxes[3].left).toBe(1500)
    })

    test("falls back to the average of known widths for a screen not yet open", () => {
      const layout = computeScreenSpanLayout(
        [1, 2, 3],
        // screen 2 unknown -> average of 1000/3000 = 2000
        { 1: { width: 1000, height: 600 }, 3: { width: 3000, height: 600 } },
        1
      )

      expect(layout.canvasWidth).toBe(1000 + 2000 + 3000)
      expect(layout.boxes[2].left).toBe(1000)
      expect(layout.boxes[3].left).toBe(3000)
    })

    test("falls back to DEFAULT_SCREEN_WIDTH when no screen's width is known yet", () => {
      const layout = computeScreenSpanLayout([1, 2], {}, 1)

      expect(layout.canvasWidth).toBe(DEFAULT_SCREEN_WIDTH * 2)
      expect(layout.boxes[2].left).toBe(DEFAULT_SCREEN_WIDTH)
    })
  })

  describe("cover", () => {
    test("zooms a media squarer than the canvas until it fills the width", () => {
      // 16:9 is narrower than the 8/3 canvas, so it overflows downwards.
      const { media } = layoutOf(16 / 9, { canvasHeight: 600 })

      expect(media.width).toBeCloseTo(1600)
      expect(media.height).toBeCloseTo(900)
      expect(media.top).toBeCloseTo((600 - 900) / 2)
    })

    test("zooms a media wider than the canvas until it fills the height", () => {
      // 32:9 is wider than the 8/3 canvas, so it overflows sideways.
      const { media } = layoutOf(32 / 9, { canvasHeight: 600 })

      expect(media.width).toBeCloseTo(2133.33, 1)
      expect(media.height).toBeCloseTo(600)
      expect(media.left).toBeCloseTo((1600 - 2133.33) / 2, 1)
    })

    test("never leaves a gap on either axis", () => {
      for (const aspect of [0.5, 1, 16 / 9, 8 / 3, 32 / 9, 12]) {
        const { media, canvasWidth, canvasHeight } = layoutOf(aspect, {
          canvasHeight: 600,
        })

        expect(media.width).toBeGreaterThanOrEqual(canvasWidth - 0.001)
        expect(media.height).toBeGreaterThanOrEqual(canvasHeight - 0.001)
      }
    })

    test("keeps the media's own proportions", () => {
      const { media } = layoutOf(16 / 9, { canvasHeight: 600 })

      expect(media.width / media.height).toBeCloseTo(16 / 9)
    })
  })

  describe("contain", () => {
    test("fits a media wider than the canvas, leaving bands above and below", () => {
      const { media, canvasHeight } = layoutOf(32 / 9, {
        canvasHeight: 600,
        fill: "contain",
      })

      expect(media.width).toBeCloseTo(1600)
      expect(media.height).toBeCloseTo(450)
      expect(media.top).toBeCloseTo((canvasHeight - 450) / 2)
    })

    test("fits a media narrower than the canvas, leaving bands left and right", () => {
      const { media, canvasWidth } = layoutOf(16 / 9, {
        canvasHeight: 600,
        fill: "contain",
      })

      expect(media.height).toBeCloseTo(600)
      expect(media.width).toBeCloseTo(1066.67, 1)
      expect(media.left).toBeCloseTo((canvasWidth - media.width) / 2)
    })

    test("never crops either axis", () => {
      for (const aspect of [0.5, 1, 16 / 9, 8 / 3, 32 / 9, 12]) {
        const { media, canvasWidth, canvasHeight } = layoutOf(aspect, {
          canvasHeight: 600,
          fill: "contain",
        })

        expect(media.width).toBeLessThanOrEqual(canvasWidth + 0.001)
        expect(media.height).toBeLessThanOrEqual(canvasHeight + 0.001)
      }
    })
  })

  describe("position", () => {
    test("centers the media by default", () => {
      const { media, canvasHeight } = layoutOf(16 / 9, { canvasHeight: 300 })

      // 16:9 over a 1600x300 canvas covers by width, so it overflows down.
      expect(media.top).toBeCloseTo((canvasHeight - media.height) / 2)
      expect(media.top).toBeLessThan(0)
    })

    test("anchors the kept part when cover crops vertically", () => {
      const options = { canvasHeight: 300 } as const
      const top = layoutOf(16 / 9, { ...options, position: "top" }).media
      const bottom = layoutOf(16 / 9, { ...options, position: "bottom" }).media

      expect(top.top).toBeCloseTo(0)
      expect(bottom.top).toBeCloseTo(300 - bottom.height)
      expect(bottom.top).toBeLessThan(top.top)
    })

    test("anchors the kept part when cover crops horizontally", () => {
      const options = { canvasHeight: 600 } as const
      const left = layoutOf(32 / 9, { ...options, position: "left" }).media
      const right = layoutOf(32 / 9, { ...options, position: "right" }).media

      expect(left.left).toBeCloseTo(0)
      expect(right.left).toBeCloseTo(1600 - right.width)
    })

    test("places the bands on the opposite side in contain", () => {
      const options = { canvasHeight: 600, fill: "contain" } as const
      const top = layoutOf(32 / 9, { ...options, position: "top" }).media
      const bottom = layoutOf(32 / 9, { ...options, position: "bottom" }).media

      expect(top.top).toBeCloseTo(0)
      expect(bottom.top).toBeCloseTo(600 - bottom.height)
    })

    test("uses the corner's own anchor on both axes", () => {
      const { media } = layoutOf(1, {
        canvasHeight: 600,
        fill: "contain",
        position: "top-left",
      })

      expect(media.left).toBeCloseTo(0)
      expect(media.top).toBeCloseTo(0)
    })

    test("leaves the axis that does not move alone, whatever the anchor", () => {
      // Covering by width: nothing to choose horizontally.
      const positions = ["left", "center", "right"] as const
      const lefts = positions.map(
        (position) =>
          layoutOf(16 / 9, { canvasHeight: 300, position }).media.left
      )

      expect(new Set(lefts.map((left) => left.toFixed(6))).size).toBe(1)
    })

    test("exposes nine positions, row-major", () => {
      expect(SPAN_POSITIONS).toHaveLength(9)
      expect(SPAN_POSITIONS[0]).toBe("top-left")
      expect(SPAN_POSITIONS[4]).toBe("center")
      expect(SPAN_POSITIONS[8]).toBe("bottom-right")
    })
  })

  describe("screens of different shapes", () => {
    // A 4:3 output beside a 16:9 one, both 600 tall.
    const mixed = {
      1: { width: 800, height: 600 },
      2: { width: 1067, height: 600 },
    }

    test("gives each screen its own width in the canvas", () => {
      const layout = computeScreenSpanLayout([1, 2], mixed, 16 / 9)

      expect(layout.canvasWidth).toBe(1867)
      expect(layout.boxes[1].left).toBe(0)
      expect(layout.boxes[2].left).toBe(800)
    })

    test("takes the canvas height from the tallest screen", () => {
      const layout = computeScreenSpanLayout(
        [1, 2],
        { 1: { width: 800, height: 600 }, 2: { width: 800, height: 400 } },
        16 / 9
      )

      expect(layout.canvasHeight).toBe(600)
      // The shorter screen covers a centered band of it, so it loses as
      // much above as below instead of hanging off one edge.
      expect(layout.boxes[2].top).toBe(100)
      expect(layout.boxes[1].top).toBe(0)
    })

    test("keeps the media continuous across the seam", () => {
      const layout = computeScreenSpanLayout([1, 2], mixed, 16 / 9)
      const left = spanMediaStyle(layout, 1)
      const right = spanMediaStyle(layout, 2)

      const px = (value: string, basis: number) =>
        (parseFloat(value) / 100) * basis

      // Where screen 1's slice ends, screen 2's must begin -- the media's
      // left edge sits one screen-1 width further left for screen 2.
      const leftEdge1 = px(left.left, mixed[1].width)
      const leftEdge2 = px(right.left, mixed[2].width)
      expect(leftEdge1 - leftEdge2).toBeCloseTo(mixed[1].width, 6)

      // And it is drawn at the same scale on both.
      expect(px(left.width, mixed[1].width)).toBeCloseTo(
        px(right.width, mixed[2].width),
        6
      )
      expect(px(left.height, mixed[1].height)).toBeCloseTo(
        px(right.height, mixed[2].height),
        6
      )
    })

    test("lines a shorter screen up with its taller neighbour", () => {
      const layout = computeScreenSpanLayout(
        [1, 2],
        { 1: { width: 800, height: 600 }, 2: { width: 800, height: 400 } },
        16 / 9
      )
      const tall = spanMediaStyle(layout, 1)
      const short = spanMediaStyle(layout, 2)

      const topPx = (value: string, basis: number) =>
        (parseFloat(value) / 100) * basis

      // The shorter screen starts 100px lower in the canvas, so the media
      // sits 100px higher relative to its own box.
      expect(topPx(tall.top, 600) - topPx(short.top, 400)).toBeCloseTo(100, 6)
    })
  })

  describe("degenerate input", () => {
    test("falls back to the canvas itself when the aspect ratio isn't known", () => {
      const { media, canvasWidth, canvasHeight } = layoutOf(0, {
        canvasHeight: 600,
      })

      expect(media).toEqual({
        width: canvasWidth,
        height: canvasHeight,
        left: 0,
        top: 0,
      })
    })

    test("treats a zero-sized screen as not measured yet", () => {
      const measured = computeScreenSpanLayout(
        [1, 2],
        { 1: { width: 800, height: 600 }, 2: { width: 0, height: 0 } },
        16 / 9
      )

      // Screen 2 borrows screen 1's size rather than collapsing the canvas.
      expect(measured.boxes[2]).toMatchObject({ width: 800, height: 600 })
      expect(measured.canvasWidth).toBe(1600)
    })
  })
})

describe("screenWidthMapFromRatios", () => {
  test("widens a screen in proportion to its own ratio", () => {
    const boxMap = screenBoxesFromRatios([1, 2], { "2": "4:3" }, "16:9")

    expect(boxMap[1].width).toBeCloseTo(16 / 9)
    expect(boxMap[2].width).toBeCloseTo(4 / 3)
    expect(boxMap[1].height).toBe(1)
    expect(boxMap[1].width).toBeGreaterThan(boxMap[2].width)
  })

  test("gives equal widths when every screen shares a ratio", () => {
    const boxMap = screenBoxesFromRatios([1, 2, 3], {}, "16:9")

    expect(boxMap[1].width).toBeCloseTo(boxMap[2].width)
    expect(boxMap[2].width).toBeCloseTo(boxMap[3].width)
  })

  test("pairs with a canvas height of 1, the unit its sizes are in", () => {
    const boxMap = screenBoxesFromRatios([1, 2], {}, "16:9")
    const { canvasWidth, media } = computeScreenSpanLayout(
      [1, 2],
      boxMap,
      16 / 9
    )

    expect(canvasWidth).toBeCloseTo((16 / 9) * 2)
    // The canvas is twice as wide as the media's own shape, so covering it
    // means filling the width and spilling to twice the canvas height.
    expect(media.width).toBeCloseTo(canvasWidth)
    expect(media.height).toBeCloseTo(2)
  })
})
