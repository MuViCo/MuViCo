import { fireEvent, render, screen } from "@testing-library/react"
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
  return function MockPresentationPlaybackControls() {
    return <div data-testid="mock-playback-controls" />
  }
})

jest.mock("../../components/utils/ResizeElement", () =>
  jest.fn(() => jest.fn())
)

jest.mock("../../components/presentation/CueAudioPlayers", () => (props) => (
  <div
    data-testid="mock-cue-audio-players"
    data-should-auto-play={String(props.shouldAutoPlay)}
    data-manually-playing={JSON.stringify(
      props.manuallyPlayingTrackIds ?? null
    )}
  />
))

jest.mock("../../components/presentation/ShowMode", () => (props) => (
  <div data-testid="mock-show-mode">
    <span data-testid="is-audio-armed">{String(props.isAudioArmed)}</span>
    <span data-testid="audio-advance-mode">{props.audioAdvanceMode}</span>
    <button onClick={props.onToggleAudioArmed}>toggle-armed</button>
    <button onClick={props.onToggleAudioAdvanceMode}>toggle-mode</button>
    <button onClick={() => props.onToggleTrackPlay("track-1")}>
      toggle-play
    </button>
    <button onClick={() => props.onToggleTrackPlay("track-2")}>
      toggle-play-2
    </button>
    <button onClick={props.onExit}>exit-show</button>
  </div>
))

const baseProps = {
  id: "presentation-1",
  cues: [],
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
  onEnterShow: jest.fn(),
  onExitShow: jest.fn(),
}

describe("EditModeContainer audio arm and advance mode", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    useDispatch.mockReturnValue(jest.fn())
    useSelector.mockImplementation((selector) =>
      selector({
        presentation: { name: "Test presentation", screenCount: 2 },
      })
    )
  })

  test("does not arm audio just by entering Show mode", () => {
    render(<EditModeContainer {...baseProps} isShowMode />)

    expect(screen.getByTestId("is-audio-armed")).toHaveTextContent("false")
    expect(screen.getByTestId("mock-cue-audio-players")).toHaveAttribute(
      "data-should-auto-play",
      "false"
    )
  })

  test("defaults the advance mode to auto", () => {
    render(<EditModeContainer {...baseProps} isShowMode />)

    expect(screen.getByTestId("audio-advance-mode")).toHaveTextContent("auto")
  })

  test("arming in auto mode lets CueAudioPlayers auto-play", () => {
    render(<EditModeContainer {...baseProps} isShowMode />)

    fireEvent.click(screen.getByText("toggle-armed"))

    expect(screen.getByTestId("is-audio-armed")).toHaveTextContent("true")
    expect(screen.getByTestId("mock-cue-audio-players")).toHaveAttribute(
      "data-should-auto-play",
      "true"
    )
  })

  test("arming in manual mode never turns on auto-play", () => {
    render(<EditModeContainer {...baseProps} isShowMode />)

    fireEvent.click(screen.getByText("toggle-mode"))
    fireEvent.click(screen.getByText("toggle-armed"))

    expect(screen.getByTestId("audio-advance-mode")).toHaveTextContent("manual")
    expect(screen.getByTestId("mock-cue-audio-players")).toHaveAttribute(
      "data-should-auto-play",
      "false"
    )
  })

  test("toggling a track's play state flips it on then off", () => {
    render(<EditModeContainer {...baseProps} isShowMode />)

    fireEvent.click(screen.getByText("toggle-play"))
    expect(screen.getByTestId("mock-cue-audio-players")).toHaveAttribute(
      "data-manually-playing",
      JSON.stringify({ "track-1": true })
    )

    fireEvent.click(screen.getByText("toggle-play"))
    expect(screen.getByTestId("mock-cue-audio-players")).toHaveAttribute(
      "data-manually-playing",
      JSON.stringify({ "track-1": false })
    )
  })

  test("toggling a second track keeps the first track's state intact", () => {
    render(<EditModeContainer {...baseProps} isShowMode />)

    fireEvent.click(screen.getByText("toggle-play"))
    fireEvent.click(screen.getByText("toggle-play-2"))

    expect(screen.getByTestId("mock-cue-audio-players")).toHaveAttribute(
      "data-manually-playing",
      JSON.stringify({ "track-1": true, "track-2": true })
    )
  })

  test("leaving Show mode disarms audio and clears any manually-playing tracks", () => {
    const { rerender } = render(<EditModeContainer {...baseProps} isShowMode />)
    fireEvent.click(screen.getByText("toggle-armed"))
    fireEvent.click(screen.getByText("toggle-play"))
    expect(screen.getByTestId("is-audio-armed")).toHaveTextContent("true")

    rerender(<EditModeContainer {...baseProps} isShowMode={false} />)
    rerender(<EditModeContainer {...baseProps} isShowMode />)

    expect(screen.getByTestId("is-audio-armed")).toHaveTextContent("false")
    expect(screen.getByTestId("mock-cue-audio-players")).toHaveAttribute(
      "data-manually-playing",
      JSON.stringify({})
    )
  })

  test("exiting Show mode disarms audio immediately, before the parent re-renders", () => {
    render(<EditModeContainer {...baseProps} isShowMode />)
    fireEvent.click(screen.getByText("toggle-armed"))

    fireEvent.click(screen.getByText("exit-show"))

    expect(baseProps.onExitShow).toHaveBeenCalledTimes(1)
  })

  test("edit mode ignores the Show-mode arm state for CueAudioPlayers", () => {
    const { rerender } = render(<EditModeContainer {...baseProps} isShowMode />)
    fireEvent.click(screen.getByText("toggle-armed"))
    expect(screen.getByTestId("mock-cue-audio-players")).toHaveAttribute(
      "data-should-auto-play",
      "true"
    )

    rerender(<EditModeContainer {...baseProps} isShowMode={false} />)

    expect(screen.getByTestId("mock-cue-audio-players")).toHaveAttribute(
      "data-should-auto-play",
      "false"
    )
  })

  test("edit mode never receives the manually-playing tracks even if some were toggled on in Show mode", () => {
    const { rerender } = render(<EditModeContainer {...baseProps} isShowMode />)
    fireEvent.click(screen.getByText("toggle-play"))

    rerender(<EditModeContainer {...baseProps} isShowMode={false} />)

    expect(screen.getByTestId("mock-cue-audio-players")).toHaveAttribute(
      "data-manually-playing",
      JSON.stringify(null)
    )
  })
})
