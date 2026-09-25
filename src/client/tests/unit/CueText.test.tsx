import { render, screen } from "@testing-library/react"
import "@testing-library/jest-dom"
import CueText from "../../components/utils/CueText"

describe("CueText", () => {
  test("shows the text", () => {
    render(<CueText text="La nuit est tombée" />)

    expect(screen.getByText("La nuit est tombée")).toBeInTheDocument()
  })

  test("keeps line breaks", () => {
    render(<CueText text={"line 1\nline 2"} />)

    expect(screen.getByText(/line 1/)).toHaveStyle({ whiteSpace: "pre-wrap" })
  })

  test("uses the given color", () => {
    render(<CueText text="Hello" color="#ffcc00" />)

    expect(screen.getByText("Hello")).toHaveStyle({ color: "#ffcc00" })
  })

  test("is white when no color is given", () => {
    render(<CueText text="Hello" />)

    expect(screen.getByText("Hello")).toHaveStyle({ color: "#ffffff" })
  })

  test("sizes the text relative to the screen it is in", () => {
    render(<CueText text="Hello" size={12} />)

    expect(
      screen.getByText("Hello").style.getPropertyValue("--cue-text-size")
    ).toBe("12")
    expect(screen.getByTestId("cue-text").style.containerType).toBe("size")
  })

  test("falls back to the default size when the size is not usable", () => {
    render(<CueText text="Hello" size={Number.NaN} />)

    expect(
      screen.getByText("Hello").style.getPropertyValue("--cue-text-size")
    ).toBe("8")
  })

  test("does not catch the mouse", () => {
    render(<CueText text="Hello" />)

    expect(screen.getByTestId("cue-text")).toHaveStyle({
      pointerEvents: "none",
    })
  })

  test("has no padding, so the size stays a percentage of the whole screen", () => {
    render(<CueText text="Hello" />)

    expect(screen.getByTestId("cue-text").style.padding).toBe("")
  })
})
