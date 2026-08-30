import React from "react"
import { ChakraProvider } from "@chakra-ui/react"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import "@testing-library/jest-dom"
import ScorePdfViewer from "../../components/presentation/ScorePdfViewer"
import {
  createScoreMarker,
  updateScoreMarker,
  deleteScoreMarker,
} from "../../redux/presentationReducer"

import type { ScoreDocument } from "../../types"

const mockGetDocument = jest.fn()

jest.mock("pdfjs-dist", () => ({
  GlobalWorkerOptions: { workerSrc: "" },
  getDocument: mockGetDocument,
}))

let mockIndexCount = 5
const mockDispatch = jest.fn()
jest.mock("../../redux/hooks", () => ({
  useAppDispatch: () => mockDispatch,
  useAppSelector: (selector: (state: unknown) => unknown) =>
    selector({ presentation: { indexCount: mockIndexCount } }),
}))

const mockShowToast = jest.fn()
jest.mock("../../components/utils/toastUtils", () => ({
  useCustomToast: () => mockShowToast,
}))

jest.mock("../../redux/presentationReducer", () => ({
  createScoreMarker: jest.fn(() => "create-thunk"),
  updateScoreMarker: jest.fn(() => "update-thunk"),
  deleteScoreMarker: jest.fn(() => "delete-thunk"),
}))

const renderWithChakra = (component: React.ReactElement) =>
  render(<ChakraProvider>{component}</ChakraProvider>)

// Builds a fake pdfjs-dist loading task; numPages controls how many pages
// the multi-page marker tests see.
const makeLoadingTask = (numPages = 1) => {
  const page = {
    getViewport: jest.fn(() => ({ width: 300, height: 300 })),
    render: jest.fn(() => ({ promise: Promise.resolve(), cancel: jest.fn() })),
  }
  const pdf = {
    numPages,
    getPage: jest.fn().mockResolvedValue(page),
    destroy: jest.fn().mockResolvedValue(undefined),
  }
  return { promise: Promise.resolve(pdf), destroy: jest.fn() }
}

const baseScore: ScoreDocument = {
  _id: "score-1",
  title: "Apano stin Triantafyllia",
  source: "upload",
  file: { name: "score.pdf", url: "https://example.com/score.pdf" },
  pageCount: 1,
  markers: [],
}

const renderViewer = (
  score: ScoreDocument,
  previewUrl: string | null = null
) =>
  renderWithChakra(
    <ScorePdfViewer
      presentationId="presentation-1"
      scores={[score]}
      selectedScore={score}
      previewUrl={previewUrl}
      onSelectScore={jest.fn()}
      onOpenExternal={jest.fn()}
      onUpload={jest.fn()}
    />
  )

const waitForPdfLoaded = () =>
  waitFor(() =>
    expect(screen.getByTestId("score-pdf-viewer")).toBeInTheDocument()
  )

// jsdom never lays out elements, so give the overlay a real size before
// simulating a click on it.
const stubOverlayRect = (overlay: HTMLElement) =>
  jest.spyOn(overlay, "getBoundingClientRect").mockReturnValue({
    x: 0,
    y: 0,
    width: 300,
    height: 300,
    top: 0,
    left: 0,
    right: 300,
    bottom: 300,
    toJSON: () => {},
  })

