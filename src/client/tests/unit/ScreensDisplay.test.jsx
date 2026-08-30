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

  test("falls back to the default background color when a color-only cue has no color", () => {
    const cues = [
      {
        _id: "cue-no-color",
        name: "No color cue",
        index: 0,
        screen: 1,
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
      (div) => div.style.backgroundColor === "rgb(51, 51, 51)"
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
        color: "#000000",
        file: null,
      },
      {
        _id: "cue-layer-1",
        name: "Middle layer",
        index: 0,
        screen: 1,
        layer: 1,
        color: "#444444",
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

  test("crops a spanning cue's image differently on each screen it covers", () => {
    const cues = [
      {
        _id: "cue-span",
        name: "Wide banner",
        index: 0,
        screen: 1,
        spanScreens: [1, 2],
        file: { url: "https://example.com/wide.png", type: "image/png" },
      },
    ]

    render(
      <ScreensDisplay
        screenCount={2}
        cues={cues}
        cueIndex={0}
        indexCount={10}
        screens={{ 1: false, 2: false }}
      />
    )

    // Before the image's natural size is known, each tile falls back to the
    // plain full-bleed image -- fire load on both hidden probes.
    const probes = document.querySelectorAll(
      'img[src="https://example.com/wide.png"][alt=""]'
    )
    expect(probes).toHaveLength(2)
    probes.forEach((probe) => {
      Object.defineProperty(probe, "naturalWidth", {
        value: 1600,
        configurable: true,
      })
      Object.defineProperty(probe, "naturalHeight", {
        value: 900,
        configurable: true,
      })
      fireEvent.load(probe)
    })

    const croppedTiles = screen.getAllByRole("img", { name: "Wide banner" })
    expect(croppedTiles).toHaveLength(2)
    const positions = croppedTiles.map(
      (tile) =>
        tile.getAttribute("style").match(/background-position: ([^;]+)/)[1]
    )
    // Screen 1 is the first (leftmost) slice, screen 2 the last -- their
    // crops must differ, not show the same full image twice.
    expect(positions[0]).toBe("0% 50%")
    expect(positions[1]).toBe("100% 50%")
  })
})
