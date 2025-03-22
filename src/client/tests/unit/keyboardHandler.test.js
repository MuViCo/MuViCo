import React from "react"
import { render, fireEvent } from "@testing-library/react"
import KeyboardHandler from "../../components/utils/keyboardHandler"

// Lisätty, jotta saat expect(...).toBeInTheDocument() jne.
import "@testing-library/jest-dom"

describe("KeyboardHandler", () => {
  test("kutsuu onNext kun painetaan nuolinäppäintä oikealle (ArrowRight)", () => {
    const onNext = jest.fn()
    const onPrevious = jest.fn()

    render(<KeyboardHandler onNext={onNext} onPrevious={onPrevious} />)

    // Simuloidaan ArrowRight-näppäimen painallus
    fireEvent.keyDown(window, { key: "ArrowRight" })

    expect(onNext).toHaveBeenCalledTimes(1)
    expect(onPrevious).not.toHaveBeenCalled()
  })

  test("kutsuu onPrevious kun painetaan nuolinäppäintä vasemmalle (ArrowLeft)", () => {
    const onNext = jest.fn()
    const onPrevious = jest.fn()

    render(<KeyboardHandler onNext={onNext} onPrevious={onPrevious} />)

    fireEvent.keyDown(window, { key: "ArrowLeft" })

    expect(onPrevious).toHaveBeenCalledTimes(1)
    expect(onNext).not.toHaveBeenCalled()
  })

  test("kutsuu onNext kun painetaan PageDown", () => {
    const onNext = jest.fn()
    const onPrevious = jest.fn()

    render(<KeyboardHandler onNext={onNext} onPrevious={onPrevious} />)

    fireEvent.keyDown(window, { key: "PageDown" })

    expect(onNext).toHaveBeenCalledTimes(1)
    expect(onPrevious).not.toHaveBeenCalled()
  })

  test("kutsuu onPrevious kun painetaan PageUp", () => {
    const onNext = jest.fn()
    const onPrevious = jest.fn()

    render(<KeyboardHandler onNext={onNext} onPrevious={onPrevious} />)

    fireEvent.keyDown(window, { key: "PageUp" })

    expect(onPrevious).toHaveBeenCalledTimes(1)
    expect(onNext).not.toHaveBeenCalled()
  })

  test("ei kutsu callbackeja muilla näppäimillä", () => {
    const onNext = jest.fn()
    const onPrevious = jest.fn()

    render(<KeyboardHandler onNext={onNext} onPrevious={onPrevious} />)

    fireEvent.keyDown(window, { key: "Enter" })
    fireEvent.keyDown(window, { key: "Escape" })
    fireEvent.keyDown(window, { key: "A" })

    expect(onNext).not.toHaveBeenCalled()
    expect(onPrevious).not.toHaveBeenCalled()
  })

  test("poistaa eventListenerin unmountissa", () => {
    const onNext = jest.fn()
    const onPrevious = jest.fn()

    const { unmount } = render(
      <KeyboardHandler onNext={onNext} onPrevious={onPrevious} />
    )

    // Komponentti unmountataan
    unmount()

    // Nyt eventListener on poistettu
    fireEvent.keyDown(window, { key: "ArrowRight" })

    // onNext ei saa tulla kutsutuksi
    expect(onNext).not.toHaveBeenCalled()
  })
})
