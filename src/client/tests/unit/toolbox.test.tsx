/**
 * Tests Toolbox modal behavior for rendering, closing, and cue name saving rules.
 * Verifies visibility state, button interactions, and save payload normalization.
 */

import React from "react"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import Toolbox from "../../components/presentation/ToolBox"
import "@testing-library/jest-dom"
import type { Cue } from "../../types"

describe("ToolBox Component", () => {
  const mockOnClose = jest.fn()
  const cue = { _id: "cue-1", name: "Test cue" } as Cue
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
        cue={{ ...cue, cueType: "visual", opacity: 0.6 } as Cue}
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
    } as Cue

    const renderTextToolbox = (cueOverrides: Partial<Cue> = {}) =>
      render(
        <Toolbox
          isOpen
          onClose={mockOnClose}
          cue={{ ...textCue, ...cueOverrides } as Cue}
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

    it("shows the current animation and defaults to none", () => {
      renderTextToolbox({ textEffect: "scroll-up" })
      expect(screen.getByTestId("toolbox-text-effect")).toHaveValue("scroll-up")
    })

    it("falls back to none when the element has no animation", () => {
      renderTextToolbox()
      expect(screen.getByTestId("toolbox-text-effect")).toHaveValue("none")
    })

    it("saves the chosen animation", async () => {
      mockOnSave.mockResolvedValue(undefined)
      renderTextToolbox()

      fireEvent.change(screen.getByTestId("toolbox-text-effect"), {
        target: { value: "scroll-down" },
      })
      fireEvent.click(screen.getByRole("button", { name: "Save" }))

      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalledWith(
          expect.objectContaining({ textEffect: "scroll-down" })
        )
      })
    })

    it("hides the speed slider until an animation is chosen", () => {
      renderTextToolbox()
      expect(screen.queryByLabelText("Animation speed")).not.toBeInTheDocument()

      fireEvent.change(screen.getByTestId("toolbox-text-effect"), {
        target: { value: "scroll-up" },
      })
      expect(screen.getByLabelText("Animation speed")).toBeInTheDocument()
    })

    it("saves the chosen animation speed", async () => {
      mockOnSave.mockResolvedValue(undefined)
      renderTextToolbox({ textEffect: "scroll-up", textEffectSpeed: 2 })

      expect(screen.getByText("2×")).toBeInTheDocument()
      fireEvent.click(screen.getByRole("button", { name: "Save" }))

      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalledWith(
          expect.objectContaining({ textEffectSpeed: 2 })
        )
      })
    })

    it("does not repeat the animation by default", () => {
      renderTextToolbox({ textEffect: "crawl" })

      expect(screen.getByTestId("toolbox-text-effect-loop")).not.toBeChecked()
    })

    it("saves the looping choice", async () => {
      mockOnSave.mockResolvedValue(undefined)
      renderTextToolbox({ textEffect: "crawl" })

      fireEvent.click(screen.getByTestId("toolbox-text-effect-loop"))
      fireEvent.click(screen.getByRole("button", { name: "Save" }))

      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalledWith(
          expect.objectContaining({ textEffectLoop: true })
        )
      })
    })

    it("hides the looping checkbox without an animation", () => {
      renderTextToolbox()

      expect(
        screen.queryByTestId("toolbox-text-effect-loop")
      ).not.toBeInTheDocument()
    })

    it("does not show the text fields for an ordinary element", () => {
      render(
        <Toolbox
          isOpen
          onClose={mockOnClose}
          cue={{ _id: "c", name: "photo", cueType: "visual" } as Cue}
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
      fireEvent.submit(
        screen.getByTestId("toolbox-text").closest("form") as Element
      )

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
      renderTextToolbox({ name: "" })

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

  describe("image element", () => {
    const imageCue = {
      _id: "cue-image",
      name: "Overlay",
      cueType: "visual",
      file: { type: "image/png", url: "http://example.com/overlay.png" },
      opacity: 1,
    } as Cue

    const renderImageToolbox = (cueOverrides: Partial<Cue> = {}) =>
      render(
        <Toolbox
          isOpen
          onClose={mockOnClose}
          cue={{ ...imageCue, ...cueOverrides } as Cue}
          onSave={mockOnSave}
        />
      )

    it("shows the current animation and defaults to none", () => {
      renderImageToolbox({ imageEffect: "fade" })
      expect(screen.getByTestId("toolbox-image-effect")).toHaveValue("fade")
    })

    it("falls back to none when the element has no animation", () => {
      renderImageToolbox()
      expect(screen.getByTestId("toolbox-image-effect")).toHaveValue("none")
    })

    it("saves the chosen animation", async () => {
      mockOnSave.mockResolvedValue(undefined)
      renderImageToolbox()

      fireEvent.change(screen.getByTestId("toolbox-image-effect"), {
        target: { value: "fade" },
      })
      fireEvent.click(screen.getByRole("button", { name: "Save" }))

      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalledWith(
          expect.objectContaining({ imageEffect: "fade" })
        )
      })
    })

    it("hides the speed slider until an animation is chosen", () => {
      renderImageToolbox()
      expect(screen.queryByLabelText("Animation speed")).not.toBeInTheDocument()

      fireEvent.change(screen.getByTestId("toolbox-image-effect"), {
        target: { value: "fade" },
      })
      expect(screen.getByLabelText("Animation speed")).toBeInTheDocument()
    })

    it("saves the chosen animation speed", async () => {
      mockOnSave.mockResolvedValue(undefined)
      renderImageToolbox({ imageEffect: "fade", imageEffectSpeed: 2 })

      expect(screen.getByText("2×")).toBeInTheDocument()
      fireEvent.click(screen.getByRole("button", { name: "Save" }))

      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalledWith(
          expect.objectContaining({ imageEffectSpeed: 2 })
        )
      })
    })

    it("does not repeat the animation by default", () => {
      renderImageToolbox({ imageEffect: "fade" })

      expect(screen.getByTestId("toolbox-image-effect-loop")).not.toBeChecked()
    })

    it("saves the looping choice", async () => {
      mockOnSave.mockResolvedValue(undefined)
      renderImageToolbox({ imageEffect: "fade" })

      fireEvent.click(screen.getByTestId("toolbox-image-effect-loop"))
      fireEvent.click(screen.getByRole("button", { name: "Save" }))

      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalledWith(
          expect.objectContaining({ imageEffectLoop: true })
        )
      })
    })

    it("hides the looping checkbox without an animation", () => {
      renderImageToolbox()

      expect(
        screen.queryByTestId("toolbox-image-effect-loop")
      ).not.toBeInTheDocument()
    })

    it("does not show the image animation controls for a color-only element", () => {
      render(
        <Toolbox
          isOpen
          onClose={mockOnClose}
          cue={{ _id: "c", name: "color", cueType: "visual" } as Cue}
          onSave={mockOnSave}
        />
      )

      expect(screen.queryByTestId("toolbox-image-effect")).toBeNull()
    })

    it("does not show the image animation controls for a video element", () => {
      render(
        <Toolbox
          isOpen
          onClose={mockOnClose}
          cue={
            {
              _id: "c",
              name: "clip",
              cueType: "visual",
              file: { type: "video/mp4", url: "http://example.com/clip.mp4" },
            } as Cue
          }
          onSave={mockOnSave}
        />
      )

      expect(screen.queryByTestId("toolbox-image-effect")).toBeNull()
    })

    it("does not show the text fields for an image element", () => {
      renderImageToolbox()

      expect(screen.queryByTestId("toolbox-text")).toBeNull()
    })
  })

  describe("framing a cue that spans screens", () => {
    const spanning = {
      ...cue,
      spanScreens: [1, 2],
      frame: { x: 0.666, y: 0, width: 0.333, height: 0.333 },
    } as Cue

    it("offers the span's framing instead of a position on one screen", () => {
      render(
        <Toolbox
          isOpen
          onClose={mockOnClose}
          cue={spanning}
          onSave={mockOnSave}
        />
      )

      expect(screen.getByText("Framing across screens")).toBeInTheDocument()
      expect(screen.queryByText("Position on screen")).toBeNull()
      expect(screen.queryByTestId("cue-frame-picker")).toBeNull()
      expect(screen.getByRole("button", { name: "Fill" })).toBeInTheDocument()
      expect(screen.getByRole("button", { name: "Fit" })).toBeInTheDocument()
    })

    it("keeps the per-screen picker while the cue stays on one screen", () => {
      render(
        <Toolbox isOpen onClose={mockOnClose} cue={cue} onSave={mockOnSave} />
      )

      expect(screen.getByText("Position on screen")).toBeInTheDocument()
      expect(screen.queryByRole("button", { name: "Fill" })).toBeNull()
    })

    it("saves the framing it was given", async () => {
      render(
        <Toolbox
          isOpen
          onClose={mockOnClose}
          cue={spanning}
          onSave={mockOnSave}
        />
      )

      fireEvent.click(screen.getByRole("button", { name: "Fit" }))
      fireEvent.click(screen.getByRole("button", { name: "Bottom right" }))
      fireEvent.click(screen.getByText("Save"))

      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalledWith(
          expect.objectContaining({
            spanFill: "contain",
            spanPosition: "bottom-right",
          })
        )
      })
    })

    it("shows the cue's own framing when it has one", () => {
      render(
        <Toolbox
          isOpen
          onClose={mockOnClose}
          cue={{ ...spanning, spanFill: "contain", spanPosition: "top" } as Cue}
          onSave={mockOnSave}
        />
      )

      expect(screen.getByRole("button", { name: "Fit" })).toHaveAttribute(
        "aria-pressed",
        "true"
      )
      expect(screen.getByRole("button", { name: "Top" })).toHaveAttribute(
        "aria-pressed",
        "true"
      )
    })
  })
})
