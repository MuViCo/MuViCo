import React from "react"
import { render, waitFor, act } from "@testing-library/react"
import "@testing-library/jest-dom"
import Screen from "../../components/presentation/Screen"

describe("Screen", () => {
  beforeAll(() => {
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
    delete window.open
  })

  beforeEach(() => {
    jest.clearAllMocks()
  })

  test("sets window title to Starting Frame at index 0", async () => {
    const screenData = {
      file: { url: "http://example.com/image.jpg", type: "image/jpg", name: "image.jpg" },
      index: 0,
      name: "cue-start",
      screen: 1,
      _id: "id-start",
      loop: false,
    }

    await act(async () => {
      render(<Screen screenNumber={1} screenData={screenData} isVisible={true} onClose={() => {}} />)
    })

    await waitFor(() => {
      const popup = window.open.mock.results.at(-1).value
      expect(popup.document.title).toBe("Screen 1 • Starting Frame")
    })
  })

  test("sets window title when index is 4", async () => {
    const screenData = {
      file: { url: "http://example.com/image.jpg", type: "image/jpg", name: "image.jpg" },
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
      expect(popup.document.title).toBe("Screen 1 • Frame 4")
    })
  })

  test("sets window title when index is 7", async () => {
    const screenData = {
      file: { url: "http://example.com/image.jpg", type: "image/jpg", name: "image.jpg" },
      index: 7,
      name: "cue-7",
      screen: 1,
      _id: "id-7",
      loop: false,
    }

    await act(async () => {
      render(<Screen screenNumber={1} screenData={screenData} isVisible={true} onClose={() => {}} />)
    })

    await waitFor(() => {
      const popup = window.open.mock.results.at(-1).value
      expect(popup.document.title).toBe("Screen 1 • Frame 7")
    })
  })

  test("renders a color background when cue has no file but has color", async () => {
    const consoleLogSpy = jest.spyOn(console, "log").mockImplementation(() => {})

    const screenData = {
      file: null,
      color: "#ff0000",
      index: 2,
      name: "color-only-cue",
      screen: 1,
      _id: "id-color",
      loop: false,
    }

    await act(async () => {
      render(<Screen screenNumber={1} screenData={screenData} isVisible={true} onClose={() => {}} />)
    })

    await waitFor(() => {
      const popup = window.open.mock.results.at(-1).value
      expect(popup.document.title).toBe("Screen 1 • Frame 2")
    })

    expect(consoleLogSpy).toHaveBeenCalledWith("Rendering media with file:", null)
    consoleLogSpy.mockRestore()
  })

  test("does not open popup when screen is not visible", () => {
    render(
      <Screen
        screenNumber={1}
        screenData={{
          file: { url: "http://example.com/image.jpg", type: "image/jpg", name: "image.jpg" },
          index: 1,
          name: "hidden-cue",
          screen: 1,
          _id: "hidden-cue",
          loop: false,
        }}
        isVisible={false}
        onClose={() => {}}
      />
    )

    expect(window.open).not.toHaveBeenCalled()
  })

  test("renders video media when cue is a video", async () => {
    const screenData = {
      file: { url: "http://example.com/video.mp4", type: "video/mp4", name: "video.mp4" },
      index: 2,
      name: "video-cue",
      screen: 1,
      _id: "id-video",
      loop: false,
    }

    await act(async () => {
      render(<Screen screenNumber={1} screenData={screenData} isVisible={true} onClose={() => {}} />)
    })

    await waitFor(() => {
      const popup = window.open.mock.results.at(-1).value
      expect(popup.document.body.querySelector('video[src="http://example.com/video.mp4"]')).toBeTruthy()
    })
  })

  test("renders audio media when cue is audio", async () => {
    const screenData = {
      file: { url: "http://example.com/audio.mp3", type: "audio/mpeg", name: "audio.mp3" },
      index: 3,
      name: "audio-cue",
      screen: 1,
      _id: "id-audio",
      loop: true,
    }

    await act(async () => {
      render(<Screen screenNumber={1} screenData={screenData} isVisible={true} onClose={() => {}} />)
    })

    await waitFor(() => {
      const popup = window.open.mock.results.at(-1).value
      expect(popup.document.body.querySelector("audio")).toBeTruthy()
      expect(popup.document.body.textContent).toContain("Your browser does not support the audio element")
    })
  })

  test("falls back to local image path when image url is missing", async () => {
    const screenData = {
      file: { url: "", type: "image/jpg", name: "fallback.jpg" },
      index: 5,
      name: "fallback-cue",
      screen: 1,
      _id: "id-fallback",
      loop: false,
    }

    await act(async () => {
      render(<Screen screenNumber={1} screenData={screenData} isVisible={true} onClose={() => {}} />)
    })

    await waitFor(() => {
      const popup = window.open.mock.results.at(-1).value
      const image = popup.document.body.querySelector('img[alt="fallback-cue"]')
      expect(image).toBeTruthy()
      expect(image.getAttribute("src")).toContain("/fallback.jpg")
    })
  })
})
