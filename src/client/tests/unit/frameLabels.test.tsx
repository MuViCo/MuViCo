import { render, screen, fireEvent } from "@testing-library/react"
import "@testing-library/jest-dom"

import { ColumnHeaders } from "../../components/presentation/EditModeHeaders"
import { ScoreMarkerPin } from "../../components/presentation/ScoreMarkerOverlay"
import type { ScoreMarker } from "../../types"

const renderHeaders = (props = {}) =>
  render(
    <ColumnHeaders
      xLabels={["Frame 0", "Frame 1", "Frame 2"]}
      cueIndex={0}
      bgCurrentFrame="#fff"
      bgColorIndex="#eee"
      rowHeight={60}
      columnWidth={150}
      frameHeaderHeight={34}
      indexCount={3}
      headerActionsRef={{ current: {} } as never}
      {...props}
    />
  )

describe("frame labels in the timeline header", () => {
  test("shows the custom label instead of the default one", () => {
    renderHeaders({ frameLabels: { "1": "Chorus" } })

    expect(screen.getByText("Chorus")).toBeInTheDocument()
    expect(screen.queryByText("Frame 1")).not.toBeInTheDocument()
    expect(screen.getByText("Frame 0")).toBeInTheDocument()
  })

  test("double-clicking opens an input seeded with the current label", () => {
    renderHeaders({ frameLabels: { "1": "Chorus" }, onRenameFrame: jest.fn() })

    fireEvent.doubleClick(screen.getByText("Chorus"))

    expect(screen.getByTestId("frame-label-input-1")).toHaveValue("Chorus")
  })

  test("reports the new label on Enter", () => {
    const onRenameFrame = jest.fn()
    renderHeaders({ onRenameFrame })

    fireEvent.doubleClick(screen.getByText("Frame 2"))
    const input = screen.getByTestId("frame-label-input-2")
    fireEvent.change(input, { target: { value: "Outro" } })
    fireEvent.keyDown(input, { key: "Enter" })

    expect(onRenameFrame).toHaveBeenCalledWith(2, "Outro")
  })

  test("Escape leaves the label untouched", () => {
    const onRenameFrame = jest.fn()
    renderHeaders({ onRenameFrame })

    fireEvent.doubleClick(screen.getByText("Frame 2"))
    fireEvent.keyDown(screen.getByTestId("frame-label-input-2"), {
      key: "Escape",
    })

    expect(onRenameFrame).not.toHaveBeenCalled()
    expect(screen.getByText("Frame 2")).toBeInTheDocument()
  })

  test("offers no renaming without a handler", () => {
    renderHeaders()

    fireEvent.doubleClick(screen.getByText("Frame 1"))

    expect(screen.queryByTestId("frame-label-input-1")).not.toBeInTheDocument()
  })
})

describe("frame labels on score markers", () => {
  const marker = {
    _id: "m1",
    page: 1,
    frameIndex: 2,
    rect: { x: 0.5, y: 0.5 },
  } as ScoreMarker

  test("names the frame in the tooltip when it has a label", () => {
    render(<ScoreMarkerPin marker={marker} frameLabel="Chorus" />)

    expect(screen.getByTestId("score-marker-pin")).toHaveAttribute(
      "title",
      expect.stringContaining("Chorus (Frame 2)")
    )
  })

  test("falls back to the frame number without a label", () => {
    render(<ScoreMarkerPin marker={marker} />)

    expect(screen.getByTestId("score-marker-pin")).toHaveAttribute(
      "title",
      expect.stringContaining("Frame 2")
    )
  })
})
