/**
 * This test suite covers the presentation "Settings" button in EditModeContainer,
 * which opens a popover for choosing how cues transition between frames on the
 * pop-up screen windows.
 */

import React from "react"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import "@testing-library/jest-dom"
import EditModeContainer from "../../components/presentation/EditModeContainer"
import { useDispatch, useSelector } from "react-redux"
import { fetchPresentationInfo } from "../../redux/presentationReducer"

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

// makeResizable returns a disposer the caller must invoke on unmount.
jest.mock("../../components/utils/ResizeElement", () =>
  jest.fn(() => jest.fn())
)

describe("EditModeContainer transition settings", () => {
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
    transitionType: "fade",
    onTransitionChange: jest.fn(),
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
    useDispatch.mockReturnValue(jest.fn())
    useSelector.mockImplementation((selector) =>
      selector({
        presentation: {
          name: "Test presentation",
          screenCount: 2,
        },
      })
    )
  })

  test("renders a Presentation Settings button", () => {
    render(<EditModeContainer {...baseProps} />)

    expect(screen.getByLabelText("Presentation Settings")).toBeInTheDocument()
  })

  test("opens a popover with the transition type select when clicked", async () => {
    render(<EditModeContainer {...baseProps} />)

    fireEvent.click(screen.getByLabelText("Presentation Settings"))

    await waitFor(() => {
      expect(screen.getByText("Transition Type:")).toBeVisible()
      expect(screen.getByTestId("transition-type-select")).toBeVisible()
    })
  })

  test("select lists all supported transition options", async () => {
    render(<EditModeContainer {...baseProps} />)

    fireEvent.click(screen.getByLabelText("Presentation Settings"))

    await waitFor(() => {
      expect(screen.getByTestId("transition-type-select")).toBeVisible()
    })

    const select = screen.getByTestId("transition-type-select")
    const optionValues = Array.from(select.options).map(
      (option) => option.value
    )

    expect(optionValues).toEqual([
      "fade",
      "slide-left",
      "slide-right",
      "zoom",
      "none",
    ])
  })

  test("select reflects the current transitionType prop", async () => {
    render(<EditModeContainer {...baseProps} transitionType="zoom" />)

    fireEvent.click(screen.getByLabelText("Presentation Settings"))

    await waitFor(() => {
      expect(screen.getByTestId("transition-type-select")).toBeVisible()
    })

    expect(screen.getByTestId("transition-type-select").value).toBe("zoom")
  })

  test("changing the select calls onTransitionChange with the new value", async () => {
    const onTransitionChange = jest.fn()
    render(
      <EditModeContainer
        {...baseProps}
        onTransitionChange={onTransitionChange}
      />
    )

    fireEvent.click(screen.getByLabelText("Presentation Settings"))

    await waitFor(() => {
      expect(screen.getByTestId("transition-type-select")).toBeVisible()
    })

    fireEvent.change(screen.getByTestId("transition-type-select"), {
      target: { value: "slide-left" },
    })

    expect(onTransitionChange).toHaveBeenCalledWith("slide-left")
  })
})
