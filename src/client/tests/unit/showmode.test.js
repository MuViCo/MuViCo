import React from "react"
import { render, screen, fireEvent, act, waitFor } from "@testing-library/react"
import ShowMode from "../../components/presentation/ShowMode"
import "@testing-library/jest-dom"

const mockCues = [
  {
    file: { url: "http://example.com/image1.jpg" },
    index: 0,
    name: "testtt",
    screen: 1,
    _id: "123456789",
  },
  {
    file: { url: "http://example.com/image2.jpg" },
    index: 1,
    name: "testtt2",
    screen: 2,
    _id: "987654321",
  },
]

const mockemptyCues = []

describe("ShowMode", () => {
  // simulate image loading behavior
  beforeAll(() => {
    global.Image = class {
      constructor() {
        setTimeout(() => {
          if (this.onload) {
            this.onload()
          }
        }, 0)
      }
    }
  })

  afterAll(() => {
    // clean up the global image mock
    delete global.Image
  })

  test("renders without crashing", async () => {
    await act(async () => {
      render(<ShowMode cues={mockCues} />)
    })

    expect(
      screen.getByRole("button", { name: "Open screen: 1" })
    ).toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: "Open screen: 2" })
    ).toBeInTheDocument()
  })

  test("initializes state correctly", async () => {
    await act(async () => {
      render(<ShowMode cues={mockCues} />)
    })

    expect(screen.getByRole("heading", { name: "Cue 0" })).toBeInTheDocument()

    expect(
      screen.getByRole("button", { name: "Open screen: 1" })
    ).toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: "Open screen: 2" })
    ).toBeInTheDocument()
  })

  test("navigates to next and previous cues", async () => {
    await act(async () => {
      render(<ShowMode cues={mockCues} />)
    })

    act(() => {
      fireEvent.click(screen.getByRole("button", { name: "Next Cue" }))
    })
    expect(screen.getByRole("heading", { name: "Cue 1" })).toBeInTheDocument()

    act(() => {
      fireEvent.click(screen.getByRole("button", { name: "Previous Cue" }))
    })
    expect(screen.getByRole("heading", { name: "Cue 0" })).toBeInTheDocument()
  })

  test("toggles screen visibility", async () => {
    await act(async () => {
      render(<ShowMode cues={mockCues} />)
    })

    act(() => {
      fireEvent.click(screen.getByRole("button", { name: "Open screen: 1" }))
    })
    expect(
      screen.getByRole("button", { name: "Close screen: 1" })
    ).toBeInTheDocument()

    act(() => {
      fireEvent.click(screen.getByRole("button", { name: "Close screen: 1" }))
    })
    expect(
      screen.getByRole("button", { name: "Open screen: 1" })
    ).toBeInTheDocument()
  })

  test("toggles visibility for multiple screens", async () => {
    await act(async () => {
      render(<ShowMode cues={mockCues} />)
    })

    act(() => {
      fireEvent.click(screen.getByRole("button", { name: "Open screen: 1" }))
    })
    expect(
      screen.getByRole("button", { name: "Close screen: 1" })
    ).toBeInTheDocument()

    act(() => {
      fireEvent.click(screen.getByRole("button", { name: "Open screen: 2" }))
    })
    expect(
      screen.getByRole("button", { name: "Close screen: 2" })
    ).toBeInTheDocument()

    act(() => {
      fireEvent.click(screen.getByRole("button", { name: "Close screen: 1" }))
    })
    expect(
      screen.getByRole("button", { name: "Open screen: 1" })
    ).toBeInTheDocument()

    act(() => {
      fireEvent.click(screen.getByRole("button", { name: "Close screen: 2" }))
    })
    expect(
      screen.getByRole("button", { name: "Open screen: 2" })
    ).toBeInTheDocument()
  })

  test("handles empty cues", async () => {
    await act(async () => {
      render(<ShowMode cues={mockemptyCues} />)
    })
    expect(
      screen.queryByRole("button", { name: "Open screen: 1" })
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole("button", { name: "Open screen: 2" })
    ).not.toBeInTheDocument()
  })

  test("handles keyboard arrow keys", async () => {
    await act(async () => {
      render(<ShowMode cues={mockCues} />)
    })

    // Simuloidaan "ArrowRight" (seuraava)
    fireEvent.keyDown(window, { key: "ArrowRight" })
    expect(screen.getByRole("heading", { name: "Index 1" })).toBeInTheDocument()

    // Simuloidaan "ArrowLeft" (edellinen)
    fireEvent.keyDown(window, { key: "ArrowLeft" })
    expect(screen.getByRole("heading", { name: "Index 0" })).toBeInTheDocument()
  })

  test("mirrors one screen to another", async () => {
    if (!window.HTMLElement.prototype.scrollTo) {
      window.HTMLElement.prototype.scrollTo = () => {}
    }

    render(<ShowMode cues={mockCues} />)

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: "Open screen: 1" })
      ).toBeInTheDocument()
    })

    const dropdownButton = screen.getByRole("button", {
      name: "Dropdown for screen 1",
    })

    act(() => {
      fireEvent.click(dropdownButton)
    })

    const menuItem = screen.getByText("Mirror screen: 2")

    act(() => {
      fireEvent.click(menuItem)
    })

    const button = screen.getByRole("button", { name: /Open screen: 1/i })
    expect(button).toHaveTextContent(/Mirroring screen: 2/)
  })
})
