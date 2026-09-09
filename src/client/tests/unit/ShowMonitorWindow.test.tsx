import React from "react"
import { act, render, waitFor } from "@testing-library/react"
import "@testing-library/jest-dom"
import ShowMonitorWindow from "../../components/presentation/ShowMonitorWindow"

describe("ShowMonitorWindow", () => {
  test("opens and closes a synchronized popup", async () => {
    const style = document.createElement("style")
    style.textContent = ".monitor-test { color: red; }"
    document.head.appendChild(style)
    const popupDocument = document.implementation.createHTMLDocument()
    const popup = {
      document: popupDocument,
      closed: false,
      close: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    }
    const open = jest
      .spyOn(window, "open")
      .mockReturnValue(popup as unknown as Window)
    const onClose = jest.fn()

    const view = render(
      <ShowMonitorWindow title="Concert monitor" onClose={onClose}>
        <div>Live monitor content</div>
      </ShowMonitorWindow>
    )

    await waitFor(() => {
      expect(popupDocument.body.textContent).toContain("Live monitor content")
      expect(popupDocument.title).toBe("Concert monitor")
      expect(popupDocument.head.textContent).toContain("monitor-test")
    })

    view.unmount()
    expect(popup.close).toHaveBeenCalledTimes(1)
    style.remove()
    open.mockRestore()
  })

  test("reports when the browser blocks the monitor popup", () => {
    const open = jest.spyOn(window, "open").mockReturnValue(null)
    const onClose = jest.fn()

    render(
      <ShowMonitorWindow title="Blocked monitor" onClose={onClose}>
        <div>Hidden content</div>
      </ShowMonitorWindow>
    )

    expect(onClose).toHaveBeenCalledTimes(1)
    open.mockRestore()
  })

  test("detects a monitor window closed without beforeunload", async () => {
    jest.useFakeTimers()
    const popupDocument = document.implementation.createHTMLDocument()
    const popup = {
      document: popupDocument,
      closed: false,
      close: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    }
    const open = jest
      .spyOn(window, "open")
      .mockReturnValue(popup as unknown as Window)
    const onClose = jest.fn()

    render(
      <ShowMonitorWindow title="Concert monitor" onClose={onClose}>
        <div>Live monitor content</div>
      </ShowMonitorWindow>
    )

    await act(async () => {})
    popup.closed = true
    act(() => jest.advanceTimersByTime(750))

    expect(onClose).toHaveBeenCalledTimes(1)
    open.mockRestore()
    jest.useRealTimers()
  })
})
