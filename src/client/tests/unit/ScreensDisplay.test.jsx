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

  test("renders video cue for active screen", () => {
    const cues = [
      {
        _id: "cue-video",
        name: "Video cue",
        index: 0,
        screen: 1,
        file: { url: "https://example.com/video.mp4", type: "video/mp4" },
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

    expect(
      document.querySelector('video[src="https://example.com/video.mp4"]')
    ).toBeInTheDocument()
  })

  test("shows unsupported content type message for unrecognized files", () => {
    const cues = [
      {
        _id: "cue-doc",
        name: "Doc cue",
        index: 0,
        screen: 1,
        file: {
          url: "https://example.com/document.pdf",
          type: "application/pdf",
        },
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

    expect(screen.getByText("Unsupported content type")).toBeInTheDocument()
  })

  test("renders a plain color background for a color-only cue", () => {
    const cues = [
      {
        _id: "cue-color",
        name: "Color cue",
        index: 0,
        screen: 1,
        color: "#ff00ff",
        file: null,
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

    const colorDivs = Array.from(document.querySelectorAll("div")).filter(
      (div) => div.style.backgroundColor === "rgb(255, 0, 255)"
    )
    expect(colorDivs.length).toBeGreaterThan(0)
  })

  test("stacks multiple cues on the same screen and frame ordered by layer", () => {
    const cues = [
      {
        _id: "cue-layer-0",
        name: "Base layer",
        index: 0,
        screen: 1,
        layer: 0,
        color: "#000000",
        file: null,
      },
      {
        _id: "cue-layer-2",
        name: "Top layer",
        index: 0,
        screen: 1,
        layer: 2,
        file: { url: "https://example.com/top.png", type: "image/png" },
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

    expect(screen.getByRole("img", { name: "Top layer" })).toBeInTheDocument()
    const colorDivs = Array.from(document.querySelectorAll("div")).filter(
      (div) => div.style.backgroundColor === "rgb(0, 0, 0)"
    )
    expect(colorDivs.length).toBeGreaterThan(0)
  })
})
