/*
 * Preview strip focus tests.
 * Covers the highlight, the scroll-to and the cases where the strip must stay
 * exactly where the user left it.
 */
import "@testing-library/jest-dom"
import { render, screen } from "@testing-library/react"

import { ScreensDisplay } from "../../components/presentation/ScreensDisplay"

const renderStrip = (focusedScreen: number | null) =>
  render(
    <ScreensDisplay
      screenCount={3}
      cues={[]}
      cueIndex={0}
      indexCount={5}
      editModeBackground="#000"
      screens={{}}
      focusedScreen={focusedScreen}
    />
  )

describe("ScreensDisplay focus highlight", () => {
  beforeEach(() => {
    Element.prototype.scrollTo = jest.fn()
  })

  test("marks only the focused tile", () => {
    renderStrip(2)

    expect(screen.getByTestId("screen-tile-2")).toHaveAttribute(
      "aria-current",
      "true"
    )
    expect(screen.getByTestId("screen-tile-1")).not.toHaveAttribute(
      "aria-current"
    )
  })

  test("marks nothing when no lane is focused", () => {
    // Also the audio case: an audio lane resolves to no screen.
    renderStrip(null)

    for (const n of [1, 2, 3]) {
      expect(screen.getByTestId(`screen-tile-${n}`)).not.toHaveAttribute(
        "aria-current"
      )
    }
  })

  test("does not scroll when the tile is already visible", () => {
    // jsdom reports every offset as 0, so the tile reads as fully in view.
    renderStrip(3)

    expect(Element.prototype.scrollTo).not.toHaveBeenCalled()
  })

  test("does not scroll on mount with no focus", () => {
    renderStrip(null)

    expect(Element.prototype.scrollTo).not.toHaveBeenCalled()
  })

  test("scrolls once when the focused tile sits past the right edge", () => {
    const { rerender } = renderStrip(null)

    const strip = screen.getByTestId("screens-strip")
    Object.defineProperty(strip, "clientWidth", {
      value: 300,
      configurable: true,
    })
    const tile = screen.getByTestId("screen-tile-3")
    Object.defineProperty(tile, "offsetLeft", {
      value: 800,
      configurable: true,
    })
    Object.defineProperty(tile, "offsetWidth", {
      value: 240,
      configurable: true,
    })

    rerender(
      <ScreensDisplay
        screenCount={3}
        cues={[]}
        cueIndex={0}
        indexCount={5}
        editModeBackground="#000"
        screens={{}}
        focusedScreen={3}
      />
    )

    expect(Element.prototype.scrollTo).toHaveBeenCalledTimes(1)
    expect(Element.prototype.scrollTo).toHaveBeenCalledWith(
      expect.objectContaining({ behavior: "smooth" })
    )
  })

  test("does not re-scroll when an unrelated prop changes", () => {
    const props = {
      screenCount: 3,
      cues: [],
      cueIndex: 0,
      indexCount: 5,
      editModeBackground: "#000",
      screens: {},
      focusedScreen: 2,
    }
    const { rerender } = render(<ScreensDisplay {...props} />)
    const callsAfterMount = (Element.prototype.scrollTo as jest.Mock).mock.calls
      .length

    // A frame change must not move the strip out from under the user.
    rerender(<ScreensDisplay {...props} cueIndex={3} />)

    expect((Element.prototype.scrollTo as jest.Mock).mock.calls.length).toBe(
      callsAfterMount
    )
  })
})
