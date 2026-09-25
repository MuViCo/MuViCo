import {
  DEFAULT_OUTPUT_ASPECT_RATIO,
  isValidAspectRatio,
  parseAspectRatio,
  resolveScreenAspectRatio,
} from "../../../constants.js"

describe("aspectRatio", () => {
  test("parses a well formed ratio", () => {
    expect(parseAspectRatio("16:9")).toBeCloseTo(16 / 9)
    expect(parseAspectRatio("4:3")).toBeCloseTo(4 / 3)
    expect(parseAspectRatio("1:1")).toBe(1)
  })

  test("falls back to 16:9 on anything unusable", () => {
    const fallback = 16 / 9
    expect(parseAspectRatio(undefined)).toBeCloseTo(fallback)
    expect(parseAspectRatio(null)).toBeCloseTo(fallback)
    expect(parseAspectRatio("")).toBeCloseTo(fallback)
    expect(parseAspectRatio("16/9")).toBeCloseTo(fallback)
    expect(parseAspectRatio("0:9")).toBeCloseTo(fallback)
    expect(parseAspectRatio("16:0")).toBeCloseTo(fallback)
    expect(parseAspectRatio(1.777)).toBeCloseTo(fallback)
  })

  test("accepts only W:H with both sides positive", () => {
    expect(isValidAspectRatio(DEFAULT_OUTPUT_ASPECT_RATIO)).toBe(true)
    expect(isValidAspectRatio("256:135")).toBe(true)
    expect(isValidAspectRatio("0:1")).toBe(false)
    expect(isValidAspectRatio("1:0")).toBe(false)
    expect(isValidAspectRatio("-16:9")).toBe(false)
    expect(isValidAspectRatio("16:9 ")).toBe(false)
    expect(isValidAspectRatio(169)).toBe(false)
  })

  describe("resolveScreenAspectRatio", () => {
    test("prefers the screen's own value", () => {
      expect(resolveScreenAspectRatio({ "2": "4:3" }, 2, "16:9")).toBe("4:3")
    })

    test("falls back to the presentation value for an unset screen", () => {
      expect(resolveScreenAspectRatio({ "2": "4:3" }, 1, "21:9")).toBe("21:9")
    })

    test("ignores a malformed per-screen value", () => {
      expect(resolveScreenAspectRatio({ "1": "nope" }, 1, "4:3")).toBe("4:3")
    })

    test("ends at 16:9 when nothing usable is given", () => {
      expect(resolveScreenAspectRatio(undefined, 1, undefined)).toBe("16:9")
      expect(resolveScreenAspectRatio(null, 1, "bad")).toBe("16:9")
    })

    test("accepts a numeric or string screen key", () => {
      expect(resolveScreenAspectRatio({ "3": "1:1" }, "3", "16:9")).toBe("1:1")
      expect(resolveScreenAspectRatio({ "3": "1:1" }, 3, "16:9")).toBe("1:1")
    })
  })
})
