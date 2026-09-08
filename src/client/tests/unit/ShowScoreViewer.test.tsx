import React from "react"
import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import "@testing-library/jest-dom"
import ShowScoreViewer from "../../components/presentation/ShowScoreViewer"
import type { ScoreDocument } from "../../types"

const mockGetDocument = jest.fn()
let resizeCallback: ResizeObserverCallback

jest.mock("pdfjs-dist", () => ({
  GlobalWorkerOptions: { workerSrc: "" },
  getDocument: mockGetDocument,
}))

const score: ScoreDocument = {
  _id: "score-1",
  title: "Concert score",
  source: "upload",
  file: {
    proxyUrl: "/api/presentation/presentation-1/scores/score-1/file",
    url: "https://example.com/score.pdf",
  },
  pageCount: 2,
  markers: [
    {
      _id: "marker-1",
      page: 2,
      frameIndex: 3,
      measureLabel: "m. 12",
      rect: { x: 0.1, y: 0.3, width: 0.8, height: 0.1 },
    },
  ],
}

describe("ShowScoreViewer", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    global.ResizeObserver = class {
      constructor(callback: ResizeObserverCallback) {
        resizeCallback = callback
      }
      observe() {}
      disconnect() {}
    } as unknown as typeof ResizeObserver
    Element.prototype.scrollIntoView = jest.fn()
    Object.defineProperty(HTMLCanvasElement.prototype, "getContext", {
      configurable: true,
      value: jest.fn(() => ({
        setTransform: jest.fn(),
        drawImage: jest.fn(),
      })),
    })
    const page = {
      getViewport: jest.fn(({ scale }) => ({
        width: 600 * scale,
        height: 800 * scale,
      })),
      render: jest.fn(() => ({
        promise: Promise.resolve(),
        cancel: jest.fn(),
      })),
    }
    const pdf = {
      numPages: 2,
      getPage: jest.fn().mockResolvedValue(page),
    }
    mockGetDocument.mockReturnValue({
      promise: Promise.resolve(pdf),
      destroy: jest.fn(),
    })
    window.localStorage.setItem("user", JSON.stringify({ token: "token" }))
  })

  test("shows a clear empty state without a score", () => {
    render(
      <ShowScoreViewer score={null} cueIndex={0} pageMode="two" autoPageTurn />
    )

    expect(screen.getByText("No score selected")).toBeInTheDocument()
  })

  test("follows the current frame marker and renders its highlight", async () => {
    render(
      <ShowScoreViewer score={score} cueIndex={3} pageMode="two" autoPageTurn />
    )

    await waitFor(() => {
      expect(document.querySelector('[data-page="2"]')).toBeInTheDocument()
    })
    expect(screen.getByText("m. 12")).toBeInTheDocument()
    expect(screen.getByTestId("score-marker-pin")).toHaveAttribute(
      "data-active",
      "true"
    )
    expect(screen.getByText("3")).toBeInTheDocument()
    expect(mockGetDocument).toHaveBeenCalledWith(
      expect.objectContaining({
        url: "/api/presentation/presentation-1/scores/score-1/file",
        httpHeaders: { Authorization: "bearer token" },
      })
    )
  })

  test("switches between two-page and scrolling layouts", async () => {
    const onPageModeChange = jest.fn()
    const onAutoPageTurnChange = jest.fn()
    render(
      <ShowScoreViewer
        score={score}
        cueIndex={0}
        pageMode="two"
        autoPageTurn={false}
        onPageModeChange={onPageModeChange}
        onAutoPageTurnChange={onAutoPageTurnChange}
      />
    )

    await waitFor(() =>
      expect(document.querySelector('[data-page="1"]')).toBeInTheDocument()
    )

    fireEvent.click(screen.getByRole("button", { name: "Scrolling" }))
    fireEvent.click(screen.getByRole("button", { name: "Auto page turn" }))

    expect(onPageModeChange).toHaveBeenCalledWith("scroll")
    expect(onAutoPageTurnChange).toHaveBeenCalledWith(true)
  })

  test("zoom controls still step even before the page is measured", async () => {
    render(
      <ShowScoreViewer
        score={score}
        cueIndex={0}
        pageMode="two"
        autoPageTurn={false}
      />
    )

    await waitFor(() =>
      expect(document.querySelector('[data-page="1"]')).toBeInTheDocument()
    )
    expect(screen.getByRole("button", { name: "Fit" })).toBeInTheDocument()

    fireEvent.click(screen.getByRole("button", { name: "Zoom in" }))
    expect(screen.getByRole("button", { name: "125%" })).toBeInTheDocument()

    fireEvent.click(screen.getByRole("button", { name: "Zoom out" }))
    expect(screen.getByRole("button", { name: "100%" })).toBeInTheDocument()
  })

  test("serializes page rendering while the viewer is resizing", async () => {
    let finishFirstRender: () => void = () => {}
    const renderPage = jest
      .fn()
      .mockReturnValueOnce({
        promise: new Promise<void>((resolve) => {
          finishFirstRender = resolve
        }),
        cancel: jest.fn(),
      })
      .mockReturnValue({ promise: Promise.resolve(), cancel: jest.fn() })
    const page = {
      getViewport: jest.fn(({ scale }) => ({
        width: 600 * scale,
        height: 800 * scale,
      })),
      render: renderPage,
    }
    mockGetDocument.mockReturnValue({
      promise: Promise.resolve({
        numPages: 1,
        getPage: jest.fn().mockResolvedValue(page),
      }),
      destroy: jest.fn(),
    })

    render(
      <ShowScoreViewer
        score={{ ...score, pageCount: 1 }}
        cueIndex={0}
        pageMode="two"
        autoPageTurn={false}
      />
    )

    await waitFor(() => expect(renderPage).toHaveBeenCalledTimes(1))
    const pageHost = document.querySelector('[data-page="1"]') as HTMLElement
    Object.defineProperty(pageHost, "clientWidth", {
      configurable: true,
      value: 720,
    })
    resizeCallback([], {} as ResizeObserver)
    expect(renderPage).toHaveBeenCalledTimes(1)

    finishFirstRender()
    await waitFor(() => expect(renderPage).toHaveBeenCalledTimes(2))
  })
})
