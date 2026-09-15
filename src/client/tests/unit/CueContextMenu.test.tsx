/*
 * Cue context menu tests.
 * Covers visual/audio action visibility, callback wiring, and focus recovery.
 */
import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import "@testing-library/jest-dom"

import CueContextMenu from "../../components/presentation/CueContextMenu"

import type { Cue } from "../../types"

const visualCue: Cue = {
  _id: "visual-1",
  cueType: "visual",
  index: 0,
  name: "Visual cue",
  screen: 1,
  spanScreens: [1, 2],
  file: {
    id: "file-1",
    name: "visual.png",
    url: "https://example.com/visual.png",
    type: "image/png",
  },
  loop: false,
  continuePlayback: false,
  opacity: 1,
  layer: 0,
}

const audioCue: Cue = {
  ...visualCue,
  _id: "audio-1",
  cueType: "audio",
  name: "Audio cue",
  screen: 3,
  spanScreens: undefined,
  file: {
    id: "file-2",
    name: "audio.mp3",
    url: "https://example.com/audio.mp3",
    type: "audio/mpeg",
  },
  loop: true,
  continuePlayback: false,
}

const renderMenu = (cue: Cue, overrides = {}) => {
  const returnFocusTo = document.createElement("button")
  returnFocusTo.textContent = "Return focus"
  returnFocusTo.dataset.cueContextReturnFocus = "true"
  document.body.appendChild(returnFocusTo)

  const props = {
    state: { cue, x: 120, y: 240, returnFocusTo },
    onClose: jest.fn(),
    onEdit: jest.fn(),
    onCopy: jest.fn(),
    onDelete: jest.fn(),
    onToggleLoop: jest.fn(),
    onToggleContinuePlayback: jest.fn(),
    onOpenMultiScreen: jest.fn(),
    ...overrides,
  }

  const result = render(<CueContextMenu {...props} />)
  return { ...result, props, returnFocusTo }
}

describe("CueContextMenu", () => {
  afterEach(() => {
    document
      .querySelectorAll('[data-cue-context-return-focus="true"]')
      .forEach((element) => element.remove())
  })

  it("shows and dispatches the actions for a visual cue", () => {
    const { props } = renderMenu(visualCue)

    expect(screen.getByRole("menu")).toBeInTheDocument()
    expect(screen.getByText("Span across screens")).toBeInTheDocument()
    expect(screen.queryByText("Enable loop")).not.toBeInTheDocument()

    fireEvent.click(screen.getByLabelText("Edit Visual cue"))
    expect(props.onEdit).toHaveBeenCalledWith(visualCue)
  })

  it("shows the current audio toggle actions", () => {
    const { props } = renderMenu(audioCue)

    expect(screen.getByText("Disable loop")).toBeInTheDocument()
    expect(screen.getByText("Enable continuous playback")).toBeInTheDocument()
    expect(screen.queryByText("Span across screens")).not.toBeInTheDocument()

    fireEvent.click(screen.getByLabelText("Loop audio Audio cue"))
    expect(props.onToggleLoop).toHaveBeenCalledWith(audioCue)
  })

  it("closes on Escape and restores focus to the originating element", async () => {
    const { props, returnFocusTo } = renderMenu(visualCue)

    const menu = screen.getByRole("menu")
    await waitFor(() => expect(menu).toHaveFocus())
    fireEvent.keyDown(menu, { key: "Escape" })

    expect(props.onClose).toHaveBeenCalledTimes(1)
    await waitFor(() => expect(returnFocusTo).toHaveFocus())
  })
})
