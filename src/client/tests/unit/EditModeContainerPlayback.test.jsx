/**
 * This test suite focuses on the playback behavior of the EditModeContainer component,
 * particularly how it handles autoplay functionality. It verifies that autoplay starts
 * from the correct frame, advances at the specified interval, and stops at the last frame.
 * Additionally, it checks that the fetchPresentationInfo action is dispatched on mount
 * to load presentation data.
 */

import React from "react"
import { render, screen, fireEvent, act, waitFor } from "@testing-library/react"
import "@testing-library/jest-dom"
import EditModeContainer from "../../components/presentation/EditModeContainer"
import { useDispatch, useSelector } from "react-redux"
import { fetchPresentationInfo } from "../../redux/presentationReducer"

jest.mock("react-redux", () => ({
  useDispatch: jest.fn(),
  useSelector: jest.fn(),
}))

jest.mock("../../redux/presentationReducer", () => ({
  fetchPresentationInfo: jest.fn(() => ({ type: "MOCK_FETCH_PRESENTATION_INFO" })),
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
      <div data-testid="mock-playback-controls">
        <span data-testid="mock-cue-index">{props.cueIndex}</span>
        <button type="button" onClick={props.toggleAutoplay}>
          {props.isAutoplaying ? "Stop Autoplay" : "Start Autoplay"}
        </button>
        <input
          aria-label="Autoplay seconds"
          value={props.autoplayInterval}
          onChange={(event) => props.toggleAutoplayInterval(event.target.value)}
        />
      </div>
    )
  }
})

jest.mock("../../components/utils/ResizeElement", () => jest.fn())

describe("EditModeContainer playback behavior", () => {
  const dispatchMock = jest.fn()

  const baseCues = [
    {
      _id: "cue-1",
      index: 0,
      screen: 1,
      name: "Cue 1",
      cueType: "visual",
      file: { type: "image/png", url: "https://example.com/cue-1.png" },
      loop: false,
    },
  ]

  const baseProps = {
    id: "presentation-1",
    cues: baseCues,
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
    useSelector.mockImplementation((selector) => selector({
      presentation: {
        name: "Test presentation",
        screenCount: 2,
      },
    }))
  })

  const renderWithCueState = ({ initialCueIndex = 0, indexCount = 10 } = {}) => {
    const setCueIndexSpy = jest.fn()
    const cueIndexRef = { current: initialCueIndex }

    function Harness() {
      const [cueIndex, setCueIndexState] = React.useState(initialCueIndex)

      React.useEffect(() => {
        cueIndexRef.current = cueIndex
      }, [cueIndex])

      const setCueIndex = (nextValue) => {
        setCueIndexSpy(nextValue)
        setCueIndexState((previousCueIndex) => (
          typeof nextValue === "function"
            ? nextValue(previousCueIndex)
            : nextValue
        ))
      }

      return (
        <EditModeContainer
          {...baseProps}
          cueIndex={cueIndex}
          setCueIndex={setCueIndex}
          indexCount={indexCount}
        />
      )
    }

    render(<Harness />)
    return { setCueIndexSpy, cueIndexRef }
  }

  test("starts autoplay from frame 0 and advances with interval", async () => {
    jest.useFakeTimers()

    const { setCueIndexSpy } = renderWithCueState({ initialCueIndex: 1, indexCount: 10 })

    fireEvent.click(screen.getByRole("button", { name: "Start Autoplay" }))

    expect(setCueIndexSpy).toHaveBeenCalledWith(0)

    await act(async () => {
      jest.advanceTimersByTime(5000)
    })

    expect(setCueIndexSpy.mock.calls.some((call) => typeof call[0] === "function")).toBe(true)

    jest.useRealTimers()
  })

  test("autoplay interval change increases tick frequency", async () => {
    jest.useFakeTimers()

    const { setCueIndexSpy } = renderWithCueState({ initialCueIndex: 0, indexCount: 100 })

    fireEvent.change(screen.getByLabelText("Autoplay seconds"), {
      target: { value: "0.1" },
    })

    fireEvent.click(screen.getByRole("button", { name: "Start Autoplay" }))

    await act(async () => {
      jest.advanceTimersByTime(500)
    })

    const updaterCallCount = setCueIndexSpy.mock.calls.filter((call) => typeof call[0] === "function").length
    expect(updaterCallCount).toBeGreaterThanOrEqual(4)

    jest.useRealTimers()
  })

  test("autoplay stops at the last frame", async () => {
    jest.useFakeTimers()

    const { cueIndexRef } = renderWithCueState({ initialCueIndex: 0, indexCount: 3 })

    fireEvent.click(screen.getByRole("button", { name: "Start Autoplay" }))

    await act(async () => {
      jest.advanceTimersByTime(5000 * 4)
    })

    await waitFor(() => {
      expect(cueIndexRef.current).toBe(2)
      expect(screen.getByRole("button", { name: "Start Autoplay" })).toBeInTheDocument()
    })

    jest.useRealTimers()
  })

  test("dispatches fetchPresentationInfo on mount", () => {
    render(<EditModeContainer {...baseProps} />)

    expect(fetchPresentationInfo).toHaveBeenCalledWith("presentation-1")
    expect(dispatchMock).toHaveBeenCalled()
  })
})
