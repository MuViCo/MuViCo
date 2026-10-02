/**
 * MultiScreenModal unit tests.
 * Covers screen list rendering, the cue's own screen being locked in,
 * pre-checking an existing span, and the onSave payload shape.
 */
import React from "react"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import "@testing-library/jest-dom"
import MultiScreenModal from "../../components/presentation/MultiScreenModal"
import type { Cue } from "../../types"

describe("MultiScreenModal", () => {
  const cue = {
    _id: "cue-1",
    index: 0,
    screen: 2,
    name: "Banner",
    cueType: "visual",
    file: { type: "image/png", url: "https://example.com/banner.png" },
  } as Cue

  test("renders nothing when closed", () => {
    render(
      <MultiScreenModal
        isOpen={false}
        cue={cue}
        screenCount={4}
        onSave={jest.fn()}
        onClose={jest.fn()}
      />
    )

    expect(screen.queryByText("Span across screens")).not.toBeInTheDocument()
  })

  test("lists every screen and locks the cue's own screen checked and disabled", () => {
    render(
      <MultiScreenModal
        isOpen={true}
        cue={cue}
        screenCount={4}
        onSave={jest.fn()}
        onClose={jest.fn()}
      />
    )

    for (let screenNumber = 1; screenNumber <= 4; screenNumber += 1) {
      expect(
        screen.getByText(new RegExp(`^Screen ${screenNumber}`))
      ).toBeInTheDocument()
    }

    const ownScreenCheckbox = screen.getByRole("checkbox", {
      name: /Screen 2 \(this element\)/,
    })
    expect(ownScreenCheckbox).toBeChecked()
    expect(ownScreenCheckbox).toBeDisabled()
  })

  test("disables a screen whose layer is already taken at this frame", () => {
    const layeredCue = { ...cue, layer: 1 }
    const cues = [
      layeredCue,
      {
        _id: "cue-blocker",
        index: 0,
        screen: 3,
        layer: 1,
        name: "Sunset",
        cueType: "visual",
      },
    ] as Cue[]

    render(
      <MultiScreenModal
        isOpen={true}
        cue={layeredCue}
        screenCount={4}
        cues={cues}
        onSave={jest.fn()}
        onClose={jest.fn()}
      />
    )

    const blocked = screen.getByRole("checkbox", { name: /Screen 3/ })
    expect(blocked).toBeDisabled()
    expect(screen.getByText(/taken by "Sunset"/)).toBeInTheDocument()

    expect(screen.getByRole("checkbox", { name: /Screen 4/ })).toBeEnabled()
  })

  test("counts a screen reached by another cue's span as taken", () => {
    const layeredCue = { ...cue, layer: 1 }
    const cues = [
      layeredCue,
      {
        _id: "cue-other-span",
        index: 0,
        screen: 1,
        layer: 1,
        name: "Backdrop",
        cueType: "visual",
        spanScreens: [1, 4],
      },
    ] as Cue[]

    render(
      <MultiScreenModal
        isOpen={true}
        cue={layeredCue}
        screenCount={4}
        cues={cues}
        onSave={jest.fn()}
        onClose={jest.fn()}
      />
    )

    expect(screen.getByRole("checkbox", { name: /Screen 4/ })).toBeDisabled()
    expect(screen.getByRole("checkbox", { name: /Screen 1/ })).toBeDisabled()
    expect(screen.getAllByText(/taken by "Backdrop"/)).toHaveLength(2)
  })

  test("flags the screens the span will add a lane to", () => {
    const layeredCue = { ...cue, layer: 1 }

    render(
      <MultiScreenModal
        isOpen={true}
        cue={layeredCue}
        screenCount={3}
        cues={[layeredCue]}
        hasLaneForLayer={(screenNumber: number) => screenNumber !== 3}
        onSave={jest.fn()}
        onClose={jest.fn()}
      />
    )

    expect(screen.getByText(/adds a lane/)).toBeInTheDocument()
    expect(
      screen.getByRole("checkbox", { name: /Screen 3.*adds a lane/ })
    ).toBeEnabled()
  })

  test("pre-checks an existing span", () => {
    render(
      <MultiScreenModal
        isOpen={true}
        cue={{ ...cue, spanScreens: [1, 2, 3] }}
        screenCount={4}
        onSave={jest.fn()}
        onClose={jest.fn()}
      />
    )

    expect(screen.getByRole("checkbox", { name: /^Screen 1/ })).toBeChecked()
    expect(
      screen.getByRole("checkbox", { name: /Screen 2 \(this element\)/ })
    ).toBeChecked()
    expect(screen.getByRole("checkbox", { name: /^Screen 3/ })).toBeChecked()
    expect(
      screen.getByRole("checkbox", { name: /^Screen 4/ })
    ).not.toBeChecked()
  })

  test("saves the selected screens, including cueName so the cue's name survives", async () => {
    const onSave = jest.fn().mockResolvedValue(undefined)
    const onClose = jest.fn()

    render(
      <MultiScreenModal
        isOpen={true}
        cue={cue}
        screenCount={4}
        onSave={onSave}
        onClose={onClose}
      />
    )

    fireEvent.click(screen.getByRole("checkbox", { name: /^Screen 3/ }))
    fireEvent.click(screen.getByRole("button", { name: "Save" }))

    await waitFor(() => {
      expect(onSave).toHaveBeenCalledWith(
        expect.objectContaining({
          _id: "cue-1",
          cueName: "Banner",
          spanScreens: [2, 3],
        })
      )
      expect(onClose).toHaveBeenCalled()
    })
  })

  test("saving with only the cue's own screen checked clears the span", async () => {
    const onSave = jest.fn().mockResolvedValue(undefined)

    render(
      <MultiScreenModal
        isOpen={true}
        cue={{ ...cue, spanScreens: [1, 2, 3] }}
        screenCount={4}
        onSave={onSave}
        onClose={jest.fn()}
      />
    )

    fireEvent.click(screen.getByRole("checkbox", { name: /^Screen 1/ }))
    fireEvent.click(screen.getByRole("checkbox", { name: /^Screen 3/ }))
    fireEvent.click(screen.getByRole("button", { name: "Save" }))

    await waitFor(() => {
      expect(onSave).toHaveBeenCalledWith(
        expect.objectContaining({ spanScreens: [] })
      )
    })
  })

  describe("framing", () => {
    const spanningCue = { ...cue, spanScreens: [2, 3] } as Cue

    test("defaults to filling the screens, centered", () => {
      render(
        <MultiScreenModal
          isOpen={true}
          cue={spanningCue}
          screenCount={4}
          onSave={jest.fn()}
          onClose={jest.fn()}
        />
      )

      expect(screen.getByRole("button", { name: "Fill" })).toHaveAttribute(
        "aria-pressed",
        "true"
      )
      expect(screen.getByRole("button", { name: "Center" })).toHaveAttribute(
        "aria-pressed",
        "true"
      )
    })

    test("shows the cue's own framing when it has one", () => {
      render(
        <MultiScreenModal
          isOpen={true}
          cue={
            {
              ...spanningCue,
              spanFill: "contain",
              spanPosition: "bottom-right",
            } as Cue
          }
          screenCount={4}
          onSave={jest.fn()}
          onClose={jest.fn()}
        />
      )

      expect(screen.getByRole("button", { name: "Fit" })).toHaveAttribute(
        "aria-pressed",
        "true"
      )
      expect(
        screen.getByRole("button", { name: "Bottom right" })
      ).toHaveAttribute("aria-pressed", "true")
    })

    test("saves the chosen fill and position", async () => {
      const onSave = jest.fn().mockResolvedValue(undefined)

      render(
        <MultiScreenModal
          isOpen={true}
          cue={spanningCue}
          screenCount={4}
          onSave={onSave}
          onClose={jest.fn()}
        />
      )

      fireEvent.click(screen.getByRole("button", { name: "Fit" }))
      fireEvent.click(screen.getByRole("button", { name: "Top" }))
      fireEvent.click(screen.getByRole("button", { name: "Save" }))

      await waitFor(() => {
        expect(onSave).toHaveBeenCalledWith(
          expect.objectContaining({
            spanFill: "contain",
            spanPosition: "top",
          })
        )
      })
    })

    test("offers all nine anchors", () => {
      render(
        <MultiScreenModal
          isOpen={true}
          cue={spanningCue}
          screenCount={4}
          onSave={jest.fn()}
          onClose={jest.fn()}
        />
      )

      expect(
        screen
          .getByRole("group", { name: "Position" })
          .querySelectorAll("button")
      ).toHaveLength(9)
    })

    test("disables the framing controls until the cue actually spans", () => {
      render(
        <MultiScreenModal
          isOpen={true}
          cue={cue}
          screenCount={4}
          onSave={jest.fn()}
          onClose={jest.fn()}
        />
      )

      expect(screen.getByRole("button", { name: "Fill" })).toBeDisabled()
      expect(screen.getByRole("button", { name: "Center" })).toBeDisabled()

      fireEvent.click(screen.getByRole("checkbox", { name: /^Screen 3/ }))

      expect(screen.getByRole("button", { name: "Fill" })).toBeEnabled()
      expect(screen.getByRole("button", { name: "Center" })).toBeEnabled()
    })
  })
})
