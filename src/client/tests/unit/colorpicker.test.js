import React from "react"
import { render, screen, fireEvent } from "@testing-library/react"
import "@testing-library/jest-dom"
import { ColorPickerWithPresets } from "../../components/presentation/ColorPicker"

describe("ColorPickerWithPresets", () => {
  test("renders all preset swatches", () => {
    const presetColors = ["#000000", "#ffffff", "#ff0000", "#00ff00"]

    render(
      <ColorPickerWithPresets
        color="#000000"
        onChange={() => {}}
        presetColors={presetColors}
      />
    )

    const swatches = document.querySelectorAll(".picker__swatch")
    expect(swatches).toHaveLength(presetColors.length)
  })

  test("clicking a swatch calls onChange with that preset color", () => {
    const onChange = jest.fn()
    const presetColors = ["#000000", "#ffffff", "#ff0000"]

    render(
      <ColorPickerWithPresets
        color="#000000"
        onChange={onChange}
        presetColors={presetColors}
      />
    )

    const swatches = document.querySelectorAll(".picker__swatch")
    fireEvent.click(swatches[2])

    expect(onChange).toHaveBeenCalledWith("#ff0000")
  })

  test("typing a hex color in input triggers onChange", () => {
    const onChange = jest.fn()

    render(
      <ColorPickerWithPresets
        color="#000000"
        onChange={onChange}
        presetColors={["#000000"]}
      />
    )

    const hexInput = screen.getByRole("textbox")
    fireEvent.change(hexInput, { target: { value: "#123456" } })

    expect(onChange).toHaveBeenCalled()
    const latestCall = onChange.mock.calls[onChange.mock.calls.length - 1][0]
    expect(String(latestCall)).toContain("123456")
  })
})
