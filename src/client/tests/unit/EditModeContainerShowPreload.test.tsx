/**
 * Regression tests for the show-mode media preload gate: clicking "Show
 * mode" used to navigate immediately, so secondary screen windows could open
 * before their images/videos were cached, showing blank/broken media.
 *
 * EditModeContainer now freezes every cue's media (image/video/audio) by
 * fetching it into a Blob and swapping it for an Object URL, and blocks
 * `onEnterShow` behind a loading overlay until every Blob has actually
 * finished downloading -- not a looser heuristic like `oncanplaythrough`.
 */

import React from "react"
import { render, screen, fireEvent, act, waitFor } from "@testing-library/react"
import "@testing-library/jest-dom"
import EditModeContainer from "../../components/presentation/EditModeContainer"
import { useDispatch, useSelector } from "react-redux"
import type { Cue } from "../../types"
const mockedUseSelector = jest.mocked(useSelector)
const mockedUseDispatch = jest.mocked(useDispatch)

jest.mock("react-redux", () => ({
  useDispatch: jest.fn(),
  useSelector: jest.fn(),
}))

jest.mock("../../redux/presentationReducer", () => ({
  fetchPresentationInfo: jest.fn(() => ({
    type: "MOCK_FETCH_PRESENTATION_INFO",
  })),
}))

jest.mock("../../components/presentation/EditMode", () => {
  return function MockEditMode() {
    return <div data-testid="mock-edit-mode" />
  }
})

jest.mock("../../components/presentation/CuesForm", () => {
  return function MockCuesForm() {
    return <div data-testid="mock-cues-form" />
  }
})

jest.mock("../../components/presentation/PresentationTitle", () => {
  return function MockPresentationTitle() {
    return <div data-testid="mock-presentation-title" />
  }
})

jest.mock("../../components/presentation/ScreensDisplay", () => ({
  ScreensDisplay: function MockScreensDisplay() {
    return <div data-testid="mock-screens-display" />
  },
}))

jest.mock("../../components/presentation/Screen", () => {
  return function MockScreen() {
    return <div data-testid="mock-screen" />
  }
})

jest.mock("../../components/tutorial/TutorialGuide", () => {
  return function MockTutorialGuide() {
    return <div data-testid="mock-tutorial-guide" />
  }
})

jest.mock("../../components/utils/keyboardHandler", () => {
  return function MockKeyboardHandler() {
    return <div data-testid="mock-keyboard-handler" />
  }
})

jest.mock("../../components/presentation/PresentationPlaybackControls", () => {
  return function MockPresentationPlaybackControls() {
    return <div data-testid="mock-playback-controls" />
  }
})
jest.mock("../../components/presentation/CueAudioPlayers", () => () => null)

// makeResizable returns a disposer the caller must invoke on unmount.
jest.mock("../../components/utils/ResizeElement", () =>
  jest.fn(() => jest.fn())
)

