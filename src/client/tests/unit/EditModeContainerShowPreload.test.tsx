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

  // freezeMediaUrl looks the media up in the disk cache before falling back to
  // the network, so its fetch() is a few microtasks behind the click that
  // triggered it. Give it those ticks rather than assuming it already fired.
  const takePendingFetch = async (url: string) => {
    for (let attempt = 0; attempt < 20; attempt += 1) {
      const index = pendingFetches.findIndex((entry) => entry.url === url)
      if (index !== -1) {
        const [entry] = pendingFetches.splice(index, 1)
        return entry
      }
      await Promise.resolve()
    }
    throw new Error(`No pending fetch for ${url}`)
  }

  // Resolves the oldest pending fetch() for a given URL with a fake Blob.
  const resolveFetch = async (url: string) => {
    const entry = await takePendingFetch(url)
    entry.resolve(new Blob(["data"], { type: "application/octet-stream" }))
  }

  const rejectFetch = async (url: string) => {
    const entry = await takePendingFetch(url)
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

    await waitFor(() =>
      expect(global.fetch).toHaveBeenCalledWith(
        "https://example.com/photo.png",
        { cache: "reload" }
      )
    )
    expect(global.fetch).toHaveBeenCalledWith("https://example.com/clip.mp4", {
      cache: "reload",
    })

    await act(async () => {
      await resolveFetch("https://example.com/photo.png")
    })
    await waitFor(() =>
      expect(screen.getByText("1/2 médias chargés")).toBeInTheDocument()
    )

    await act(async () => {
      await resolveFetch("https://example.com/clip.mp4")
    })

    await waitFor(() => expect(onEnterShow).toHaveBeenCalledTimes(1))
    expect(screen.queryByText(/Préparation du show/)).not.toBeInTheDocument()
    // Each media URL produced exactly one Object URL (no re-fetch/re-freeze).
    expect(createObjectURLMock).toHaveBeenCalledTimes(2)
  })

  test("shows a per-item status list in the loading overlay, including a failed item", async () => {
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
        cues={[imageCue, videoCue, audioCue]}
        onEnterShow={onEnterShow}
      />
    )

    fireEvent.click(screen.getByText("Show mode"))

    const items = screen.getAllByTestId("preload-item")
    expect(items).toHaveLength(3)
    expect(screen.getByText("Photo")).toBeInTheDocument()
    expect(screen.getByText("Clip")).toBeInTheDocument()
    expect(screen.getByText("Track")).toBeInTheDocument()
    // Nothing has settled yet -- every row starts out loading (the
    // background preload effect already kicked off every fetch).
    items.forEach((item) =>
      expect(item).toHaveAttribute("data-status", "loading")
    )

    await act(async () => {
      await resolveFetch("https://example.com/photo.png")
    })
    await waitFor(() =>
      expect(
        screen.getByText("Photo").closest('[data-testid="preload-item"]')
      ).toHaveAttribute("data-status", "done")
    )

    // The audio cue is left unresolved so the overlay stays open long
    // enough to observe the failed video's status.
    await act(async () => {
      await rejectFetch("https://example.com/clip.mp4")
    })
    await waitFor(() =>
      expect(
        screen.getByText("Clip").closest('[data-testid="preload-item"]')
      ).toHaveAttribute("data-status", "failed")
    )
    expect(onEnterShow).not.toHaveBeenCalled()

    await act(async () => {
      await resolveFetch("https://example.com/track.mp3")
    })
    await waitFor(() => expect(onEnterShow).toHaveBeenCalledTimes(1))
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
      await rejectFetch("https://example.com/clip.mp4")
    })

    await waitFor(() => expect(onEnterShow).toHaveBeenCalledTimes(1))
    expect(console.error).toHaveBeenCalled()
    // A failed freeze never produces an Object URL.
    expect(createObjectURLMock).not.toHaveBeenCalled()
  })

  test("counts only media that finished downloading, never more than the total", async () => {
    const extraCue = {
      _id: "cue-extra",
      index: 0,
      screen: 3,
      name: "Extra",
      cueType: "visual",
      file: { type: "image/png", url: "https://example.com/extra.png" },
    } as unknown as Cue

    const { rerender } = render(
      <EditModeContainer
        {...baseProps}
        cues={[imageCue, videoCue]}
        onEnterShow={jest.fn()}
      />
    )

    fireEvent.click(screen.getByText("Show mode"))
    await act(async () => {
      await resolveFetch("https://example.com/photo.png")
      await resolveFetch("https://example.com/clip.mp4")
    })

    // Re-entering with one more cue re-counts the two already-frozen media.
    rerender(
      <EditModeContainer
        {...baseProps}
        cues={[imageCue, videoCue, extraCue]}
        onEnterShow={jest.fn()}
      />
    )
    fireEvent.click(screen.getByText("Show mode"))

    await waitFor(() =>
      expect(screen.getByText("2/3 médias chargés")).toBeInTheDocument()
    )

    await act(async () => {
      await resolveFetch("https://example.com/extra.png")
    })

    await waitFor(() =>
      expect(screen.queryByText(/Préparation du show/)).not.toBeInTheDocument()
    )
  })

  test("skips the overlay on a second show-mode entry once media is already frozen", async () => {
    const onEnterShow = jest.fn()
    render(
      <EditModeContainer
        {...baseProps}
        cues={[imageCue]}
        onEnterShow={onEnterShow}
      />
    )

    fireEvent.click(screen.getByText("Show mode"))
    await act(async () => {
      await resolveFetch("https://example.com/photo.png")
    })
    await waitFor(() => expect(onEnterShow).toHaveBeenCalledTimes(1))

    fireEvent.click(screen.getByText("Show mode"))

    expect(onEnterShow).toHaveBeenCalledTimes(2)
    expect(screen.queryByText(/Préparation du show/)).not.toBeInTheDocument()
  })

  test("preloads back layers before front layers", async () => {
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

    fireEvent.click(screen.getByText("Show mode"))

    const fetchMock = global.fetch as jest.Mock
    await waitFor(() => expect(fetchMock.mock.calls.length).toBe(2))
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

    fireEvent.click(screen.getByText("Show mode"))
    expect(onEnterShow).not.toHaveBeenCalled()
    await waitFor(() =>
      expect(global.fetch).toHaveBeenCalledWith(
        "https://example.com/track.mp3",
        { cache: "reload" }
      )
    )

    await act(async () => {
      await resolveFetch("https://example.com/track.mp3")
    })

    await waitFor(() => expect(onEnterShow).toHaveBeenCalledTimes(1))
  })

  test("does not duplicate preload work when show mode's lookahead effect runs", async () => {
    const { rerender } = render(
      <EditModeContainer
        {...baseProps}
        cues={[imageCue, videoCue]}
        isShowMode={false}
        onEnterShow={jest.fn()}
      />
    )

    fireEvent.click(screen.getByText("Show mode"))
    await act(async () => {
      await resolveFetch("https://example.com/photo.png")
      await resolveFetch("https://example.com/clip.mp4")
    })

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

    fireEvent.click(screen.getByText("Show mode"))
    await act(async () => {
      await resolveFetch("https://example.com/photo.png")
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

    fireEvent.click(screen.getByText("Show mode"))
    await act(async () => {
      await resolveFetch("https://example.com/photo.png")
    })

    expect(createObjectURLMock).toHaveBeenCalledTimes(1)

    unmount()

    expect(revokeObjectURLMock).toHaveBeenCalledWith("blob:fake-0")
  })
})

