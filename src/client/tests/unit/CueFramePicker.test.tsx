import { render, screen, fireEvent } from "@testing-library/react"
import "@testing-library/jest-dom"

import CueFramePicker from "../../components/presentation/CueFramePicker"
import { FULL_FRAME } from "../../components/utils/cueFrame"

describe("CueFramePicker", () => {
  test("offers a square for each of the nine positions plus full screen", () => {
    render(
      <CueFramePicker
        value={FULL_FRAME}
        aspectRatio={16 / 9}
        onChange={jest.fn()}
      />
    )

    const labels = [
      "Top left",
      "Top",
      "Top right",
      "Left",
      "Centre",
      "Right",
      "Bottom left",
      "Bottom",
      "Bottom right",
    ]
    labels.forEach((label) => {
      expect(screen.getByTestId(`frame-cell-${label}`)).toBeInTheDocument()
    })
    expect(screen.getByTestId("frame-cell-Full")).toBeInTheDocument()
  })

  test("clicking a square reports that position", () => {
    const onChange = jest.fn()
    render(
      <CueFramePicker
        value={FULL_FRAME}
        aspectRatio={16 / 9}
        onChange={onChange}
      />
    )

    fireEvent.click(screen.getByTestId("frame-cell-Bottom right"))

    expect(onChange).toHaveBeenCalledWith({
      x: 0.5,
      y: 0.5,
      width: 0.5,
      height: 0.5,
    })
  })

  test("marks the square matching the current frame", () => {
    render(
      <CueFramePicker
        value={{ x: 0, y: 0, width: 0.5, height: 0.5 }}
        aspectRatio={16 / 9}
        onChange={jest.fn()}
      />
    )

    expect(screen.getByTestId("frame-cell-Top left")).toHaveAttribute(
      "data-active",
      "true"
    )
    expect(screen.getByTestId("frame-cell-Centre")).not.toHaveAttribute(
      "data-active"
    )
  })

  test("marks no square when the element covers the whole screen", () => {
    render(
      <CueFramePicker
        value={undefined}
        aspectRatio={16 / 9}
        onChange={jest.fn()}
      />
    )

    const active = screen
      .getByTestId("cue-frame-picker")
      .querySelectorAll('[data-active="true"]')
    expect(active).toHaveLength(0)
  })
})
