import React from "react"
import { ChakraProvider } from "@chakra-ui/react"
import { render, screen, fireEvent } from "@testing-library/react"
import "@testing-library/jest-dom"
import EditorDock from "../../components/presentation/EditorDock"

jest.mock(
  "../../components/presentation/CuesForm",
  () =>
    ({ activeTab }: { activeTab: string }) => (
      <div data-testid="cues-form">{activeTab}</div>
    )
)
jest.mock("../../components/presentation/ScorePanel", () => () => (
  <div data-testid="score-panel">Scores</div>
))

// The dock reads the media library from the store and dispatches the upload
// and delete thunks; these tests only cover the tab strip, so stub the hooks
// rather than standing up a Provider.
jest.mock("../../redux/hooks", () => ({
  useAppDispatch: () => jest.fn(),
  useAppSelector: (selector: (state: unknown) => unknown) =>
    selector({ presentation: { media: [] } }),
}))

const renderDock = () =>
  render(
    <ChakraProvider>
      <EditorDock
        presentationId="presentation-1"
        scores={[]}
        cues={[]}
        updateCue={jest.fn()}
        screenCount={3}
        indexCount={5}
      />
    </ChakraProvider>
  )

describe("EditorDock", () => {
  beforeEach(() => {
    window.localStorage.removeItem("editModeMediaPoolActiveTab")
  })

  test("offers Colors, Media and Scores on a single row", () => {
    renderDock()

    expect(screen.getAllByRole("tab")).toHaveLength(3)
    expect(screen.getByRole("tab", { name: "Colors" })).toBeInTheDocument()
    expect(screen.getByRole("tab", { name: "Media" })).toBeInTheDocument()
    expect(screen.getByRole("tab", { name: "Scores" })).toBeInTheDocument()
  })

  test("opens on Media and drives the section CuesForm renders", () => {
    renderDock()

    expect(screen.getByTestId("cues-form")).toHaveTextContent("media")

    fireEvent.click(screen.getByRole("tab", { name: "Colors" }))
    expect(screen.getByTestId("cues-form")).toHaveTextContent("colors")
  })

  test("swaps CuesForm for the score panel on Scores", () => {
    renderDock()

    fireEvent.click(screen.getByRole("tab", { name: "Scores" }))
    expect(screen.getByTestId("score-panel")).toBeInTheDocument()
    expect(screen.queryByTestId("cues-form")).toBeNull()

    fireEvent.click(screen.getByRole("tab", { name: "Media" }))
    expect(screen.getByTestId("cues-form")).toBeInTheDocument()
  })

  test("remembers the selected tab", () => {
    const { unmount } = renderDock()

    fireEvent.click(screen.getByRole("tab", { name: "Colors" }))
    expect(window.localStorage.getItem("editModeMediaPoolActiveTab")).toBe(
      "colors"
    )

    unmount()
    renderDock()
    expect(screen.getByTestId("cues-form")).toHaveTextContent("colors")
  })

  test("falls back to Media for a tab that no longer exists", () => {
    // "audio" was a tab of its own before the pools were merged.
    window.localStorage.setItem("editModeMediaPoolActiveTab", "audio")

    renderDock()

    expect(screen.getByTestId("cues-form")).toHaveTextContent("media")
  })
})
