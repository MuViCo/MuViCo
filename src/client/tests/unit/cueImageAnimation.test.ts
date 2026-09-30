import { imageEffectAnimation } from "../../components/utils/cueImageAnimation"

describe("imageEffectAnimation", () => {
  test("is undefined when the effect is none", () => {
    expect(imageEffectAnimation({ imageEffect: "none" }, false)).toBeUndefined()
  })

  test("is undefined when there is no effect at all", () => {
    expect(imageEffectAnimation({}, false)).toBeUndefined()
    expect(imageEffectAnimation(null, false)).toBeUndefined()
  })

  test("is undefined when the viewer prefers reduced motion, even with fade set", () => {
    expect(imageEffectAnimation({ imageEffect: "fade" }, true)).toBeUndefined()
  })

  test("uses the default 4s duration at the default speed", () => {
    const animation = imageEffectAnimation({ imageEffect: "fade" }, false)

    expect(animation).toContain(" 4s ease-in-out forwards")
  })

  test("shortens the duration at a higher speed", () => {
    const animation = imageEffectAnimation(
      { imageEffect: "fade", imageEffectSpeed: 2 },
      false
    )

    expect(animation).toContain(" 2s ease-in-out forwards")
  })

  test("loops forever when imageEffectLoop is set", () => {
    const animation = imageEffectAnimation(
      { imageEffect: "fade", imageEffectLoop: true },
      false
    )

    expect(animation).toContain(" 4s ease-in-out infinite")
  })

  test("plays once and holds when imageEffectLoop is not set", () => {
    const animation = imageEffectAnimation(
      { imageEffect: "fade", imageEffectLoop: false },
      false
    )

    expect(animation).toContain(" 4s ease-in-out forwards")
  })
})
