import React from "react"
import { render, screen, fireEvent, act } from "@testing-library/react"
import ShowMode from "../../components/presentation/ShowMode"
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
    delete global.Image
    delete window.open
  })

  test("renders without crashing", async () => {
    await act(async () => {
      render(<ShowMode cues={mockCues} />)
    })

    expect(
      screen.getByRole("button", { name: "Open all screens" })
    ).toBeInTheDocument()
  })

  test("initializes state correctly", async () => {
    await act(async () => {
      render(<ShowMode cues={mockCues} cueIndex={mockCueIndex} />)
    })

    expect(screen.getByRole("heading", { name: "Frame 0" })).toBeInTheDocument()

    expect(
      screen.getByRole("button", { name: "Open all screens" })
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

    expect(screen.getByRole("heading", { name: "Frame 0" })).toBeInTheDocument()
  })

  test("handles empty cues", async () => {
    await act(async () => {
      render(<ShowMode cues={mockemptyCues} indexCount={100}/>)
    })
    expect(
      screen.getByRole("button", { name: "Open all screens" })
    ).toBeInTheDocument()
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

    expect(screen.getByRole("heading", { name: "Frame 0" })).toBeInTheDocument()
    fireEvent.keyDown(window, { key: "ArrowRight" })
    expect(mockSetCueIndex).toHaveBeenCalled()
    expect(screen.getByRole("heading", { name: "Frame 1" })).toBeInTheDocument()

    fireEvent.keyDown(window, { key: "ArrowLeft" })
    expect(mockSetCueIndex).toHaveBeenCalledTimes(2)
    expect(screen.getByRole("heading", { name: "Frame 0" })).toBeInTheDocument()
  })

    describe("Autoplay", () => {
    test("Autoplay button works", async () => {
      const mockSetCueIndex = jest.fn()
      await act(async () => {
        render(
          <ShowMode
            cues={mockCues}
            cueIndex={0}
            setCueIndex={mockSetCueIndex}
            indexCount={100}
          />
        )
      })
      act(() => {
        fireEvent.click(screen.getByRole("button", { name: "Start Autoplay" }))
      })
      expect(
        screen.getByRole("button", { name: "Stop Autoplay" })
      ).toBeInTheDocument()
    
      act(() => {
        fireEvent.click(screen.getByRole("button", { name: "Stop Autoplay" }))
      })
      expect(
        screen.getByRole("button", { name: "Start Autoplay" })
      ).toBeInTheDocument()
    })

    test("autoplay advances frames at the configured interval", async () => {
      jest.useFakeTimers()
      const mockSetCueIndex = jest.fn((updater) => {
        if (typeof updater === "function") {
          updater(0)
        }
      })

      await act(async () => {
        render(
          <ShowMode
            cues={mockCues}
            cueIndex={0}
            setCueIndex={mockSetCueIndex}
            indexCount={3}
          />
        )
      })

      act(() => {
        fireEvent.click(screen.getByRole("button", { name: "Start Autoplay" }))
      })
      expect(mockSetCueIndex).toHaveBeenCalled()

      act(() => {
        jest.advanceTimersByTime(5000)
      })
      const calls = mockSetCueIndex.mock.calls
      expect(calls.length).toBeGreaterThanOrEqual(2)
      expect(typeof calls[1][0]).toBe("function")
      act(() => {
        fireEvent.click(screen.getByRole("button", { name: "Stop Autoplay" }))
      })
      jest.useRealTimers()
    })

    test("autoplay advances frames 10 times a second with 0.1 second intervals", async () => {
      jest.useFakeTimers()
      const mockSetCueIndex = jest.fn((updater) => {
        if (typeof updater === "function") {
          updater(0)
        }
      })

      await act(async () => {
        render(
          <ShowMode
            cues={mockCues}
            cueIndex={0}
            setCueIndex={mockSetCueIndex}
            indexCount={100}
          />
        )
      })

      const autoplayTimeInput = screen.getByRole("spinbutton", { id: "autoplaytime" })
      act(() => {
        fireEvent.change(autoplayTimeInput, { target: { value: "0.1" } })
      })
      expect(autoplayTimeInput.value).toBe("0.1")

      act(() => {
        fireEvent.click(screen.getByRole("button", { name: "Start Autoplay" }))
      })
      expect(mockSetCueIndex).toHaveBeenCalled()

      act(() => {
        jest.advanceTimersByTime(5000)
      })
      expect(mockSetCueIndex).toHaveBeenCalledTimes(51) // initial call + 50 advances
      act(() => {
        fireEvent.click(screen.getByRole("button", { name: "Stop Autoplay" }))
      })
      jest.useRealTimers()
    })

    test("changing interval updates autoplay speed", async () => {
      jest.useFakeTimers()
      const mockSetCueIndex = jest.fn((updater) => {
        if (typeof updater === "function") {
          updater(0)
        }
      })

      await act(async () => {
        render(
          <ShowMode
            cues={mockCues}
            cueIndex={0}
            setCueIndex={mockSetCueIndex}
            indexCount={5}
          />
        )
      })

      const spin = screen.getByRole("spinbutton")
      expect(spin).toBeInTheDocument()

      act(() => {
        fireEvent.change(spin, { target: { value: "1" } })
      })

      act(() => {
        fireEvent.click(screen.getByRole("button", { name: "Start Autoplay" }))
      })

      act(() => {
        jest.advanceTimersByTime(1000)
      })

      const calls = mockSetCueIndex.mock.calls
      const functionCalls = calls.filter(c => typeof c[0] === "function")
      expect(functionCalls.length).toBeGreaterThanOrEqual(1)

      act(() => {
        fireEvent.click(screen.getByRole("button", { name: "Stop Autoplay" }))
      })
      jest.useRealTimers()
    })

    test("autoplay stops when reaching last frame and does not advance further", async () => {
      jest.useFakeTimers()
    
      let testCueIndex = 0
      const mockSetCueIndex = jest.fn((updater) => {
        if (typeof updater === "function") {
          testCueIndex = updater(testCueIndex)
        } else {
          testCueIndex = updater
        }
      })
    
      await act(async () => {
        render(
          <ShowMode
            cues={mockCues}
            cueIndex={testCueIndex}
            setCueIndex={mockSetCueIndex}
            indexCount={3}
          />
        )
      })
      act(() => {
        fireEvent.click(screen.getByRole("button", { name: "Start Autoplay" }))
      })
    
      act(() => {
        jest.advanceTimersByTime(5000 * 4)
      })
    
      expect(screen.getByRole("button", { name: "Start Autoplay" })).toBeInTheDocument()
      expect(testCueIndex).toBe(2)
    
      jest.useRealTimers()
    })

    test("interval cant be set to negative", async () => {
      await act(async () => {
        render(
          <ShowMode
            cues={mockCues}
            cueIndex={0}
            indexCount={100}
          />
        )
      })

      const autoplayTimeInput = screen.getByRole("spinbutton", { id: "autoplaytime" })
      act(() => {
        fireEvent.change(autoplayTimeInput, { target: { value: "-1" } })
        fireEvent.focusOut(autoplayTimeInput)
      })
      expect(autoplayTimeInput.value).toBe("0.1")
    })
  })
})


