import React from "react"
import { render, screen } from "@testing-library/react"
import "@testing-library/jest-dom"
import ShowScreenPreview from "../../components/presentation/ShowScreenPreview"
import type { Cue } from "../../types"

const makeCue = (overrides: Partial<Cue>): Cue => ({
  _id: "cue-1",
  cueType: "visual",
  index: 0,
  screen: 1,
  layer: 0,
  name: "Cue",
  color: "#000000",
  file: null,
  loop: false,
  continuePlayback: false,
  opacity: 1,
  ...overrides,
})

describe("ShowScreenPreview", () => {
  test("stacks every active layer, base layer on top", () => {
    const cues = [
      makeCue({
        _id: "cue-l2",
        layer: 1,
        name: "background.png",
        file: { url: "https://example.com/background.png", type: "image/png" },
      }),
      makeCue({
        _id: "cue-l1",
        layer: 0,
        name: "overlay.png",
        opacity: 0.5,
        file: { url: "https://example.com/overlay.png", type: "image/png" },
      }),
    ]

    render(<ShowScreenPreview screenNumber={1} cues={cues} />)

    expect(screen.getByText("L2")).toBeInTheDocument()
    expect(screen.getByText("L1")).toBeInTheDocument()
    expect(screen.getByText("background.png / overlay.png")).toBeInTheDocument()

    const images = screen.getAllByRole("img")
    expect(images).toHaveLength(2)

    const layerBoxes = Array.from(
      document.querySelectorAll<HTMLElement>(
        ".show-screen-preview-canvas > div"
      )
    )
    expect(layerBoxes).toHaveLength(2)
    expect(layerBoxes[0]).toHaveStyle({ zIndex: "99" })
    expect(layerBoxes[1]).toHaveStyle({ zIndex: "100", opacity: "0.5" })
  })

  test("renders media whose mime type is missing but whose url is an image", () => {
    const cues = [
      makeCue({
        _id: "cue-drive",
        name: "drive-image.png",
        file: { url: "https://example.com/drive-image.png" },
      }),
    ]

    render(<ShowScreenPreview screenNumber={1} cues={cues} />)

    expect(
      screen.getByRole("img", { name: "drive-image.png" })
    ).toBeInTheDocument()
  })
})
