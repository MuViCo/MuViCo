/*
 * Presentation playback controls unit tests.
 * Covers frame label rendering, previous/next navigation, screen toggle controls,
 * autoplay start/stop behavior, and autoplay interval input handling.
 */
import React from "react"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import "@testing-library/jest-dom"
import PresentationPlaybackControls from "../../components/presentation/PresentationPlaybackControls"

const renderControls = (overrideProps = {}) => {
  const props = {
    screens: { 1: false, 2: false },
    toggleAllScreens: jest.fn(),
    cueIndex: 0,
    updateCue: jest.fn(),
    indexCount: 10,
    autoplayInterval: 5,
    toggleAutoplay: jest.fn(),
    isAutoplaying: false,
    toggleAutoplayInterval: jest.fn(),
    ...overrideProps,
  }

  const view = render(<PresentationPlaybackControls {...props} />)
  return { ...view, props }
}

describe("PresentationPlaybackControls", () => {
  let playSpy
  let pauseSpy

  beforeEach(() => {
    playSpy = jest
      .spyOn(window.HTMLMediaElement.prototype, "play")
      .mockImplementation(() => Promise.resolve())
    pauseSpy = jest
      .spyOn(window.HTMLMediaElement.prototype, "pause")
      .mockImplementation(() => {})
  })

  afterEach(() => {
    playSpy.mockRestore()
    pauseSpy.mockRestore()
  })

  test("shows Frame 0 at cueIndex 0", () => {
    renderControls({ cueIndex: 0 })

    expect(screen.getByRole("heading", { name: "Frame 0" })).toBeInTheDocument()
  })

  test("shows Frame N when cueIndex is greater than 0", () => {
    renderControls({ cueIndex: 4 })

    expect(screen.getByRole("heading", { name: "Frame 4" })).toBeInTheDocument()
  })

  test("calls updateCue for previous and next buttons", () => {
    const updateCue = jest.fn()
    renderControls({ cueIndex: 1, updateCue, indexCount: 5 })

    fireEvent.click(screen.getByRole("button", { name: "Previous Cue" }))
    fireEvent.click(screen.getByRole("button", { name: "Next Cue" }))

    expect(updateCue).toHaveBeenNthCalledWith(1, "Previous")
    expect(updateCue).toHaveBeenNthCalledWith(2, "Next")
  })

  test("disables previous button at first frame", () => {
    renderControls({ cueIndex: 0 })

    expect(screen.getByRole("button", { name: "Previous Cue" })).toBeDisabled()
  })

  test("disables next button at last frame", () => {
    renderControls({ cueIndex: 9, indexCount: 10 })

    expect(screen.getByRole("button", { name: "Next Cue" })).toBeDisabled()
  })

  test("renders Open all screens when all screens are closed", () => {
    renderControls({ screens: { 1: false, 2: false } })

    expect(
      screen.getByRole("button", { name: "Open all screens" })
    ).toBeInTheDocument()
  })

  test("renders Close all screens when at least one screen is open", () => {
    renderControls({ screens: { 1: true, 2: false } })

    expect(
      screen.getByRole("button", { name: "Close all screens" })
    ).toBeInTheDocument()
  })

  test("calls toggleAllScreens when the all screens button is clicked", () => {
    const toggleAllScreens = jest.fn()
    renderControls({ toggleAllScreens })

    fireEvent.click(screen.getByRole("button", { name: "Open all screens" }))

    expect(toggleAllScreens).toHaveBeenCalledTimes(1)
  })

  test("calls toggleAutoplay from autoplay button", () => {
    const toggleAutoplay = jest.fn()
    renderControls({ toggleAutoplay, isAutoplaying: false })

    fireEvent.click(screen.getByRole("button", { name: "Start Autoplay" }))

    expect(toggleAutoplay).toHaveBeenCalledTimes(1)
  })

  test("shows Stop Autoplay when autoplay is active", () => {
    renderControls({ isAutoplaying: true })

    expect(
      screen.getByRole("button", { name: "Stop Autoplay" })
    ).toBeInTheDocument()
  })

  test("calls toggleAutoplayInterval on interval input changes", () => {
    // Input emits string values; handler is responsible for normalization.
    const toggleAutoplayInterval = jest.fn()
    renderControls({ toggleAutoplayInterval, autoplayInterval: 5 })

    fireEvent.change(screen.getByRole("spinbutton"), {
      target: { value: "0.5" },
    })

    expect(toggleAutoplayInterval).toHaveBeenCalled()
  })

  test("audio element loops when audioLoop is true", () => {
    const { container } = renderControls({
      audioSourceURL: "https://example.com/cue.mp3",
      audioLoop: true,
    })

    expect(container.querySelector("audio")).toHaveAttribute("loop")
  })

  test("audio element does not loop when audioLoop is false", () => {
    const { container } = renderControls({
      audioSourceURL: "https://example.com/cue.mp3",
      audioLoop: false,
    })

    expect(container.querySelector("audio")).not.toHaveAttribute("loop")
  })

  test("does not start audio when an audio cue appears while autoplay is stopped", async () => {
    renderControls({
      audioSourceURL: "https://example.com/cue.mp3",
      isAutoplaying: false,
    })

    await waitFor(() => {
      expect(pauseSpy).toHaveBeenCalled()
    })
    expect(playSpy).not.toHaveBeenCalled()
  })

  test("starts and stops audio with autoplay state", async () => {
    const { rerender, props } = renderControls({
      audioSourceURL: "https://example.com/cue.mp3",
      isAutoplaying: false,
    })

    expect(playSpy).not.toHaveBeenCalled()

    rerender(
      <PresentationPlaybackControls
        {...props}
        audioSourceURL="https://example.com/cue.mp3"
        isAutoplaying={true}
      />
    )

    await waitFor(() => {
      expect(playSpy).toHaveBeenCalled()
    })

    rerender(
      <PresentationPlaybackControls
        {...props}
        audioSourceURL="https://example.com/cue.mp3"
        isAutoplaying={false}
      />
    )

    await waitFor(() => {
      expect(pauseSpy).toHaveBeenCalledTimes(2)
    })
  })

  test("plays every active audio track when autoplay starts", async () => {
    const { container } = renderControls({
      isAutoplaying: true,
      audioTracks: [
        {
          id: "track-a1",
          src: "https://example.com/music.mp3",
          loop: true,
        },
        {
          id: "track-a2",
          src: "https://example.com/sfx.mp3",
          loop: false,
        },
      ],
    })

    const audioElements = container.querySelectorAll("audio")
    expect(audioElements).toHaveLength(2)
    expect(audioElements[0]).toHaveAttribute(
      "src",
      "https://example.com/music.mp3"
    )
    expect(audioElements[0]).toHaveAttribute("loop")
    expect(audioElements[1]).toHaveAttribute(
      "src",
      "https://example.com/sfx.mp3"
    )
    expect(audioElements[1]).not.toHaveAttribute("loop")

    await waitFor(() => {
      expect(playSpy).toHaveBeenCalledTimes(2)
    })
  })

  test("keeps a continuous audio track playing after autoplay reaches the end", async () => {
    const { rerender, props } = renderControls({
      isAutoplaying: true,
      audioTracks: [
        {
          id: "track-a1",
          src: "https://example.com/music.mp3",
          loop: true,
          continuePlayback: true,
        },
      ],
    })

    await waitFor(() => {
      expect(playSpy).toHaveBeenCalledTimes(1)
    })
    expect(pauseSpy).not.toHaveBeenCalled()

    rerender(
      <PresentationPlaybackControls
        {...props}
        isAutoplaying={false}
        allowContinuousAudio={true}
        audioTracks={[
          {
            id: "track-a1",
            src: "https://example.com/music.mp3",
            loop: true,
            continuePlayback: true,
          },
        ]}
      />
    )

    expect(pauseSpy).not.toHaveBeenCalled()
  })

  test("keeps a looped audio track playing after autoplay reaches the end", async () => {
    const { rerender, props } = renderControls({
      isAutoplaying: true,
      audioTracks: [
        {
          id: "track-a1",
          src: "https://example.com/music.mp3",
          loop: true,
          continuePlayback: false,
        },
      ],
    })

    await waitFor(() => {
      expect(playSpy).toHaveBeenCalledTimes(1)
    })

    rerender(
      <PresentationPlaybackControls
        {...props}
        isAutoplaying={false}
        allowContinuousAudio={true}
        audioTracks={[
          {
            id: "track-a1",
            src: "https://example.com/music.mp3",
            loop: true,
            continuePlayback: false,
          },
        ]}
      />
    )

    expect(pauseSpy).not.toHaveBeenCalled()
  })

  test("stops a continuous audio track on manual autoplay stop", async () => {
    const { rerender, props } = renderControls({
      isAutoplaying: true,
      audioTracks: [
        {
          id: "track-a1",
          src: "https://example.com/music.mp3",
          loop: true,
          continuePlayback: true,
        },
      ],
    })

    await waitFor(() => {
      expect(playSpy).toHaveBeenCalledTimes(1)
    })

    rerender(
      <PresentationPlaybackControls
        {...props}
        isAutoplaying={false}
        allowContinuousAudio={false}
        audioTracks={[
          {
            id: "track-a1",
            src: "https://example.com/music.mp3",
            loop: true,
            continuePlayback: true,
          },
        ]}
      />
    )

    await waitFor(() => {
      expect(pauseSpy).toHaveBeenCalledTimes(1)
    })
  })

  test("falls back to a src-based key when an audio track has no id", () => {
    const { container } = renderControls({
      isAutoplaying: true,
      audioTracks: [{ src: "https://example.com/no-id.mp3", loop: false }],
    })

    expect(
      container.querySelector('audio[src="https://example.com/no-id.mp3"]')
    ).toBeInTheDocument()
  })

  test("does not attempt to control an audio track that has no source", () => {
    const { container } = renderControls({
      isAutoplaying: true,
      audioTracks: [{ id: "track-empty", src: "", loop: false }],
    })

    expect(container.querySelector("audio")).not.toBeInTheDocument()
    expect(playSpy).not.toHaveBeenCalled()
  })

  test("does not throw when play() does not return a promise", async () => {
    playSpy.mockImplementation(() => undefined)

    renderControls({
      isAutoplaying: true,
      audioTracks: [
        { id: "track-a1", src: "https://example.com/music.mp3", loop: true },
      ],
    })

    await waitFor(() => {
      expect(playSpy).toHaveBeenCalled()
    })
  })
})
