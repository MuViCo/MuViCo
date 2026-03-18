import React from "react"
import { render, fireEvent, screen, waitFor } from "@testing-library/react"
import "@testing-library/jest-dom"
import GridLayoutComponent from "../../components/presentation/GridLayoutComponent"
import { useDispatch } from "react-redux"
import { updatePresentation, removeCue } from "../../redux/presentationReducer"
import { buildCueCellMap } from "../../components/utils/cueGridUtils"

const mockDispatch = jest.fn(() => Promise.resolve({}))
const mockShowToast = jest.fn()
let mockDragScenario = null
let mockResizeScenario = null
let lastGridLayoutProps = null

jest.mock("react-redux", () => ({
  useDispatch: jest.fn(),
}))

jest.mock("../../redux/presentationReducer", () => ({
  updatePresentation: jest.fn(() => ({ type: "MOCK_UPDATE_PRESENTATION" })),
  removeCue: jest.fn(() => ({ type: "MOCK_REMOVE_CUE" })),
}))

jest.mock("../../components/utils/toastUtils", () => ({
  useCustomToast: () => mockShowToast,
}))

jest.mock("react-grid-layout", () => {
  return function MockGridLayout(props) {
    const { children, onDragStop, onResizeStop } = props
    lastGridLayoutProps = props

    const scenarios = {
      visualToEmptyVisual: {
        oldItem: { i: "visual-1", x: 0, y: 8 },
        newItem: { i: "visual-1", x: 0, y: 0 },
      },
      visualSwapVisual: {
        oldItem: { i: "visual-1", x: 0, y: 0 },
        newItem: { i: "visual-1", x: 1, y: 0 },
      },
      visualToAudio: {
        oldItem: { i: "visual-1", x: 0, y: 0 },
        newItem: { i: "visual-1", x: 0, y: 8 },
      },
      audioToEmptyAudio: {
        oldItem: { i: "audio-1", x: 0, y: 8 },
        newItem: { i: "audio-1", x: 1, y: 8 },
      },
      audioSwapAudio: {
        oldItem: { i: "audio-1", x: 0, y: 8 },
        newItem: { i: "audio-1", x: 2, y: 8 },
      },
      visualIntoSpannedCell: {
        oldItem: { i: "visual-1", x: 0, y: 0 },
        newItem: { i: "visual-1", x: 2, y: 1 },
      },
    }

    const resizeScenarios = {
      resizeVisualCue: {
        oldItem: { i: "visual-1", x: 0, y: 0, w: 1, h: 1 },
        newItem: { i: "visual-1", x: 0, y: 0, w: 3, h: 1 },
      },
    }

    const runScenario = () => {
      const scenario = scenarios[mockDragScenario]
      if (!scenario) {
        return
      }
      onDragStop([], scenario.oldItem, scenario.newItem)
    }

    const runResizeScenario = () => {
      const scenario = resizeScenarios[mockResizeScenario]
      if (!scenario) {
        return
      }
      onResizeStop([], scenario.oldItem, scenario.newItem)
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
        <button
          type="button"
          data-testid="trigger-resize-stop"
          onClick={runResizeScenario}
        >
          trigger-resize
        </button>
        {children}
      </div>
    )
  }
})

