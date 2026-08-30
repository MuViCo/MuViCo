import React from "react"
import { ChakraProvider } from "@chakra-ui/react"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import "@testing-library/jest-dom"
import ScorePanel from "../../components/presentation/ScorePanel"
import {
  uploadScorePdf,
  importImslpScore,
  deleteScoreDocument,
} from "../../redux/presentationReducer"

// Mock ScorePdfViewer so Jest never loads pdfjs-dist.
// We verify that ScorePanel passes the correct selectedScore down.
jest.mock("../../components/presentation/ScorePdfViewer", () => {
  return function MockScorePdfViewer({
    selectedScore,
    scores,
    previewUrl,
  }: {
    selectedScore: {
      _id: string
      title: string
      file?: { proxyUrl?: string; url?: string }
      sourceUrl?: string
    } | null
    scores: { _id: string }[]
    previewUrl: string | null
  }) {
    return (
      <div
        data-testid="score-pdf-viewer"
        data-url={previewUrl ?? ""}
        data-score-count={scores.length}
        data-selected-id={selectedScore?._id ?? ""}
      />
    )
  }
})

test("uploads a PDF file", async () => {
  ;(uploadScorePdf as unknown as jest.Mock).mockReturnValue(Promise.resolve())
  // render with no scores so the upload button is visible
  renderWithChakra(<ScorePanel presentationId="presentation-1" scores={[]} />)

  // It's a hidden file input, but we can query it by looking for the input type="file"
  const fileInput = document.querySelector('input[type="file"]')
  const file = new File(["dummy content"], "test.pdf", {
    type: "application/pdf",
  })

  fireEvent.change(fileInput!, { target: { files: [file] } })

  await waitFor(() => {
    expect(mockDispatch).toHaveBeenCalled()
    expect(uploadScorePdf).toHaveBeenCalledWith(
      "presentation-1",
      expect.objectContaining({ file })
    )
  })
})

test("imports from IMSLP URL", async () => {
  ;(importImslpScore as unknown as jest.Mock).mockReturnValue(Promise.resolve())
  renderWithChakra(<ScorePanel presentationId="presentation-1" scores={[]} />)

  const input = screen.getByPlaceholderText(/https:\/\/imslp.org/i)
  fireEvent.change(input, { target: { value: "https://imslp.org/score.pdf" } })

  const importBtn = screen.getByRole("button", { name: "IMSLP" })
  fireEvent.click(importBtn)

  await waitFor(() => {
    expect(mockDispatch).toHaveBeenCalled()
    expect(importImslpScore).toHaveBeenCalledWith("presentation-1", {
      sourceUrl: "https://imslp.org/score.pdf",
    })
  })
})

test("deletes a score", async () => {
  ;(deleteScoreDocument as unknown as jest.Mock).mockReturnValue(
    Promise.resolve()
  )
  renderWithChakra(
    <ScorePanel presentationId="presentation-1" scores={[score]} />
  )

  const removeBtn = screen.getByRole("button", { name: /Remove/i })
  fireEvent.click(removeBtn)

  await waitFor(() => {
    expect(mockDispatch).toHaveBeenCalled()
    expect(deleteScoreDocument).toHaveBeenCalledWith(
      "presentation-1",
      "score-1"
    )
  })
})

const mockDispatch = jest.fn()
jest.mock("../../redux/hooks", () => ({
  useAppDispatch: () => mockDispatch,
}))

jest.mock("../../components/utils/toastUtils", () => ({
  useCustomToast: () => jest.fn(),
}))

const renderWithChakra = (component: React.ReactElement) =>
  render(<ChakraProvider>{component}</ChakraProvider>)

const score = {
  _id: "score-1",
  title: "Apano stin Triantafyllia",
  source: "upload" as const,
  file: {
    name: "IMSLP939945-PMLP1474190-apano-stin-triantafyllia.pdf",
    proxyUrl: "/api/presentation/presentation-1/scores/score-1/file",
    url: "https://example.com/score.pdf",
    type: "application/pdf",
  },
  markers: [],
}

jest.mock("../../redux/presentationReducer", () => ({
  uploadScorePdf: jest.fn(),
  importImslpScore: jest.fn(),
  deleteScoreDocument: jest.fn(),
}))

describe("ScorePanel", () => {
  test("renders the PDF viewer with the correct URL and score count", () => {
    renderWithChakra(
      <ScorePanel presentationId="presentation-1" scores={[score]} />
    )

    const viewer = screen.getByTestId("score-pdf-viewer")
    expect(viewer).toHaveAttribute(
      "data-url",
      "/api/presentation/presentation-1/scores/score-1/file"
    )
    expect(viewer).toHaveAttribute("data-score-count", "1")
    expect(viewer).toHaveAttribute("data-selected-id", "score-1")
  })

  test("renders the viewer even when scores list is empty", () => {
    renderWithChakra(<ScorePanel presentationId="presentation-1" scores={[]} />)

    const viewer = screen.getByTestId("score-pdf-viewer")
    expect(viewer).toHaveAttribute("data-url", "")
    expect(viewer).toHaveAttribute("data-score-count", "0")
  })

  test("auto-selects the first score on mount", () => {
    const second = { ...score, _id: "score-2", title: "Second Score" }
    renderWithChakra(
      <ScorePanel presentationId="presentation-1" scores={[score, second]} />
    )

    const viewer = screen.getByTestId("score-pdf-viewer")
    expect(viewer).toHaveAttribute("data-selected-id", "score-1")
  })
})
