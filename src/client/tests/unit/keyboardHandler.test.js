import React from "react"
import { render, fireEvent } from "@testing-library/react"
import KeyboardHandler from "../../components/utils/keyboardHandler"

// Added to enable additional matchers like toBeInTheDocument()
import "@testing-library/jest-dom"

describe("KeyboardHandler", () => {
  test("calls onNext when pressing ArrowRight", () => {
    const onNext = jest.fn()
    const onPrevious = jest.fn()

    render(<KeyboardHandler onNext={onNext} onPrevious={onPrevious} />)

    // Simulate the ArrowRight key
    fireEvent.keyDown(window, { key: "ArrowRight" })

    expect(onNext).toHaveBeenCalledTimes(1)
    expect(onPrevious).not.toHaveBeenCalled()
  })

  test("calls onPrevious when pressing ArrowLeft", () => {
    const onNext = jest.fn()
    const onPrevious = jest.fn()

    render(<KeyboardHandler onNext={onNext} onPrevious={onPrevious} />)

    // Simulate the ArrowLeft key
    fireEvent.keyDown(window, { key: "ArrowLeft" })

    expect(onPrevious).toHaveBeenCalledTimes(1)
    expect(onNext).not.toHaveBeenCalled()
  })

  test("calls onNext when pressing PageDown", () => {
    const onNext = jest.fn()
    const onPrevious = jest.fn()

    render(<KeyboardHandler onNext={onNext} onPrevious={onPrevious} />)

    // Simulate the PageDown key
    fireEvent.keyDown(window, { key: "PageDown" })

    expect(onNext).toHaveBeenCalledTimes(1)
    expect(onPrevious).not.toHaveBeenCalled()
  })

  test("calls onPrevious when pressing PageUp", () => {
    const onNext = jest.fn()
    const onPrevious = jest.fn()

    render(<KeyboardHandler onNext={onNext} onPrevious={onPrevious} />)

    // Simulate the PageUp key
    fireEvent.keyDown(window, { key: "PageUp" })

    expect(onPrevious).toHaveBeenCalledTimes(1)
    expect(onNext).not.toHaveBeenCalled()
  })

  test("calls onNext when pressing ArrowUp (index moves forward)", () => {
    const onNext = jest.fn()
    const onPrevious = jest.fn()

    render(<KeyboardHandler onNext={onNext} onPrevious={onPrevious} />)

    // Simulate the ArrowUp key
    fireEvent.keyDown(window, { key: "ArrowUp" })

    expect(onNext).toHaveBeenCalledTimes(1)
    expect(onPrevious).not.toHaveBeenCalled()
  })

  test("calls onPrevious when pressing ArrowDown (index moves backward)", () => {
    const onNext = jest.fn()
    const onPrevious = jest.fn()

    render(<KeyboardHandler onNext={onNext} onPrevious={onPrevious} />)

    // Simulate the ArrowDown key
    fireEvent.keyDown(window, { key: "ArrowDown" })

    expect(onPrevious).toHaveBeenCalledTimes(1)
    expect(onNext).not.toHaveBeenCalled()
  })

  test("it does not call callbacks for keys that are not handled", () => {
    const onNext = jest.fn()
    const onPrevious = jest.fn()

    render(<KeyboardHandler onNext={onNext} onPrevious={onPrevious} />)

    // Simulate keys that should not trigger any callbacks
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

    // Unmount the component to trigger a cleanup
    unmount()

    // After unmounting, simulate pressing a key and verify that the callbacks are not called
    fireEvent.keyDown(window, { key: "ArrowRight" })
    expect(onNext).not.toHaveBeenCalled()
  })
})