describe("GridLayoutComponent drag constraints", () => {
  const baseProps = {
    id: "presentation-1",
    setStatus: jest.fn(),
    setCopiedCue: jest.fn(),
    setIsCopied: jest.fn(),
    columnWidth: 150,
    rowHeight: 100,
    gap: 10,
    isShowMode: false,
    cueIndex: 0,
    isAudioMuted: false,
    setSelectedCue: jest.fn(),
    setIsToolboxOpen: jest.fn(),
    indexCount: 10,
    setShowAlert: jest.fn(),
    setAlertData: jest.fn(),
    screenCount: 8,
  }

  const renderGrid = (cues, layout) => {
    return render(
      <GridLayoutComponent
        {...baseProps}
        cues={cues}
        layout={layout}
        cueByGridCell={buildCueCellMap(cues)}
      />
    )
  }

  beforeEach(() => {
    jest.clearAllMocks()
    useDispatch.mockReturnValue(mockDispatch)
    mockDragScenario = null
    mockResizeScenario = null
    lastGridLayoutProps = null
  })

  it("uses horizontal-only resize handles and locked height constraints", () => {
    const cues = [
      {
        _id: "visual-1",
        index: 0,
        screen: 1,
        name: "Visual cue",
        cueType: "visual",
        file: { type: "image/png", url: "https://example.com/image.png", name: "image.png" },
      },
    ]

    renderGrid(cues, [{ i: "visual-1", x: 0, y: 0, w: 1, h: 1, static: false }])

    expect(lastGridLayoutProps.isResizable).toBe(true)
    expect(lastGridLayoutProps.resizeHandles).toEqual(["e", "w"])

    const firstCue = React.Children.toArray(lastGridLayoutProps.children)[0]
    expect(firstCue.props["data-grid"]).toEqual(expect.objectContaining({
      w: 1,
      h: 1,
      minW: 1,
      minH: 1,
      maxH: 1,
    }))
  })

  it("persists cue width on resize stop", async () => {
    mockResizeScenario = "resizeVisualCue"

    const cues = [
      {
        _id: "visual-1",
        index: 0,
        screen: 1,
        name: "Visual cue",
        color: "#ffffff",
        cueType: "visual",
        file: {
          type: "image/png",
          url: "https://example.com/image.png",
          name: "image.png",
        },
      },
    ]

    renderGrid(cues, [{ i: "visual-1", x: 0, y: 0, w: 1, h: 1, static: false }])

    fireEvent.click(screen.getByTestId("trigger-resize-stop"))

    await waitFor(() => {
      expect(updatePresentation).toHaveBeenCalledWith("presentation-1", {
        cueId: "visual-1",
        index: 0,
        screen: 1,
        cueWidth: 3,
        cueName: "Visual cue",
        color: "#ffffff",
      })
    })
  })

  it("treats spanned cells as occupied to avoid invalid direct move updates", () => {
    mockDragScenario = "visualIntoSpannedCell"

    const cues = [
      {
        _id: "visual-1",
        index: 0,
        screen: 1,
        name: "Visual cue 1",
        color: "#ffffff",
        cueType: "visual",
        cueWidth: 1,
        file: { type: "image/png", url: "https://example.com/1.png", name: "1.png" },
      },
      {
        _id: "visual-2",
        index: 1,
        screen: 2,
        cueWidth: 2,
        name: "Visual cue 2",
        color: "#000000",
        cueType: "visual",
        file: { type: "image/png", url: "https://example.com/2.png", name: "2.png" },
      },
    ]

    renderGrid(cues, [
      { i: "visual-1", x: 0, y: 0, w: 1, h: 1, static: false },
      { i: "visual-2", x: 1, y: 1, w: 2, h: 1, static: false },
    ])

    fireEvent.click(screen.getByTestId("trigger-drag-stop"))

    expect(updatePresentation).not.toHaveBeenCalled()
  })

  it("visual cue can be moved to an empty visual row slot", async () => {
    mockDragScenario = "visualToEmptyVisual"

    const cues = [
      {
        _id: "visual-1",
        index: 0,
        screen: 9,
        name: "Visual cue",
        color: "#ffffff",
        loop: false,
        cueType: "visual",
        file: {
          type: "image/png",
          url: "https://example.com/image.png",
          name: "image.png",
        },
      },
    ]

    renderGrid(cues, [{ i: "visual-1", x: 0, y: 8, w: 1, h: 1, static: false }])

    fireEvent.click(screen.getByTestId("trigger-drag-stop"))

    await waitFor(() => {
      expect(updatePresentation).toHaveBeenCalledWith("presentation-1", {
        cueId: "visual-1",
        index: 0,
        screen: 1,
        cueName: "Visual cue",
        color: "#ffffff",
      })
    })

    expect(mockDispatch).toHaveBeenCalled()
    expect(removeCue).not.toHaveBeenCalled()
    expect(mockShowToast).not.toHaveBeenCalledWith(
      expect.objectContaining({ title: "Cannot move this file type here" })
    )
  })

  it("visual cue can be swapped with another visual cue", () => {
    mockDragScenario = "visualSwapVisual"

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

    renderGrid(cues, [
      { i: "visual-1", x: 0, y: 0, w: 1, h: 1, static: false },
      { i: "visual-2", x: 1, y: 0, w: 1, h: 1, static: false },
    ])

    fireEvent.click(screen.getByTestId("trigger-drag-stop"))

    expect(updatePresentation).not.toHaveBeenCalled()
    expect(mockShowToast).not.toHaveBeenCalledWith(
      expect.objectContaining({ title: "Cannot move this file type here" })
    )
  })

  it("visual cue cannot be moved to audio row", () => {
    mockDragScenario = "visualToAudio"

    const cues = [
      {
        _id: "visual-1",
        index: 0,
        screen: 1,
        name: "Visual cue",
        color: "#ffffff",
        cueType: "visual",
        file: { type: "image/png", url: "https://example.com/image.png", name: "image.png" },
      },
    ]

    renderGrid(cues, [{ i: "visual-1", x: 0, y: 0, w: 1, h: 1, static: false }])

    fireEvent.click(screen.getByTestId("trigger-drag-stop"))

    expect(updatePresentation).not.toHaveBeenCalled()
    expect(mockShowToast).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Cannot move this file type here" })
    )
  })

  it("audio cue can be moved to an empty audio row slot", async () => {
    mockDragScenario = "audioToEmptyAudio"

    const cues = [
      {
        _id: "audio-1",
        index: 0,
        screen: 9,
        name: "Audio cue",
        color: "#ffffff",
        cueType: "audio",
        file: { type: "audio/mpeg", url: "https://example.com/audio.mp3", name: "audio.mp3" },
      },
    ]

    renderGrid(cues, [{ i: "audio-1", x: 0, y: 8, w: 1, h: 1, static: false }])

    fireEvent.click(screen.getByTestId("trigger-drag-stop"))

    await waitFor(() => {
      expect(updatePresentation).toHaveBeenCalledWith("presentation-1", {
        cueId: "audio-1",
        index: 1,
        screen: 9,
        cueName: "Audio cue",
        color: "#ffffff",
      })
    })

    expect(mockShowToast).not.toHaveBeenCalledWith(
      expect.objectContaining({ title: "Cannot move this file type here" })
    )
  })

  it("audio cue can be swapped with audio cue", () => {
    mockDragScenario = "audioSwapAudio"

    const cues = [
      {
        _id: "audio-1",
        index: 0,
        screen: 9,
        name: "Audio cue 1",
        color: "#ffffff",
        cueType: "audio",
        file: { type: "audio/mpeg", url: "https://example.com/a1.mp3", name: "a1.mp3" },
      },
      {
        _id: "audio-2",
        index: 2,
        screen: 9,
        name: "Audio cue 2",
        color: "#000000",
        cueType: "audio",
        file: { type: "audio/mpeg", url: "https://example.com/a2.mp3", name: "a2.mp3" },
      },
    ]

    renderGrid(cues, [
      { i: "audio-1", x: 0, y: 8, w: 1, h: 1, static: false },
      { i: "audio-2", x: 2, y: 8, w: 1, h: 1, static: false },
    ])

    fireEvent.click(screen.getByTestId("trigger-drag-stop"))

    expect(updatePresentation).not.toHaveBeenCalled()
    expect(mockShowToast).not.toHaveBeenCalledWith(
      expect.objectContaining({ title: "Cannot move this file type here" })
    )
  })
})
