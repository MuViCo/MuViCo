import React from "react"
import { ChakraProvider } from "@chakra-ui/react"
import { render, screen, fireEvent } from "@testing-library/react"
import "@testing-library/jest-dom"
import EditorDock from "../../components/presentation/EditorDock"

jest.mock("../../components/presentation/CuesForm", () => () => (
  <div data-testid="cues-form">Elements</div>
))
jest.mock("../../components/presentation/ScorePanel", () => () => (
  <div data-testid="score-panel">Scores</div>
))

// The dock reads the media library from the store and dispatches the upload
// and delete thunks; this test only cares about tab switching, so stub the
// hooks rather than standing up a Provider.
jest.mock("../../redux/hooks", () => ({
  useAppDispatch: () => jest.fn(),
  useAppSelector: (selector: (state: unknown) => unknown) =>
    selector({ presentation: { media: [] } }),
}))

const renderWithChakra = (component: React.ReactElement) =>
  render(<ChakraProvider>{component}</ChakraProvider>)

describe("EditorDock", () => {
  test("toggles between Elements and Scores", () => {
    renderWithChakra(
      <EditorDock
        presentationId="presentation-1"
        scores={[]}
        cues={[]}
        updateCue={jest.fn()}
        screenCount={3}
        indexCount={5}
      />
    )

    // Switch to Scores
    const scoresTab = screen.getByRole("button", { name: /Scores/i })
    fireEvent.click(scoresTab)
    expect(screen.getByTestId("score-panel")).toBeInTheDocument()

    // Switch back to Elements
    const elementsTab = screen.getByRole("button", { name: /Elements/i })
    fireEvent.click(elementsTab)
    expect(screen.getByTestId("cues-form")).toBeInTheDocument()
  })
})
