import React from "react"
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react"
import "@testing-library/jest-dom"
import EditMode from "../../components/presentation/EditMode"
import { useDispatch, useSelector } from "react-redux"
import {
  swapCues,
  updatePresentation,
} from "../../redux/presentationReducer"

const mockDispatch = jest.fn(() => Promise.resolve({}))
const mockShowToast = jest.fn()
let mockDragScenario = null

jest.mock("react-redux", () => ({
  useDispatch: jest.fn(),
  useSelector: jest.fn(),
}))

jest.mock("../../redux/presentationReducer", () => ({
  updatePresentation: jest.fn(() => ({ type: "MOCK_UPDATE_PRESENTATION" })),
  createCue: jest.fn(() => ({ type: "MOCK_CREATE_CUE" })),
  removeCue: jest.fn(() => ({ type: "MOCK_REMOVE_CUE" })),
  swapCues: jest.fn(() => ({ type: "MOCK_SWAP_CUES" })),
  incrementIndexCount: jest.fn(() => ({ type: "MOCK_INCREMENT_INDEX_COUNT" })),
  decrementIndexCount: jest.fn(() => ({ type: "MOCK_DECREMENT_INDEX_COUNT" })),
  incrementScreenCount: jest.fn(() => ({ type: "MOCK_INCREMENT_SCREEN_COUNT" })),
  decrementScreenCount: jest.fn(() => ({ type: "MOCK_DECREMENT_SCREEN_COUNT" })),
  editCue: jest.fn(() => ({ type: "MOCK_EDIT_CUE" })),
  shiftPresentationIndexes: jest.fn(() => ({ type: "MOCK_SHIFT_INDEXES" })),
  fetchPresentationInfo: jest.fn(() => ({ type: "MOCK_FETCH_PRESENTATION_INFO" })),
}))

jest.mock("../../redux/presentationThunks", () => ({
  saveIndexCount: jest.fn(() => ({ type: "MOCK_SAVE_INDEX_COUNT" })),
  saveScreenCount: jest.fn(() => ({ type: "MOCK_SAVE_SCREEN_COUNT" })),
}))

jest.mock("../../components/utils/toastUtils", () => ({
  useCustomToast: () => mockShowToast,
}))

jest.mock("../../components/presentation/ToolBox", () => {
  return function MockToolBox() {
    return <div data-testid="toolbox" />
  }
})

jest.mock("../../components/presentation/StatusToolTip", () => {
  return function MockStatusToolTip() {
    return <div data-testid="status-tooltip" />
  }
})

jest.mock("../../components/utils/CustomAlert", () => {
  return function MockCustomAlert() {
    return <div data-testid="custom-alert" />
  }
})

jest.mock("../../components/utils/AlertDialog", () => {
  return function MockAlertDialog() {
    return null
  }
})

jest.mock("../../services/presentation", () => ({
  __esModule: true,
  default: {},
}))

jest.mock("react-grid-layout", () => {
  const mockReact = require("react")

  return function MockGridLayout({ children, onDragStop }) {
    const scenarios = {
      visualSwapVisual: {
        oldItem: { i: "visual-1", x: 0, y: 0 },
        newItem: { i: "visual-1", x: 1, y: 0 },
      },
    }

    const runScenario = () => {
      const scenario = scenarios[mockDragScenario]
      if (!scenario) {
        return
      }

      onDragStop([], scenario.oldItem, scenario.newItem)
    }

    return (
      <div>
        <button
          type="button"
          data-testid="trigger-drag-stop"
          onClick={runScenario}
        >
          trigger
        </button>
        {mockReact.Children.map(children, (child) => (
          <div className="react-grid-item">{child}</div>
        ))}
      </div>
    )
  }
})

