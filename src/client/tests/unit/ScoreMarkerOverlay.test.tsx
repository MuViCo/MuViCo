import React from "react"
import { render, screen, fireEvent } from "@testing-library/react"
import "@testing-library/jest-dom"
import ScoreMarkerOverlay from "../../components/presentation/ScoreMarkerOverlay"

describe("ScoreMarkerOverlay", () => {
  const stubRect = (element: HTMLElement, rect: Partial<DOMRect>) => {
    jest.spyOn(element, "getBoundingClientRect").mockReturnValue({
      x: 0,
      y: 0,
      width: 200,
      height: 100,
      top: 0,
      left: 0,
      right: 200,
      bottom: 100,
      toJSON: () => {},
      ...rect,
    })
  }

  test("does not capture clicks when not in placing mode", () => {
    const onPlace = jest.fn()
    render(
      <ScoreMarkerOverlay
        markers={[]}
        isPlacing={false}
        onPlace={onPlace}
        onSelectMarker={jest.fn()}
      />
    )

    const overlay = screen.getByTestId("score-marker-overlay")
    stubRect(overlay, {})
    fireEvent.click(overlay, { clientX: 100, clientY: 50 })

    expect(onPlace).not.toHaveBeenCalled()
  })

  test("converts a click into normalized 0-1 coordinates while placing", () => {
    const onPlace = jest.fn()
    render(
      <ScoreMarkerOverlay
        markers={[]}
        isPlacing={true}
        onPlace={onPlace}
        onSelectMarker={jest.fn()}
      />
    )

    const overlay = screen.getByTestId("score-marker-overlay")
    stubRect(overlay, { width: 200, height: 100, left: 0, top: 0 })
    fireEvent.click(overlay, { clientX: 50, clientY: 25 })

    expect(onPlace).toHaveBeenCalledWith(0.25, 0.25)
  })

  test("renders a pin per marker with a rect, skipping markers without one", () => {
    render(
      <ScoreMarkerOverlay
        markers={[
          {
            _id: "m1",
            page: 1,
            frameIndex: 3,
            rect: { x: 0.5, y: 0.2, width: 0, height: 0 },
          },
          { _id: "m2", page: 1, frameIndex: 7 }, // no rect -> not rendered
        ]}
        isPlacing={false}
        onPlace={jest.fn()}
        onSelectMarker={jest.fn()}
      />
    )

    expect(screen.getByText("3")).toBeInTheDocument()
    expect(screen.queryByText("7")).not.toBeInTheDocument()
  })

  test("clicking a marker selects it for editing instead of placing a new one", () => {
    const onPlace = jest.fn()
    const onSelectMarker = jest.fn()
    const marker = {
      _id: "m1",
      page: 1,
      frameIndex: 3,
      rect: { x: 0.5, y: 0.2, width: 0, height: 0 },
    }
    render(
      <ScoreMarkerOverlay
        markers={[marker]}
        isPlacing={true}
        onPlace={onPlace}
        onSelectMarker={onSelectMarker}
      />
    )

    fireEvent.click(screen.getByText("3"))

    expect(onSelectMarker).toHaveBeenCalledWith(marker)
    expect(onPlace).not.toHaveBeenCalled()
  })
})
