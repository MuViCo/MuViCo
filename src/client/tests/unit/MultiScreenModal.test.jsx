/**
 * MultiScreenModal unit tests.
 * Covers screen list rendering, the cue's own screen being locked in,
 * pre-checking an existing span, and the onSave payload shape.
 */
import React from "react"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import "@testing-library/jest-dom"
import MultiScreenModal from "../../components/presentation/MultiScreenModal"

describe("MultiScreenModal", () => {
  const cue = {
    _id: "cue-1",
    index: 0,
    screen: 2,
    name: "Banner",
    cueType: "visual",
    file: { type: "image/png", url: "https://example.com/banner.png" },
  }

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
})
