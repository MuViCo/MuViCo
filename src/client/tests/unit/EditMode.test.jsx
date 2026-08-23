/**
 * This test suite verifies the functionality of the EditMode component,
 * particularly focusing on the drag-and-drop behavior for swapping cues.
 */

import {
  act,
  createEvent,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react"
import "@testing-library/jest-dom"
import EditMode from "../../components/presentation/EditMode"
import {
  TIMELINE_METRICS,
  laneTop,
  timelineRowsTopOffset,
} from "../../components/presentation/timelineMetrics"

/**
 * Vertical centre of a lane, in container coordinates.
 *
 * Derived rather than hardcoded so the suite survives a change to the timeline
 * geometry: these are pointer inputs chosen to land on a given row, not
 * assertions about pixel values.
 */
const rowCenterY = (rowIndex) =>
  timelineRowsTopOffset() +
  rowIndex * (TIMELINE_METRICS.rowHeight + TIMELINE_METRICS.gap) +
  TIMELINE_METRICS.rowHeight / 2
import { useDispatch, useSelector } from "react-redux"
import {
  createCue,
  swapCues,
  updatePresentation,
  incrementIndexCount,
  decrementIndexCount,
  removeCue,
  shiftPresentationIndexes,
  fetchPresentationInfo,
} from "../../redux/presentationReducer"
import { saveIndexCount, saveScreenCount } from "../../redux/presentationThunks"

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
  incrementScreenCount: jest.fn(() => ({
    type: "MOCK_INCREMENT_SCREEN_COUNT",
  })),
  decrementScreenCount: jest.fn(() => ({
    type: "MOCK_DECREMENT_SCREEN_COUNT",
  })),
  editCue: jest.fn(() => ({ type: "MOCK_EDIT_CUE" })),
  shiftPresentationIndexes: jest.fn(() => ({ type: "MOCK_SHIFT_INDEXES" })),
  fetchPresentationInfo: jest.fn(() => ({
    type: "MOCK_FETCH_PRESENTATION_INFO",
  })),
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
  return function MockAlertDialog({ isOpen, onConfirm, message }) {
    if (!isOpen) {
      return null
    }

    return (
      <div data-testid="mock-alert-dialog">
        <span>{message}</span>
        <button
          type="button"
          data-testid="confirm-dialog-confirm"
          onClick={() => {
            if (typeof onConfirm === "function") {
              onConfirm()
            }
          }}
        >
          confirm
        </button>
      </div>
    )
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

      if (typeof onDragStop === "function") {
        onDragStop([], scenario.oldItem, scenario.newItem)
      }
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
      file: {
        type: "image/png",
        url: "https://example.com/1.png",
        name: "1.png",
      },
    },
    {
      _id: "visual-2",
      index: 1,
      screen: 1,
      name: "Visual cue 2",
      color: "#000000",
      cueType: "visual",
      file: {
        type: "image/png",
        url: "https://example.com/2.png",
        name: "2.png",
      },
    },
  ]

  const renderEditMode = (
    customCues = cues,
    customIndexCount = 3,
    extraProps = {}
  ) => {
    return render(
      <EditMode
        id="presentation-1"
        cues={customCues}
        isToolboxOpen={false}
        setIsToolboxOpen={jest.fn()}
        cueIndex={0}
        isAudioMuted={false}
        toggleAudioMute={jest.fn()}
        indexCount={customIndexCount}
        {...extraProps}
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

  const buildPoolColorDragDataTransfer = () => ({
    files: [],
    getData: jest.fn((type) => {
      if (type === "application/json") {
        return JSON.stringify({
          type: "newCueFromForm",
          elementType: "color",
          cueName: "Pool color",
          color: "#ff8800",
        })
      }

      return ""
    }),
  })

  const buildPoolEmptyNameColorDragDataTransfer = () => ({
    files: [],
    getData: jest.fn((type) => {
      if (type === "application/json") {
        return JSON.stringify({
          type: "newCueFromForm",
          elementType: "color",
          cueName: "",
          color: "#ff8800",
        })
      }

      return ""
    }),
  })

  beforeEach(() => {
    jest.clearAllMocks()
    useDispatch.mockReturnValue(mockDispatch)
    useSelector.mockImplementation((selector) =>
      selector({
        presentation: {
          cues,
          name: "Test presentation",
          screenCount: 2,
          indexCount: 3,
        },
      })
    )
    mockDragScenario = null
  })

  it("swaps cues after drag collision without dispatching a direct move update", async () => {
    mockDragScenario = "visualSwapVisual"

    renderEditMode()

    const gridContainer = setupGridGeometry()

    fireEvent.mouseDown(screen.getByTestId("cue-Visual cue 1"), {
      clientX: 10,
      clientY: rowCenterY(0),
    })

    fireEvent.click(screen.getByTestId("trigger-drag-stop"))

    fireEvent.mouseUp(gridContainer, {
      clientX: 170,
      clientY: rowCenterY(0),
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

  it("hides cues from a collapsed screen group without remapping other screens", () => {
    const layeredCues = [
      {
        _id: "screen-1-layer-1",
        index: 0,
        screen: 1,
        layer: 0,
        name: "Screen 1 L1",
        color: "#ffffff",
        cueType: "visual",
        file: null,
      },
      {
        _id: "screen-1-layer-2",
        index: 0,
        screen: 1,
        layer: 1,
        name: "Screen 1 L2",
        color: "#111111",
        cueType: "visual",
        file: null,
      },
      {
        _id: "screen-2-layer-1",
        index: 0,
        screen: 2,
        layer: 0,
        name: "Screen 2 L1",
        color: "#222222",
        cueType: "visual",
        file: null,
      },
    ]

    renderEditMode(layeredCues)

    expect(screen.getByTestId("cue-Screen 1 L1")).toBeInTheDocument()
    expect(screen.getByTestId("cue-Screen 1 L2")).toBeInTheDocument()
    expect(screen.getByTestId("cue-Screen 2 L1")).toBeInTheDocument()

    fireEvent.click(screen.getAllByLabelText("Collapse row group")[0])

    expect(screen.queryByTestId("cue-Screen 1 L1")).not.toBeInTheDocument()
    expect(screen.queryByTestId("cue-Screen 1 L2")).not.toBeInTheDocument()
    expect(
      screen.getByTestId("collapsed-preview-screen-1-0")
    ).toBeInTheDocument()
    expect(screen.getByTestId("cue-Screen 2 L1")).toBeInTheDocument()
  })

  it("does not swap when dropped on a continuation cell", () => {
    mockDragScenario = "visualSwapVisual"

    renderEditMode()

    const gridContainer = setupGridGeometry()

    fireEvent.mouseDown(screen.getByTestId("cue-Visual cue 1"), {
      clientX: 10,
      clientY: rowCenterY(0),
    })

    fireEvent.click(screen.getByTestId("trigger-drag-stop"))

    // xIndex=2, yIndex=1 is a continuation slot of cue-2 in visual-span mode
    fireEvent.mouseUp(gridContainer, {
      clientX: 330,
      clientY: rowCenterY(0),
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
        file: {
          type: "image/png",
          url: "https://example.com/1.png",
          name: "1.png",
        },
      },
      {
        _id: "visual-2",
        index: 1,
        screen: 2,
        name: "Visual cue 2",
        color: "#000000",
        cueType: "visual",
        file: {
          type: "image/png",
          url: "https://example.com/2.png",
          name: "2.png",
        },
      },
    ]

    useSelector.mockImplementation((selector) =>
      selector({
        presentation: {
          cues: cuesWithContinuation,
          name: "Test presentation",
          screenCount: 2,
          indexCount: 4,
        },
      })
    )

    renderEditMode(cuesWithContinuation, 4)
    const gridContainer = setupGridGeometry()

    fireEvent.mouseDown(screen.getByTestId("cue-Visual cue 1"), {
      clientX: 10,
      clientY: rowCenterY(0),
    })

    // xIndex=2, yIndex=2 is continuation area for cue-2 in visual-span mode
    await act(async () => {
      fireEvent.mouseUp(gridContainer, {
        clientX: 330,
        clientY: rowCenterY(1),
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
      clientY: rowCenterY(1),
    })

    expect(hoverPreview).toHaveStyle({
      display: "block",
      left: `${2 * (TIMELINE_METRICS.columnWidth + TIMELINE_METRICS.gap)}px`,
      top: `${laneTop(1)}px`,
    })
  })

  it("hides hover preview when moving over occupied slots", () => {
    renderEditMode()
    const gridContainer = setupGridGeometry()
    const hoverPreview = screen.getByTestId("hover-preview")

    fireEvent.mouseMove(gridContainer, {
      clientX: 330,
      clientY: rowCenterY(1),
    })
    expect(hoverPreview).toHaveStyle({ display: "block" })

    // Occupied slot at xIndex=0, yIndex=1 by visual-1
    fireEvent.mouseMove(gridContainer, {
      clientX: 10,
      clientY: rowCenterY(0),
    })

    expect(hoverPreview).toHaveStyle({ display: "none" })
  })

  it("hides hover preview when hovering frame header labels", () => {
    renderEditMode()
    const gridContainer = setupGridGeometry()
    const hoverPreview = screen.getByTestId("hover-preview")

    fireEvent.mouseMove(gridContainer, {
      clientX: 330,
      clientY: rowCenterY(1),
    })
    expect(hoverPreview).toHaveStyle({ display: "block" })

    fireEvent.mouseMove(screen.getByText("Frame 1"), {
      clientX: 170,
      clientY: 10,
    })

    expect(hoverPreview).toHaveStyle({ display: "none" })
  })

  it("shows and hides drag placement preview while dragging", async () => {
    renderEditMode()
    const gridContainer = setupGridGeometry()

    fireEvent.mouseDown(screen.getByTestId("cue-Visual cue 1"), {
      clientX: 10,
      clientY: rowCenterY(0),
      button: 0,
    })

    const placementPreview = screen.getByTestId("drag-placement-preview")
    expect(placementPreview).toHaveStyle({ display: "block" })

    fireEvent.mouseMove(gridContainer, {
      clientX: 170,
      clientY: rowCenterY(0),
    })

    await waitFor(() => {
      expect(placementPreview).toHaveStyle({ display: "block" })
    })

    fireEvent.mouseUp(gridContainer, {
      clientX: 170,
      clientY: rowCenterY(0),
    })

    await waitFor(() =>
      expect(
        screen.queryByTestId("drag-placement-preview")
      ).not.toBeInTheDocument()
    )
  })

  it("cancels dragging when cursor leaves the grid container", async () => {
    renderEditMode()
    const gridContainer = setupGridGeometry()

    fireEvent.mouseDown(screen.getByTestId("cue-Visual cue 1"), {
      clientX: 10,
      clientY: rowCenterY(0),
      button: 0,
    })

    fireEvent.mouseMove(gridContainer, {
      clientX: 170,
      clientY: rowCenterY(0),
    })

    await waitFor(() => {
      expect(screen.getByTestId("drag-placement-preview")).toHaveStyle({
        display: "block",
      })
    })

    fireEvent.mouseLeave(gridContainer)

    await waitFor(() => {
      expect(
        screen.queryByTestId("drag-placement-preview")
      ).not.toBeInTheDocument()
    })

    fireEvent.mouseMove(gridContainer, {
      clientX: 250,
      clientY: rowCenterY(0),
    })

    expect(
      screen.queryByTestId("drag-placement-preview")
    ).not.toBeInTheDocument()
  })

  it("shrinks continuation preview when dragging a cue over another cue continuation", async () => {
    renderEditMode()
    const gridContainer = setupGridGeometry()

    expect(
      screen.getByTestId("cue-continuation-overlay-visual-2")
    ).toBeInTheDocument()

    fireEvent.mouseDown(screen.getByTestId("cue-Visual cue 1"), {
      clientX: 10,
      clientY: rowCenterY(0),
      button: 0,
    })

    fireEvent.mouseMove(gridContainer, {
      clientX: 330,
      clientY: rowCenterY(0),
    })

    await waitFor(() => {
      expect(
        screen.getByTestId("cue-continuation-overlay-visual-2")
      ).toHaveStyle({
        opacity: "0.76",
      })
    })
  })

  it("allows dropping pool cues on continuation slots", async () => {
    renderEditMode()
    const gridContainer = setupGridGeometry()
    const dropArea = screen.getByTestId("drop-area")
    const dataTransfer = buildPoolColorDragDataTransfer()

    fireEvent.dragOver(gridContainer, {
      dataTransfer,
      clientX: 330,
      clientY: rowCenterY(0),
    })

    const dropEvent = createEvent.drop(dropArea)
    Object.defineProperty(dropEvent, "dataTransfer", {
      value: dataTransfer,
      configurable: true,
    })
    Object.defineProperty(dropEvent, "clientX", {
      value: 330,
      configurable: true,
    })
    Object.defineProperty(dropEvent, "clientY", {
      value: rowCenterY(0),
      configurable: true,
    })

    await act(async () => {
      fireEvent(dropArea, dropEvent)
    })

    await waitFor(() => {
      expect(createCue).toHaveBeenCalledWith(
        "presentation-1",
        expect.any(FormData)
      )
    })
    expect(mockShowToast).not.toHaveBeenCalledWith(
      expect.objectContaining({ title: "Cannot drop here" })
    )
  })

  it("focuses the lane an element was dropped onto", async () => {
    const onFocusLane = jest.fn()
    renderEditMode(cues, 3, { onFocusLane })
    const gridContainer = setupGridGeometry()
    const dropArea = screen.getByTestId("drop-area")
    const dataTransfer = buildPoolColorDragDataTransfer()

    fireEvent.dragOver(gridContainer, {
      dataTransfer,
      clientX: 330,
      clientY: rowCenterY(0),
    })

    const dropEvent = createEvent.drop(dropArea)
    for (const [key, value] of [
      ["dataTransfer", dataTransfer],
      ["clientX", 330],
      ["clientY", rowCenterY(0)],
    ]) {
      Object.defineProperty(dropEvent, key, { value, configurable: true })
    }

    await act(async () => {
      fireEvent(dropArea, dropEvent)
    })

    await waitFor(() => {
      expect(createCue).toHaveBeenCalled()
    })
    // Dropping an element is a placement, so the lane it landed on takes focus
    // the same way clicking it would.
    expect(onFocusLane).toHaveBeenCalled()
  })

  it("focuses the target lane when a cue is dragged to another layer", async () => {
    const onFocusLane = jest.fn()
    renderEditMode(cues, 3, { onFocusLane })
    const gridContainer = setupGridGeometry()

    fireEvent.mouseDown(screen.getByTestId("cue-Visual cue 1"), {
      clientX: 170,
      clientY: rowCenterY(0),
      button: 0,
    })
    // Past the 4px threshold, onto the lane below.
    fireEvent.mouseMove(gridContainer, {
      clientX: 330,
      clientY: rowCenterY(1),
    })
    await act(async () => {
      fireEvent.mouseUp(gridContainer, {
        clientX: 330,
        clientY: rowCenterY(1),
      })
    })

    // The lane the cue was released on is the one now being worked with, not
    // the one it came from.
    await waitFor(() => {
      expect(onFocusLane).toHaveBeenCalled()
    })
    const focusedKey = onFocusLane.mock.calls.at(-1)[0]
    expect(focusedKey).not.toBe("screen-1:0")
  })

  it("does not block pool cue drops on occupied anchor slots", async () => {
    renderEditMode()
    const gridContainer = setupGridGeometry()
    const dropArea = screen.getByTestId("drop-area")
    const dataTransfer = buildPoolColorDragDataTransfer()

    fireEvent.dragOver(gridContainer, {
      dataTransfer,
      clientX: 170,
      clientY: rowCenterY(0),
    })

    await act(async () => {
      fireEvent.drop(dropArea, {
        dataTransfer,
        clientX: 170,
        clientY: rowCenterY(0),
      })
    })

    expect(mockShowToast).not.toHaveBeenCalledWith(
      expect.objectContaining({ title: "Cannot drop here" })
    )
  })

  it("replaces occupied cue with empty-name color payload and cleared file", async () => {
    renderEditMode()
    const gridContainer = setupGridGeometry()
    const dropArea = screen.getByTestId("drop-area")
    const dataTransfer = buildPoolEmptyNameColorDragDataTransfer()

    fireEvent.dragOver(gridContainer, {
      dataTransfer,
      clientX: 170,
      clientY: rowCenterY(0),
    })

    const dropEvent = createEvent.drop(dropArea)
    Object.defineProperty(dropEvent, "dataTransfer", {
      value: dataTransfer,
      configurable: true,
    })
    Object.defineProperty(dropEvent, "clientX", {
      value: 170,
      configurable: true,
    })
    Object.defineProperty(dropEvent, "clientY", {
      value: rowCenterY(0),
      configurable: true,
    })

    await act(async () => {
      fireEvent(dropArea, dropEvent)
    })

    const confirmButton = await screen.findByTestId("confirm-dialog-confirm")
    fireEvent.click(confirmButton)

    await waitFor(() => {
      expect(updatePresentation).toHaveBeenCalledWith(
        "presentation-1",
        expect.objectContaining({
          cueName: "",
          file: null,
          color: "#ff8800",
          index: 1,
          screen: 1,
        }),
        "visual-2"
      )
    })
  })

  it("clears pool drag preview when drop happens outside grid", async () => {
    renderEditMode()
    const gridContainer = setupGridGeometry()
    const dataTransfer = buildPoolColorDragDataTransfer()
    const poolPreview = screen.getByTestId("pool-drag-placement-preview")

    const dragOverEvent = new Event("dragover", {
      bubbles: true,
      cancelable: true,
    })
    Object.defineProperty(dragOverEvent, "dataTransfer", {
      value: dataTransfer,
      configurable: true,
    })
    Object.defineProperty(dragOverEvent, "clientX", {
      value: 330,
      configurable: true,
    })
    Object.defineProperty(dragOverEvent, "clientY", {
      value: 120,
      configurable: true,
    })
    fireEvent(gridContainer, dragOverEvent)

    await waitFor(() => {
      expect(poolPreview).toHaveStyle({ display: "block" })
    })

    fireEvent(window, new Event("drop"))

    await waitFor(() => {
      expect(poolPreview).toHaveStyle({ display: "none" })
    })
  })

  it("shows copy preview and continuation shrink while hovering paste target", async () => {
    renderEditMode()
    const gridContainer = setupGridGeometry()

    fireEvent.click(screen.getByTestId("cue-menu-button-visual-1"))

    await waitFor(() => {
      expect(screen.getByLabelText("Copy Visual cue 1")).toBeInTheDocument()
    })

    fireEvent.mouseUp(screen.getByLabelText("Copy Visual cue 1"))

    await waitFor(() => {
      expect(gridContainer).toHaveStyle({ cursor: "copy" })
    })

    fireEvent.mouseMove(gridContainer, {
      clientX: 330,
      clientY: rowCenterY(0),
    })

    await waitFor(() => {
      expect(screen.getByTestId("copy-drag-placement-preview")).toHaveStyle({
        transform: `translate3d(${2 * (TIMELINE_METRICS.columnWidth + TIMELINE_METRICS.gap)}px, ${timelineRowsTopOffset()}px, 0)`,
      })
      expect(
        screen.getByTestId("cue-continuation-overlay-visual-2")
      ).toHaveStyle({
        opacity: "0.76",
      })
    })
  })

  it("shows not-allowed state when hovering the same copied cue", async () => {
    renderEditMode()
    const gridContainer = setupGridGeometry()

    fireEvent.click(screen.getByTestId("cue-menu-button-visual-1"))

    await waitFor(() => {
      expect(screen.getByLabelText("Copy Visual cue 1")).toBeInTheDocument()
    })

    fireEvent.mouseUp(screen.getByLabelText("Copy Visual cue 1"))

    fireEvent.mouseMove(gridContainer, {
      clientX: 10,
      clientY: rowCenterY(0),
    })

    await waitFor(() => {
      expect(gridContainer).toHaveStyle({ cursor: "not-allowed" })
      expect(screen.getByTestId("copy-drag-placement-preview")).toHaveAttribute(
        "data-valid-drop-cell",
        "false"
      )
    })
  })

  it("pastes copied cue when clicking a continuation slot", async () => {
    renderEditMode()
    const gridContainer = setupGridGeometry()
    const originalFetch = global.fetch
    global.fetch = jest.fn(async () => ({
      blob: async () => new Blob(["test"], { type: "image/png" }),
    }))

    try {
      fireEvent.click(screen.getByTestId("cue-menu-button-visual-1"))

      await waitFor(() => {
        expect(screen.getByLabelText("Copy Visual cue 1")).toBeInTheDocument()
      })

      fireEvent.mouseUp(screen.getByLabelText("Copy Visual cue 1"))

      fireEvent.mouseMove(gridContainer, {
        clientX: 330,
        clientY: rowCenterY(0),
      })

      fireEvent.click(screen.getByTestId("cue-Visual cue 2"), {
        clientX: 330,
        clientY: rowCenterY(0),
      })

      await waitFor(() => {
        expect(createCue).toHaveBeenCalledWith(
          "presentation-1",
          expect.any(FormData)
        )
      })
    } finally {
      global.fetch = originalFetch
    }
  })

  it("positions drag cursor preview near pointer on mouse down without move", async () => {
    renderEditMode()
    setupGridGeometry()

    fireEvent.mouseDown(screen.getByTestId("cue-Visual cue 1"), {
      clientX: 170,
      clientY: rowCenterY(0),
      button: 0,
    })

    await waitFor(() => {
      expect(screen.getByTestId("drag-cursor-preview")).toHaveStyle({
        transform: `translate3d(180px, ${rowCenterY(0) + 10}px, 0)`,
      })
    })
  })

  it("renders video thumbnail in drag cursor preview for video cues", async () => {
    const videoCues = [
      {
        _id: "video-1",
        index: 0,
        screen: 1,
        name: "Video cue 1",
        color: "#6f3ac9",
        cueType: "visual",
        file: {
          type: "video/mp4",
          url: "https://example.com/video-1.mp4",
          name: "video-1.mp4",
        },
      },
    ]

    renderEditMode(videoCues, 2)
    setupGridGeometry()

    fireEvent.mouseDown(screen.getByTestId("cue-Video cue 1"), {
      clientX: 10,
      clientY: rowCenterY(0),
      button: 0,
    })

    await waitFor(() => {
      const preview = screen.getByTestId("drag-cursor-preview")
      const previewVideo = preview.querySelector("video")

      expect(previewVideo).toBeInTheDocument()
      expect(preview.querySelector("img")).not.toBeInTheDocument()
      expect(previewVideo).toHaveAttribute(
        "src",
        "https://example.com/video-1.mp4"
      )
    })
  })

  it("starts dragging when clicking continuation area", async () => {
    renderEditMode()
    const gridContainer = setupGridGeometry()

    // xIndex=2, yIndex=1 points to continuation area of visual-2 with current test setup.
    fireEvent.mouseDown(screen.getByTestId("cue-Visual cue 2"), {
      clientX: 330,
      clientY: rowCenterY(0),
      button: 0,
    })

    await waitFor(() => {
      expect(screen.getByTestId("drag-placement-preview")).toHaveStyle({
        transform: `translate3d(${TIMELINE_METRICS.columnWidth + TIMELINE_METRICS.gap}px, ${timelineRowsTopOffset()}px, 0)`,
      })
    })

    fireEvent.mouseMove(gridContainer, {
      clientX: 340,
      clientY: rowCenterY(0),
    })

    await waitFor(() => {
      expect(screen.getByTestId("drag-cursor-preview")).toBeInTheDocument()
      expect(screen.getByTestId("drag-placement-preview")).toHaveStyle({
        display: "block",
        transform: `translate3d(${2 * (TIMELINE_METRICS.columnWidth + TIMELINE_METRICS.gap)}px, ${timelineRowsTopOffset()}px, 0)`,
      })
    })
  })

  it("does not move cue when clicking continuation area without moving pointer", async () => {
    renderEditMode()
    const gridContainer = setupGridGeometry()

    fireEvent.mouseDown(screen.getByTestId("cue-Visual cue 2"), {
      clientX: 330,
      clientY: rowCenterY(0),
      button: 0,
    })

    await act(async () => {
      fireEvent.mouseUp(gridContainer, {
        clientX: 330,
        clientY: rowCenterY(0),
      })
    })

    expect(updatePresentation).not.toHaveBeenCalled()
    expect(swapCues).not.toHaveBeenCalled()
  })

  it("can move cue right when dragging from continuation area", async () => {
    renderEditMode()
    const gridContainer = setupGridGeometry()

    fireEvent.mouseDown(screen.getByTestId("cue-Visual cue 2"), {
      clientX: 330,
      clientY: rowCenterY(0),
      button: 0,
    })

    fireEvent.mouseMove(gridContainer, {
      clientX: 340,
      clientY: rowCenterY(0),
    })

    await act(async () => {
      fireEvent.mouseUp(gridContainer, {
        clientX: 340,
        clientY: rowCenterY(0),
      })
    })

    await waitFor(() => {
      expect(updatePresentation).toHaveBeenCalledWith(
        "presentation-1",
        expect.objectContaining({
          cueName: "Visual cue 2",
          index: 2,
          screen: 1,
        }),
        "visual-2"
      )
    })
    expect(swapCues).not.toHaveBeenCalled()
  })

  it("prevents native default behavior when cue drag starts", () => {
    renderEditMode()
    setupGridGeometry()

    const defaultWasNotPrevented = fireEvent(
      screen.getByTestId("cue-Visual cue 1"),
      new MouseEvent("mousedown", {
        bubbles: true,
        cancelable: true,
        clientX: 10,
        clientY: rowCenterY(0),
        button: 0,
      })
    )

    expect(defaultWasNotPrevented).toBe(false)
  })

  describe("frame index add/remove shifting", () => {
    const buildCue = ({ id, index, screen = 1 }) => ({
      _id: id,
      index,
      screen,
      name: `Cue ${id}`,
      color: "#ffffff",
      cueType: "visual",
      file: {
        type: "image/png",
        url: `https://example.com/${id}.png`,
        name: `${id}.png`,
      },
    })

    beforeEach(() => {
      // jest.clearAllMocks() (outer beforeEach) clears call history but not a
      // custom mockImplementation set by an error-path test — reset it here
      // so each test starts from the default resolve-everything behavior.
      mockDispatch.mockImplementation(() => Promise.resolve({}))
    })

    const renderWithFrames = (customCues, customIndexCount) => {
      useSelector.mockImplementation((selector) =>
        selector({
          presentation: {
            cues: customCues,
            name: "Test presentation",
            screenCount: 2,
            indexCount: customIndexCount,
          },
        })
      )
      return render(
        <EditMode
          id="presentation-1"
          cues={customCues}
          isToolboxOpen={false}
          setIsToolboxOpen={jest.fn()}
          cueIndex={0}
          isAudioMuted={false}
          toggleAudioMute={jest.fn()}
          indexCount={customIndexCount}
        />
      )
    }

    it("does not shift when adding a frame with no cues after it", async () => {
      renderWithFrames([], 3)

      await act(async () => {
        fireEvent.click(screen.getAllByLabelText("Add Frame")[0])
      })

      await waitFor(() => {
        expect(incrementIndexCount).toHaveBeenCalled()
      })
      expect(shiftPresentationIndexes).not.toHaveBeenCalled()
      expect(mockShowToast).not.toHaveBeenCalledWith(
        expect.objectContaining({ title: "Frame added in between" })
      )
    })

    it("shifts a single cue right in one request when adding a frame before it", async () => {
      const cues = [buildCue({ id: "c1", index: 2 })]
      renderWithFrames(cues, 4)

      await act(async () => {
        fireEvent.click(screen.getAllByLabelText("Add Frame")[0])
      })

      await waitFor(() => {
        expect(shiftPresentationIndexes).toHaveBeenCalledWith(
          "presentation-1",
          0,
          "right"
        )
      })
      expect(shiftPresentationIndexes).toHaveBeenCalledTimes(1)
      expect(mockShowToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Frame added in between",
          description: expect.stringContaining("Moved 1 element(s) forward"),
        })
      )
    })

    it("shifts several consecutive same-screen cues in a single request when adding a frame (previously racy)", async () => {
      const cues = [
        buildCue({ id: "c1", index: 1 }),
        buildCue({ id: "c2", index: 2 }),
        buildCue({ id: "c3", index: 3 }),
      ]
      renderWithFrames(cues, 5)

      await act(async () => {
        fireEvent.click(screen.getAllByLabelText("Add Frame")[0])
      })

      await waitFor(() => {
        expect(shiftPresentationIndexes).toHaveBeenCalledWith(
          "presentation-1",
          0,
          "right"
        )
      })
      expect(shiftPresentationIndexes).toHaveBeenCalledTimes(1)
      expect(mockShowToast).toHaveBeenCalledWith(
        expect.objectContaining({
          description: expect.stringContaining("Moved 3 element(s) forward"),
        })
      )
      expect(mockShowToast).not.toHaveBeenCalledWith(
        expect.objectContaining({ title: "Error" })
      )
    })

    it("reverts the index-count increment when the shift request fails", async () => {
      const cues = [buildCue({ id: "c1", index: 2 })]
      renderWithFrames(cues, 4)
      mockDispatch.mockImplementation((action) =>
        action?.type === "MOCK_SHIFT_INDEXES"
          ? Promise.reject(new Error("shift failed"))
          : Promise.resolve({})
      )

      await act(async () => {
        fireEvent.click(screen.getAllByLabelText("Add Frame")[0])
      })

      await waitFor(() => {
        expect(mockShowToast).toHaveBeenCalledWith(
          expect.objectContaining({ title: "Error" })
        )
      })
      expect(decrementIndexCount).toHaveBeenCalled()
      expect(saveIndexCount).toHaveBeenCalledWith({
        id: "presentation-1",
        indexCount: 4,
      })
    })

    it("does not shift when removing a frame with no cues after it", async () => {
      renderWithFrames([], 3)

      await act(async () => {
        fireEvent.click(screen.getAllByLabelText("Remove Frame")[1])
      })

      await waitFor(() => {
        expect(decrementIndexCount).toHaveBeenCalled()
      })
      expect(shiftPresentationIndexes).not.toHaveBeenCalled()
    })

    it("shifts a single cue left in one request when removing an earlier empty frame", async () => {
      const cues = [buildCue({ id: "c1", index: 2 })]
      renderWithFrames(cues, 4)

      await act(async () => {
        fireEvent.click(screen.getAllByLabelText("Remove Frame")[0])
      })

      await waitFor(() => {
        expect(shiftPresentationIndexes).toHaveBeenCalledWith(
          "presentation-1",
          1,
          "left"
        )
      })
      expect(shiftPresentationIndexes).toHaveBeenCalledTimes(1)
      expect(mockShowToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Removed frame in between",
          description: expect.stringContaining("Moved 1 element(s) backwards"),
        })
      )
    })

    it("shifts several consecutive same-screen cues in a single request when removing a frame (previously racy)", async () => {
      const cues = [
        buildCue({ id: "c1", index: 2 }),
        buildCue({ id: "c2", index: 3 }),
        buildCue({ id: "c3", index: 4 }),
      ]
      renderWithFrames(cues, 6)

      await act(async () => {
        fireEvent.click(screen.getAllByLabelText("Remove Frame")[0])
      })

      await waitFor(() => {
        expect(shiftPresentationIndexes).toHaveBeenCalledWith(
          "presentation-1",
          1,
          "left"
        )
      })
      expect(shiftPresentationIndexes).toHaveBeenCalledTimes(1)
      expect(mockShowToast).toHaveBeenCalledWith(
        expect.objectContaining({
          description: expect.stringContaining("Moved 3 element(s) backwards"),
        })
      )
      expect(mockShowToast).not.toHaveBeenCalledWith(
        expect.objectContaining({ title: "Error" })
      )
    })

    it("shows an error and skips the index-count update when the removal shift request fails", async () => {
      const cues = [buildCue({ id: "c1", index: 2 })]
      renderWithFrames(cues, 4)
      mockDispatch.mockImplementation((action) =>
        action?.type === "MOCK_SHIFT_INDEXES"
          ? Promise.reject(new Error("shift failed"))
          : Promise.resolve({})
      )

      await act(async () => {
        fireEvent.click(screen.getAllByLabelText("Remove Frame")[0])
      })

      await waitFor(() => {
        expect(mockShowToast).toHaveBeenCalledWith(
          expect.objectContaining({ title: "Error" })
        )
      })
      expect(decrementIndexCount).not.toHaveBeenCalled()
      expect(saveIndexCount).not.toHaveBeenCalled()
    })

    it("delegates to the confirmation dialog instead of shifting directly when the removed frame has a cue on it", async () => {
      const cues = [buildCue({ id: "c1", index: 1 })]
      renderWithFrames(cues, 3)

      await act(async () => {
        fireEvent.click(screen.getAllByLabelText("Remove Frame")[0])
      })

      expect(screen.getByTestId("mock-alert-dialog")).toBeInTheDocument()
      expect(
        screen.getByText(/Frame 1 has existing elements/)
      ).toBeInTheDocument()
      expect(shiftPresentationIndexes).not.toHaveBeenCalled()
    })

    it("removes the cue, shifts remaining cues after it, and shrinks the index count after confirming removal of a frame with a cue", async () => {
      const cues = [
        buildCue({ id: "c1", index: 1 }),
        buildCue({ id: "c2", index: 2 }),
      ]
      renderWithFrames(cues, 4)

      await act(async () => {
        fireEvent.click(screen.getAllByLabelText("Remove Frame")[0])
      })
      await act(async () => {
        fireEvent.click(screen.getByTestId("confirm-dialog-confirm"))
      })

      expect(removeCue).toHaveBeenCalledWith("presentation-1", "c1")
      expect(shiftPresentationIndexes).toHaveBeenCalledWith(
        "presentation-1",
        1,
        "left"
      )
      expect(mockShowToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Removed frame in between and its elements",
          description: expect.stringContaining("Moved 1 element(s) backwards"),
        })
      )
      expect(decrementIndexCount).toHaveBeenCalled()
      expect(saveIndexCount).toHaveBeenCalledWith({
        id: "presentation-1",
        indexCount: 3,
      })
    })

    it("removes the cue and shrinks the index count without shifting when there is nothing after the removed frame", async () => {
      const cues = [buildCue({ id: "c1", index: 1 })]
      renderWithFrames(cues, 3)

      await act(async () => {
        fireEvent.click(screen.getAllByLabelText("Remove Frame")[0])
      })
      await act(async () => {
        fireEvent.click(screen.getByTestId("confirm-dialog-confirm"))
      })

      expect(removeCue).toHaveBeenCalledWith("presentation-1", "c1")
      expect(shiftPresentationIndexes).not.toHaveBeenCalled()
      expect(mockShowToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Removed frame in between and its elements",
        })
      )
      expect(decrementIndexCount).toHaveBeenCalled()
      expect(saveIndexCount).toHaveBeenCalledWith({
        id: "presentation-1",
        indexCount: 2,
      })
    })

    it("skips shrinking the index count when the shift fails while removing a frame with a cue on it", async () => {
      const cues = [
        buildCue({ id: "c1", index: 1 }),
        buildCue({ id: "c2", index: 2 }),
      ]
      renderWithFrames(cues, 4)
      mockDispatch.mockImplementation((action) =>
        action?.type === "MOCK_SHIFT_INDEXES"
          ? Promise.reject(new Error("shift failed"))
          : Promise.resolve({})
      )

      await act(async () => {
        fireEvent.click(screen.getAllByLabelText("Remove Frame")[0])
      })
      await act(async () => {
        fireEvent.click(screen.getByTestId("confirm-dialog-confirm"))
      })

      await waitFor(() => {
        expect(mockShowToast).toHaveBeenCalledWith(
          expect.objectContaining({ title: "Error" })
        )
      })
      expect(decrementIndexCount).not.toHaveBeenCalled()
      expect(saveIndexCount).not.toHaveBeenCalled()
    })
  })

  describe("screen count add/remove", () => {
    const audioCue = {
      _id: "audio-1",
      index: 0,
      screen: 3,
      name: "Audio 1",
      cueType: "audio",
      color: "#112233",
      loop: false,
      file: {
        type: "audio/mpeg",
        url: "https://example.com/audio-1.mp3",
        name: "audio-1.mp3",
      },
    }

    beforeEach(() => {
      mockDispatch.mockImplementation(() => Promise.resolve({}))
    })

    const renderWithScreenCount = (customCues, customScreenCount) => {
      useSelector.mockImplementation((selector) =>
        selector({
          presentation: {
            cues: customCues,
            name: "Test presentation",
            screenCount: customScreenCount,
            indexCount: 3,
          },
        })
      )
      return render(
        <EditMode
          id="presentation-1"
          cues={customCues}
          isToolboxOpen={false}
          setIsToolboxOpen={jest.fn()}
          cueIndex={0}
          isAudioMuted={false}
          toggleAudioMute={jest.fn()}
          indexCount={3}
        />
      )
    }

    it("relies on the server to reposition the audio cue instead of updating it directly, then refetches", async () => {
      renderWithScreenCount([audioCue], 2)

      await act(async () => {
        fireEvent.click(screen.getAllByLabelText("Remove screen")[0])
      })

      await waitFor(() => {
        expect(saveScreenCount).toHaveBeenCalledWith({
          id: "presentation-1",
          screenCount: 1,
        })
      })
      expect(updatePresentation).not.toHaveBeenCalled()
      expect(fetchPresentationInfo).toHaveBeenCalledWith("presentation-1")
    })
  })
})

