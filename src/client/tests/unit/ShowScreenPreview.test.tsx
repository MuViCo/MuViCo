import React from "react"
import { fireEvent, render, screen } from "@testing-library/react"
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

  test("renders the correct crop for an image spanning multiple screens", () => {
    render(
      <ShowScreenPreview
        screenNumber={2}
        cues={[
          makeCue({
            name: "panorama.png",
            screen: 1,
            spanScreens: [2, 1],
            file: {
              url: "https://example.com/panorama.png",
              type: "image/png",
            },
          }),
        ]}
      />
    )

    const probe = document.querySelector<HTMLImageElement>('img[alt=""]')!
    Object.defineProperty(probe, "naturalWidth", { value: 3200 })
    Object.defineProperty(probe, "naturalHeight", { value: 900 })
    fireEvent.load(probe)

    const crop = screen.getByRole("img", { name: "panorama.png" })
    expect(crop).toHaveStyle({
      backgroundPosition: "100% 50%",
      backgroundSize: "200% 100%",
    })
  })

  test("renders video and unsupported media fallbacks", () => {
    const { rerender } = render(
      <ShowScreenPreview
        screenNumber={1}
        cues={[
          makeCue({
            name: "intro.mp4",
            file: { url: "https://example.com/intro.mp4", type: "video/mp4" },
          }),
        ]}
      />
    )

    const video = document.querySelector("video")
    expect(video).toHaveAttribute("src", "https://example.com/intro.mp4")
    expect(video).toHaveAttribute("autoplay")
    expect(video).toHaveAttribute("loop")
    expect(video).toHaveProperty("muted", true)

    rerender(
      <ShowScreenPreview
        screenNumber={1}
        cues={[
          makeCue({
            name: "unsupported",
            color: "#123456",
            file: {
              url: "https://example.com/file.bin",
              type: "application/octet-stream",
            },
          }),
        ]}
      />
    )

    expect(document.querySelector("video")).not.toBeInTheDocument()
    expect(
      document.querySelector(".show-screen-preview-canvas > div > div")
    ).toHaveStyle({
      background: "#123456",
    })
  })

  test("shows empty, compact, and offline states", () => {
    const onOpen = jest.fn()
    const { rerender } = render(
      <ShowScreenPreview screenNumber={3} cues={[]} compact label="Preview" />
    )

    expect(screen.getByText("Preview")).toBeInTheDocument()
    expect(screen.getByText("No content")).toBeInTheDocument()
    expect(screen.getByTestId("show-screen-3")).toHaveClass(
      "show-screen-preview-compact"
    )

    rerender(
      <ShowScreenPreview
        screenNumber={3}
        cues={[]}
        isOnline={false}
        onOpen={onOpen}
      />
    )

    expect(screen.getByText("window closed")).toBeInTheDocument()
    fireEvent.click(screen.getByRole("button", { name: "Open display 3" }))
    expect(onOpen).toHaveBeenCalledTimes(1)
  })
})
