/**
 * Regression coverage for multi-screen image spanning: a cue whose
 * spanScreens includes a screen other than its own primary `screen` must
 * still show up when that OTHER screen's popup is rendered.
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
  return function MockScreen({ screenNumber, screenData }) {
    const cueIds = (Array.isArray(screenData) ? screenData : [])
      .map((cue) => cue._id)
      .join("|")
    return (
      <div data-testid={`mock-screen-${screenNumber}`} data-cue-ids={cueIds} />
    )
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

// makeResizable returns a disposer the caller must invoke on unmount.
jest.mock("../../components/utils/ResizeElement", () =>
  jest.fn(() => jest.fn())
)

describe("EditModeContainer spanScreens screen matching", () => {
  const dispatchMock = jest.fn()

  const spanCue = {
    _id: "cue-span",
    index: 0,
    screen: 1,
    layer: 0,
    name: "Wide banner",
    cueType: "visual",
    file: { type: "image/png", url: "https://example.com/wide.png" },
    spanScreens: [1, 2, 3],
  }

  beforeEach(() => {
    jest.clearAllMocks()
    useDispatch.mockReturnValue(dispatchMock)
    useSelector.mockImplementation((selector) =>
      selector({
        presentation: {
          name: "Test presentation",
          screenCount: 3,
        },
      })
    )
  })

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
    cues: [spanCue],
  }

  test("seeds every spanned screen, not just the cue's primary screen, so each can be opened", () => {
    render(<EditModeContainer {...baseProps} />)

    // Screen 2 and 3 have no cue of their own on any frame -- only
    // screen 1's spanCue references them via spanScreens. They must still
    // get a <Screen> instance, or "Open all screens" could never open them.
    expect(screen.getByTestId("mock-screen-1")).toBeInTheDocument()
    expect(screen.getByTestId("mock-screen-2")).toBeInTheDocument()
    expect(screen.getByTestId("mock-screen-3")).toBeInTheDocument()
  })

  test("a spanning cue appears on every screen it spans, not just its primary screen", () => {
    render(<EditModeContainer {...baseProps} />)

    expect(screen.getByTestId("mock-screen-1")).toHaveAttribute(
      "data-cue-ids",
      "cue-span"
    )
    expect(screen.getByTestId("mock-screen-2")).toHaveAttribute(
      "data-cue-ids",
      "cue-span"
    )
    expect(screen.getByTestId("mock-screen-3")).toHaveAttribute(
      "data-cue-ids",
      "cue-span"
    )
  })
})
