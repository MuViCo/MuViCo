/*
 * Screen component unit tests.
 * Verifies popup title formatting, media rendering (image/video/audio),
 * color-only cue handling, visibility guard, and image fallback behavior.
 */
import React from "react"
import { render, waitFor, act, fireEvent, within } from "@testing-library/react"
import "@testing-library/jest-dom"
import Screen from "../../components/presentation/Screen"
import type { Cue } from "../../types"

describe("Screen", () => {
  const originalWindowOpen = window.open

  beforeAll(() => {
    // Use a lightweight popup stub so tests can assert DOM written to external window.
    window.open = jest.fn(() => {
      const listeners: Record<string, (...args: unknown[]) => void> = {}
      const fakeDoc = {
        title: "",
        documentElement: {
          style: {} as CSSStyleDeclaration,
        },
        body: document.createElement("body"),
        head: document.createElement("head"),
      }
      return {
        document: fakeDoc,
        close: jest.fn(),
        addEventListener: jest.fn(
          (eventName: string, handler: (...args: unknown[]) => void) => {
            listeners[eventName] = handler
          }
        ),
        removeEventListener: jest.fn((eventName: string) => {
          delete listeners[eventName]
        }),
        listeners,
      }
    }) as unknown as typeof window.open
  })

  afterAll(() => {
    window.open = originalWindowOpen
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
    } as Cue

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
      const popup = (window.open as jest.Mock).mock.results.at(-1)!.value
      expect(popup.document.title).toBe("Screen 1 • Starting Frame")
    })
  })

  test("letterboxes the content to the screen's declared ratio", async () => {
    await act(async () => {
      render(
        <Screen
          screenNumber={1}
          screenData={[]}
          isVisible={true}
          onClose={() => {}}
          outputAspectRatio="4:3"
        />
      )
    })

    await waitFor(() => {
      const popup = (window.open as jest.Mock).mock.results.at(-1)!.value
      const stage = popup.document.body.querySelector(
        '[data-testid="screen-stage"]'
      )
      expect(stage).not.toBeNull()
    })
  })

  test("drops the frame part from the title when nothing is on the screen", async () => {
    await act(async () => {
      render(
        <Screen
          screenNumber={1}
          screenData={[]}
          isVisible={true}
          onClose={() => {}}
        />
      )
    })

    await waitFor(() => {
      const popup = (window.open as jest.Mock).mock.results.at(-1)!.value
      expect(popup.document.title).toBe("Screen 1")
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
    } as Cue

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
      const popup = (window.open as jest.Mock).mock.results.at(-1)!.value
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
    } as Cue

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
      const popup = (window.open as jest.Mock).mock.results.at(-1)!.value
      expect(popup.document.title).toBe("Screen 1 • Frame 7")
    })
  })

  test("covers the output with black without removing the current cue", async () => {
    const screenData = {
      file: null,
      color: "#ff00ff",
      index: 0,
      name: "color cue",
      screen: 1,
      _id: "color-cue",
      loop: false,
    } as Cue

    await act(async () => {
      render(
        <Screen
          screenNumber={1}
          screenData={screenData}
          isVisible={true}
          isBlackout={true}
          onClose={() => {}}
        />
      )
    })

    const popup = (window.open as jest.Mock).mock.results.at(-1)!.value
    await waitFor(() => {
      expect(
        within(popup.document.body).getByTestId("screen-blackout")
      ).toBeTruthy()
      expect(
        within(popup.document.body).getByTestId("incoming-cue-layer")
      ).toBeTruthy()
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
    } as Cue

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
      const popup = (window.open as jest.Mock).mock.results.at(-1)!.value
      expect(popup.document.title).toBe("Screen 1 • Frame 2")
    })

    const popup = (window.open as jest.Mock).mock.results.at(-1)!.value
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
        screenData={
          {
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
          } as Cue
        }
        isVisible={false}
        onClose={() => {}}
      />
    )

    expect(window.open).not.toHaveBeenCalled()
  })

  test("closes the popup and notifies the caller when isVisible turns false", async () => {
    const onClose = jest.fn()
    const screenData = {
      file: {
        url: "http://example.com/image.jpg",
        type: "image/jpg",
        name: "image.jpg",
      },
      index: 0,
      name: "closable-cue",
      screen: 1,
      _id: "id-closable",
      loop: false,
    } as Cue

    const { rerender } = render(
      <Screen
        screenNumber={1}
        screenData={screenData}
        isVisible={true}
        onClose={onClose}
      />
    )

    const popup = await waitFor(() => {
      const result = (window.open as jest.Mock).mock.results.at(-1)!.value
      expect(result).toBeTruthy()
      return result
    })

    await act(async () => {
      rerender(
        <Screen
          screenNumber={1}
          screenData={screenData}
          isVisible={false}
          onClose={onClose}
        />
      )
    })

    expect(popup.close).toHaveBeenCalled()
  })

  test("reports when the browser blocks an output popup", async () => {
    ;(window.open as jest.Mock).mockReturnValueOnce(null)
    const onClose = jest.fn()

    await act(async () => {
      render(
        <Screen
          screenNumber={2}
          screenData={null}
          isVisible={true}
          onClose={onClose}
        />
      )
    })

    expect(onClose).toHaveBeenCalledWith(2)
  })

  test("detects an output popup closed without beforeunload", async () => {
    jest.useFakeTimers()
    const onClose = jest.fn()
    let view: ReturnType<typeof render> | undefined

    await act(async () => {
      view = render(
        <Screen
          screenNumber={3}
          screenData={null}
          isVisible={true}
          onClose={onClose}
        />
      )
    })

    const popup = (window.open as jest.Mock).mock.results.at(-1)!.value
    popup.closed = true
    act(() => jest.advanceTimersByTime(750))

    expect(onClose).toHaveBeenCalledWith(3)
    view?.unmount()
    jest.useRealTimers()
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
    } as Cue

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
      const popup = (window.open as jest.Mock).mock.results.at(-1)!.value
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
    } as Cue

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
      const popup = (window.open as jest.Mock).mock.results.at(-1)!.value
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
    } as Cue

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
      const popup = (window.open as jest.Mock).mock.results.at(-1)!.value
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
    } as Cue

    const { rerender } = render(
      <Screen
        screenNumber={1}
        screenData={screenData}
        isVisible={true}
        onClose={() => {}}
      />
    )

    await waitFor(() => {
      const popup = (window.open as jest.Mock).mock.results.at(-1)!.value
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
      const popup = (window.open as jest.Mock).mock.results.at(-1)!.value
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
    } as Cue

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
    } as Cue

    const { rerender } = render(
      <Screen
        screenNumber={1}
        screenData={firstScreenData}
        isVisible={true}
        onClose={() => {}}
      />
    )

    await waitFor(() => {
      const popup = (window.open as jest.Mock).mock.results.at(-1)!.value
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
      const popup = (window.open as jest.Mock).mock.results.at(-1)!.value
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

  // Regression: a scheduled reveal used to get cancelled by its own
  // triggering effect re-run, leaving isRevealed stuck false after the
  // first real transition.
  test("reveals every transition in a row, not just the first", async () => {
    const cueA = {
      file: {
        url: "http://example.com/a.jpg",
        type: "image/jpg",
        name: "a.jpg",
      },
      index: 0,
      name: "cue-a",
      screen: 1,
      _id: "id-a",
      loop: false,
    } as Cue
    const cueB = {
      file: {
        url: "http://example.com/b.jpg",
        type: "image/jpg",
        name: "b.jpg",
      },
      index: 1,
      name: "cue-b",
      screen: 1,
      _id: "id-b",
      loop: false,
    } as Cue
    const cueC = {
      file: {
        url: "http://example.com/c.jpg",
        type: "image/jpg",
        name: "c.jpg",
      },
      index: 2,
      name: "cue-c",
      screen: 1,
      _id: "id-c",
      loop: false,
    } as Cue

    const getIncomingLayer = () => {
      const popup = (window.open as jest.Mock).mock.results.at(-1)!.value
      return popup.document.body.querySelector(
        '[data-testid="incoming-cue-layer"]'
      )
    }

    // Stable reference, like EditModeContainer's useCallback -- a fresh
    // literal per rerender would mask the bug behind a popup reopen cycle.
    const onClose = () => {}

    const { rerender } = render(
      <Screen
        screenNumber={1}
        screenData={cueA}
        isVisible={true}
        onClose={onClose}
      />
    )

    await waitFor(() => {
      expect(getIncomingLayer()?.getAttribute("data-revealed")).toBe("true")
    })

    await act(async () => {
      rerender(
        <Screen
          screenNumber={1}
          screenData={cueB}
          isVisible={true}
          onClose={onClose}
        />
      )
    })

    await waitFor(
      () => {
        expect(getIncomingLayer()?.getAttribute("data-revealed")).toBe("true")
      },
      { timeout: 2000 }
    )

    await act(async () => {
      rerender(
        <Screen
          screenNumber={1}
          screenData={cueC}
          isVisible={true}
          onClose={onClose}
        />
      )
    })

    await waitFor(
      () => {
        expect(getIncomingLayer()?.getAttribute("data-revealed")).toBe("true")
      },
      { timeout: 2000 }
    )
  })

  // Regression: the outgoing layer used to remount a cue's media under a
  // new key when it moved from the incoming to the outgoing role, which
  // restarted a playing video/gif right as the transition began.
  test("keeps the same video element playing when it becomes the outgoing cue", async () => {
    const videoCue = {
      file: {
        url: "http://example.com/video.mp4",
        type: "video/mp4",
        name: "video.mp4",
      },
      index: 0,
      name: "video-cue",
      screen: 1,
      _id: "id-video",
      loop: false,
    } as Cue
    const nextCue = {
      file: {
        url: "http://example.com/next.jpg",
        type: "image/jpg",
        name: "next.jpg",
      },
      index: 1,
      name: "next-cue",
      screen: 1,
      _id: "id-next",
      loop: false,
    } as Cue

    const onClose = () => {}
    const getVideoElement = () => {
      const popup = (window.open as jest.Mock).mock.results.at(-1)!.value
      return popup.document.body.querySelector("video")
    }

    const { rerender } = render(
      <Screen
        screenNumber={1}
        screenData={videoCue}
        isVisible={true}
        onClose={onClose}
      />
    )

    await waitFor(() => {
      expect(getVideoElement()).toBeTruthy()
    })
    const videoBeforeTransition = getVideoElement()

    await act(async () => {
      rerender(
        <Screen
          screenNumber={1}
          screenData={nextCue}
          isVisible={true}
          onClose={onClose}
        />
      )
    })

    expect(getVideoElement()).toBe(videoBeforeTransition)
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
    } as Cue

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
    } as Cue

    const { rerender } = render(
      <Screen
        screenNumber={1}
        screenData={colorCue}
        isVisible={true}
        onClose={() => {}}
      />
    )

    await waitFor(() => {
      const popup = (window.open as jest.Mock).mock.results.at(-1)!.value
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
    const popup = (window.open as jest.Mock).mock.results.at(-1)!.value
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
    } as Cue

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
    } as Cue

    const { rerender } = render(
      <Screen
        screenNumber={1}
        screenData={firstImageCue}
        isVisible={true}
        onClose={() => {}}
      />
    )

    await waitFor(() => {
      const popup = (window.open as jest.Mock).mock.results.at(-1)!.value
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

    const popup = (window.open as jest.Mock).mock.results.at(-1)!.value
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
    } as Cue

    render(
      <Screen
        screenNumber={1}
        screenData={screenData}
        isVisible={true}
        onClose={() => {}}
      />
    )

    const popup = (window.open as jest.Mock).mock.results.at(-1)!.value
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
    } as Cue

    const { unmount } = render(
      <Screen
        screenNumber={1}
        screenData={screenData}
        isVisible={true}
        onClose={onClose}
      />
    )

    const popup = (window.open as jest.Mock).mock.results.at(-1)!.value

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
    } as Cue

    render(
      <Screen
        screenNumber={1}
        screenData={screenData}
        isVisible={true}
        onClose={onClose}
      />
    )

    const popup = (window.open as jest.Mock).mock.results.at(-1)!.value

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
    } as Cue

    render(
      <Screen
        screenNumber={1}
        screenData={screenData}
        isVisible={true}
        onClose={() => {}}
      />
    )

    const popup = (window.open as jest.Mock).mock.results.at(-1)!.value

    await waitFor(() => {
      expect(
        popup.document.head.querySelector('style[data-emotion="chakra-test"]')
      ).toBeTruthy()
    })

    style.remove()
  })

  test("copies the global stylesheet (plain style and link tags) into the popup document head", async () => {
    const plainStyle = document.createElement("style")
    plainStyle.textContent =
      "@keyframes muvico-test-fade { 0% { opacity: 0; } }"
    document.head.appendChild(plainStyle)

    const link = document.createElement("link")
    link.setAttribute("rel", "stylesheet")
    link.setAttribute("href", "/assets/index.css")
    document.head.appendChild(link)

    const screenData = {
      file: {
        url: "http://example.com/image.jpg",
        type: "image/jpg",
        name: "image.jpg",
      },
      index: 9,
      name: "global-style-cue",
      screen: 1,
      _id: "id-global-style",
      loop: false,
    } as Cue

    render(
      <Screen
        screenNumber={1}
        screenData={screenData}
        isVisible={true}
        onClose={() => {}}
      />
    )

    const popup = (window.open as jest.Mock).mock.results.at(-1)!.value

    await waitFor(() => {
      expect(
        popup.document.head.querySelector("style:not([data-emotion])")
          ?.textContent
      ).toContain("muvico-test-fade")
      expect(
        popup.document.head.querySelector('link[href="/assets/index.css"]')
      ).toBeTruthy()
    })

    plainStyle.remove()
    link.remove()
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
    } as Cue

    const { rerender } = render(
      <Screen
        screenNumber={1}
        screenData={screenData}
        isVisible={true}
        onClose={() => {}}
      />
    )

    const popup = (window.open as jest.Mock).mock.results.at(-1)!.value

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
    } as Cue

    const { rerender } = render(
      <Screen
        screenNumber={1}
        screenData={screenData}
        isVisible={true}
        onClose={() => {}}
      />
    )

    await waitFor(() => {
      const popup = (window.open as jest.Mock).mock.results.at(-1)!.value
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

    const popup = (window.open as jest.Mock).mock.results.at(-1)!.value
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
    } as Cue

    render(
      <Screen
        screenNumber={1}
        screenData={screenData}
        isVisible={true}
        onClose={() => {}}
      />
    )

    await waitFor(() => {
      const popup = (window.open as jest.Mock).mock.results.at(-1)!.value
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
    } as Cue

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
      const popup = (window.open as jest.Mock).mock.results.at(-1)!.value
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
    } as Cue

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
      const popup = (window.open as jest.Mock).mock.results.at(-1)!.value
      expect(
        popup.document.body.querySelector(
          'img[src="http://example.com/named-only.jpg"]'
        )
      ).toBeTruthy()
    })
  })

  describe("image fade effect", () => {
    test("applies the fade animation to a plain image cue", async () => {
      const screenData = {
        file: {
          url: "http://example.com/overlay.png",
          type: "image/png",
          name: "overlay.png",
        },
        index: 0,
        name: "fade-cue",
        screen: 1,
        _id: "id-fade",
        loop: false,
        imageEffect: "fade",
        imageEffectSpeed: 2,
        imageEffectLoop: true,
      } as Cue

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
        const popup = (window.open as jest.Mock).mock.results.at(-1)!.value
        const image = popup.document.body.querySelector(
          'img[src="http://example.com/overlay.png"]'
        )
        expect(image).toBeTruthy()
        expect(image.style.animation).toContain("2s ease-in-out infinite")
      })
    })

    test("does not animate an image cue with no effect set", async () => {
      const screenData = {
        file: {
          url: "http://example.com/plain.png",
          type: "image/png",
          name: "plain.png",
        },
        index: 0,
        name: "plain-cue",
        screen: 1,
        _id: "id-plain",
        loop: false,
      } as Cue

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
        const popup = (window.open as jest.Mock).mock.results.at(-1)!.value
        const image = popup.document.body.querySelector(
          'img[src="http://example.com/plain.png"]'
        )
        expect(image).toBeTruthy()
        expect(image.style.animation).toBe("")
      })
    })

    test("still applies the fade animation to a cue that also spans multiple screens", async () => {
      const screenData = {
        file: {
          url: "http://example.com/wide-fade.jpg",
          type: "image/jpg",
          name: "wide-fade.jpg",
        },
        index: 0,
        name: "wide-fade-cue",
        screen: 1,
        spanScreens: [1, 2],
        _id: "id-wide-fade",
        loop: false,
        imageEffect: "fade",
      } as Cue

      await act(async () => {
        render(
          <Screen
            screenNumber={1}
            screenData={screenData}
            isVisible={true}
            onClose={() => {}}
            screenWidths={{ 1: 800, 2: 800 }}
          />
        )
      })

      await waitFor(() => {
        const popup = (window.open as jest.Mock).mock.results.at(-1)!.value
        const image = popup.document.body.querySelector(
          'img[src="http://example.com/wide-fade.jpg"]'
        )
        expect(image).toBeTruthy()
        expect(image.style.animation).toContain("4s ease-in-out forwards")
      })
    })
  })

  describe("cues that persist across a frame change", () => {
    const videoCue = {
      file: {
        url: "http://example.com/background.mp4",
        type: "video/mp4",
        name: "background.mp4",
      },
      index: 5,
      name: "background-video",
      screen: 1,
      layer: 0,
      _id: "id-video",
      loop: false,
    } as Cue

    const overlayCueA = {
      file: {
        url: "http://example.com/overlay-a.png",
        type: "image/png",
        name: "overlay-a.png",
      },
      index: 6,
      name: "overlay-a",
      screen: 1,
      layer: 1,
      _id: "id-overlay-a",
      loop: false,
    } as Cue

    const overlayCueB = {
      file: {
        url: "http://example.com/overlay-b.png",
        type: "image/png",
        name: "overlay-b.png",
      },
      index: 7,
      name: "overlay-b",
      screen: 1,
      layer: 1,
      _id: "id-overlay-b",
      loop: false,
    } as Cue

    test("keeps the same video element when a sibling layer's cue changes", async () => {
      const onClose = jest.fn()
      const { rerender } = render(
        <Screen
          screenNumber={1}
          screenData={[videoCue]}
          isVisible={true}
          onClose={onClose}
        />
      )

      let popup: any
      let firstVideoEl: Element | null = null
      await waitFor(() => {
        popup = (window.open as jest.Mock).mock.results.at(-1)!.value
        firstVideoEl = popup.document.body.querySelector(
          'video[src="http://example.com/background.mp4"]'
        )
        expect(firstVideoEl).toBeTruthy()
      })
      const classNameWhileEntering = (firstVideoEl as unknown as Element)
        .parentElement?.className

      await act(async () => {
        rerender(
          <Screen
            screenNumber={1}
            screenData={[videoCue, overlayCueA]}
            isVisible={true}
            onClose={onClose}
          />
        )
      })

      await waitFor(() => {
        const overlay = popup.document.body.querySelector(
          'img[src="http://example.com/overlay-a.png"]'
        )
        expect(overlay).toBeTruthy()
      })

      const videoElAfterOverlay = popup.document.body.querySelector(
        'video[src="http://example.com/background.mp4"]'
      )
      expect(videoElAfterOverlay).toBe(firstVideoEl)
      expect(videoElAfterOverlay?.parentElement?.className).not.toBe(
        classNameWhileEntering
      )

      const outgoingVideo = popup.document.body.querySelector(
        '[data-testid="outgoing-cue-layer"] video'
      )
      expect(outgoingVideo).toBeNull()
    })

    // Regression: an unchanged layer used to be gated by isRevealed along
    // with its transitioning sibling, briefly hiding it and exposing the
    // black background beneath.
    test("keeps an unchanged layer revealed while a sibling layer transitions", async () => {
      const onClose = jest.fn()
      const { rerender } = render(
        <Screen
          screenNumber={1}
          screenData={[videoCue, overlayCueA]}
          isVisible={true}
          onClose={onClose}
          transitionAt={Date.now() + 10000}
        />
      )

      let popup: any
      await waitFor(() => {
        popup = (window.open as jest.Mock).mock.results.at(-1)!.value
        expect(
          popup.document.body.querySelector(
            'video[src="http://example.com/background.mp4"]'
          )
        ).toBeTruthy()
      })

      await act(async () => {
        rerender(
          <Screen
            screenNumber={1}
            screenData={[videoCue, overlayCueB]}
            isVisible={true}
            onClose={onClose}
            transitionAt={Date.now() + 10000}
          />
        )
      })

      const videoLayerBox = popup.document.body
        .querySelector('video[src="http://example.com/background.mp4"]')
        .closest('[data-testid="incoming-cue-layer"]')

      expect(videoLayerBox.getAttribute("data-revealed")).toBe("true")
    })

    test("keeps the same video element across two consecutive overlay changes", async () => {
      const onClose = jest.fn()
      const { rerender } = render(
        <Screen
          screenNumber={1}
          screenData={[videoCue, overlayCueA]}
          isVisible={true}
          onClose={onClose}
        />
      )

      let popup: any
      let videoEl: Element | null = null
      await waitFor(() => {
        popup = (window.open as jest.Mock).mock.results.at(-1)!.value
        videoEl = popup.document.body.querySelector(
          'video[src="http://example.com/background.mp4"]'
        )
        expect(videoEl).toBeTruthy()
      })

      await act(async () => {
        rerender(
          <Screen
            screenNumber={1}
            screenData={[videoCue, overlayCueB]}
            isVisible={true}
            onClose={onClose}
          />
        )
      })

      await waitFor(() => {
        expect(
          popup.document.body.querySelector(
            'img[src="http://example.com/overlay-b.png"]'
          )
        ).toBeTruthy()
      })

      expect(
        popup.document.body.querySelector(
          'video[src="http://example.com/background.mp4"]'
        )
      ).toBe(videoEl)
      expect(
        popup.document.body.querySelector(
          '[data-testid="incoming-cue-layer"] img[src="http://example.com/overlay-a.png"]'
        )
      ).toBeNull()
      expect(
        popup.document.body.querySelector(
          '[data-testid="outgoing-cue-layer"] img[src="http://example.com/overlay-a.png"]'
        )
      ).toBeTruthy()
    })

    test("keeps the same video element through entering, persisting and exiting", async () => {
      const onClose = jest.fn()
      const { rerender } = render(
        <Screen
          screenNumber={1}
          screenData={[videoCue]}
          isVisible={true}
          onClose={onClose}
        />
      )

      let popup: any
      let videoEl: Element | null = null
      await waitFor(() => {
        popup = (window.open as jest.Mock).mock.results.at(-1)!.value
        videoEl = popup.document.body.querySelector(
          'video[src="http://example.com/background.mp4"]'
        )
        expect(videoEl).toBeTruthy()
      })

      await act(async () => {
        rerender(
          <Screen
            screenNumber={1}
            screenData={[videoCue, overlayCueA]}
            isVisible={true}
            onClose={onClose}
          />
        )
      })

      await waitFor(() => {
        expect(
          popup.document.body.querySelector(
            'img[src="http://example.com/overlay-a.png"]'
          )
        ).toBeTruthy()
      })
      expect(
        popup.document.body.querySelector(
          'video[src="http://example.com/background.mp4"]'
        )
      ).toBe(videoEl)

      await act(async () => {
        rerender(
          <Screen
            screenNumber={1}
            screenData={
              {
                file: null,
                color: "#000000",
                index: 8,
                name: "end-card",
                screen: 1,
                _id: "id-end-card",
                loop: false,
              } as Cue
            }
            isVisible={true}
            onClose={onClose}
          />
        )
      })

      await waitFor(() => {
        expect(
          popup.document.body.querySelector(
            '[data-testid="outgoing-cue-layer"] video[src="http://example.com/background.mp4"]'
          )
        ).toBeTruthy()
      })

      expect(
        popup.document.body.querySelector(
          '[data-testid="outgoing-cue-layer"] video[src="http://example.com/background.mp4"]'
        )
      ).toBe(videoEl)
      expect(
        popup.document.body.querySelector(
          '[data-testid="incoming-cue-layer"] video'
        )
      ).toBeNull()
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
    } as Cue

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

      const popup = (window.open as jest.Mock).mock.results.at(-1)!.value
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

      const popup = (window.open as jest.Mock).mock.results.at(-1)!.value
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
        const listeners: Record<string, (...args: unknown[]) => void> = {}
        const fakeDoc = {
          title: "",
          documentElement: { style: {} as CSSStyleDeclaration },
          body: document.createElement("body"),
          head: document.createElement("head"),
        }
        return {
          document: fakeDoc,
          innerWidth: 654,
          close: jest.fn(),
          addEventListener: jest.fn(
            (eventName: string, handler: (...args: unknown[]) => void) => {
              listeners[eventName] = handler
            }
          ),
          removeEventListener: jest.fn((eventName: string) => {
            delete listeners[eventName]
          }),
          listeners,
        }
      }) as unknown as typeof window.open

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

  describe("multi-screen video spanning", () => {
    const spanVideoCue = {
      file: {
        url: "http://example.com/wide.mp4",
        type: "video/mp4",
        name: "wide.mp4",
      },
      index: 0,
      name: "span-video-cue",
      screen: 1,
      spanScreens: [1, 2],
      _id: "id-video-span",
      loop: false,
    } as Cue

    test("renders the plain full-bleed video until its size is known", async () => {
      await act(async () => {
        render(
          <Screen
            screenNumber={1}
            screenData={spanVideoCue}
            isVisible={true}
            onClose={() => {}}
            screenWidths={{ 1: 800, 2: 800 }}
          />
        )
      })

      const popup = (window.open as jest.Mock).mock.results.at(-1)!.value
      await waitFor(() => {
        const video = popup.document.body.querySelector(
          'video[src="http://example.com/wide.mp4"]'
        )
        expect(video).toBeTruthy()
        expect(video.getAttribute("style")).not.toContain("position: absolute")
      })
    })

    test("crops to this screen's slice of the combined canvas once metadata loads", async () => {
      await act(async () => {
        render(
          <Screen
            screenNumber={2}
            screenData={spanVideoCue}
            isVisible={true}
            onClose={() => {}}
            screenWidths={{ 1: 800, 2: 500 }}
          />
        )
      })

      const popup = (window.open as jest.Mock).mock.results.at(-1)!.value
      const video = await waitFor(() =>
        popup.document.body.querySelector(
          'video[src="http://example.com/wide.mp4"]'
        )
      )

      Object.defineProperty(video, "videoWidth", {
        value: 2000,
        configurable: true,
      })
      Object.defineProperty(video, "videoHeight", {
        value: 1000,
        configurable: true,
      })
      await act(async () => {
        fireEvent.loadedMetadata(video)
      })

      await waitFor(() => {
        const croppedVideo = popup.document.body.querySelector(
          'video[src="http://example.com/wide.mp4"]'
        )
        const style = croppedVideo!.getAttribute("style")
        expect(style).toContain("left: -800px")
        expect(style).toContain("width: 1300px")
        expect(style).toContain("height: 650px")
      })
    })

    test("does not span when only one screen is listed", async () => {
      const singleScreenCue = {
        ...spanVideoCue,
        spanScreens: [1],
      } as Cue

      await act(async () => {
        render(
          <Screen
            screenNumber={1}
            screenData={singleScreenCue}
            isVisible={true}
            onClose={() => {}}
            screenWidths={{ 1: 800 }}
          />
        )
      })

      const popup = (window.open as jest.Mock).mock.results.at(-1)!.value
      await waitFor(() => {
        const video = popup.document.body.querySelector(
          'video[src="http://example.com/wide.mp4"]'
        )
        expect(video).toBeTruthy()
        expect(video.getAttribute("style")).not.toContain("position: absolute")
      })
    })
  })

  describe("frozen media URL overrides", () => {
    test("renders the frozen blob URL for an image cue instead of the live URL", async () => {
      const screenData = {
        file: {
          url: "https://example.com/photo.png",
          type: "image/png",
          name: "photo.png",
        },
        index: 0,
        name: "frozen-image-cue",
        screen: 1,
        _id: "id-frozen-image",
        loop: false,
      } as Cue

      await act(async () => {
        render(
          <Screen
            screenNumber={1}
            screenData={screenData}
            isVisible={true}
            onClose={() => {}}
            mediaUrlOverrides={{
              "https://example.com/photo.png": "blob:fake-image",
            }}
          />
        )
      })

      await waitFor(() => {
        const popup = (window.open as jest.Mock).mock.results.at(-1)!.value
        expect(
          popup.document.body.querySelector('img[src="blob:fake-image"]')
        ).toBeTruthy()
        expect(
          popup.document.body.querySelector(
            'img[src="https://example.com/photo.png"]'
          )
        ).toBeNull()
      })
    })

    test("renders the frozen blob URL for a video cue instead of the live URL", async () => {
      const screenData = {
        file: {
          url: "https://example.com/clip.mp4",
          type: "video/mp4",
          name: "clip.mp4",
        },
        index: 0,
        name: "frozen-video-cue",
        screen: 1,
        _id: "id-frozen-video",
        loop: false,
      } as Cue

      await act(async () => {
        render(
          <Screen
            screenNumber={1}
            screenData={screenData}
            isVisible={true}
            onClose={() => {}}
            mediaUrlOverrides={{
              "https://example.com/clip.mp4": "blob:fake-video",
            }}
          />
        )
      })

      await waitFor(() => {
        const popup = (window.open as jest.Mock).mock.results.at(-1)!.value
        expect(
          popup.document.body.querySelector('video[src="blob:fake-video"]')
        ).toBeTruthy()
      })
    })

    test("renders the frozen blob URL for an audio cue instead of the live URL", async () => {
      const screenData = {
        file: {
          url: "https://example.com/track.mp3",
          type: "audio/mpeg",
          name: "track.mp3",
        },
        index: 0,
        name: "frozen-audio-cue",
        screen: 1,
        _id: "id-frozen-audio",
        loop: false,
      } as Cue

      await act(async () => {
        render(
          <Screen
            screenNumber={1}
            screenData={screenData}
            isVisible={true}
            onClose={() => {}}
            mediaUrlOverrides={{
              "https://example.com/track.mp3": "blob:fake-audio",
            }}
          />
        )
      })

      await waitFor(() => {
        const popup = (window.open as jest.Mock).mock.results.at(-1)!.value
        expect(
          popup.document.body.querySelector('source[src="blob:fake-audio"]')
        ).toBeTruthy()
      })
    })

    test("falls back to the live URL when no frozen entry exists for it", async () => {
      const screenData = {
        file: {
          url: "https://example.com/unfrozen.png",
          type: "image/png",
          name: "unfrozen.png",
        },
        index: 0,
        name: "unfrozen-cue",
        screen: 1,
        _id: "id-unfrozen",
        loop: false,
      } as Cue

      await act(async () => {
        render(
          <Screen
            screenNumber={1}
            screenData={screenData}
            isVisible={true}
            onClose={() => {}}
            mediaUrlOverrides={{
              "https://example.com/other.png": "blob:fake-other",
            }}
          />
        )
      })

      await waitFor(() => {
        const popup = (window.open as jest.Mock).mock.results.at(-1)!.value
        expect(
          popup.document.body.querySelector(
            'img[src="https://example.com/unfrozen.png"]'
          )
        ).toBeTruthy()
      })
    })
  })

  test("renders the text of a text element in the popup, without a background", async () => {
    const screenData = {
      file: null,
      color: "#000000",
      text: "La nuit est tombée",
      textColor: "#ffcc00",
      textSize: 10,
      index: 0,
      name: "Intro",
      screen: 1,
      _id: "id-text",
      loop: false,
    } as Cue

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

    const popup = (window.open as jest.Mock).mock.results.at(-1)!.value
    const text = await within(popup.document.body).findByText(
      "La nuit est tombée"
    )
    expect(text).toHaveStyle({ color: "#ffcc00" })
    expect(text.style.getPropertyValue("--cue-text-size")).toBe("10")
  })

  test("shows a text element over the element below it on another layer", async () => {
    const stack = [
      {
        file: null,
        color: "#0a1a3a",
        index: 0,
        name: "night",
        screen: 1,
        layer: 1,
        _id: "id-background",
      },
      {
        file: null,
        color: "#000000",
        text: "Night has fallen",
        index: 0,
        name: "Intro",
        screen: 1,
        layer: 0,
        _id: "id-text",
      },
    ] as Cue[]

    await act(async () => {
      render(
        <Screen
          screenNumber={1}
          screenData={stack}
          isVisible={true}
          onClose={() => {}}
        />
      )
    })

    const popup = (window.open as jest.Mock).mock.results.at(-1)!.value
    await waitFor(() => {
      expect(
        within(popup.document.body).getByText("Night has fallen")
      ).toBeTruthy()
    })
    const layers = popup.document.body.querySelectorAll(
      '[data-testid="incoming-cue-layer"] > div'
    )
    expect(layers).toHaveLength(2)
  })
})