describe("ScorePdfViewer", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockIndexCount = 5
    mockGetDocument.mockReturnValue(makeLoadingTask())
    window.localStorage.setItem(
      "user",
      JSON.stringify({ token: "test-token" })
    )
    global.ResizeObserver = class {
      observe() {}
      disconnect() {}
    } as unknown as typeof ResizeObserver
    Object.defineProperty(HTMLCanvasElement.prototype, "getContext", {
      configurable: true,
      value: jest.fn(() => ({ setTransform: jest.fn() })),
    })
  })

  test("loads proxied score PDFs with authorization headers", async () => {
    const score: ScoreDocument = {
      _id: "score-1",
      title: "Score",
      source: "upload",
      file: {
        proxyUrl: "/api/presentation/presentation-1/scores/score-1/file",
        url: "https://s3.example.com/score.pdf",
        type: "application/pdf",
      },
      markers: [],
    }

    renderViewer(
      score,
      "/api/presentation/presentation-1/scores/score-1/file"
    )

    await waitFor(() => {
      expect(mockGetDocument).toHaveBeenCalledWith(
        expect.objectContaining({
          url: "/api/presentation/presentation-1/scores/score-1/file",
          httpHeaders: { Authorization: "bearer test-token" },
          disableRange: true,
          disableStream: true,
        })
      )
    })
  })

  describe("markers", () => {
    test("places a marker by clicking the score while in placing mode", async () => {
      renderViewer(baseScore)
      await waitForPdfLoaded()

      fireEvent.click(screen.getByRole("button", { name: "Add marker" }))
      const overlay = screen.getByTestId("score-marker-overlay")
      stubOverlayRect(overlay)
      fireEvent.click(overlay, { clientX: 10, clientY: 10 })

      const form = await screen.findByTestId("marker-form")
      fireEvent.change(form.querySelector("select")!, {
        target: { value: "3" },
      })
      fireEvent.click(screen.getByRole("button", { name: "Add" }))

      await waitFor(() => {
        expect(createScoreMarker).toHaveBeenCalledWith(
          "presentation-1",
          "score-1",
          expect.objectContaining({ page: 1, frameIndex: 3 })
        )
        expect(mockDispatch).toHaveBeenCalledWith("create-thunk")
      })
    })

    test("clicking an existing marker opens an edit form pre-filled with its frame", async () => {
      const score: ScoreDocument = {
        ...baseScore,
        markers: [
          {
            _id: "marker-1",
            page: 1,
            frameIndex: 2,
            rect: { x: 0.5, y: 0.5, width: 0, height: 0 },
          },
        ],
      }
      renderViewer(score)
      await waitForPdfLoaded()

      fireEvent.click(screen.getByTitle("Frame 2 — click to edit"))

      const form = await screen.findByTestId("marker-form")
      expect(form.querySelector("select")).toHaveValue("2")
      expect(screen.getByRole("button", { name: "Save" })).toBeInTheDocument()

      fireEvent.change(form.querySelector("select")!, {
        target: { value: "4" },
      })
      fireEvent.click(screen.getByRole("button", { name: "Save" }))

      await waitFor(() => {
        expect(updateScoreMarker).toHaveBeenCalledWith(
          "presentation-1",
          "score-1",
          "marker-1",
          expect.objectContaining({ frameIndex: 4 })
        )
      })
    })

    test("deletes a marker from its edit form", async () => {
      const score: ScoreDocument = {
        ...baseScore,
        markers: [
          {
            _id: "marker-1",
            page: 1,
            frameIndex: 2,
            rect: { x: 0.5, y: 0.5, width: 0, height: 0 },
          },
        ],
      }
      renderViewer(score)
      await waitForPdfLoaded()

      fireEvent.click(screen.getByTitle("Frame 2 — click to edit"))
      await screen.findByTestId("marker-form")
      fireEvent.click(screen.getByRole("button", { name: "Delete" }))

      await waitFor(() => {
        expect(deleteScoreMarker).toHaveBeenCalledWith(
          "presentation-1",
          "score-1",
          "marker-1"
        )
      })
    })

    test("lists every marker in the recap bar, jumps to and scrolls the clicked one into view", async () => {
      mockGetDocument.mockReturnValue(makeLoadingTask(2))
      const score: ScoreDocument = {
        ...baseScore,
        pageCount: 2,
        markers: [
          {
            _id: "marker-1",
            page: 1,
            frameIndex: 0,
            rect: { x: 0.2, y: 0.2, width: 0, height: 0 },
          },
          {
            _id: "marker-2",
            page: 2,
            frameIndex: 1,
            rect: { x: 0.6, y: 0.6, width: 0, height: 0 },
          },
        ],
      }
      renderViewer(score)
      await waitForPdfLoaded()

      expect(screen.getByText("Markers:")).toBeInTheDocument()
      const chip2 = screen.getByTitle("Marker 2 — Page 2, Frame 1")
      fireEvent.click(chip2)

      await waitFor(() => {
        expect(screen.getByLabelText("Page")).toHaveValue("2")
      })
      // The jump also scrolls the marker's pin into view, on a short delay.
      await waitFor(
        () =>
          expect(window.Element.prototype.scrollIntoView).toHaveBeenCalled(),
        { timeout: 1000 }
      )
    })

    test("Enter confirms and Escape cancels from the frame select", async () => {
      renderViewer(baseScore)
      await waitForPdfLoaded()

      fireEvent.click(screen.getByRole("button", { name: "Add marker" }))
      const overlay = screen.getByTestId("score-marker-overlay")
      stubOverlayRect(overlay)
      fireEvent.click(overlay, { clientX: 10, clientY: 10 })
      const form = await screen.findByTestId("marker-form")

      fireEvent.keyDown(form.querySelector("select")!, { key: "Escape" })
      expect(screen.queryByTestId("marker-form")).not.toBeInTheDocument()

      fireEvent.click(overlay, { clientX: 10, clientY: 10 })
      const form2 = await screen.findByTestId("marker-form")
      fireEvent.keyDown(form2.querySelector("select")!, { key: "Enter" })

      await waitFor(() => expect(createScoreMarker).toHaveBeenCalled())
    })

    test("rejects placing a marker when the presentation has no frames", async () => {
      mockIndexCount = 0
      renderViewer(baseScore)
      await waitForPdfLoaded()

      fireEvent.click(screen.getByRole("button", { name: "Add marker" }))
      const overlay = screen.getByTestId("score-marker-overlay")
      stubOverlayRect(overlay)
      fireEvent.click(overlay, { clientX: 10, clientY: 10 })
      await screen.findByTestId("marker-form")
      fireEvent.click(screen.getByRole("button", { name: "Add" }))

      await waitFor(() =>
        expect(mockShowToast).toHaveBeenCalledWith(
          expect.objectContaining({ title: "Invalid frame number" })
        )
      )
      expect(createScoreMarker).not.toHaveBeenCalled()
    })

    test("shows an error toast when saving a marker fails", async () => {
      mockDispatch.mockRejectedValueOnce(new Error("network down"))
      renderViewer(baseScore)
      await waitForPdfLoaded()

      fireEvent.click(screen.getByRole("button", { name: "Add marker" }))
      const overlay = screen.getByTestId("score-marker-overlay")
      stubOverlayRect(overlay)
      fireEvent.click(overlay, { clientX: 10, clientY: 10 })
      await screen.findByTestId("marker-form")
      fireEvent.click(screen.getByRole("button", { name: "Add" }))

      await waitFor(() =>
        expect(mockShowToast).toHaveBeenCalledWith(
          expect.objectContaining({ title: "Couldn't save marker" })
        )
      )
    })

    test("shows an error toast when deleting a marker fails", async () => {
      mockDispatch.mockRejectedValueOnce(new Error("network down"))
      const score: ScoreDocument = {
        ...baseScore,
        markers: [
          {
            _id: "marker-1",
            page: 1,
            frameIndex: 2,
            rect: { x: 0.5, y: 0.5, width: 0, height: 0 },
          },
        ],
      }
      renderViewer(score)
      await waitForPdfLoaded()

      fireEvent.click(screen.getByTitle("Frame 2 — click to edit"))
      await screen.findByTestId("marker-form")
      fireEvent.click(screen.getByRole("button", { name: "Delete" }))

      await waitFor(() =>
        expect(mockShowToast).toHaveBeenCalledWith(
          expect.objectContaining({ title: "Couldn't remove marker" })
        )
      )
    })
  })
})