describe("EditMode layer and audio track management", () => {
  const renderWithCues = (customCues, screenCount = 2) => {
    useSelector.mockImplementation((selector) =>
      selector({
        presentation: {
          cues: customCues,
          name: "Test presentation",
          screenCount,
          indexCount: 3,
        },
      })
    )
    return render(
      <EditMode
        id="presentation-1"
        cues={customCues}
        isToolboxOpen={false}
        setIsToolboxOpen={jest.fn()}
        cueIndex={0}
        isAudioMuted={false}
        toggleAudioMute={jest.fn()}
        indexCount={3}
      />
    )
  }

  beforeEach(() => {
    jest.clearAllMocks()
    useDispatch.mockReturnValue(mockDispatch)
    mockDragScenario = null
  })

  it("adds a new empty layer to a screen", () => {
    const cues = [
      {
        _id: "l1-cue",
        index: 0,
        screen: 1,
        layer: 0,
        name: "L1 cue",
        color: "#ffffff",
        cueType: "visual",
        file: null,
      },
    ]

    renderWithCues(cues)

    expect(
      screen.queryByLabelText("Remove layer from screen 1")
    ).not.toBeInTheDocument()

    fireEvent.click(screen.getByLabelText("Add layer to screen 1"))

    expect(
      screen.getByLabelText("Remove layer from screen 1")
    ).toBeInTheDocument()
  })

  it("removes a visual layer, shifting cues above it down and showing a success toast", async () => {
    const cues = [
      {
        _id: "l1-cue",
        index: 0,
        screen: 1,
        layer: 0,
        name: "L1 cue",
        color: "#ffffff",
        cueType: "visual",
        file: null,
      },
      {
        _id: "l2-cue",
        index: 0,
        screen: 1,
        layer: 1,
        name: "L2 cue",
        color: "#ffffff",
        cueType: "visual",
        file: null,
      },
      {
        _id: "l3-cue",
        index: 0,
        screen: 1,
        layer: 2,
        name: "L3 cue",
        color: "#ffffff",
        cueType: "visual",
        file: null,
      },
      {
        _id: "l4-cue",
        index: 1,
        screen: 1,
        layer: 3,
        name: "L4 cue",
        color: "#ffffff",
        cueType: "visual",
        file: null,
      },
    ]

    renderWithCues(cues)

    fireEvent.click(screen.getAllByLabelText("Remove layer from screen 1")[0])

    await waitFor(() => {
      expect(removeCue).toHaveBeenCalledWith("presentation-1", "l2-cue")
    })

    await waitFor(() => {
      expect(updatePresentation).toHaveBeenCalledWith(
        "presentation-1",
        expect.objectContaining({ cueName: "L3 cue", layer: 1 }),
        "l3-cue"
      )
    })

    await waitFor(() => {
      expect(updatePresentation).toHaveBeenCalledWith(
        "presentation-1",
        expect.objectContaining({ cueName: "L4 cue", layer: 2 }),
        "l4-cue"
      )
    })

    await waitFor(() => {
      expect(mockShowToast).toHaveBeenCalledWith({
        title: "Layer removed",
        description: "Layer 2 removed from screen 1",
        status: "success",
      })
    })
  })

  it("shows an error and refetches the presentation when removing a layer fails", async () => {
    const cues = [
      {
        _id: "l1-cue",
        index: 0,
        screen: 1,
        layer: 0,
        name: "L1 cue",
        color: "#ffffff",
        cueType: "visual",
        file: null,
      },
      {
        _id: "l2-cue",
        index: 0,
        screen: 1,
        layer: 1,
        name: "L2 cue",
        color: "#ffffff",
        cueType: "visual",
        file: null,
      },
    ]

    mockDispatch.mockImplementationOnce(() =>
      Promise.reject(new Error("remove failed"))
    )

    renderWithCues(cues)

    fireEvent.click(screen.getByLabelText("Remove layer from screen 1"))

    await waitFor(() => {
      expect(mockShowToast).toHaveBeenCalledWith({
        title: "Error",
        description: "remove failed",
        status: "error",
      })
    })

    expect(fetchPresentationInfo).toHaveBeenCalledWith("presentation-1")
  })

  it("adds a new empty audio track", () => {
    renderWithCues([])

    expect(screen.queryByText("A2")).not.toBeInTheDocument()

    fireEvent.click(screen.getByLabelText("Add audio track"))

    expect(screen.getByText("A2")).toBeInTheDocument()
  })

  it("stacks collapsed-preview cues by layer and falls back to layer 0 when a cue has no layer", () => {
    const cues = [
      {
        _id: "l1-cue",
        index: 0,
        screen: 1,
        name: "L1 cue",
        color: "#111111",
        cueType: "visual",
        file: null,
      },
      {
        _id: "l2-cue",
        index: 0,
        screen: 1,
        layer: 2,
        name: "L2 cue",
        color: "#222222",
        cueType: "visual",
        file: null,
      },
      {
        _id: "l3-cue",
        index: 0,
        screen: 1,
        layer: 1,
        name: "L3 cue",
        color: "#333333",
        cueType: "visual",
        file: null,
      },
      {
        _id: "l4-cue",
        index: 0,
        screen: 1,
        layer: 3,
        name: "L4 image cue",
        cueType: "visual",
        file: { url: "https://example.com/preview.jpg", type: "image/jpeg" },
      },
      {
        _id: "l5-cue",
        index: 0,
        screen: 1,
        layer: 4,
        name: "L5 video cue",
        cueType: "visual",
        file: { url: "https://example.com/preview.mp4", type: "video/mp4" },
      },
    ]

    renderWithCues(cues)

    fireEvent.click(screen.getAllByLabelText("Collapse row group")[0])

    const preview = screen.getByTestId("collapsed-preview-screen-1-0")
    expect(preview).toBeInTheDocument()
    expect(preview.textContent).toContain("L1 cue")
    expect(
      preview.querySelector('img[src="https://example.com/preview.jpg"]')
    ).toBeTruthy()
    expect(
      preview.querySelector('video[src="https://example.com/preview.mp4"]')
    ).toBeTruthy()
  })
})
