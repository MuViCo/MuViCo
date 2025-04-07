import {
  handleNumericInputChange,
  validateAndSetNumber,
  getNextAvailableIndex,
} from "../../components/utils/numberInputUtils.js"

describe("handleNumericInputChange", () => {
  test("should only accept numeric values", () => {
    let state = ""
    const setState = (newState) => {
      state = newState
    }

    handleNumericInputChange(setState)("42")
    expect(state).toBe(42)

    handleNumericInputChange(setState)("abc")
    expect(state).toBe("")

    handleNumericInputChange(setState)("10a")
    expect(state).toBe(10)

    handleNumericInputChange(setState)("")
    expect(state).toBe("")
  })
})

describe("validateAndSetNumber", () => {
  test("should ensure input is within bounds", () => {
    let state = 5
    const setState = (newState) => {
      state = newState
    }

    const validate = validateAndSetNumber(setState, 1, 100)

    validate({ target: { value: "50" } })
    expect(state).toBe(50)

    validate({ target: { value: "101" } })
    expect(state).toBe(100)

    validate({ target: { value: "0" } })
    expect(state).toBe(1)

    validate({ target: { value: "abc" } })
    expect(state).toBe(1)
  })
})

describe("getNextAvailableIndex", () => {
  test("should return 1 if screen is invalid", () => {
    expect(getNextAvailableIndex(0, [])).toBe(1)
    expect(getNextAvailableIndex(6, [])).toBe(1)
    expect(getNextAvailableIndex(NaN, [])).toBe(1)
  })

  test("should find the first available index", () => {
    const cues = [
      { screen: 1, index: 0 },
      { screen: 1, index: 1 },
      { screen: 1, index: 2 },
      { screen: 2, index: 0 },
    ]

    expect(getNextAvailableIndex(1, cues)).toBe(3)
    expect(getNextAvailableIndex(2, cues)).toBe(1)
  })

  test("should handle gaps in index numbers", () => {
    const cues = [
      { screen: 1, index: 0 },
      { screen: 1, index: 2 },
      { screen: 1, index: 3 },
    ]

    expect(getNextAvailableIndex(1, cues)).toBe(1)
  })
})
