import React from "react"
import { render, screen } from "@testing-library/react"
import "@testing-library/jest-dom"
import GridLayoutComponent from "../../components/presentation/GridLayoutComponent"
import { useDispatch } from "react-redux"

const mockDispatch = jest.fn(() => Promise.resolve({}))
const mockShowToast = jest.fn()

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

describe("GridLayoutComponent", () => {
  const baseProps = {
    id: "presentation-1",
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

  const renderGrid = (cues, layout, extraProps = {}) => {
    return render(
      <GridLayoutComponent
        {...baseProps}
        {...extraProps}
        cues={cues}
        layout={layout}
      />
    )
  }

  beforeEach(() => {
    jest.clearAllMocks()
    useDispatch.mockReturnValue(mockDispatch)
  })

  it("renders cues inside the native grid container", () => {
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

    expect(screen.getByTestId("cue-grid-layout")).toBeInTheDocument()
    expect(screen.getByTestId("cue-Visual cue")).toBeInTheDocument()
  })

  it("renders continuation overlay only for auto-expanded cue area", () => {
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
      { i: "visual-2", x: 1, y: 0, w: 9, h: 1, static: false },
    ])

    expect(screen.queryByTestId("cue-continuation-overlay-visual-1")).not.toBeInTheDocument()
    expect(screen.getByTestId("cue-continuation-overlay-visual-2")).toBeInTheDocument()
    expect(screen.getByTestId("cue-label-visual-1")).toBeInTheDocument()
  })

  it("renders drag-origin indicator only for the dragging cue", () => {
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
    ]

    const layout = [{ i: "visual-1", x: 0, y: 0, w: 1, h: 1, static: false }]

    const { rerender } = renderGrid(cues, layout, {
      isDragging: false,
      draggingCueId: null,
    })

    expect(screen.queryByTestId("cue-drag-origin-indicator-visual-1")).not.toBeInTheDocument()

    rerender(
      <GridLayoutComponent
        {...baseProps}
        cues={cues}
        layout={layout}
        isDragging={true}
        draggingCueId="visual-1"
      />
    )

    expect(screen.getByTestId("cue-drag-origin-indicator-visual-1")).toBeInTheDocument()
  })

  it("applies preview span overrides for continuation shrink rendering", () => {
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
        index: 3,
        screen: 1,
        name: "Visual cue 2",
        color: "#000000",
        cueType: "visual",
        file: { type: "image/png", url: "https://example.com/2.png", name: "2.png" },
      },
    ]

    const layout = [
      { i: "visual-1", x: 0, y: 0, w: 3, h: 1, static: false },
      { i: "visual-2", x: 3, y: 0, w: 1, h: 1, static: false },
    ]

    const { rerender } = renderGrid(cues, layout)
    expect(screen.getByTestId("cue-continuation-overlay-visual-1")).toBeInTheDocument()

    rerender(
      <GridLayoutComponent
        {...baseProps}
        cues={cues}
        layout={layout}
        previewCueSpanOverrides={{ "visual-1": 1 }}
      />
    )

    expect(screen.getByTestId("cue-continuation-overlay-visual-1")).toHaveStyle({
      opacity: "0.76",
    })
  })
})
