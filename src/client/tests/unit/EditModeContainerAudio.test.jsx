/**
 * Regression test verifying that the audio cue's `loop` field actually reaches
 * the in-page audio player. EditModeContainer computes the current audio cue
 * (on the dedicated audio row) but previously only passed its source URL
 * down to PresentationPlaybackControls, never the loop flag - so the audio
 * element always looped regardless of what the cue's loop setting was.
 */

import React from "react"
import { render, screen } from "@testing-library/react"
import "@testing-library/jest-dom"
import EditModeContainer from "../../components/presentation/EditModeContainer"
import { useDispatch, useSelector } from "react-redux"

jest.mock("react-redux", () => ({
  useDispatch: jest.fn(),
  useSelector: jest.fn(),
}))

jest.mock("../../redux/presentationReducer", () => ({
  fetchPresentationInfo: jest.fn(() => ({
    type: "MOCK_FETCH_PRESENTATION_INFO",
  })),
}))

jest.mock("../../components/presentation/EditMode", () => {
  return function MockEditMode() {
    return <div data-testid="mock-edit-mode" />
  }
})

jest.mock("../../components/presentation/CuesForm", () => {
  return function MockCuesForm() {
    return <div data-testid="mock-cues-form" />
  }
})

jest.mock("../../components/presentation/PresentationTitle", () => {
  return function MockPresentationTitle() {
    return <div data-testid="mock-presentation-title" />
  }
})

jest.mock("../../components/presentation/ScreensDisplay", () => ({
  ScreensDisplay: function MockScreensDisplay() {
    return <div data-testid="mock-screens-display" />
  },
}))

jest.mock("../../components/presentation/Screen", () => {
  return function MockScreen() {
    return <div data-testid="mock-screen" />
  }
})

jest.mock("../../components/tutorial/TutorialGuide", () => {
  return function MockTutorialGuide() {
    return <div data-testid="mock-tutorial-guide" />
  }
})

jest.mock("../../components/utils/keyboardHandler", () => {
  return function MockKeyboardHandler() {
    return <div data-testid="mock-keyboard-handler" />
  }
})

jest.mock("../../components/presentation/PresentationPlaybackControls", () => {
  return function MockPresentationPlaybackControls(props) {
    return (
      <div
        data-testid="mock-playback-controls"
        data-audio-src={props.audioSourceURL}
        data-audio-loop={String(props.audioLoop)}
        data-audio-track-count={String(props.audioTracks?.length ?? 0)}
        data-audio-track-srcs={(props.audioTracks || [])
          .map((track) => track.src)
          .join("|")}
        data-audio-track-continuous={(props.audioTracks || [])
          .map((track) => String(Boolean(track.continuePlayback)))
          .join("|")}
      />
    )
  }
})

jest.mock("../../components/utils/ResizeElement", () => jest.fn())

describe("EditModeContainer audio loop wiring", () => {
  const dispatchMock = jest.fn()
  let loadSpy

  // Audio row is screenCount + 1, so with screenCount 2 the audio row is 3.
  const makeCues = (loop) => [
    {
      _id: "cue-audio",
      index: 0,
      screen: 3,
      name: "Background music",
      cueType: "audio",
      file: { type: "audio/mpeg", url: "https://example.com/track.mp3" },
      loop,
    },
  ]

  const baseProps = {
    id: "presentation-1",
    isToolboxOpen: false,
    setIsToolboxOpen: jest.fn(),
    transitionType: "none",
    cueIndex: 0,
    setCueIndex: jest.fn(),
    isAudioMuted: false,
    toggleAudioMute: jest.fn(),
    indexCount: 10,
    addCue: jest.fn(),
    onClose: jest.fn(),
    position: null,
    cueData: null,
    updateCue: jest.fn(),
    isAudioMode: false,
  }

  beforeEach(() => {
    jest.clearAllMocks()
    loadSpy = jest
      .spyOn(window.HTMLMediaElement.prototype, "load")
      .mockImplementation(() => {})
    useDispatch.mockReturnValue(dispatchMock)
    useSelector.mockImplementation((selector) =>
      selector({
        presentation: {
          name: "Test presentation",
          screenCount: 2,
        },
      })
    )
  })

  afterEach(() => {
    loadSpy.mockRestore()
  })

  test("passes audioLoop=true through to the playback controls when the cue loops", () => {
    render(<EditModeContainer {...baseProps} cues={makeCues(true)} />)

    const controls = screen.getByTestId("mock-playback-controls")
    expect(controls).toHaveAttribute(
      "data-audio-src",
      "https://example.com/track.mp3"
    )
    expect(controls).toHaveAttribute("data-audio-loop", "true")
  })

  test("passes audioLoop=false through to the playback controls when the cue does not loop", () => {
    render(<EditModeContainer {...baseProps} cues={makeCues(false)} />)

    const controls = screen.getByTestId("mock-playback-controls")
    expect(controls).toHaveAttribute(
      "data-audio-src",
      "https://example.com/track.mp3"
    )
    expect(controls).toHaveAttribute("data-audio-loop", "false")
  })

  test("passes every active audio track through to the playback controls", () => {
    const cues = [
      {
        _id: "cue-audio-a1",
        index: 0,
        screen: 3,
        layer: 0,
        name: "Music",
        cueType: "audio",
        file: { type: "audio/mpeg", url: "https://example.com/music.mp3" },
        loop: true,
        continuePlayback: true,
      },
      {
        _id: "cue-audio-a2",
        index: 0,
        screen: 3,
        layer: 1,
        name: "SFX",
        cueType: "audio",
        file: { type: "audio/mpeg", url: "https://example.com/sfx.mp3" },
        loop: false,
        continuePlayback: false,
      },
    ]

    render(<EditModeContainer {...baseProps} cues={cues} />)

    const controls = screen.getByTestId("mock-playback-controls")
    expect(controls).toHaveAttribute("data-audio-track-count", "2")
    expect(controls).toHaveAttribute(
      "data-audio-track-srcs",
      "https://example.com/music.mp3|https://example.com/sfx.mp3"
    )
    expect(controls).toHaveAttribute(
      "data-audio-track-continuous",
      "true|false"
    )
  })
})
