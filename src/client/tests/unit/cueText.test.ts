import {
  DEFAULT_TEXT_COLOR,
  DEFAULT_TEXT_SIZE,
  MAX_TEXT_SIZE,
  MIN_TEXT_SIZE,
  isTextCue,
  normalizeTextColor,
  normalizeTextSize,
  textCellBackground,
  textSnippet,
} from "../../components/utils/cueText"

describe("isTextCue", () => {
  test("is true for a cue with text", () => {
    expect(isTextCue({ text: "Hello" })).toBe(true)
  })

  test.each([[{}], [{ text: "" }], [{ text: undefined }], [null], [undefined]])(
    "is false for %p",
    (cue) => {
      expect(isTextCue(cue as never)).toBe(false)
    }
  )

  test("is false when the text is not a string", () => {
    expect(isTextCue({ text: 12 })).toBe(false)
  })
})

describe("normalizeTextSize", () => {
  test("keeps a size in range", () => {
    expect(normalizeTextSize(12)).toBe(12)
    expect(normalizeTextSize("20")).toBe(20)
  })

  test("clamps to the allowed range", () => {
    expect(normalizeTextSize(0)).toBe(MIN_TEXT_SIZE)
    expect(normalizeTextSize(-5)).toBe(MIN_TEXT_SIZE)
    expect(normalizeTextSize(500)).toBe(MAX_TEXT_SIZE)
  })

  test.each([[undefined], [null], [""], ["big"], [NaN]])(
    "falls back to the default for %p",
    (size) => {
      expect(normalizeTextSize(size)).toBe(DEFAULT_TEXT_SIZE)
    }
  )
})

describe("normalizeTextColor", () => {
  test("keeps a valid hex color", () => {
    expect(normalizeTextColor("#ffcc00")).toBe("#ffcc00")
    expect(normalizeTextColor("#FA0")).toBe("#FA0")
  })

  test.each([[undefined], [""], ["yellow"], ["#12"], [42]])(
    "falls back to the default for %p",
    (color) => {
      expect(normalizeTextColor(color)).toBe(DEFAULT_TEXT_COLOR)
    }
  )
})

describe("textSnippet", () => {
  test("keeps a short text as it is", () => {
    expect(textSnippet("Night falls")).toBe("Night falls")
  })

  test("only keeps the first line", () => {
    expect(textSnippet("first\nsecond")).toBe("first")
  })

  test("cuts a long text and marks the cut", () => {
    const snippet = textSnippet("a".repeat(50), 10)

    expect(snippet).toHaveLength(10)
    expect(snippet.endsWith("…")).toBe(true)
  })

  test("is empty when there is no text", () => {
    expect(textSnippet(undefined)).toBe("")
    expect(textSnippet("   ")).toBe("")
  })
})

describe("textCellBackground", () => {
  test("is dark behind a light text", () => {
    expect(textCellBackground("#ffffff")).toBe("#2a2540")
  })

  test("is light behind a dark text", () => {
    expect(textCellBackground("#000000")).toBe("#ece8f7")
  })

  test("understands the short hex form", () => {
    expect(textCellBackground("#fff")).toBe("#2a2540")
    expect(textCellBackground("#000")).toBe("#ece8f7")
  })

  test("uses the default color when the color is invalid", () => {
    expect(textCellBackground("nope")).toBe(
      textCellBackground(DEFAULT_TEXT_COLOR)
    )
  })
})
