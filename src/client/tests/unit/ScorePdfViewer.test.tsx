import React from "react"
import { ChakraProvider } from "@chakra-ui/react"
import { render, waitFor } from "@testing-library/react"
import "@testing-library/jest-dom"
import ScorePdfViewer from "../../components/presentation/ScorePdfViewer"

import type { ScoreDocument } from "../../types"

const mockGetDocument = jest.fn()

jest.mock("pdfjs-dist", () => ({
  GlobalWorkerOptions: { workerSrc: "" },
  getDocument: mockGetDocument,
}))

const renderWithChakra = (component: React.ReactElement) =>
  render(<ChakraProvider>{component}</ChakraProvider>)

describe("ScorePdfViewer", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    window.localStorage.setItem("user", JSON.stringify({ token: "test-token" }))
    global.ResizeObserver = class {
      observe = jest.fn()
      unobserve = jest.fn()
      disconnect = jest.fn()
    }
    Object.defineProperty(HTMLCanvasElement.prototype, "getContext", {
      configurable: true,
      value: jest.fn(() => ({
        setTransform: jest.fn(),
      })),
    })
  })

  test("loads proxied score PDFs with authorization headers", async () => {
    const page = {
      getViewport: jest.fn(() => ({ width: 600, height: 800 })),
      render: jest.fn(() => ({
        promise: Promise.resolve(),
        cancel: jest.fn(),
      })),
    }
    const pdf = {
      numPages: 1,
      getPage: jest.fn().mockResolvedValue(page),
      destroy: jest.fn().mockResolvedValue(undefined),
    }
    const loadingTask = {
      promise: Promise.resolve(pdf),
      destroy: jest.fn(),
    }
    mockGetDocument.mockReturnValue(loadingTask)

    const score = {
      _id: "score-1",
      title: "Score",
      source: "upload",
      file: {
        proxyUrl: "/api/presentation/presentation-1/scores/score-1/file",
        url: "https://s3.example.com/score.pdf",
        type: "application/pdf",
      },
      markers: [],
    } as ScoreDocument

    renderWithChakra(
      <ScorePdfViewer
        scores={[score]}
        selectedScore={score}
        previewUrl="/api/presentation/presentation-1/scores/score-1/file"
        onSelectScore={jest.fn()}
        onOpenExternal={jest.fn()}
        onUpload={jest.fn()}
      />
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
})
