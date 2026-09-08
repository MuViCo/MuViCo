import React from "react"
import { act, fireEvent, render, screen } from "@testing-library/react"
import "@testing-library/jest-dom"
import ShowMode from "../../components/presentation/ShowMode"

jest.mock("../../components/utils/keyboardHandler", () => () => null)
jest.mock("../../components/presentation/ShowScoreViewer", () => {
  return function MockShowScoreViewer({ compact }: { compact?: boolean }) {
    return <div data-testid={compact ? "compact-score" : "show-score"} />
  }
})
jest.mock("../../components/presentation/ShowMonitorWindow", () => {
  return function MockShowMonitorWindow({
    children,
  }: {
    children: React.ReactNode
  }) {
    return <div data-testid="monitor-window">{children}</div>
  }
})

const cues = [
  {
    _id: "cue-1",
    cueType: "visual" as const,
    index: 0,
    screen: 1,
    layer: 0,
    opacity: 1,
    name: "Opening image",
    color: "#33283f",
    file: null,
    loop: false,
    continuePlayback: false,
  },
]

const renderShowMode = (overrides = {}) => {
  const props = {
    presentationName: "Concert",
    screenCount: 2,
    scores: [],
    cueIndex: 0,
    indexCount: 4,
    screens: { 1: true, 2: false },
    audioTracks: [],
    autoplayInterval: 5,
    isAutoplaying: false,
    isBlackout: false,
    getActiveCuesForScreen: jest.fn((screenNumber, index) =>
      screenNumber === 1 && index === 0 ? cues : []
    ),
    onSetCueIndex: jest.fn(),
    onPrevious: jest.fn(),
    onNext: jest.fn(),
    onToggleAutoplay: jest.fn(),
    onToggleBlackout: jest.fn(),
    onToggleScreen: jest.fn(),
    onExit: jest.fn(),
    ...overrides,
  }
  const view = render(<ShowMode {...props} />)
  return { ...props, view }
}

describe("ShowMode", () => {
  test("renders the music stand first", () => {
    renderShowMode()

    expect(screen.getByText("Concert")).toBeInTheDocument()
    expect(screen.getByTestId("show-score")).toBeInTheDocument()
    expect(screen.getByText("1 / 2 displays online")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /Music stand/ })).toHaveAttribute(
      "data-active",
      "true"
    )
    expect(
      screen.getByRole("button", { name: /Control room/ })
    ).toHaveAttribute("data-active", "false")
  })

  test("keeps operator previews visible while blackout is active", () => {
    renderShowMode({ isBlackout: true })

    expect(screen.getByText("Output blackout")).toBeInTheDocument()
    expect(screen.getByText("Opening image")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Blackout on" })).toHaveAttribute(
      "data-active",
      "true"
    )
  })

  test("connects transport and exit actions", () => {
    const props = renderShowMode()

    fireEvent.click(screen.getByRole("button", { name: /^GO/ }))
    fireEvent.click(screen.getByRole("button", { name: "Blackout" }))
    fireEvent.click(screen.getByRole("button", { name: "Exit" }))

    expect(props.onNext).toHaveBeenCalledTimes(1)
    expect(props.onToggleBlackout).toHaveBeenCalledTimes(1)
    expect(props.onExit).toHaveBeenCalledTimes(1)
  })

  test("opens an offline display from its tile", () => {
    const props = renderShowMode()

    fireEvent.click(screen.getByRole("button", { name: /Control room/ }))

    fireEvent.click(screen.getByRole("button", { name: "Open display 2" }))

    expect(props.onToggleScreen).toHaveBeenCalledWith(2)
  })

  test("switches to music stand", () => {
    renderShowMode()

    fireEvent.click(screen.getByRole("button", { name: /Control room/ }))
    fireEvent.click(screen.getByRole("button", { name: /Music stand/ }))

    expect(screen.getByTestId("show-score")).toBeInTheDocument()
    expect(screen.getByText("NEXT · Frame 1")).toBeInTheDocument()
  })

  test("opens the selected monitor output", () => {
    renderShowMode()

    fireEvent.click(screen.getByRole("button", { name: "Monitor" }))
    fireEvent.click(screen.getByText("Screen wall"))

    expect(screen.getByTestId("monitor-window")).toBeInTheDocument()
  })

  test("selects marked frames and exposes active audio tracks", () => {
    const props = renderShowMode({
      cueIndex: 1,
      isAutoplaying: true,
      scores: [
        {
          _id: "score-1",
          title: "Concert score",
          source: "upload",
          file: { url: "https://example.com/score.pdf" },
          pageCount: 1,
          markers: [{ _id: "marker-1", page: 1, frameIndex: 2 }],
        },
      ],
      audioTracks: [
        {
          id: "audio-1",
          name: "Background music",
          layer: 1,
          loop: true,
          continuePlayback: true,
        },
      ],
    })

    expect(document.querySelector(".show-cue-marker-dot")).toBeInTheDocument()
    expect(screen.getByText("Background music")).toBeInTheDocument()
    expect(screen.getByText("A2")).toBeInTheDocument()
    expect(screen.getByText("Loop")).toBeInTheDocument()
    expect(screen.getByText("Auto on · 5s")).toBeInTheDocument()

    fireEvent.click(screen.getAllByRole("button", { name: "Go to frame 2" })[0])
    fireEvent.click(screen.getByRole("button", { name: "Previous frame" }))
    fireEvent.click(screen.getByText("Auto on · 5s"))

    expect(props.onSetCueIndex).toHaveBeenCalledWith(2)
    expect(props.onPrevious).toHaveBeenCalledTimes(1)
    expect(props.onToggleAutoplay).toHaveBeenCalledTimes(1)
  })

  test("updates the elapsed time and stops its clock on unmount", () => {
    jest.useFakeTimers()
    const { view } = renderShowMode()

    act(() => jest.advanceTimersByTime(1000))

    expect(screen.getByText("00:00:01")).toBeInTheDocument()
    view.unmount()
    expect(jest.getTimerCount()).toBe(0)
    jest.useRealTimers()
  })

  test("opens and closes the score monitor", () => {
    renderShowMode()

    fireEvent.click(screen.getByRole("button", { name: "Monitor" }))
    fireEvent.click(screen.getByText("Score only"))

    expect(screen.getByTestId("monitor-window")).toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: "Monitor live" })
    ).toBeInTheDocument()

    fireEvent.click(screen.getByRole("button", { name: "Monitor live" }))
    fireEvent.click(screen.getByText("Close monitor"))

    expect(screen.queryByTestId("monitor-window")).not.toBeInTheDocument()
  })

  test("expands the compact score from the control room", () => {
    renderShowMode()

    fireEvent.click(screen.getByRole("button", { name: /Control room/ }))
    fireEvent.click(screen.getByRole("button", { name: "Expand" }))

    expect(screen.getByTestId("show-score")).toBeInTheDocument()
  })
})
