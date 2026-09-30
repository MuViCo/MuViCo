import {
  DEFAULT_IMAGE_EFFECT,
  DEFAULT_IMAGE_EFFECT_SPEED,
  IMAGE_EFFECT_BASE_SECONDS,
  MAX_IMAGE_EFFECT_SPEED,
  MIN_IMAGE_EFFECT_SPEED,
  imageEffectDurationSeconds,
  isValidImageEffect,
  normalizeImageEffect,
  normalizeImageEffectSpeed,
} from "../../components/utils/cueImageEffect"

describe("isValidImageEffect", () => {
  test.each([["none"], ["fade"]])("is true for %p", (value) => {
    expect(isValidImageEffect(value)).toBe(true)
  })

  test.each([[undefined], [null], [""], ["crawl"], [42]])(
    "is false for %p",
    (value) => {
      expect(isValidImageEffect(value)).toBe(false)
    }
  )
})

describe("normalizeImageEffect", () => {
  test("keeps a valid effect", () => {
    expect(normalizeImageEffect("fade")).toBe("fade")
  })

  test.each([[undefined], [null], [""], ["crawl"]])(
    "falls back to the default for %p",
    (value) => {
      expect(normalizeImageEffect(value)).toBe(DEFAULT_IMAGE_EFFECT)
    }
  )
})

describe("normalizeImageEffectSpeed", () => {
  test("keeps a speed in range", () => {
    expect(normalizeImageEffectSpeed(2)).toBe(2)
    expect(normalizeImageEffectSpeed("1.5")).toBe(1.5)
  })

  test("clamps to the allowed range", () => {
    expect(normalizeImageEffectSpeed(0)).toBe(MIN_IMAGE_EFFECT_SPEED)
    expect(normalizeImageEffectSpeed(-3)).toBe(MIN_IMAGE_EFFECT_SPEED)
    expect(normalizeImageEffectSpeed(100)).toBe(MAX_IMAGE_EFFECT_SPEED)
  })

  test.each([[undefined], [null], [""], ["fast"], [NaN]])(
    "falls back to the default for %p",
    (value) => {
      expect(normalizeImageEffectSpeed(value)).toBe(DEFAULT_IMAGE_EFFECT_SPEED)
    }
  )
})

describe("imageEffectDurationSeconds", () => {
  test("is the base duration at the default speed", () => {
    expect(imageEffectDurationSeconds(1)).toBe(IMAGE_EFFECT_BASE_SECONDS)
  })

  test("is shorter at a higher speed", () => {
    expect(imageEffectDurationSeconds(2)).toBe(IMAGE_EFFECT_BASE_SECONDS / 2)
  })

  test("is longer at a lower speed", () => {
    expect(imageEffectDurationSeconds(0.25)).toBe(
      IMAGE_EFFECT_BASE_SECONDS / 0.25
    )
  })
})
