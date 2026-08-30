/**
 * Regression tests for a bug where editing any cue - renaming it, dragging it
 * to another frame, or dragging it to another screen - closed every currently
 * open presentation screen window, even when the edited cue had nothing to do
 * with what was on display.
 *
 * Root cause: EditModeContainer rebuilt its `screens` visibility state from
 * scratch on every `cues` change, defaulting every screen back to hidden.
 */

import React from "react"
import { render, screen, fireEvent, act } from "@testing-library/react"
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
  return function MockScreen({ screenNumber, isVisible }) {
    return (
      <div
        data-testid={`mock-screen-${screenNumber}`}
        data-visible={isVisible}
      />
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
  return function MockPresentationPlaybackControls(props) {
    return (
      <div data-testid="mock-playback-controls">
        <button type="button" onClick={props.toggleAllScreens}>
          Toggle all screens
        </button>
      </div>
    )
  }
})

// makeResizable returns a disposer the caller must invoke on unmount.
jest.mock("../../components/utils/ResizeElement", () =>
  jest.fn(() => jest.fn())
)

describe("EditModeContainer screen visibility across cue edits", () => {
  const dispatchMock = jest.fn()

  const makeCues = (screen2Name) => [
    {
      _id: "cue-1",
      index: 0,
      screen: 1,
      name: "Cue 1",
      cueType: "visual",
      file: { type: "image/png", url: "https://example.com/cue-1.png" },
      loop: false,
    },
    {
      _id: "cue-2",
      index: 9,
      screen: 2,
      name: screen2Name,
      cueType: "visual",
      file: { type: "image/png", url: "https://example.com/cue-2.png" },
      loop: false,
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
    useDispatch.mockReturnValue(dispatchMock)
    useSelector.mockImplementation((selector) =>
      selector({
        presentation: {
          name: "Test presentation",
          // 3 visual screens + 1 audio row, so screen 3 used by the
          // "move to another screen" test below is a normal visual screen.
          screenCount: 3,
        },
      })
    )
  })

  // Renders EditModeContainer with mutable `cues` state, opens every screen
  // via the "Open all screens" control, then applies `applyEdit` to simulate
  // a cue mutation (rename, drag to another frame, drag to another screen...)
  // and hands back helpers to inspect the resulting screen visibility.
  const renderWithCueEdit = (initialCues, applyEdit) => {
    let setCuesRef
    function Harness() {
      const [cues, setCues] = React.useState(initialCues)
      setCuesRef = setCues

      return <EditModeContainer {...baseProps} cues={cues} />
    }

    render(<Harness />)

    fireEvent.click(screen.getByRole("button", { name: "Toggle all screens" }))

    const editCue = () => {
      act(() => {
        setCuesRef((prevCues) => applyEdit(prevCues))
      })
    }

    return { editCue }
  }

  test("editing an unrelated cue does not close already-open screens", () => {
    const { editCue } = renderWithCueEdit(makeCues("Cue 2"), () =>
      makeCues("Cue 2 renamed")
    )

    expect(screen.getByTestId("mock-screen-1")).toHaveAttribute(
      "data-visible",
      "true"
    )
    expect(screen.getByTestId("mock-screen-2")).toHaveAttribute(
      "data-visible",
      "true"
    )

    editCue()

    expect(screen.getByTestId("mock-screen-1")).toHaveAttribute(
      "data-visible",
      "true"
    )
    expect(screen.getByTestId("mock-screen-2")).toHaveAttribute(
      "data-visible",
      "true"
    )
  })

  test("moving a cue to another frame does not close already-open screens", () => {
    const { editCue } = renderWithCueEdit(makeCues("Cue 2"), (prevCues) =>
      // Drag cue-1 from frame 0 to frame 5 on the same screen.
      prevCues.map((cue) => (cue._id === "cue-1" ? { ...cue, index: 5 } : cue))
    )

    expect(screen.getByTestId("mock-screen-1")).toHaveAttribute(
      "data-visible",
      "true"
    )
    expect(screen.getByTestId("mock-screen-2")).toHaveAttribute(
      "data-visible",
      "true"
    )

    editCue()

    expect(screen.getByTestId("mock-screen-1")).toHaveAttribute(
      "data-visible",
      "true"
    )
    expect(screen.getByTestId("mock-screen-2")).toHaveAttribute(
      "data-visible",
      "true"
    )
  })

  test("moving a cue to another screen does not close already-open screens", () => {
    const { editCue } = renderWithCueEdit(makeCues("Cue 2"), (prevCues) =>
      // Drag cue-2 from screen 2 to a brand new screen 3.
      prevCues.map((cue) => (cue._id === "cue-2" ? { ...cue, screen: 3 } : cue))
    )

    expect(screen.getByTestId("mock-screen-1")).toHaveAttribute(
      "data-visible",
      "true"
    )
    expect(screen.getByTestId("mock-screen-2")).toHaveAttribute(
      "data-visible",
      "true"
    )
    expect(screen.getByTestId("mock-screen-3")).toHaveAttribute(
      "data-visible",
      "true"
    )

    editCue()

    // Every declared screen (1..screenCount) is already open from "Toggle
    // all screens", so moving a cue onto screen 3 doesn't change visibility.
    expect(screen.getByTestId("mock-screen-1")).toHaveAttribute(
      "data-visible",
      "true"
    )
    expect(screen.getByTestId("mock-screen-2")).toHaveAttribute(
      "data-visible",
      "true"
    )
    expect(screen.getByTestId("mock-screen-3")).toHaveAttribute(
      "data-visible",
      "true"
    )
  })
})
