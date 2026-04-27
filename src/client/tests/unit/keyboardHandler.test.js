/*
 * Keyboard handler unit tests.
 * Verifies supported navigation keys, ignored keys, and event listener cleanup on unmount.
 */
import { render, fireEvent } from "@testing-library/react"
import KeyboardHandler from "../../components/utils/keyboardHandler"

import "@testing-library/jest-dom"

describe("KeyboardHandler", () => {
  test("calls onNext when pressing ArrowRight", () => {
    const onNext = jest.fn()
    const onPrevious = jest.fn()

    render(<KeyboardHandler onNext={onNext} onPrevious={onPrevious} />)

    fireEvent.keyDown(window, { key: "ArrowRight" })

    expect(onNext).toHaveBeenCalledTimes(1)
    expect(onPrevious).not.toHaveBeenCalled()
  })

  test("calls onPrevious when pressing ArrowLeft", () => {
    const onNext = jest.fn()
    const onPrevious = jest.fn()

    render(<KeyboardHandler onNext={onNext} onPrevious={onPrevious} />)

    fireEvent.keyDown(window, { key: "ArrowLeft" })

    expect(onPrevious).toHaveBeenCalledTimes(1)
    expect(onNext).not.toHaveBeenCalled()
  })

  test("calls onNext when pressing PageDown", () => {
    const onNext = jest.fn()
    const onPrevious = jest.fn()

    render(<KeyboardHandler onNext={onNext} onPrevious={onPrevious} />)

    fireEvent.keyDown(window, { key: "PageDown" })

    expect(onNext).toHaveBeenCalledTimes(1)
    expect(onPrevious).not.toHaveBeenCalled()
  })

  test("calls onPrevious when pressing PageUp", () => {
    const onNext = jest.fn()
    const onPrevious = jest.fn()

    render(<KeyboardHandler onNext={onNext} onPrevious={onPrevious} />)

    fireEvent.keyDown(window, { key: "PageUp" })

    expect(onPrevious).toHaveBeenCalledTimes(1)
    expect(onNext).not.toHaveBeenCalled()
  })

  test("calls onNext when pressing ArrowUp (index moves forward)", () => {
    const onNext = jest.fn()
    const onPrevious = jest.fn()

    render(<KeyboardHandler onNext={onNext} onPrevious={onPrevious} />)

    fireEvent.keyDown(window, { key: "ArrowUp" })

    expect(onNext).toHaveBeenCalledTimes(1)
    expect(onPrevious).not.toHaveBeenCalled()
  })

  test("calls onPrevious when pressing ArrowDown (index moves backward)", () => {
    const onNext = jest.fn()
    const onPrevious = jest.fn()

    render(<KeyboardHandler onNext={onNext} onPrevious={onPrevious} />)

    fireEvent.keyDown(window, { key: "ArrowDown" })

    expect(onPrevious).toHaveBeenCalledTimes(1)
    expect(onNext).not.toHaveBeenCalled()
  })

  test("it does not call callbacks for keys that are not handled", () => {
    const onNext = jest.fn()
    const onPrevious = jest.fn()

    render(<KeyboardHandler onNext={onNext} onPrevious={onPrevious} />)

    fireEvent.keyDown(window, { key: "Enter" })
    fireEvent.keyDown(window, { key: "Escape" })
    fireEvent.keyDown(window, { key: "A" })

    expect(onNext).not.toHaveBeenCalled()
    expect(onPrevious).not.toHaveBeenCalled()
  })

  test("removes the event listener on unmount", () => {
    const onNext = jest.fn()
    const onPrevious = jest.fn()

    const { unmount } = render(
      <KeyboardHandler onNext={onNext} onPrevious={onPrevious} />
    )

    unmount()

    fireEvent.keyDown(window, { key: "ArrowRight" })
    expect(onNext).not.toHaveBeenCalled()
  })
})
