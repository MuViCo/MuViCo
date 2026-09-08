import React from "react"
import { render, waitFor } from "@testing-library/react"
import "@testing-library/jest-dom"
import ShowMonitorWindow from "../../components/presentation/ShowMonitorWindow"

describe("ShowMonitorWindow", () => {
  test("opens and closes a synchronized popup", async () => {
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
    })

    view.unmount()
    expect(popup.close).toHaveBeenCalledTimes(1)
    open.mockRestore()
  })
})
