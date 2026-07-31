/*
 * StatusTooltip unit tests.
 * Covers deriving the "loading"/"saved" status from the redux
 * presentation.pendingSaves counter.
 */
import React from "react"
import { render, screen } from "@testing-library/react"
import "@testing-library/jest-dom"
import { useSelector } from "react-redux"
import StatusTooltip from "../../components/presentation/StatusToolTip"

jest.mock("react-redux", () => ({
  useSelector: jest.fn(),
}))

const renderWithPendingSaves = (pendingSaves) => {
  useSelector.mockImplementation((selector) =>
    selector({ presentation: { pendingSaves } })
  )
  return render(<StatusTooltip />)
}

describe("StatusTooltip", () => {
  it("shows the loading spinner and becomes visible while a save is pending", () => {
    renderWithPendingSaves(1)

    expect(screen.getByText("Loading...")).toBeInTheDocument()
    expect(screen.getByTestId("status-tooltip-badge")).toBeVisible()
  })

  it("shows the saved checkmark only once every overlapping save has finished", () => {
    const { rerender } = renderWithPendingSaves(2)
    expect(screen.getByText("Loading...")).toBeInTheDocument()

    // One of the two overlapping saves finishing should not flip to "saved".
    useSelector.mockImplementation((selector) =>
      selector({ presentation: { pendingSaves: 1 } })
    )
    rerender(<StatusTooltip />)
    expect(screen.getByText("Loading...")).toBeInTheDocument()

    useSelector.mockImplementation((selector) =>
      selector({ presentation: { pendingSaves: 0 } })
    )
    rerender(<StatusTooltip />)
    expect(screen.queryByText("Loading...")).not.toBeInTheDocument()
  })

  it("shows the saved checkmark when nothing is pending", () => {
    renderWithPendingSaves(0)

    expect(screen.queryByText("Loading...")).not.toBeInTheDocument()
  })

  it("stays hidden on initial mount instead of flashing the saved checkmark", () => {
    renderWithPendingSaves(0)

    expect(screen.getByTestId("status-tooltip-badge")).not.toBeVisible()
  })
})
