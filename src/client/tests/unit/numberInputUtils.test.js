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
    expect(state).toBe(42) // Accepts numbers

    handleNumericInputChange(setState)("abc")
    expect(state).toBe("") // Rejects non-numeric input

    handleNumericInputChange(setState)("10a")
    expect(state).toBe(10) // Accepts valid numeric input, rejects non-numeric part

    handleNumericInputChange(setState)("")
    expect(state).toBe("") // Allows empty input
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
    expect(state).toBe(50) // Input is within range, stays the same

    validate({ target: { value: "101" } })
    expect(state).toBe(100) // Input is over maximum limit, is set to valid max value (100)

    validate({ target: { value: "0" } })
    expect(state).toBe(1) // Input is under maximum limit, is set to valid min value (1)

    validate({ target: { value: "abc" } })
    expect(state).toBe(1) // Input is invalid, is set to default value (1)
  })
})

describe("getNextAvailableIndex", () => {
  test("should return 1 if screen is invalid", () => {
    expect(getNextAvailableIndex(0, [])).toBe(1) // Screen < 1, returns default index
    expect(getNextAvailableIndex(5, [])).toBe(1) // Screen > 4, returns default index
    expect(getNextAvailableIndex(NaN, [])).toBe(1) // NaN, returns default index
  })

  test("should find the first available index", () => {
    const cues = [
      { screen: 1, index: 0 },
      { screen: 1, index: 1 },
      { screen: 1, index: 2 },
      { screen: 2, index: 0 },
    ]

    expect(getNextAvailableIndex(1, cues)).toBe(3) // Correctly returns next available index 3 for screen 1
    expect(getNextAvailableIndex(2, cues)).toBe(1) // Correctly returns next available index 1 for screen 2
  })

  test("should handle gaps in index numbers", () => {
    const cues = [
      { screen: 1, index: 0 },
      { screen: 1, index: 2 },
      { screen: 1, index: 3 },
    ]

    expect(getNextAvailableIndex(1, cues)).toBe(1) // Correctly returns next available index 1
  })
})
