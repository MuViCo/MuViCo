import { render, screen } from "@testing-library/react"
import "@testing-library/jest-dom"

import CueText from "../../components/utils/CueText"
import {
  DEFAULT_TEXT_EFFECT,
  DEFAULT_TEXT_EFFECT_SPEED,
  TEXT_EFFECT_BASE_SECONDS,
  normalizeTextEffectSpeed,
  textEffectDurationSeconds,
  TEXT_EFFECTS,
  isValidTextEffect,
  normalizeTextEffect,
} from "../../components/utils/cueText"

describe("text effects", () => {
  test("offers none, the crawl and the two flat scrolls", () => {
    expect(TEXT_EFFECTS.map((effect) => effect.value)).toEqual([
      "none",
      "crawl",
      "scroll-up",
      "scroll-down",
    ])
  })

  test("accepts only the known effects", () => {
    expect(isValidTextEffect("crawl")).toBe(true)
    expect(isValidTextEffect("scroll-up")).toBe(true)
    expect(isValidTextEffect("scroll-down")).toBe(true)
    expect(isValidTextEffect("none")).toBe(true)
    expect(isValidTextEffect("tilt")).toBe(false)
    expect(isValidTextEffect(undefined)).toBe(false)
    expect(isValidTextEffect(1)).toBe(false)
  })

  test("falls back to none on anything unusable", () => {
    expect(normalizeTextEffect(undefined)).toBe(DEFAULT_TEXT_EFFECT)
    expect(normalizeTextEffect(null)).toBe("none")
    expect(normalizeTextEffect("")).toBe("none")
    expect(normalizeTextEffect("spin")).toBe("none")
  })

  test("keeps a valid effect untouched", () => {
    expect(normalizeTextEffect("scroll-up")).toBe("scroll-up")
    expect(normalizeTextEffect("scroll-down")).toBe("scroll-down")
  })
})

describe("CueText animation", () => {
  test("stays still without an effect", () => {
    render(<CueText text="Hello" />)

    const node = screen.getByTestId("cue-text")
    expect(node).toHaveAttribute("data-effect", "none")
    expect(node).not.toHaveAttribute("data-animated")
    expect(window.getComputedStyle(screen.getByText("Hello")).animation).toBe(
      ""
    )
  })

  test("tilts the text in perspective for the Star Wars crawl", () => {
    render(<CueText text="A long time ago" effect="crawl" />)

    const node = screen.getByTestId("cue-text")
    expect(node).toHaveAttribute("data-effect", "crawl")
    expect(node).toHaveAttribute("data-animated", "true")
    expect(
      window.getComputedStyle(screen.getByText("A long time ago")).animation
    ).not.toBe("")
  })

  test.each(["scroll-up", "scroll-down"])("animates %s", (effect) => {
    render(<CueText text="Hello" effect={effect} />)

    expect(screen.getByTestId("cue-text")).toHaveAttribute(
      "data-animated",
      "true"
    )
    expect(
      window.getComputedStyle(screen.getByText("Hello")).animation
    ).not.toBe("")
  })

  test("ignores an unknown effect rather than animating with it", () => {
    render(<CueText text="Hello" effect="spin" />)

    const node = screen.getByTestId("cue-text")
    expect(node).toHaveAttribute("data-effect", "none")
    expect(node).not.toHaveAttribute("data-animated")
  })
})

describe("animation speed", () => {
  test("defaults to 1x and clamps out-of-range values", () => {
    expect(normalizeTextEffectSpeed(undefined)).toBe(DEFAULT_TEXT_EFFECT_SPEED)
    expect(normalizeTextEffectSpeed("")).toBe(1)
    expect(normalizeTextEffectSpeed("fast")).toBe(1)
    expect(normalizeTextEffectSpeed(0)).toBe(0.25)
    expect(normalizeTextEffectSpeed(99)).toBe(4)
  })

  test("a higher speed means a shorter cycle", () => {
    expect(textEffectDurationSeconds(1)).toBe(TEXT_EFFECT_BASE_SECONDS)
    expect(textEffectDurationSeconds(2)).toBe(TEXT_EFFECT_BASE_SECONDS / 2)
    expect(textEffectDurationSeconds(0.5)).toBe(TEXT_EFFECT_BASE_SECONDS * 2)
  })

  test("applies the duration on the animated text only", () => {
    const { unmount } = render(
      <CueText text="Hello" effect="scroll-up" effectSpeed={2} />
    )
    expect(
      window.getComputedStyle(screen.getByText("Hello")).animation
    ).toContain("11s")
    unmount()

    render(<CueText text="Hello" effectSpeed={2} />)
    expect(window.getComputedStyle(screen.getByText("Hello")).animation).toBe(
      ""
    )
  })
})

describe("animation looping", () => {
  const animationOf = (label: string) =>
    window.getComputedStyle(screen.getByText(label)).animation

  test("plays once and stays hidden by default", () => {
    render(<CueText text="Hello" effect="crawl" />)

    expect(animationOf("Hello")).toContain("forwards")
    expect(animationOf("Hello")).not.toContain("infinite")
  })

  test("repeats when looping is asked for", () => {
    render(<CueText text="Hello" effect="crawl" effectLoop />)

    expect(animationOf("Hello")).toContain("infinite")
    expect(animationOf("Hello")).not.toContain("forwards")
  })
})

describe("animation travel", () => {
  const sheetText = () =>
    [...document.querySelectorAll("style")]
      .map((tag) =>
        tag.sheet
          ? [...tag.sheet.cssRules].map((rule) => rule.cssText).join("")
          : (tag.textContent ?? "")
      )
      .join("")

  test("a flat scroll travels exactly one screen plus its own height", () => {
    render(<CueText text="Hello" effect="scroll-up" />)

    const css = sheetText()
    expect(css).toContain("top: 100%")
    expect(css).toContain("top: 0%")
    expect(css).toContain("translateY(-100%)")
  })

  test("the crawl overshoots to clear the foreshortening of its tilt", () => {
    render(<CueText text="Hello" effect="crawl" />)

    const css = sheetText()
    expect(css).toContain("rotateX(56deg)")
    expect(css).toContain("translateY(-220%)")
  })
})
