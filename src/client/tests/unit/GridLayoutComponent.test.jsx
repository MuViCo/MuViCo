
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import "@testing-library/jest-dom"
import GridLayoutComponent from "../../components/presentation/GridLayoutComponent"
import { useDispatch } from "react-redux"
import { removeCue, updatePresentation } from "../../redux/presentationReducer"

const mockDispatch = jest.fn(() => Promise.resolve({}))
const mockShowToast = jest.fn()
const mockGridLayout = jest.fn(({ children }) => (
  <div data-testid="mock-grid-layout">{children}</div>
))

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
    return mockGridLayout(props)
  }
})

describe("GridLayoutComponent", () => {
  const baseProps = {
    id: "presentation-1",
    setCopiedCue: jest.fn(),
    setIsCopied: jest.fn(),
    columnWidth: 150,
    rowHeight: 100,
    gap: 10,
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

  it("does not wire deprecated onDragStop behavior", () => {
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

    const firstCallProps = mockGridLayout.mock.calls[0][0]
    expect(firstCallProps.isDraggable).toBe(false)
    expect(firstCallProps.onDragStop).toBeUndefined()
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

    renderGrid(cues, [
      { i: "visual-1", x: 0, y: 0, w: 1, h: 1, static: false },
      { i: "visual-2", x: 1, y: 0, w: 9, h: 1, static: false },
    ])

    expect(
      screen.queryByTestId("cue-continuation-overlay-visual-1")
    ).not.toBeInTheDocument()
    expect(
      screen.getByTestId("cue-continuation-overlay-visual-2")
    ).toBeInTheDocument()
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
        file: {
          type: "image/png",
          url: "https://example.com/1.png",
          name: "1.png",
        },
      },
    ]

    const layout = [{ i: "visual-1", x: 0, y: 0, w: 1, h: 1, static: false }]

    const { rerender } = renderGrid(cues, layout, {
      isDragging: false,
      draggingCueId: null,
    })

    expect(
      screen.queryByTestId("cue-drag-origin-indicator-visual-1")
    ).not.toBeInTheDocument()

    rerender(
      <GridLayoutComponent
        {...baseProps}
        cues={cues}
        layout={layout}
        isDragging={true}
        draggingCueId="visual-1"
      />
    )

    expect(
      screen.getByTestId("cue-drag-origin-indicator-visual-1")
    ).toBeInTheDocument()
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
        file: {
          type: "image/png",
          url: "https://example.com/1.png",
          name: "1.png",
        },
      },
      {
        _id: "visual-2",
        index: 3,
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

    const layout = [
      { i: "visual-1", x: 0, y: 0, w: 3, h: 1, static: false },
      { i: "visual-2", x: 3, y: 0, w: 1, h: 1, static: false },
    ]

    const { rerender } = renderGrid(cues, layout)
    expect(
      screen.getByTestId("cue-continuation-overlay-visual-1")
    ).toBeInTheDocument()

    rerender(
      <GridLayoutComponent
        {...baseProps}
        cues={cues}
        layout={layout}
        previewCueSpanOverrides={{ "visual-1": 1 }}
      />
    )

    expect(screen.getByTestId("cue-continuation-overlay-visual-1")).toHaveStyle(
      {
        opacity: "0.76",
      }
    )
  })

  it("renders video media for visual video cues", () => {
    const cues = [
      {
        _id: "video-1",
        index: 0,
        screen: 1,
        name: "Video cue",
        color: "#ffffff",
        cueType: "visual",
        file: {
          type: "video/mp4",
          url: "https://example.com/video.mp4",
          name: "video.mp4",
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

    const { container } = renderGrid(cues, [
      { i: "video-1", x: 0, y: 0, w: 1, h: 1, static: false },
      { i: "visual-2", x: 1, y: 0, w: 9, h: 1, static: false },
    ])

    expect(
      container.querySelector('video[src="https://example.com/video.mp4"]')
    ).toBeInTheDocument()
  })

  it("does not render audio media when cue index is before cue", () => {
    const cues = [
      {
        _id: "audio-1",
        index: 1,
        screen: 3,
        name: "Audio cue 1",
        color: "#ffffff",
        cueType: "audio",
        file: {
          type: "audio/mpeg",
          url: "https://example.com/audio-1.mp3",
          name: "audio-1.mp3",
        },
        loop: false,
      },
    ]

    const { container } = renderGrid(
      cues,
      [{ i: "audio-1", x: 1, y: 2, w: 9, h: 1, static: false }],
      {
        cueIndex: 0,
        screenCount: 2,
      }
    )

    expect(container.querySelector("audio")).not.toBeInTheDocument()
  })

  it("handles copy action from cue menu", async () => {
    const setCopiedCue = jest.fn()
    const setIsCopied = jest.fn()
    const setShowAlert = jest.fn()
    const setAlertData = jest.fn()
    const cue = {
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
    }

    renderGrid(
      [cue],
      [{ i: "visual-1", x: 0, y: 0, w: 10, h: 1, static: false }],
      {
        setCopiedCue,
        setIsCopied,
        setShowAlert,
        setAlertData,
      }
    )

    fireEvent.click(screen.getByTestId("cue-menu-button-visual-1"))
    fireEvent.mouseUp(screen.getByLabelText("Copy Visual cue"))

    await waitFor(() => {
      expect(setIsCopied).toHaveBeenCalledWith(true)
      expect(setCopiedCue).toHaveBeenCalledWith(cue)
      expect(setShowAlert).toHaveBeenCalledWith(true)
      expect(setAlertData).toHaveBeenCalled()
    })
  })

  it("handles delete action from cue menu", async () => {
    const cue = {
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
    }

    renderGrid(
      [cue],
      [{ i: "visual-1", x: 0, y: 0, w: 10, h: 1, static: false }]
    )

    fireEvent.click(screen.getByTestId("cue-menu-button-visual-1"))
    fireEvent.mouseDown(screen.getByLabelText("Delete Visual cue"))

    fireEvent.click(await screen.findByRole("button", { name: "Yes" }))

    await waitFor(() => {
      expect(removeCue).toHaveBeenCalledWith("presentation-1", "visual-1")
    })
  })

  it("handles loop toggle action for audio cue", async () => {
    mockDispatch.mockResolvedValueOnce({
      payload: {
        loop: true,
        name: "Audio cue",
      },
    })

    const cue = {
      _id: "audio-1",
      index: 0,
      screen: 3,
      name: "Audio cue",
      color: "#ffffff",
      cueType: "audio",
      file: {
        type: "audio/mpeg",
        url: "https://example.com/audio.mp3",
        name: "audio.mp3",
      },
      loop: false,
    }

    renderGrid(
      [cue],
      [{ i: "audio-1", x: 0, y: 2, w: 10, h: 1, static: false }]
    )

    fireEvent.click(screen.getByTestId("cue-menu-button-audio-1"))
    fireEvent.mouseDown(screen.getByLabelText("Loop audio Audio cue"))

    await waitFor(() => {
      expect(updatePresentation).toHaveBeenCalledWith(
        "presentation-1",
        expect.objectContaining({
          cueId: "audio-1",
          loop: true,
        })
      )
    })
  })
})
