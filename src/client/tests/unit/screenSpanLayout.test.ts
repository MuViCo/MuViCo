import {
  computeScreenSpanLayout,
  DEFAULT_SCREEN_WIDTH,
} from "../../components/utils/screenSpanLayout"

describe("computeScreenSpanLayout", () => {
  test("splits the canvas by each screen's known width, in screen-number order", () => {
    const layout = computeScreenSpanLayout(
      [2, 1, 3],
      { 1: 1000, 2: 500, 3: 1500 },
      2 // aspect ratio: canvasWidth / 2
    )

    expect(layout.canvasWidth).toBe(3000)
    expect(layout.canvasHeight).toBe(1500)
    expect(layout.offsets).toEqual({ 1: 0, 2: 1000, 3: 1500 })
  })

  test("falls back to the average of known widths for a screen not yet open", () => {
    const layout = computeScreenSpanLayout(
      [1, 2, 3],
      { 1: 1000, 3: 3000 }, // screen 2 unknown -> average of 1000/3000 = 2000
      1
    )

    expect(layout.canvasWidth).toBe(1000 + 2000 + 3000)
    expect(layout.offsets).toEqual({ 1: 0, 2: 1000, 3: 3000 })
  })

  test("falls back to DEFAULT_SCREEN_WIDTH when no screen's width is known yet", () => {
    const layout = computeScreenSpanLayout([1, 2], {}, 1)

    expect(layout.canvasWidth).toBe(DEFAULT_SCREEN_WIDTH * 2)
    expect(layout.offsets).toEqual({ 1: 0, 2: DEFAULT_SCREEN_WIDTH })
  })

  test("computes canvasHeight from the combined width and the image's aspect ratio", () => {
    const layout = computeScreenSpanLayout([1, 2], { 1: 800, 2: 800 }, 4 / 3)

    expect(layout.canvasWidth).toBe(1600)
    expect(layout.canvasHeight).toBeCloseTo(1200)
  })
})
