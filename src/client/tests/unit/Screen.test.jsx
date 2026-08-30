/*
 * Screen component unit tests.
 * Verifies popup title formatting, media rendering (image/video/audio),
 * color-only cue handling, visibility guard, and image fallback behavior.
 */
import React from "react"
import { render, waitFor, act, fireEvent, within } from "@testing-library/react"
import "@testing-library/jest-dom"
import Screen from "../../components/presentation/Screen"

describe("Screen", () => {
  beforeAll(() => {
    // Use a lightweight popup stub so tests can assert DOM written to external window.
    window.open = jest.fn(() => {
      const listeners = {}
      const fakeDoc = {
        title: "",
        documentElement: {
          style: {},
        },
        body: document.createElement("body"),
        head: document.createElement("head"),
      }
      return {
        document: fakeDoc,
        close: jest.fn(),
        addEventListener: jest.fn((eventName, handler) => {
          listeners[eventName] = handler
        }),
        removeEventListener: jest.fn((eventName) => {
          delete listeners[eventName]
        }),
        listeners,
      }
    })
  })

  afterAll(() => {
    delete window.open
  })

  beforeEach(() => {
    jest.clearAllMocks()
    global.console = { ...console, log: jest.fn() }
  })

  test("sets window title to Starting Frame at index 0", async () => {
    const screenData = {
      file: {
        url: "http://example.com/image.jpg",
        type: "image/jpg",
        name: "image.jpg",
      },
      index: 0,
      name: "cue-start",
      screen: 1,
      _id: "id-start",
      loop: false,
    }

    await act(async () => {
      render(
        <Screen
          screenNumber={1}
          screenData={screenData}
          isVisible={true}
          onClose={() => {}}
        />
      )
    })

    await waitFor(() => {
      const popup = window.open.mock.results.at(-1).value
      expect(popup.document.title).toBe("Screen 1 • Starting Frame")
    })
  })

  test("sets window title when index is 4", async () => {
    const screenData = {
      file: {
        url: "http://example.com/image.jpg",
        type: "image/jpg",
        name: "image.jpg",
      },
      index: 4,
      name: "cue-4",
      screen: 1,
      _id: "id-4",
      loop: false,
    }

    await act(async () => {
      render(
        <Screen
          screenNumber={1}
          screenData={screenData}
          isVisible={true}
          onClose={() => {}}
        />
      )
    })

    await waitFor(() => {
      const popup = window.open.mock.results.at(-1).value
      expect(popup.document.title).toBe("Screen 1 • Frame 4")
    })
  })

  test("sets window title when index is 7", async () => {
    const screenData = {
      file: {
        url: "http://example.com/image.jpg",
        type: "image/jpg",
        name: "image.jpg",
      },
      index: 7,
      name: "cue-7",
      screen: 1,
      _id: "id-7",
      loop: false,
    }

    await act(async () => {
      render(
        <Screen
          screenNumber={1}
          screenData={screenData}
          isVisible={true}
          onClose={() => {}}
        />
      )
    })

    await waitFor(() => {
      const popup = window.open.mock.results.at(-1).value
      expect(popup.document.title).toBe("Screen 1 • Frame 7")
    })
  })

  test("renders a color background when cue has no file but has color", async () => {
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
      render(
        <Screen
          screenNumber={1}
          screenData={screenData}
          isVisible={true}
          onClose={() => {}}
        />
      )
    })

    await waitFor(() => {
      const popup = window.open.mock.results.at(-1).value
      expect(popup.document.title).toBe("Screen 1 • Frame 2")
    })

    const popup = window.open.mock.results.at(-1).value
    const incomingLayer = popup.document.body.querySelector(
      '[data-testid="incoming-cue-layer"]'
    )
    expect(incomingLayer.querySelector("img")).toBeNull()
    expect(incomingLayer.children.length).toBeGreaterThan(0)
  })

  test("does not open popup when screen is not visible", () => {
    render(
      <Screen
        screenNumber={1}
        screenData={{
          file: {
            url: "http://example.com/image.jpg",
            type: "image/jpg",
            name: "image.jpg",
          },
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
      file: {
        url: "http://example.com/video.mp4",
        type: "video/mp4",
        name: "video.mp4",
      },
      index: 2,
      name: "video-cue",
      screen: 1,
      _id: "id-video",
      loop: false,
    }

    await act(async () => {
      render(
        <Screen
          screenNumber={1}
          screenData={screenData}
          isVisible={true}
          onClose={() => {}}
        />
      )
    })

    await waitFor(() => {
      const popup = window.open.mock.results.at(-1).value
      expect(
        popup.document.body.querySelector(
          'video[src="http://example.com/video.mp4"]'
        )
      ).toBeTruthy()
    })
  })

  test("renders audio media when cue is audio", async () => {
    const screenData = {
      file: {
        url: "http://example.com/audio.mp3",
        type: "audio/mpeg",
        name: "audio.mp3",
      },
      index: 3,
      name: "audio-cue",
      screen: 1,
      _id: "id-audio",
      loop: true,
    }

    await act(async () => {
      render(
        <Screen
          screenNumber={1}
          screenData={screenData}
          isVisible={true}
          onClose={() => {}}
        />
      )
    })

    await waitFor(() => {
      const popup = window.open.mock.results.at(-1).value
      expect(popup.document.body.querySelector("audio")).toBeTruthy()
      expect(popup.document.body.textContent).toContain(
        "Your browser does not support the audio element"
      )
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
      render(
        <Screen
          screenNumber={1}
          screenData={screenData}
          isVisible={true}
          onClose={() => {}}
        />
      )
    })

    await waitFor(() => {
      const popup = window.open.mock.results.at(-1).value
      const image = popup.document.body.querySelector('img[alt="fallback-cue"]')
      expect(image).toBeTruthy()
      expect(image.getAttribute("src")).toContain("/fallback.jpg")
    })
  })

  test("does not update media when rerendered with the same cue data", async () => {
    const screenData = {
      file: {
        url: "http://example.com/image.jpg",
        type: "image/jpg",
        name: "image.jpg",
      },
      index: 1,
      name: "stable-cue",
      screen: 1,
      _id: "id-stable",
      loop: false,
    }

    const { rerender } = render(
      <Screen
        screenNumber={1}
        screenData={screenData}
        isVisible={true}
        onClose={() => {}}
      />
    )

    await waitFor(() => {
      const popup = window.open.mock.results.at(-1).value
      expect(popup.document.body.querySelectorAll("img")).toHaveLength(1)
    })

    await act(async () => {
      rerender(
        <Screen
          screenNumber={1}
          screenData={{ ...screenData }}
          isVisible={true}
          onClose={() => {}}
        />
      )
    })

    await waitFor(() => {
      const popup = window.open.mock.results.at(-1).value
      expect(popup.document.body.querySelectorAll("img")).toHaveLength(1)
    })
  })

  test("keeps the previous cue while transitioning to a new cue", async () => {
    const firstScreenData = {
      file: {
        url: "http://example.com/first.jpg",
        type: "image/jpg",
        name: "first.jpg",
      },
      index: 1,
      name: "first-cue",
      screen: 1,
      _id: "id-first",
      loop: false,
    }

    const nextScreenData = {
      file: {
        url: "http://example.com/second.jpg",
        type: "image/jpg",
        name: "second.jpg",
      },
      index: 2,
      name: "second-cue",
      screen: 1,
      _id: "id-second",
      loop: false,
    }

    const { rerender } = render(
      <Screen
        screenNumber={1}
        screenData={firstScreenData}
        isVisible={true}
        onClose={() => {}}
      />
    )

    await waitFor(() => {
      const popup = window.open.mock.results.at(-1).value
      expect(
        popup.document.body.querySelector(
          'img[src="http://example.com/first.jpg"]'
        )
      ).toBeTruthy()
    })

    await act(async () => {
      rerender(
        <Screen
          screenNumber={1}
          screenData={nextScreenData}
          isVisible={true}
          onClose={() => {}}
        />
      )
    })

    await waitFor(() => {
      const popup = window.open.mock.results.at(-1).value
      expect(
        popup.document.body.querySelector(
          'img[src="http://example.com/first.jpg"]'
        )
      ).toBeTruthy()
      expect(
        popup.document.body.querySelector(
          'img[src="http://example.com/second.jpg"]'
        )
      ).toBeTruthy()
    })
  })

  // Regression test that ensures that the outgoing cue is still rendered as a background when it is a color cue,
  // instead of being dropped and displaying a blank or black background during the transition to the next cue.
  test("keeps rendering the outgoing cue's color as a background instead of leaving it blank", async () => {
    const colorCue = {
      file: null,
      color: "red",
      index: 1,
      name: "color-cue",
      screen: 1,
      _id: "id-color",
      loop: false,
    }

    const imageCue = {
      file: {
        url: "http://example.com/next.jpg",
        type: "image/jpg",
        name: "next.jpg",
      },
      index: 2,
      name: "image-cue",
      screen: 1,
      _id: "id-image",
      loop: false,
    }

    const { rerender } = render(
      <Screen
        screenNumber={1}
        screenData={colorCue}
        isVisible={true}
        onClose={() => {}}
      />
    )

    await waitFor(() => {
      const popup = window.open.mock.results.at(-1).value
      expect(popup.document.title).toBe("Screen 1 • Frame 1")
    })

    await act(async () => {
      rerender(
        <Screen
          screenNumber={1}
          screenData={imageCue}
          isVisible={true}
          onClose={() => {}}
        />
      )
    })

    // Once the color cue becomes the outgoing (previous) layer, it should
    // still be rendered as a colored background.
    const popup = window.open.mock.results.at(-1).value
    const outgoingLayer = popup.document.body.querySelector(
      '[data-testid="outgoing-cue-layer"]'
    )
    expect(outgoingLayer).toBeTruthy()
    expect(outgoingLayer.children.length).toBeGreaterThan(0)
  })

  test("renders the outgoing image cue with the same styling as the incoming cue", async () => {
    const firstImageCue = {
      file: {
        url: "http://example.com/outgoing.jpg",
        type: "image/jpg",
        name: "outgoing.jpg",
      },
      index: 1,
      name: "outgoing-cue",
      screen: 1,
      _id: "id-outgoing",
      loop: false,
    }

    const secondImageCue = {
      file: {
        url: "http://example.com/incoming.jpg",
        type: "image/jpg",
        name: "incoming.jpg",
      },
      index: 2,
      name: "incoming-cue",
      screen: 1,
      _id: "id-incoming",
      loop: false,
    }

    const { rerender } = render(
      <Screen
        screenNumber={1}
        screenData={firstImageCue}
        isVisible={true}
        onClose={() => {}}
      />
    )

    await waitFor(() => {
      const popup = window.open.mock.results.at(-1).value
      expect(popup.document.title).toBe("Screen 1 • Frame 1")
    })

    await act(async () => {
      rerender(
        <Screen
          screenNumber={1}
          screenData={secondImageCue}
          isVisible={true}
          onClose={() => {}}
        />
      )
    })

    const popup = window.open.mock.results.at(-1).value
    const outgoingImg = popup.document.body.querySelector(
      '[data-testid="outgoing-cue-layer"] img'
    )
    const incomingImg = popup.document.body.querySelector(
      '[data-testid="incoming-cue-layer"] img'
    )
    expect(outgoingImg).toBeTruthy()
    expect(incomingImg).toBeTruthy()
    // Chakra classNames are generated based on the style props, so if the classNames match, then the cue image styling matches
    expect(outgoingImg.className).toBe(incomingImg.className)
  })

  test("shows and hides cue metadata with the Shift key", async () => {
    const screenData = {
      file: {
        url: "http://example.com/image.jpg",
        type: "image/jpg",
        name: "image.jpg",
      },
      index: 3,
      name: "shift-cue",
      screen: 1,
      _id: "id-shift",
      loop: false,
    }

    render(
      <Screen
        screenNumber={1}
        screenData={screenData}
        isVisible={true}
        onClose={() => {}}
      />
    )

    const popup = window.open.mock.results.at(-1).value
    const popupBody = popup.document.body

    await act(async () => {
      fireEvent.keyDown(window, { key: "Shift" })
    })

    expect(within(popupBody).getByText("Screen 1")).toHaveStyle({
      visibility: "visible",
    })
    expect(within(popupBody).getByText("Element Name: shift-cue")).toHaveStyle({
      visibility: "visible",
    })

    await act(async () => {
      fireEvent.keyUp(window, { key: "Shift" })
    })

    expect(within(popupBody).getByText("Screen 1")).toHaveStyle({
      visibility: "hidden",
    })
    expect(within(popupBody).getByText("Element Name: shift-cue")).toHaveStyle({
      visibility: "hidden",
    })
  })

  test("cleans up the popup window when unmounted", async () => {
    const onClose = jest.fn()
    const screenData = {
      file: {
        url: "http://example.com/image.jpg",
        type: "image/jpg",
        name: "image.jpg",
      },
      index: 6,
      name: "cleanup-cue",
      screen: 1,
      _id: "id-cleanup",
      loop: false,
    }

    const { unmount } = render(
      <Screen
        screenNumber={1}
        screenData={screenData}
        isVisible={true}
        onClose={onClose}
      />
    )

    const popup = window.open.mock.results.at(-1).value

    await act(async () => {
      unmount()
    })

    expect(popup.close).toHaveBeenCalled()
    expect(onClose).toHaveBeenCalledWith(1)
  })

  test("responds to the popup beforeunload event", async () => {
    const onClose = jest.fn()
    const screenData = {
      file: {
        url: "http://example.com/image.jpg",
        type: "image/jpg",
        name: "image.jpg",
      },
      index: 8,
      name: "beforeunload-cue",
      screen: 1,
      _id: "id-beforeunload",
      loop: false,
    }

    render(
      <Screen
        screenNumber={1}
        screenData={screenData}
        isVisible={true}
        onClose={onClose}
      />
    )

    const popup = window.open.mock.results.at(-1).value

    await act(async () => {
      popup.listeners.beforeunload()
    })

    expect(onClose).toHaveBeenCalledWith(1)
    expect(popup.close).not.toHaveBeenCalled()
  })

  test("copies Chakra styles into the popup document head", async () => {
    const style = document.createElement("style")
    style.setAttribute("data-emotion", "chakra-test")
    style.textContent = ".chakra-test { color: red; }"
    document.head.appendChild(style)

    const screenData = {
      file: {
        url: "http://example.com/image.jpg",
        type: "image/jpg",
        name: "image.jpg",
      },
      index: 9,
      name: "style-cue",
      screen: 1,
      _id: "id-style",
      loop: false,
    }

    render(
      <Screen
        screenNumber={1}
        screenData={screenData}
        isVisible={true}
        onClose={() => {}}
      />
    )

    const popup = window.open.mock.results.at(-1).value

    await waitFor(() => {
      expect(
        popup.document.head.querySelector('style[data-emotion="chakra-test"]')
      ).toBeTruthy()
    })

    style.remove()
  })

  test("closes the popup when the screen becomes hidden", async () => {
    const screenData = {
      file: {
        url: "http://example.com/image.jpg",
        type: "image/jpg",
        name: "image.jpg",
      },
      index: 10,
      name: "hide-cue",
      screen: 1,
      _id: "id-hide",
      loop: false,
    }

    const { rerender } = render(
      <Screen
        screenNumber={1}
        screenData={screenData}
        isVisible={true}
        onClose={() => {}}
      />
    )

    const popup = window.open.mock.results.at(-1).value

    await act(async () => {
      rerender(
        <Screen
          screenNumber={1}
          screenData={screenData}
          isVisible={false}
          onClose={() => {}}
        />
      )
    })

    expect(popup.close).toHaveBeenCalled()
  })

  test("shows the no-media fallback and keeps the previous cue while clearing to an empty cue", async () => {
    const screenData = {
      file: {
        url: "http://example.com/clearing.jpg",
        type: "image/jpg",
        name: "clearing.jpg",
      },
      index: 1,
      name: "clearing-cue",
      screen: 1,
      _id: "id-clearing",
      loop: false,
    }

    const { rerender } = render(
      <Screen
        screenNumber={1}
        screenData={screenData}
        isVisible={true}
        onClose={() => {}}
      />
    )

    await waitFor(() => {
      const popup = window.open.mock.results.at(-1).value
      expect(
        popup.document.body.querySelector(
          'img[src="http://example.com/clearing.jpg"]'
        )
      ).toBeTruthy()
    })

    await act(async () => {
      rerender(
        <Screen
          screenNumber={1}
          screenData={null}
          isVisible={true}
          onClose={() => {}}
        />
      )
    })

    const popup = window.open.mock.results.at(-1).value
    expect(
      popup.document.body.querySelector('[data-testid="incoming-cue-layer"]')
        .textContent
    ).toContain("No media available for this cue.")
    expect(
      popup.document.body.querySelector(
        'img[src="http://example.com/clearing.jpg"]'
      )
    ).toBeTruthy()
  })

  test("renders the unsupported-media fallback when the file type is unknown", async () => {
    const screenData = {
      file: {
        url: "http://example.com/document.pdf",
        type: "application/pdf",
        name: "document.pdf",
      },
      color: "#123456",
      index: 11,
      name: "unsupported-cue",
      screen: 1,
      _id: "id-unsupported",
      loop: false,
    }

    render(
      <Screen
        screenNumber={1}
        screenData={screenData}
        isVisible={true}
        onClose={() => {}}
      />
    )

    await waitFor(() => {
      const popup = window.open.mock.results.at(-1).value
      expect(
        popup.document.body.querySelectorAll("img,video,audio")
      ).toHaveLength(0)
    })
  })

  test("renders a cue that has no id, name, index or screen", async () => {
    const screenData = {
      file: {
        url: "http://example.com/minimal.jpg",
        type: "image/jpg",
        name: "minimal.jpg",
      },
    }

    await act(async () => {
      render(
        <Screen
          screenNumber={1}
          screenData={screenData}
          isVisible={true}
          onClose={() => {}}
        />
      )
    })

    await waitFor(() => {
      const popup = window.open.mock.results.at(-1).value
      expect(
        popup.document.body.querySelector(
          'img[src="http://example.com/minimal.jpg"]'
        )
      ).toBeTruthy()
    })
  })

  test("falls back to the cue name for its key when id is missing", async () => {
    const screenData = {
      file: {
        url: "http://example.com/named-only.jpg",
        type: "image/jpg",
        name: "named-only.jpg",
      },
      name: "named-only-cue",
    }

    await act(async () => {
      render(
        <Screen
          screenNumber={1}
          screenData={screenData}
          isVisible={true}
          onClose={() => {}}
        />
      )
    })

    await waitFor(() => {
      const popup = window.open.mock.results.at(-1).value
      expect(
        popup.document.body.querySelector(
          'img[src="http://example.com/named-only.jpg"]'
        )
      ).toBeTruthy()
    })
  })

  describe("multi-screen image spanning", () => {
    const spanCue = {
      file: {
        url: "http://example.com/wide.jpg",
        type: "image/jpg",
        name: "wide.jpg",
      },
      index: 0,
      name: "span-cue",
      screen: 1,
      spanScreens: [1, 2],
      _id: "id-span",
      loop: false,
    }

    test("renders the plain full-bleed image until the spanning image's size is known", async () => {
      await act(async () => {
        render(
          <Screen
            screenNumber={1}
            screenData={spanCue}
            isVisible={true}
            onClose={() => {}}
            screenWidths={{ 1: 800, 2: 800 }}
          />
        )
      })

      const popup = window.open.mock.results.at(-1).value
      await waitFor(() => {
        expect(
          popup.document.body.querySelector(
            'img[src="http://example.com/wide.jpg"]'
          )
        ).toBeTruthy()
      })
    })

    test("crops to this screen's slice of the combined canvas once the image loads", async () => {
      await act(async () => {
        render(
          <Screen
            screenNumber={2}
            screenData={spanCue}
            isVisible={true}
            onClose={() => {}}
            screenWidths={{ 1: 800, 2: 500 }}
          />
        )
      })

      const popup = window.open.mock.results.at(-1).value
      const probe = await waitFor(() =>
        within(popup.document.body).getByTestId("span-image-probe")
      )

      Object.defineProperty(probe, "naturalWidth", {
        value: 2000,
        configurable: true,
      })
      Object.defineProperty(probe, "naturalHeight", {
        value: 1000,
        configurable: true,
      })
      await act(async () => {
        fireEvent.load(probe)
      })

      // Screen 2 sits after screen 1's 800px, and the canvas (1300px total)
      // scales the 2000x1000 image to a 1300x650 canvas -- so screen 2's
      // background-position offset is -800px and its background-size is
      // 1300px x 650px.
      await waitFor(() => {
        const cropBox = popup.document.body.querySelector(
          '[style*="background-image"]'
        )
        expect(cropBox).toBeTruthy()
        const style = cropBox.getAttribute("style")
        expect(style).toContain("background-position: -800px 50%")
        expect(style).toContain("background-size: 1300px 650px")
      })
    })

    test("reports this screen's live width via onWidthChange", async () => {
      window.open = jest.fn(() => {
        const listeners = {}
        const fakeDoc = {
          title: "",
          documentElement: { style: {} },
          body: document.createElement("body"),
          head: document.createElement("head"),
        }
        return {
          document: fakeDoc,
          innerWidth: 654,
          close: jest.fn(),
          addEventListener: jest.fn((eventName, handler) => {
            listeners[eventName] = handler
          }),
          removeEventListener: jest.fn((eventName) => {
            delete listeners[eventName]
          }),
          listeners,
        }
      })

      const onWidthChange = jest.fn()
      await act(async () => {
        render(
          <Screen
            screenNumber={1}
            screenData={spanCue}
            isVisible={true}
            onClose={() => {}}
            screenWidths={{}}
            onWidthChange={onWidthChange}
          />
        )
      })

      await waitFor(() => {
        expect(onWidthChange).toHaveBeenCalledWith(1, 654)
      })
    })
  })
})
