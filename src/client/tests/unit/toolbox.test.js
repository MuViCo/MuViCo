import React from "react"
import { render, screen, fireEvent } from "@testing-library/react"
import Toolbox from "../../components/presentation/ToolBox.jsx"
import "@testing-library/jest-dom"

describe("ToolBox Component", () => {
  const mockOnClose = jest.fn()

  it("renders correctly when open", () => {
    render(
      <Toolbox
        isOpen={true}
        onClose={mockOnClose}
      />
    )
    expect(screen.getByRole("dialog")).toBeInTheDocument()
    expect(screen.getByTestId("close-drawer-button")).toBeInTheDocument()
  })

  it("calls onClose when the close button is clicked", () => {
    render(
      <Toolbox
        isOpen={true}
        onClose={mockOnClose}
      />
    )

    fireEvent.click(screen.getByTestId("close-drawer-button"))
    expect(mockOnClose).toHaveBeenCalledTimes(1)
  })

  it("does not render when closed", () => {
    render(
      <Toolbox
        isOpen={false}
        onClose={mockOnClose}
      />
    )

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
  })
})