describe("EditModeContainer show mode media preload gate", () => {
  const dispatchMock = jest.fn()
  const originalFetch = global.fetch
  // jsdom doesn't implement these at all, so there's nothing meaningful to
  // restore in afterEach -- just keep a harmless no-op installed between
  // tests instead of leaving them undefined (RTL's auto-cleanup unmounts
  // after this suite's own afterEach runs and would otherwise call into a
  // missing function).

  // Each fetch() call is held open until the test resolves it, so assertions
  // can inspect "in flight" state the way the old Image/video mocks did.
  let pendingFetches: Array<{
    url: string
    resolve: (blob: Blob) => void
    reject: (error: Error) => void
  }>
  let createObjectURLMock: jest.Mock
  let revokeObjectURLMock: jest.Mock
  let objectUrlCounter: number

  const imageCue = {
    _id: "cue-image",
    index: 0,
    screen: 1,
    name: "Photo",
    cueType: "visual",
    file: { type: "image/png", url: "https://example.com/photo.png" },
  } as unknown as Cue

  const videoCue = {
    _id: "cue-video",
    index: 0,
    screen: 2,
    name: "Clip",
    cueType: "visual",
    file: { type: "video/mp4", url: "https://example.com/clip.mp4" },
  } as unknown as Cue

  const colorCue = {
    _id: "cue-color",
    index: 0,
    screen: 1,
    name: "Background",
    cueType: "visual",
    color: "#000000",
  } as unknown as Cue

  const baseProps = {
    id: "presentation-1",
    isToolboxOpen: false,
    setIsToolboxOpen: jest.fn(),
    transitionType: "none",
    onTransitionChange: jest.fn(),
    cueIndex: 0,
    setCueIndex: jest.fn(),
    isAudioMuted: false,
    toggleAudioMute: jest.fn(),
    indexCount: 10,
    addCue: jest.fn(),
    onClose: jest.fn(),
    position: null,
    cueData: null,
    updateCue: jest.fn(),
    isAudioMode: false,
  }

  // Resolves the oldest pending fetch() for a given URL with a fake Blob.
  const resolveFetch = (url: string) => {
    const index = pendingFetches.findIndex((entry) => entry.url === url)
    if (index === -1) {
      throw new Error(`No pending fetch for ${url}`)
    }
    const [entry] = pendingFetches.splice(index, 1)
    entry.resolve(new Blob(["data"], { type: "application/octet-stream" }))
  }

  const rejectFetch = (url: string) => {
    const index = pendingFetches.findIndex((entry) => entry.url === url)
    if (index === -1) {
      throw new Error(`No pending fetch for ${url}`)
    }
    const [entry] = pendingFetches.splice(index, 1)
    entry.reject(new Error("network error"))
  }

  beforeEach(() => {
    jest.clearAllMocks()
    pendingFetches = []
    objectUrlCounter = 0

    global.fetch = jest.fn((input: RequestInfo | URL) => {
      const url = String(input)
      return new Promise((resolve, reject) => {
        pendingFetches.push({
          url,
          resolve: (blob) =>
            resolve({
              ok: true,
              status: 200,
              blob: async () => blob,
            } as unknown as Response),
          reject,
        })
      })
    }) as unknown as typeof global.fetch

    createObjectURLMock = jest.fn(() => `blob:fake-${objectUrlCounter++}`)
    revokeObjectURLMock = jest.fn()
    global.URL.createObjectURL =
      createObjectURLMock as unknown as typeof URL.createObjectURL
    global.URL.revokeObjectURL =
      revokeObjectURLMock as unknown as typeof URL.revokeObjectURL

    // Swallow the expected console.error from a deliberately-failed freeze.
    jest.spyOn(console, "error").mockImplementation(() => {})

    mockedUseDispatch.mockReturnValue(dispatchMock)
    mockedUseSelector.mockImplementation((selector) =>
      selector({
        presentation: {
          name: "Test presentation",
          screenCount: 2,
        },
      })
    )
  })

  afterEach(() => {
    global.fetch = originalFetch
    global.URL.createObjectURL = (() =>
      "") as unknown as typeof URL.createObjectURL
    global.URL.revokeObjectURL =
      (() => {}) as unknown as typeof URL.revokeObjectURL
    jest.restoreAllMocks()
  })

  test("enters show mode immediately when no cue has visual media", () => {
    const onEnterShow = jest.fn()
    render(
      <EditModeContainer
        {...baseProps}
        cues={[colorCue]}
        onEnterShow={onEnterShow}
      />
    )

    fireEvent.click(screen.getByText("Show mode"))

    expect(onEnterShow).toHaveBeenCalledTimes(1)
    expect(screen.queryByText(/Préparation du show/)).not.toBeInTheDocument()
  })

  test("blocks show mode behind a loading overlay until every image/video Blob finishes downloading", async () => {
    const onEnterShow = jest.fn()
    render(
      <EditModeContainer
        {...baseProps}
        cues={[imageCue, videoCue]}
        onEnterShow={onEnterShow}
      />
    )

    fireEvent.click(screen.getByText("Show mode"))

    expect(onEnterShow).not.toHaveBeenCalled()
    expect(screen.getByText(/Préparation du show/)).toBeInTheDocument()
    expect(screen.getByText("0/2 médias chargés")).toBeInTheDocument()

    expect(global.fetch).toHaveBeenCalledWith("https://example.com/photo.png")
    expect(global.fetch).toHaveBeenCalledWith("https://example.com/clip.mp4")

    await act(async () => {
      resolveFetch("https://example.com/photo.png")
    })
    await waitFor(() =>
      expect(screen.getByText("1/2 médias chargés")).toBeInTheDocument()
    )

    await act(async () => {
      resolveFetch("https://example.com/clip.mp4")
    })

    await waitFor(() => expect(onEnterShow).toHaveBeenCalledTimes(1))
    expect(screen.queryByText(/Préparation du show/)).not.toBeInTheDocument()
    // Each media URL produced exactly one Object URL (no re-fetch/re-freeze).
    expect(createObjectURLMock).toHaveBeenCalledTimes(2)
  })

  test("falls back to the live URL and still resolves when a freeze fetch fails", async () => {
    const onEnterShow = jest.fn()
    render(
      <EditModeContainer
        {...baseProps}
        cues={[videoCue]}
        onEnterShow={onEnterShow}
      />
    )

    fireEvent.click(screen.getByText("Show mode"))

    expect(screen.getByText(/Préparation du show/)).toBeInTheDocument()

    await act(async () => {
      rejectFetch("https://example.com/clip.mp4")
    })

    await waitFor(() => expect(onEnterShow).toHaveBeenCalledTimes(1))
    expect(console.error).toHaveBeenCalled()
    // A failed freeze never produces an Object URL.
    expect(createObjectURLMock).not.toHaveBeenCalled()
  })

  test("skips the overlay once media has already been preloaded in the background", async () => {
    const onEnterShow = jest.fn()
    render(
      <EditModeContainer
        {...baseProps}
        cues={[imageCue]}
        onEnterShow={onEnterShow}
      />
    )

    // The passive preload effect (running since cues were loaded) already
    // started the fetch; resolve it before entering show mode.
    await act(async () => {
      resolveFetch("https://example.com/photo.png")
    })

    fireEvent.click(screen.getByText("Show mode"))

    expect(onEnterShow).toHaveBeenCalledTimes(1)
    expect(screen.queryByText(/Préparation du show/)).not.toBeInTheDocument()
  })

  test("preloads back layers before front layers", () => {
    const frontImageCue = {
      _id: "cue-front",
      index: 0,
      screen: 1,
      layer: 0,
      name: "Front",
      cueType: "visual",
      file: { type: "image/png", url: "https://example.com/front.png" },
    } as unknown as Cue

    const backImageCue = {
      _id: "cue-back",
      index: 0,
      screen: 1,
      layer: 3,
      name: "Back",
      cueType: "visual",
      file: { type: "image/png", url: "https://example.com/back.png" },
    } as unknown as Cue

    render(
      <EditModeContainer
        {...baseProps}
        // Listed front-first so a pass would only happen by sorting, not by
        // array order coincidence.
        cues={[frontImageCue, backImageCue]}
        onEnterShow={jest.fn()}
      />
    )

    const fetchMock = global.fetch as jest.Mock
    expect(fetchMock.mock.calls[0][0]).toBe("https://example.com/back.png")
    expect(fetchMock.mock.calls[1][0]).toBe("https://example.com/front.png")
  })

  test("freezes audio cues too, and gates show mode entry on them", async () => {
    const audioCue = {
      _id: "cue-audio",
      index: 0,
      screen: 3,
      name: "Track",
      cueType: "audio",
      file: { type: "audio/mpeg", url: "https://example.com/track.mp3" },
    } as unknown as Cue

    const onEnterShow = jest.fn()
    render(
      <EditModeContainer
        {...baseProps}
        indexCount={10}
        cues={[audioCue]}
        onEnterShow={onEnterShow}
      />
    )

    expect(global.fetch).toHaveBeenCalledWith("https://example.com/track.mp3")

    fireEvent.click(screen.getByText("Show mode"))
    expect(onEnterShow).not.toHaveBeenCalled()

    await act(async () => {
      resolveFetch("https://example.com/track.mp3")
    })

    await waitFor(() => expect(onEnterShow).toHaveBeenCalledTimes(1))
  })

  test("does not duplicate preload work when show mode's lookahead effect runs", () => {
    const { rerender } = render(
      <EditModeContainer
        {...baseProps}
        cues={[imageCue, videoCue]}
        isShowMode={false}
        onEnterShow={jest.fn()}
      />
    )

    expect(global.fetch).toHaveBeenCalledTimes(2)

    mockedUseSelector.mockImplementation((selector) =>
      selector({
        presentation: {
          name: "Test presentation",
          screenCount: 2,
          scores: [],
        },
      })
    )

    rerender(
      <EditModeContainer
        {...baseProps}
        cues={[imageCue, videoCue]}
        isShowMode={true}
        cueIndex={0}
        onEnterShow={jest.fn()}
      />
    )

    // Entering show mode runs the lookahead effect on top of the background
    // preload that already ran for these cues -- it must reuse the cache,
    // not re-fetch.
    expect(global.fetch).toHaveBeenCalledTimes(2)
  })

  test("revokes a cue's frozen Object URL once its media is no longer referenced", async () => {
    const { rerender } = render(
      <EditModeContainer
        {...baseProps}
        cues={[imageCue]}
        onEnterShow={jest.fn()}
      />
    )

    await act(async () => {
      resolveFetch("https://example.com/photo.png")
    })

    expect(createObjectURLMock).toHaveBeenCalledTimes(1)
    expect(revokeObjectURLMock).not.toHaveBeenCalled()

    rerender(
      <EditModeContainer {...baseProps} cues={[]} onEnterShow={jest.fn()} />
    )

    await waitFor(() => {
      expect(revokeObjectURLMock).toHaveBeenCalledWith("blob:fake-0")
    })
  })

  test("revokes every outstanding frozen Object URL on unmount", async () => {
    const { unmount } = render(
      <EditModeContainer
        {...baseProps}
        cues={[imageCue]}
        onEnterShow={jest.fn()}
      />
    )

    await act(async () => {
      resolveFetch("https://example.com/photo.png")
    })

    expect(createObjectURLMock).toHaveBeenCalledTimes(1)

    unmount()

    expect(revokeObjectURLMock).toHaveBeenCalledWith("blob:fake-0")
  })
})
