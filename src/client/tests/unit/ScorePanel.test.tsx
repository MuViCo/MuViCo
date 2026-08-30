import React from "react"
import { ChakraProvider } from "@chakra-ui/react"
import { render, screen } from "@testing-library/react"
import "@testing-library/jest-dom"
import ScorePanel from "../../components/presentation/ScorePanel"

// Mock ScorePdfViewer so Jest never loads pdfjs-dist.
// We verify that ScorePanel passes the correct selectedScore down.
jest.mock("../../components/presentation/ScorePdfViewer", () => {
  return function MockScorePdfViewer({
    selectedScore,
    scores,
  }: {
    selectedScore: {
      _id: string
      title: string
      file?: { url?: string }
      sourceUrl?: string
    } | null
    scores: { _id: string }[]
  }) {
    const url = selectedScore?.file?.url ?? selectedScore?.sourceUrl ?? ""
    return (
      <div
        data-testid="score-pdf-viewer"
        data-url={url}
        data-score-count={scores.length}
        data-selected-id={selectedScore?._id ?? ""}
      />
    )
  }
})

jest.mock("../../redux/hooks", () => ({
  useAppDispatch: () => jest.fn(),
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
    url: "https://example.com/score.pdf",
    type: "application/pdf",
  },
  markers: [],
}

describe("ScorePanel", () => {
  test("renders the PDF viewer with the correct URL and score count", () => {
    renderWithChakra(
      <ScorePanel presentationId="presentation-1" scores={[score]} />
    )

    const viewer = screen.getByTestId("score-pdf-viewer")
    expect(viewer).toHaveAttribute("data-url", "https://example.com/score.pdf")
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