/**
 * Regression tests for the media-integrity check: an already-frozen URL is
 * revalidated (a 1-byte ranged GET) against the ETag/Last-Modified/
 * Content-Length captured at freeze time before its cached Blob is
 * reused, so a file replaced in place under the same URL (e.g. a shared
 * media-library entry) doesn't serve stale content forever.
 */
describe("EditModeContainer media URL staleness check", () => {
  const dispatchMock = jest.fn()
  const originalFetch = global.fetch
  const originalDateNow = Date.now

  type FetchCall = {
    url: string
    method: string
    resolve: (opts: {
      etag?: string | null
      lastModified?: string | null
      contentLength?: string | null
      ok?: boolean
      status?: number
    }) => void
    reject: (error: Error) => void
  }

  let calls: FetchCall[]
  let createObjectURLMock: jest.Mock
  let revokeObjectURLMock: jest.Mock
  let objectUrlCounter: number
  let currentTime: number

  const imageCue = {
    _id: "cue-image",
    index: 0,
    screen: 1,
    name: "Photo",
    cueType: "visual",
    file: { type: "image/png", url: "https://example.com/photo.png" },
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

  const makeHeaders = (opts: {
    etag?: string | null
    lastModified?: string | null
    contentLength?: string | null
  }) => ({
    get: (name: string) => {
      if (name === "etag") return opts.etag ?? null
      if (name === "last-modified") return opts.lastModified ?? null
      if (name === "content-length") return opts.contentLength ?? null
      return null
    },
  })

  // The disk cache lookup in freezeMediaUrl runs before the network call, so
  // give the fetch a few microtasks to show up instead of assuming it already
  // did.
  const resolveCall = async (
    predicate: (call: FetchCall) => boolean,
    opts: {
      etag?: string | null
      lastModified?: string | null
      contentLength?: string | null
    } = {}
  ) => {
    for (let attempt = 0; attempt < 20; attempt += 1) {
      const index = calls.findIndex(predicate)
      if (index !== -1) {
        const [entry] = calls.splice(index, 1)
        entry.resolve(opts)
        return
      }
      await Promise.resolve()
    }
    throw new Error("No matching fetch call")
  }

  const isDownloadCall = (call: FetchCall) => call.method === "GET"

  beforeEach(() => {
    jest.clearAllMocks()
    calls = []
    objectUrlCounter = 0
    currentTime = 0

    jest.spyOn(Date, "now").mockImplementation(() => currentTime)

    global.fetch = jest.fn((input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input)
      const headers = init?.headers as Record<string, string> | undefined
      const method = init?.method
        ? init.method
        : headers?.Range
          ? "RANGE-GET"
          : "GET"

      return new Promise((resolve, reject) => {
        calls.push({
          url,
          method,
          resolve: (opts) =>
            resolve({
              ok: opts.ok ?? true,
              status: opts.status ?? (method === "RANGE-GET" ? 206 : 200),
              headers: makeHeaders(opts),
              blob: async () => new Blob(["data"]),
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

    jest.spyOn(console, "error").mockImplementation(() => {})
    jest.spyOn(console, "warn").mockImplementation(() => {})

    mockedUseDispatch.mockReturnValue(dispatchMock)
    mockedUseSelector.mockImplementation((selector) =>
      selector({
        presentation: {
          name: "Test presentation",
          screenCount: 2,
          scores: [],
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
    Date.now = originalDateNow
    jest.restoreAllMocks()
  })

  test("skips re-downloading when revalidation finds matching validators", async () => {
    const { rerender } = render(
      <EditModeContainer
        {...baseProps}
        cues={[imageCue]}
        onEnterShow={jest.fn()}
      />
    )

    fireEvent.click(screen.getByText("Show mode"))
    await act(async () => {
      await resolveCall(isDownloadCall, { etag: "v1" })
    })
    expect(createObjectURLMock).toHaveBeenCalledTimes(1)

    // Advance past the revalidation throttle, then force freezeMediaUrl to
    // run again for the same (already-frozen) URL via the show-mode
    // lookahead effect -- entering show mode again would skip it outright
    // since it's already settled, so this is the only remaining path that
    // re-touches a cached URL.
    currentTime += 20000
    rerender(
      <EditModeContainer
        {...baseProps}
        cues={[imageCue]}
        isShowMode
        cueIndex={0}
        onEnterShow={jest.fn()}
      />
    )

    await waitFor(() =>
      expect(calls.some((call) => call.method === "RANGE-GET")).toBe(true)
    )
    await act(async () => {
      await resolveCall((call) => call.method === "RANGE-GET", { etag: "v1" })
    })

    // Validators matched -- the cached Blob is reused, no second download.
    expect(createObjectURLMock).toHaveBeenCalledTimes(1)
    expect(revokeObjectURLMock).not.toHaveBeenCalled()
  })

  test("re-downloads when revalidation finds the content changed under the same URL", async () => {
    const { rerender } = render(
      <EditModeContainer
        {...baseProps}
        cues={[imageCue]}
        onEnterShow={jest.fn()}
      />
    )

    fireEvent.click(screen.getByText("Show mode"))
    await act(async () => {
      await resolveCall(isDownloadCall, { etag: "v1" })
    })
    expect(createObjectURLMock).toHaveBeenCalledTimes(1)

    currentTime += 20000
    rerender(
      <EditModeContainer
        {...baseProps}
        cues={[imageCue]}
        isShowMode
        cueIndex={0}
        onEnterShow={jest.fn()}
      />
    )

    await waitFor(() =>
      expect(calls.some((call) => call.method === "RANGE-GET")).toBe(true)
    )
    await act(async () => {
      await resolveCall((call) => call.method === "RANGE-GET", { etag: "v2" })
    })

    // Stale Blob revoked and a fresh download kicked off automatically.
    await waitFor(() =>
      expect(revokeObjectURLMock).toHaveBeenCalledWith("blob:fake-0")
    )
    await waitFor(() => expect(calls.some(isDownloadCall)).toBe(true))

    await act(async () => {
      await resolveCall(isDownloadCall, { etag: "v2" })
    })

    expect(createObjectURLMock).toHaveBeenCalledTimes(2)
  })
})

/**
 * Frozen media is persisted to a CacheStorage bucket scoped to the
 * presentation, so it survives reloads and can be dropped wholesale when the
 * user moves on to another presentation.
 */
describe("EditModeContainer media disk cache", () => {
  const dispatchMock = jest.fn()
  const originalFetch = global.fetch

  const imageCue = {
    _id: "cue-image",
    index: 0,
    screen: 1,
    name: "Photo",
    cueType: "visual",
    file: {
      id: "media-1",
      type: "image/png",
      url: "https://example.com/photo.png",
    },
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

  let cacheNames: string[]
  let openMock: jest.Mock
  let deleteCacheMock: jest.Mock
  let putMock: jest.Mock
  let deleteEntryMock: jest.Mock
  let lastUsedStamps: Record<string, number>
  let cacheKeys: string[]
  let cachedMedia: Set<string>
  let cachedHeaders: Record<string, string>
  let revokeMock: jest.Mock

  beforeEach(() => {
    jest.clearAllMocks()
    cacheNames = []
    lastUsedStamps = {}
    cacheKeys = []
    cachedMedia = new Set()
    cachedHeaders = {}
    putMock = jest.fn(async () => undefined)
    deleteEntryMock = jest.fn(async () => true)
    openMock = jest.fn(async (name: string) => ({
      match: async (key: string) => {
        if (key === "/__muvico_last_used__") {
          const stamp = lastUsedStamps[name]
          return stamp === undefined
            ? undefined
            : { text: async () => String(stamp) }
        }
        return cachedMedia.has(key)
          ? {
              headers: {
                get: (header: string) => cachedHeaders[header] ?? null,
              },
              blob: async () => new Blob(["cached"]),
            }
          : undefined
      },
      keys: async () =>
        cacheKeys.map((path) => ({ url: `http://localhost${path}` })),
      put: putMock,
      delete: deleteEntryMock,
    }))
    deleteCacheMock = jest.fn(async () => true)
    ;(global as unknown as { caches: unknown }).caches = {
      open: openMock,
      keys: async () => cacheNames,
      delete: deleteCacheMock,
    }

    // jsdom ships neither CacheStorage nor Response; the production code
    // wraps the Blob in one before storing it.
    ;(global as unknown as { Response: unknown }).Response = class {
      constructor(public body: unknown) {}
      async text() {
        return String(this.body)
      }
    }

    global.fetch = jest.fn(async () => ({
      ok: true,
      status: 200,
      headers: { get: () => null },
      blob: async () => new Blob(["data"]),
    })) as unknown as typeof global.fetch

    revokeMock = jest.fn()
    global.URL.createObjectURL = (() =>
      "blob:fake") as unknown as typeof URL.createObjectURL
    global.URL.revokeObjectURL =
      revokeMock as unknown as typeof URL.revokeObjectURL

    mockedUseDispatch.mockReturnValue(dispatchMock)
    mockedUseSelector.mockImplementation((selector) =>
      selector({
        presentation: { name: "Test presentation", screenCount: 2 },
      })
    )
  })

  afterEach(() => {
    global.fetch = originalFetch
    delete (global as unknown as { caches?: unknown }).caches
    delete (global as unknown as { Response?: unknown }).Response
    jest.restoreAllMocks()
  })

  test("stores frozen media in a cache scoped to the presentation", async () => {
    render(
      <EditModeContainer
        {...baseProps}
        cues={[imageCue]}
        onEnterShow={jest.fn()}
      />
    )

    fireEvent.click(screen.getByText("Show mode"))

    await waitFor(() =>
      expect(
        putMock.mock.calls.some(
          ([key]) => key === "/__muvico_media_cache__/media-1"
        )
      ).toBe(true)
    )
    expect(openMock).toHaveBeenCalledWith("muvico-show-media-v1-presentation-1")
  })

  test("keeps the most recently used presentations and drops the rest", async () => {
    cacheNames = [
      "muvico-show-media-v1-presentation-1",
      "muvico-show-media-v1-recent",
      "muvico-show-media-v1-older",
      "muvico-show-media-v1-oldest",
      "some-unrelated-cache",
    ]
    lastUsedStamps = {
      "muvico-show-media-v1-recent": 3000,
      "muvico-show-media-v1-older": 2000,
      "muvico-show-media-v1-oldest": 1000,
    }

    render(
      <EditModeContainer
        {...baseProps}
        cues={[imageCue]}
        onEnterShow={jest.fn()}
      />
    )

    // Three presentations keep their media: the current one, plus the two
    // most recently used.
    await waitFor(() => expect(deleteCacheMock).toHaveBeenCalledTimes(1))
    const deleted = deleteCacheMock.mock.calls.map(([name]) => name)
    expect(deleted).toEqual(["muvico-show-media-v1-oldest"])
  })

  test("drops cached media that no cue references any more", async () => {
    cacheKeys = [
      "/__muvico_media_cache__/media-1",
      "/__muvico_media_cache__/removed-media",
      "/__muvico_last_used__",
    ]

    render(
      <EditModeContainer
        {...baseProps}
        cues={[imageCue]}
        onEnterShow={jest.fn()}
      />
    )

    await waitFor(() => expect(deleteEntryMock).toHaveBeenCalledTimes(1))
    expect(deleteEntryMock.mock.calls[0][0].url).toContain("removed-media")
  })

  test("keeps cached media when the cue list is momentarily empty", async () => {
    cacheKeys = ["/__muvico_media_cache__/media-1"]

    render(
      <EditModeContainer {...baseProps} cues={[]} onEnterShow={jest.fn()} />
    )

    await waitFor(() => expect(openMock).toHaveBeenCalled())
    expect(deleteEntryMock).not.toHaveBeenCalled()
  })

  test("serves media from the disk cache without touching the network", async () => {
    cachedMedia.add("/__muvico_media_cache__/media-1")
    const onEnterShow = jest.fn()

    render(
      <EditModeContainer
        {...baseProps}
        cues={[imageCue]}
        onEnterShow={onEnterShow}
      />
    )

    fireEvent.click(screen.getByText("Show mode"))

    await waitFor(() => expect(onEnterShow).toHaveBeenCalledTimes(1))
    expect(global.fetch).not.toHaveBeenCalled()
  })

  test("still preloads over the network when the disk cache is unavailable", async () => {
    // Private windows and a full storage quota both make caches.open throw.
    openMock.mockRejectedValue(new Error("quota exceeded"))
    jest.spyOn(console, "warn").mockImplementation(() => {})
    const onEnterShow = jest.fn()

    render(
      <EditModeContainer
        {...baseProps}
        cues={[imageCue]}
        onEnterShow={onEnterShow}
      />
    )

    fireEvent.click(screen.getByText("Show mode"))

    await waitFor(() => expect(onEnterShow).toHaveBeenCalledTimes(1))
    expect(global.fetch).toHaveBeenCalledTimes(1)
  })

  test("keeps media served from the disk cache alive through revalidation", async () => {
    // The stored response carries its validators, so revalidating it finds
    // the content unchanged. Losing them made the Blob look stale, and
    // revoking it left the popups pointing at a dead blob: URL.
    cachedMedia.add("/__muvico_media_cache__/media-1")
    cachedHeaders = { etag: "v1" }
    let now = 0
    jest.spyOn(Date, "now").mockImplementation(() => now)

    const { rerender } = render(
      <EditModeContainer
        {...baseProps}
        cues={[imageCue]}
        onEnterShow={jest.fn()}
      />
    )

    fireEvent.click(screen.getByText("Show mode"))
    await waitFor(() => expect(openMock).toHaveBeenCalled())

    // Past the revalidation throttle, then re-touch the media through the
    // show-mode lookahead.
    now += 20000
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
        cues={[imageCue]}
        isShowMode
        cueIndex={0}
        onEnterShow={jest.fn()}
      />
    )

    await act(async () => {
      await Promise.resolve()
    })
    expect(revokeMock).not.toHaveBeenCalled()
  })

  test("marks the presentation as recently used on entry", async () => {
    render(
      <EditModeContainer
        {...baseProps}
        cues={[imageCue]}
        onEnterShow={jest.fn()}
      />
    )

    await waitFor(() =>
      expect(
        putMock.mock.calls.some(([key]) => key === "/__muvico_last_used__")
      ).toBe(true)
    )
  })
})
