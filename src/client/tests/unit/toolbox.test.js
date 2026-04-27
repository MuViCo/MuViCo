/**
 * Tests Toolbox modal behavior for rendering, closing, and cue name saving rules.
 * Verifies visibility state, button interactions, and save payload normalization.
 */

import React from "react"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import Toolbox from "../../components/presentation/ToolBox.jsx"
import "@testing-library/jest-dom"

describe("ToolBox Component", () => {
  const mockOnClose = jest.fn()
  const cue = { _id: "cue-1", name: "Test cue" }
  const mockOnSave = jest.fn()

  beforeEach(() => {
    mockOnClose.mockClear()
    mockOnSave.mockClear()
  })

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

  it("saves trimmed cue name and closes modal", async () => {
    mockOnSave.mockResolvedValue(undefined)

    render(
      <Toolbox
        isOpen
        onClose={mockOnClose}
        cue={cue}
        onSave={mockOnSave}
      />
    )

    fireEvent.change(screen.getByPlaceholderText("Cue name"), {
      target: { value: "  Updated Name  " },
    })
    fireEvent.click(screen.getByRole("button", { name: "Save" }))

    await waitFor(() => {
      // The component currently keeps backward compatibility by setting both fields.
      expect(mockOnSave).toHaveBeenCalledWith({
        ...cue,
        cueName: "Updated Name",
        name: "Updated Name",
      })
    })
    expect(mockOnClose).toHaveBeenCalledTimes(1)
  })

  it("does not save when cue name is empty after trimming", () => {
    render(
      <Toolbox
        isOpen
        onClose={mockOnClose}
        cue={cue}
        onSave={mockOnSave}
      />
    )

    fireEvent.change(screen.getByPlaceholderText("Cue name"), {
      // Whitespace-only input is treated as empty after normalization.
      target: { value: "   " },
    })
    fireEvent.click(screen.getByRole("button", { name: "Save" }))

    expect(mockOnSave).not.toHaveBeenCalled()
    expect(mockOnClose).not.toHaveBeenCalled()
  })
})