describe("EditMode drag swapping", () => {
  const cues = [
    {
      _id: "visual-1",
      index: 0,
      screen: 1,
      name: "Visual cue 1",
      color: "#ffffff",
      cueType: "visual",
      file: { type: "image/png", url: "https://example.com/1.png", name: "1.png" },
    },
    {
      _id: "visual-2",
      index: 1,
      screen: 1,
      name: "Visual cue 2",
      color: "#000000",
      cueType: "visual",
      file: { type: "image/png", url: "https://example.com/2.png", name: "2.png" },
    },
  ]

  const renderEditMode = (customCues = cues, customIndexCount = 3) => {
    return render(
      <EditMode
        id="presentation-1"
        cues={customCues}
        isToolboxOpen={false}
        setIsToolboxOpen={jest.fn()}
        isShowMode={false}
        cueIndex={0}
        isAudioMuted={false}
        toggleAudioMute={jest.fn()}
        indexCount={customIndexCount}
      />
    )
  }

  const setupGridGeometry = () => {
    const gridContainer = screen.getByTestId("edit-mode-grid-container")
    Object.defineProperty(gridContainer, "scrollLeft", {
      configurable: true,
      value: 0,
    })
    gridContainer.getBoundingClientRect = jest.fn(() => ({
      left: 0,
      top: 0,
      right: 480,
      bottom: 440,
      width: 480,
      height: 440,
    }))

    return gridContainer
  }

  beforeEach(() => {
    jest.clearAllMocks()
    useDispatch.mockReturnValue(mockDispatch)
    useSelector.mockImplementation((selector) => selector({
      presentation: {
        cues,
        name: "Test presentation",
        screenCount: 2,
        indexCount: 3,
      },
    }))
    mockDragScenario = null
  })

  it("swaps cues after drag collision without dispatching a direct move update", async () => {
    mockDragScenario = "visualSwapVisual"

    renderEditMode()

    const gridContainer = setupGridGeometry()

    fireEvent.mouseDown(screen.getByTestId("cue-Visual cue 1"), {
      clientX: 10,
      clientY: 120,
    })

    fireEvent.click(screen.getByTestId("trigger-drag-stop"))

    fireEvent.mouseUp(gridContainer, {
      clientX: 170,
      clientY: 120,
    })

    await waitFor(() => {
      expect(swapCues).toHaveBeenCalledWith(
        "presentation-1",
        expect.objectContaining({
          _id: "visual-2",
          index: 0,
          screen: 1,
        }),
        expect.objectContaining({
          _id: "visual-1",
          index: 1,
          screen: 1,
        })
      )
    })

    expect(updatePresentation).not.toHaveBeenCalled()
  })

  it("does not swap when dropped on a continuation cell", () => {
    mockDragScenario = "visualSwapVisual"

    renderEditMode()

    const gridContainer = setupGridGeometry()

    fireEvent.mouseDown(screen.getByTestId("cue-Visual cue 1"), {
      clientX: 10,
      clientY: 120,
    })

    fireEvent.click(screen.getByTestId("trigger-drag-stop"))

    // xIndex=2, yIndex=1 is a continuation slot of cue-2 in visual-span mode
    fireEvent.mouseUp(gridContainer, {
      clientX: 330,
      clientY: 120,
    })

    expect(swapCues).not.toHaveBeenCalled()
  })

  it("moves cue when dropped on continuation cell in another row", async () => {
    const cuesWithContinuation = [
      {
        _id: "visual-1",
        index: 0,
        screen: 1,
        name: "Visual cue 1",
        color: "#ffffff",
        cueType: "visual",
        file: { type: "image/png", url: "https://example.com/1.png", name: "1.png" },
      },
      {
        _id: "visual-2",
        index: 1,
        screen: 2,
        name: "Visual cue 2",
        color: "#000000",
        cueType: "visual",
        file: { type: "image/png", url: "https://example.com/2.png", name: "2.png" },
      },
    ]

    useSelector.mockImplementation((selector) => selector({
      presentation: {
        cues: cuesWithContinuation,
        name: "Test presentation",
        screenCount: 2,
        indexCount: 4,
      },
    }))

    renderEditMode(cuesWithContinuation, 4)
    const gridContainer = setupGridGeometry()

    fireEvent.mouseDown(screen.getByTestId("cue-Visual cue 1"), {
      clientX: 10,
      clientY: 120,
    })

    // xIndex=2, yIndex=2 is continuation area for cue-2 in visual-span mode
    await act(async () => {
      fireEvent.mouseUp(gridContainer, {
        clientX: 330,
        clientY: 230,
      })
    })

    await waitFor(() => {
      expect(updatePresentation).toHaveBeenCalledWith(
        "presentation-1",
        expect.objectContaining({
          cueName: "Visual cue 1",
          index: 2,
          screen: 2,
        }),
        "visual-1"
      )
    })

    expect(swapCues).not.toHaveBeenCalled()
  })

  it("shows and repositions hover preview on empty slots", () => {
    renderEditMode()
    const gridContainer = setupGridGeometry()
    const hoverPreview = screen.getByTestId("hover-preview")

    expect(hoverPreview).toHaveStyle({ display: "none" })

    // Empty slot at xIndex=2, yIndex=2 with current test cues and derived visual spans
    fireEvent.mouseMove(gridContainer, {
      clientX: 330,
      clientY: 230,
    })

    expect(hoverPreview).toHaveStyle({
      display: "block",
      left: "320px",
      top: "220px",
    })
  })

  it("hides hover preview when moving over occupied slots", () => {
    renderEditMode()
    const gridContainer = setupGridGeometry()
    const hoverPreview = screen.getByTestId("hover-preview")

    fireEvent.mouseMove(gridContainer, {
      clientX: 330,
      clientY: 230,
    })
    expect(hoverPreview).toHaveStyle({ display: "block" })

    // Occupied slot at xIndex=0, yIndex=1 by visual-1
    fireEvent.mouseMove(gridContainer, {
      clientX: 10,
      clientY: 120,
    })

    expect(hoverPreview).toHaveStyle({ display: "none" })
  })

  it("hides hover preview when hovering frame header labels", () => {
    renderEditMode()
    const gridContainer = setupGridGeometry()
    const hoverPreview = screen.getByTestId("hover-preview")

    fireEvent.mouseMove(gridContainer, {
      clientX: 330,
      clientY: 230,
    })
    expect(hoverPreview).toHaveStyle({ display: "block" })

    fireEvent.mouseMove(screen.getByText("Frame 1"), {
      clientX: 170,
      clientY: 10,
    })

    expect(hoverPreview).toHaveStyle({ display: "none" })
  })
})