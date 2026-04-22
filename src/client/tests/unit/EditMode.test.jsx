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
import { useDispatch, useSelector } from "react-redux"
import {
  createCue,
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

  const renderEditMode = (customCues = cues, customIndexCount = 3) => {
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
      top: "175px",
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

  it("shows and hides drag placement preview while dragging", async () => {
    renderEditMode()
    const gridContainer = setupGridGeometry()

    fireEvent.mouseDown(screen.getByTestId("cue-Visual cue 1"), {
      clientX: 10,
      clientY: 120,
      button: 0,
    })

    const placementPreview = screen.getByTestId("drag-placement-preview")
    expect(placementPreview).toHaveStyle({ display: "block" })

    fireEvent.mouseMove(gridContainer, {
      clientX: 170,
      clientY: 120,
    })

    await waitFor(() => {
      expect(placementPreview).toHaveStyle({ display: "block" })
    })

    fireEvent.mouseUp(gridContainer, {
      clientX: 170,
      clientY: 120,
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
      clientY: 120,
      button: 0,
    })

    fireEvent.mouseMove(gridContainer, {
      clientX: 170,
      clientY: 120,
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
      clientY: 120,
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
      clientY: 120,
      button: 0,
    })

    fireEvent.mouseMove(gridContainer, {
      clientX: 330,
      clientY: 120,
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
      clientY: 120,
    })

    await act(async () => {
      fireEvent.drop(dropArea, {
        dataTransfer,
        clientX: 330,
        clientY: 120,
      })
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

  it("does not block pool cue drops on occupied anchor slots", async () => {
    renderEditMode()
    const gridContainer = setupGridGeometry()
    const dropArea = screen.getByTestId("drop-area")
    const dataTransfer = buildPoolColorDragDataTransfer()

    fireEvent.dragOver(gridContainer, {
      dataTransfer,
      clientX: 170,
      clientY: 120,
    })

    await act(async () => {
      fireEvent.drop(dropArea, {
        dataTransfer,
        clientX: 170,
        clientY: 120,
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
      clientY: 120,
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
      value: 120,
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
      clientY: 120,
    })

    await waitFor(() => {
      expect(screen.getByTestId("copy-drag-placement-preview")).toHaveStyle({
        transform: "translate3d(320px, 65px, 0)",
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
      clientY: 120,
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
        clientY: 120,
      })

      fireEvent.click(screen.getByTestId("cue-Visual cue 2"), {
        clientX: 330,
        clientY: 120,
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
      clientY: 120,
      button: 0,
    })

    await waitFor(() => {
      expect(screen.getByTestId("drag-cursor-preview")).toHaveStyle({
        transform: "translate3d(180px, 130px, 0)",
      })
    })
  })

  it("starts dragging when clicking continuation area", async () => {
    renderEditMode()
    const gridContainer = setupGridGeometry()

    // xIndex=2, yIndex=1 points to continuation area of visual-2 with current test setup.
    fireEvent.mouseDown(screen.getByTestId("cue-Visual cue 2"), {
      clientX: 330,
      clientY: 120,
      button: 0,
    })

    await waitFor(() => {
      expect(screen.getByTestId("drag-placement-preview")).toHaveStyle({
        transform: "translate3d(160px, 65px, 0)",
      })
    })

    fireEvent.mouseMove(gridContainer, {
      clientX: 340,
      clientY: 120,
    })

    await waitFor(() => {
      expect(screen.getByTestId("drag-cursor-preview")).toBeInTheDocument()
      expect(screen.getByTestId("drag-placement-preview")).toHaveStyle({
        display: "block",
        transform: "translate3d(320px, 65px, 0)",
      })
    })
  })

  it("does not move cue when clicking continuation area without moving pointer", async () => {
    renderEditMode()
    const gridContainer = setupGridGeometry()

    fireEvent.mouseDown(screen.getByTestId("cue-Visual cue 2"), {
      clientX: 330,
      clientY: 120,
      button: 0,
    })

    await act(async () => {
      fireEvent.mouseUp(gridContainer, {
        clientX: 330,
        clientY: 120,
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
      clientY: 120,
      button: 0,
    })

    fireEvent.mouseMove(gridContainer, {
      clientX: 340,
      clientY: 120,
    })

    await act(async () => {
      fireEvent.mouseUp(gridContainer, {
        clientX: 340,
        clientY: 120,
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
        clientY: 120,
        button: 0,
      })
    )

    expect(defaultWasNotPrevented).toBe(false)
  })
})
