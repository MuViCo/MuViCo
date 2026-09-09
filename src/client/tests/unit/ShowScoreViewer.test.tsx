import React from "react"
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react"
import "@testing-library/jest-dom"
import ShowScoreViewer from "../../components/presentation/ShowScoreViewer"
import type { ScoreDocument } from "../../types"

const mockGetDocument = jest.fn()
let resizeCallback: ResizeObserverCallback
let resizeCallbacks: ResizeObserverCallback[]

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
      _id: "marker-0",
      page: 1,
      frameIndex: 0,
      rect: { x: 0.2, y: 0.2, width: 0, height: 0 },
    },
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
    resizeCallbacks = []
    global.ResizeObserver = class {
      constructor(callback: ResizeObserverCallback) {
        resizeCallback = callback
        resizeCallbacks.push(callback)
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
    fireEvent.click(screen.getByRole("button", { name: "Two pages" }))
    fireEvent.click(screen.getByRole("button", { name: "Auto page turn" }))

    expect(onPageModeChange).toHaveBeenCalledWith("scroll")
    expect(onPageModeChange).toHaveBeenCalledWith("two")
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

    fireEvent.click(screen.getByRole("button", { name: "Fit" }))
    expect(screen.getByRole("button", { name: "100%" })).toBeInTheDocument()
    fireEvent.click(screen.getByRole("button", { name: "100%" }))
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

  test("shows a load error when the PDF cannot be opened", async () => {
    mockGetDocument.mockReturnValue({
      promise: Promise.reject(new Error("invalid PDF")),
      destroy: jest.fn(),
    })

    render(
      <ShowScoreViewer
        score={score}
        cueIndex={0}
        pageMode="two"
        autoPageTurn={false}
      />
    )

    expect(
      await screen.findByText("PDF preview unavailable.")
    ).toBeInTheDocument()
  })

  test("loads a public score without an authorization header", async () => {
    render(
      <ShowScoreViewer
        score={{
          ...score,
          file: { url: "https://example.com/public-score.pdf" },
        }}
        cueIndex={0}
        pageMode="two"
        autoPageTurn={false}
      />
    )

    await waitFor(() => expect(mockGetDocument).toHaveBeenCalled())
    expect(mockGetDocument).toHaveBeenCalledWith(
      expect.objectContaining({
        url: "https://example.com/public-score.pdf",
        httpHeaders: undefined,
      })
    )
  })

  test("navigates score pages manually and disables automatic turns", async () => {
    const onAutoPageTurnChange = jest.fn()
    render(
      <ShowScoreViewer
        score={score}
        cueIndex={0}
        pageMode="two"
        autoPageTurn={false}
        onAutoPageTurnChange={onAutoPageTurnChange}
      />
    )

    await screen.findByText("1 / 2")
    fireEvent.click(screen.getByRole("button", { name: "Next score page" }))

    expect(await screen.findByText("2 / 2")).toBeInTheDocument()
    expect(onAutoPageTurnChange).toHaveBeenLastCalledWith(false)

    fireEvent.click(screen.getByRole("button", { name: "Previous score page" }))
    expect(await screen.findByText("1 / 2")).toBeInTheDocument()
  })

  test("fits scrolling pages to the measured viewer and follows the active page", async () => {
    render(
      <ShowScoreViewer
        score={score}
        cueIndex={3}
        pageMode="scroll"
        autoPageTurn
      />
    )

    await waitFor(() => {
      expect(document.querySelectorAll(".show-score-page")).toHaveLength(2)
      expect(Element.prototype.scrollIntoView).toHaveBeenCalled()
    })

    await act(async () => {
      resizeCallbacks.forEach((callback) =>
        callback(
          [
            {
              contentRect: { width: 1000, height: 800 },
            } as ResizeObserverEntry,
          ],
          {} as ResizeObserver
        )
      )
    })

    await waitFor(() => {
      expect(
        document.querySelector<HTMLElement>('[data-page="1"]')
      ).toHaveStyle({
        width: "588px",
      })
    })
  })

  test("recovers from a failed page render", async () => {
    const renderPage = jest.fn(() => ({
      promise: Promise.reject(new Error("render failed")),
      cancel: jest.fn(),
    }))
    mockGetDocument.mockReturnValue({
      promise: Promise.resolve({
        numPages: 1,
        getPage: jest.fn().mockResolvedValue({
          getViewport: jest.fn(({ scale }) => ({
            width: 600 * scale,
            height: 800 * scale,
          })),
          render: renderPage,
        }),
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

    await waitFor(() => expect(renderPage).toHaveBeenCalled())
    expect(
      screen.queryByText("PDF preview unavailable.")
    ).not.toBeInTheDocument()
  })
})
