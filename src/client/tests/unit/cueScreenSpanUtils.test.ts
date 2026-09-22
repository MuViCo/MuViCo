import {
  occupiedScreens,
  occupiesScreen,
  spansOntoScreen,
} from "../../components/utils/cueScreenSpanUtils"

describe("cueScreenSpanUtils", () => {
  test("a cue without a span occupies only its own screen", () => {
    expect(occupiedScreens({ screen: 2 })).toEqual([2])
    expect(occupiedScreens({ screen: 2, spanScreens: undefined })).toEqual([2])
    expect(occupiedScreens({ screen: 2, spanScreens: null })).toEqual([2])
  })

  test("a single-screen spanScreens is not a span", () => {
    expect(occupiedScreens({ screen: 2, spanScreens: [2] })).toEqual([2])
  })

  test("a real span occupies every screen it lists", () => {
    expect(occupiedScreens({ screen: 1, spanScreens: [1, 2, 3] })).toEqual([
      1, 2, 3,
    ])
  })

  test("screen numbers arriving as strings still compare", () => {
    expect(occupiesScreen({ screen: "2" }, 2)).toBe(true)
  })

  test("spansOntoScreen excludes the screen the cue lives on", () => {
    const cue = { screen: 1, spanScreens: [1, 2] }
    expect(spansOntoScreen(cue, 1)).toBe(false)
    expect(spansOntoScreen(cue, 2)).toBe(true)
    expect(spansOntoScreen(cue, 3)).toBe(false)
  })
})
