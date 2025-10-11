import React from "react"
import { render, screen, fireEvent, act, waitFor } from "@testing-library/react"
import ShowMode from "../../components/presentation/ShowMode"
import Screen from "../../components/presentation/Screen"
import "@testing-library/jest-dom"

const mockCues = [
  {
    file: { url: "http://example.com/image1.jpg", type: "image/jpg" },

    index: 0,
    name: "testtt",
    screen: 1,
    _id: "123456789",
    loop: false,
  },
  {
    file: { url: "http://example.com/image2.jpg", type: "image/jpg" },

    index: 1,
    name: "testtt2",
    screen: 2,
    _id: "987654321",
    loop: false,
  },
]

const mockemptyCues = []
const mockCueIndex = 0

describe("ShowMode", () => {
  // simulate image loading behavior
  beforeAll(() => {
    global.Image = class {
      constructor() {
        setTimeout(() => this.onload && this.onload(), 0)
      }
    }

    window.open = jest.fn(() => {
      const fakeDoc = {
        title: "",
        body: document.createElement("body"),
        head: document.createElement("head"),
      }
      return {
        document: fakeDoc,
        close: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
      }
    })
  })

  afterAll(() => {
    // clean up the global image and window mock
    delete global.Image
    delete window.open
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
      render(<ShowMode cues={mockCues} cueIndex={mockCueIndex} />)
    })

    expect(screen.getByRole("heading", { name: "Starting Frame" })).toBeInTheDocument()

    expect(
      screen.getByRole("button", { name: "Open screen: 1" })
    ).toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: "Open screen: 2" })
    ).toBeInTheDocument()
  })

  test("navigates to next and previous cues", async () => {
    let testCueIndex = mockCueIndex
    const mockSetCueIndex = jest.fn((updater) => {
      if (typeof updater === "function") {
        testCueIndex = updater(testCueIndex)
      } else {
        testCueIndex = updater
      }
      rerender(
        <ShowMode
          cues={mockCues}
          cueIndex={testCueIndex}
          setCueIndex={mockSetCueIndex}
          indexCount={100}
        />
      )
    })

    const { rerender } = render(
      <ShowMode
        cues={mockCues}
        cueIndex={mockCueIndex}
        setCueIndex={mockSetCueIndex}
        indexCount={100}
      />
    )

    act(() => {
      fireEvent.click(screen.getByRole("button", { name: "Next Cue" }))
    })

    expect(screen.getByRole("heading", { name: "Frame 1" })).toBeInTheDocument()

    act(() => {
      fireEvent.click(screen.getByRole("button", { name: "Previous Cue" }))
    })

    expect(screen.getByRole("heading", { name: "Starting Frame" })).toBeInTheDocument()
  })

  test("toggles screen visibility", async () => {
    await act(async () => {
      render(<ShowMode cues={mockCues} indexCount={100} />)
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
      render(<ShowMode cues={mockCues} indexCount={100} />)
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
      render(<ShowMode cues={mockemptyCues} indexCount={100}/>)
    })
    expect(
      screen.queryByRole("button", { name: "Open screen: 1" })
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole("button", { name: "Open screen: 2" })
    ).not.toBeInTheDocument()
  })

  test("handles keyboard arrow keys", async () => {
    let testCueIndex = mockCueIndex
    const mockSetCueIndex = jest.fn((updater) => {
      if (typeof updater === "function") {
        testCueIndex = updater(testCueIndex)
      } else {
        testCueIndex = updater
      }
      rerender(
        <ShowMode
          cues={mockCues}
          cueIndex={testCueIndex}
          setCueIndex={mockSetCueIndex}
          indexCount={100}
        />
      )
    })

    const { rerender } = render(
      <ShowMode
        cues={mockCues}
        cueIndex={mockCueIndex}
        setCueIndex={mockSetCueIndex}
        indexCount={100}
      />
    )

    expect(screen.getByRole("heading", { name: "Starting Frame" })).toBeInTheDocument()
    fireEvent.keyDown(window, { key: "ArrowRight" })
    expect(mockSetCueIndex).toHaveBeenCalled()
    expect(screen.getByRole("heading", { name: "Frame 1" })).toBeInTheDocument()

    fireEvent.keyDown(window, { key: "ArrowLeft" })
    expect(mockSetCueIndex).toHaveBeenCalledTimes(2)
    expect(screen.getByRole("heading", { name: "Starting Frame" })).toBeInTheDocument()
  })

  test("mirrors one screen to another", async () => {
    if (!window.HTMLElement.prototype.scrollTo) {
      window.HTMLElement.prototype.scrollTo = () => {}
    }

    render(<ShowMode cues={mockCues} indexCount={100}/>)

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

 test("title shows 'Starting Frame' when index=0", async () => {
  const cues = [
    {
      file: { url: "http://example.com/image.jpg", type: "image/jpg" },
      index: 0,
      name: "cue-start",
      screen: 1,
      _id: "id-start",
      loop: false,
    },
  ]

  await act(async () => {
    render(<ShowMode cues={cues} cueIndex={mockCueIndex} indexCount={100}/>)
  })

  await act(async () => {
    fireEvent.click(screen.getByRole("button", { name: "Open screen: 1" }))
  })

  await waitFor(() => {
    const fakeWindow = window.open.mock.results.at(-1).value
    expect(fakeWindow.document.title).toBe("Screen 1, Starting Frame")
  })
})

 test("title does not contain 'Starting Frame' when index is not 0", async () => {
  const cues = [
    {
      file: { url: "http://example.com/image.jpg", type: "image/jpg" },
      index: 4,
      name: "cue-start",
      screen: 1,
      _id: "id-start",
      loop: false,
    },
  ]

  await act(async () => {
    render(<ShowMode cues={cues} cueIndex={mockCueIndex} indexCount={100}/>)
  })

  await act(async () => {
    fireEvent.click(screen.getByRole("button", { name: "Open screen: 1" }))
  })

  await waitFor(() => {
    const fakeWindow = window.open.mock.results.at(-1).value
    expect(fakeWindow.document.title).not.toBe("Screen 1, Starting Frame")
  })
})

  test("Screen sets window title when index is 4", async () => {
    const screenData = {
      file: { url: "http://example.com/image.jpg", type: "image/jpg" },
      index: 4,
      name: "cue-4",
      screen: 1,
      _id: "id-4",
      loop: false,
    }

    await act(async () => {
      render(<Screen screenNumber={1} screenData={screenData} isVisible={true} onClose={() => {}} />)
    })

    await waitFor(() => {
      const popup = window.open.mock.results.at(-1).value
      expect(popup.document.title).toBe("Screen 1, Frame 4")
    })
  })

  test("Screen sets window title when index is 7", async () => {
    const screenData = {
      file: { url: "http://example.com/image.jpg", type: "image/jpg" },
      index: 7,
      name: "cue-4",
      screen: 1,
      _id: "id-4",
      loop: false,
    }

    await act(async () => {
      render(<Screen screenNumber={1} screenData={screenData} isVisible={true} onClose={() => {}} />)
    })

    await waitFor(() => {
      const popup = window.open.mock.results.at(-1).value
      expect(popup.document.title).toBe("Screen 1, Frame 7")
    })
  })
})

