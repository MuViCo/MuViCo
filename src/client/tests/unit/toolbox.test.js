import React from "react"
import { render, screen, fireEvent } from "@testing-library/react"
import Toolbox from "../../components/presentation/ToolBox.jsx"
import "@testing-library/jest-dom"

describe("ToolBox Component", () => {
  const mockOnClose = jest.fn()
  const cue = { _id: "cue-1", name: "Test cue" }
  const mockOnSave = jest.fn()

  it("renders correctly when open", () => {
    render(
      <Toolbox
        isOpen
        onClose={mockOnClose}
        cue={cue}
        onSave={mockOnSave}
      />
    )
    expect(screen.getByRole("dialog")).toBeInTheDocument()
    expect(screen.getByText("Edit cue name")).toBeInTheDocument()
  })

  it("calls onClose when the close button is clicked", () => {
    render(
      <Toolbox
        isOpen
        onClose={mockOnClose}
        cue={cue}
        onSave={mockOnSave}
      />
    )

    fireEvent.click(screen.getByText("Cancel"))
    expect(mockOnClose).toHaveBeenCalledTimes(1)
  })

  it("does not render when closed", () => {
    render(
      <Toolbox
        isOpen={false}
        onClose={mockOnClose}
        cue={cue}
        onSave={mockOnSave}
      />
    )

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
  })
})
