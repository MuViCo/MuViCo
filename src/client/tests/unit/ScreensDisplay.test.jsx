/*
 * Screens display unit tests.
 * Verifies per-screen open/close controls, empty-state rendering,
 * and cue preview rendering for active screens.
 */
import React from "react"
import { render, screen, fireEvent } from "@testing-library/react"
import "@testing-library/jest-dom"
import { ScreensDisplay } from "../../components/presentation/ScreensDisplay"

describe("ScreensDisplay", () => {
  test("renders one open button per screen", () => {
    render(
      <ScreensDisplay
        screenCount={2}
        cues={[]}
        cueIndex={0}
        indexCount={10}
        screens={{ 1: false, 2: false }}
      />
    )

    expect(screen.getAllByRole("button", { name: "Open" })).toHaveLength(2)
  })

  test("opens a specific screen from preview controls", () => {
    const toggleScreenVisibility = jest.fn()

    render(
      <ScreensDisplay
        screenCount={2}
        cues={[]}
        cueIndex={0}
        indexCount={10}
        screens={{ 1: false, 2: false }}
        toggleScreenVisibility={toggleScreenVisibility}
      />
    )

    const openButtons = screen.getAllByRole("button", { name: "Open" })
    fireEvent.click(openButtons[0])
    fireEvent.click(openButtons[1])

    expect(toggleScreenVisibility).toHaveBeenNthCalledWith(1, 1)
    expect(toggleScreenVisibility).toHaveBeenNthCalledWith(2, 2)
  })

  test("shows Close button for currently open screens", () => {
    render(
      <ScreensDisplay
        screenCount={2}
        cues={[]}
        cueIndex={0}
        indexCount={10}
        screens={{ 1: true, 2: false }}
      />
    )

    expect(screen.getByRole("button", { name: "Close" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Open" })).toBeInTheDocument()
  })

  test("shows no content text when screen has no cue", () => {
    render(
      <ScreensDisplay
        screenCount={1}
        cues={[]}
        cueIndex={0}
        indexCount={10}
        screens={{ 1: false }}
      />
    )

    expect(screen.getByText("No content")).toBeInTheDocument()
  })

  test("renders image cue for active screen", () => {
    const cues = [
      {
        _id: "cue-1",
        name: "Image cue",
        index: 0,
        screen: 1,
        file: { url: "https://example.com/image.jpg", type: "image/jpeg" },
      },
    ]

    render(
      <ScreensDisplay
        screenCount={1}
        cues={cues}
        cueIndex={0}
        indexCount={10}
        screens={{ 1: false }}
      />
    )

    expect(screen.getByRole("img", { name: "Image cue" })).toBeInTheDocument()
  })
})
