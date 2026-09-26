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
      <Toolbox isOpen onClose={mockOnClose} cue={cue} onSave={mockOnSave} />
    )
    expect(screen.getByRole("dialog")).toBeInTheDocument()
    expect(screen.getByText("Edit cue name")).toBeInTheDocument()
  })

  it("calls onClose when the close button is clicked", () => {
    render(
      <Toolbox isOpen onClose={mockOnClose} cue={cue} onSave={mockOnSave} />
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
      <Toolbox isOpen onClose={mockOnClose} cue={cue} onSave={mockOnSave} />
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
        opacity: 1,
        frame: null,
      })
    })
    expect(mockOnClose).toHaveBeenCalledTimes(1)
  })

  it("saves cue opacity", async () => {
    mockOnSave.mockResolvedValue(undefined)

    render(
      <Toolbox
        isOpen
        onClose={mockOnClose}
        cue={{ ...cue, cueType: "visual", opacity: 0.6 }}
        onSave={mockOnSave}
      />
    )

    expect(screen.getByText("60%")).toBeInTheDocument()
    fireEvent.click(screen.getByRole("button", { name: "Save" }))

    await waitFor(() => {
      expect(mockOnSave).toHaveBeenCalledWith(
        expect.objectContaining({ opacity: 0.6 })
      )
    })
  })

  it("does not save when cue name is empty after trimming", () => {
    render(
      <Toolbox isOpen onClose={mockOnClose} cue={cue} onSave={mockOnSave} />
    )

    fireEvent.change(screen.getByPlaceholderText("Cue name"), {
      // Whitespace-only input is treated as empty after normalization.
      target: { value: "   " },
    })
    fireEvent.click(screen.getByRole("button", { name: "Save" }))

    expect(mockOnSave).not.toHaveBeenCalled()
    expect(mockOnClose).not.toHaveBeenCalled()
  })

  describe("text element", () => {
    const textCue = {
      _id: "cue-text",
      name: "Intro",
      cueType: "visual",
      text: "La nuit est tombée",
      textColor: "#ffcc00",
      textSize: 12,
      opacity: 1,
    }

    const renderTextToolbox = (cueOverrides = {}) =>
      render(
        <Toolbox
          isOpen
          onClose={mockOnClose}
          cue={{ ...textCue, ...cueOverrides }}
          onSave={mockOnSave}
        />
      )

    it("has its own title and shows the current text, size and color", () => {
      renderTextToolbox()

      expect(screen.getByText("Edit text element")).toBeInTheDocument()
      expect(screen.getByTestId("toolbox-text")).toHaveValue(
        "La nuit est tombée"
      )
      expect(screen.getByText("12%")).toBeInTheDocument()
      expect(screen.getByTestId("toolbox-text-color")).toHaveValue("#ffcc00")
    })

    it("does not show the text fields for an ordinary element", () => {
      render(
        <Toolbox
          isOpen
          onClose={mockOnClose}
          cue={{ _id: "c", name: "photo", cueType: "visual" }}
          onSave={mockOnSave}
        />
      )

      expect(screen.queryByTestId("toolbox-text")).toBeNull()
      expect(screen.queryByText("Text size")).toBeNull()
    })

    it("saves the edited text, size and color", async () => {
      mockOnSave.mockResolvedValue(undefined)
      renderTextToolbox()

      fireEvent.change(screen.getByTestId("toolbox-text"), {
        target: { value: "  Peter Grimes  " },
      })
      fireEvent.change(screen.getByTestId("toolbox-text-color"), {
        target: { value: "#112233" },
      })
      fireEvent.keyDown(screen.getByRole("slider", { name: "Text size" }), {
        key: "ArrowRight",
      })
      fireEvent.click(screen.getByRole("button", { name: "Save" }))

      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalledWith(
          expect.objectContaining({
            text: "Peter Grimes",
            textColor: "#112233",
            textSize: 13,
          })
        )
      })
    })

    it("renames an automatically named element when its text changes", async () => {
      mockOnSave.mockResolvedValue(undefined)
      renderTextToolbox({ name: "La nuit est tombée" })

      fireEvent.change(screen.getByTestId("toolbox-text"), {
        target: { value: "Peter Grimes" },
      })
      fireEvent.click(screen.getByRole("button", { name: "Save" }))

      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalledWith(
          expect.objectContaining({
            cueName: "Peter Grimes",
            name: "Peter Grimes",
          })
        )
      })
    })

    it("keeps a name the user chose when the text changes", async () => {
      mockOnSave.mockResolvedValue(undefined)
      renderTextToolbox({ name: "Intro" })

      fireEvent.change(screen.getByTestId("toolbox-text"), {
        target: { value: "Peter Grimes" },
      })
      fireEvent.click(screen.getByRole("button", { name: "Save" }))

      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalledWith(
          expect.objectContaining({ cueName: "Intro", name: "Intro" })
        )
      })
    })

    it("ignores a form submit (Enter) while the text is empty", () => {
      renderTextToolbox()

      fireEvent.change(screen.getByTestId("toolbox-text"), {
        target: { value: "" },
      })
      fireEvent.submit(screen.getByTestId("toolbox-text").closest("form"))

      expect(mockOnSave).not.toHaveBeenCalled()
      expect(mockOnClose).not.toHaveBeenCalled()
    })

    it("cannot be saved without a text", () => {
      renderTextToolbox()

      fireEvent.change(screen.getByTestId("toolbox-text"), {
        target: { value: "   " },
      })

      expect(screen.getByRole("button", { name: "Save" })).toBeDisabled()
      fireEvent.click(screen.getByRole("button", { name: "Save" }))
      expect(mockOnSave).not.toHaveBeenCalled()
    })

    it("names an unnamed text element after its text", () => {
      renderTextToolbox({ name: "", cueName: undefined })

      expect(screen.getByPlaceholderText("Cue name")).toHaveValue(
        "La nuit est tombée"
      )
    })

    it("falls back to the default size and color when they are missing", () => {
      renderTextToolbox({ textSize: undefined, textColor: undefined })

      expect(screen.getByText("8%")).toBeInTheDocument()
      expect(screen.getByTestId("toolbox-text-color")).toHaveValue("#ffffff")
    })
  })
})
