/**
 * Regression tests for the show-mode media preload gate: clicking "Show
 * mode" used to navigate immediately, so secondary screen windows could open
 * before their images/videos were cached, showing blank/broken media.
 *
 * EditModeContainer now preloads every visual cue's media and blocks
 * `onEnterShow` behind a loading overlay until all of it has resolved.
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

// Controllable stand-in for the global Image constructor: preloadVisualUrl
// waits on `onload`/`onerror`, and jsdom never fires either on its own.
class FakeImage {
  onload: (() => void) | null = null
  onerror: (() => void) | null = null
  src = ""
  static instances: FakeImage[] = []

  constructor() {
    FakeImage.instances.push(this)
  }
}

describe("EditModeContainer show mode media preload gate", () => {
  const dispatchMock = jest.fn()
  const originalCreateElement = document.createElement.bind(document)
  // Real <video> elements (not fakes): preloadVisualUrl must attach them to
  // the document for browsers to actually buffer their src, so the test
  // needs a genuine Node it can check document.body for. jsdom doesn't fire
  // `oncanplaythrough`/`onerror` on its own, so the test still triggers
  // those handlers manually.
  let videoInstances: HTMLVideoElement[]
  let createElementSpy: jest.SpyInstance

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

  beforeEach(() => {
    jest.clearAllMocks()
    FakeImage.instances = []
    videoInstances = []
    ;(global as unknown as { Image: unknown }).Image = FakeImage

    createElementSpy = jest
      .spyOn(document, "createElement")
      .mockImplementation((tagName: string) => {
        const el = originalCreateElement(tagName)
        if (tagName === "video") {
          // jsdom doesn't implement media loading, so stub `load` to avoid
          // its "Not implemented" console noise, then hand back the real
          // element so DOM-attachment assertions are meaningful.
          ;(el as HTMLVideoElement).load = jest.fn()
          videoInstances.push(el as HTMLVideoElement)
        }
        return el
      })

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
    createElementSpy.mockRestore()
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

  test("blocks show mode behind a loading overlay until every image/video preloads", async () => {
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

    expect(FakeImage.instances).toHaveLength(1)
    expect(videoInstances).toHaveLength(1)
    // Detached <video> elements aren't reliably buffered by every browser
    // engine (Safari in particular), so the preload element must be
    // attached to the document while it loads.
    expect(document.body.contains(videoInstances[0])).toBe(true)

    await act(async () => {
      FakeImage.instances[0].onload?.()
    })
    await waitFor(() =>
      expect(screen.getByText("1/2 médias chargés")).toBeInTheDocument()
    )

    await act(async () => {
      videoInstances[0].oncanplaythrough?.(new Event("canplaythrough"))
    })

    await waitFor(() => expect(onEnterShow).toHaveBeenCalledTimes(1))
    expect(screen.queryByText(/Préparation du show/)).not.toBeInTheDocument()
    // Resolved preload elements are cleaned up, not leaked in the DOM.
    expect(document.body.contains(videoInstances[0])).toBe(false)
  })

  test("removes the preload video element from the DOM on error too", async () => {
    render(
      <EditModeContainer
        {...baseProps}
        cues={[videoCue]}
        onEnterShow={jest.fn()}
      />
    )

    expect(videoInstances).toHaveLength(1)
    expect(document.body.contains(videoInstances[0])).toBe(true)

    await act(async () => {
      videoInstances[0].onerror?.(new Event("error"))
    })

    expect(document.body.contains(videoInstances[0])).toBe(false)
  })

  test("removes any outstanding preload video elements on unmount", () => {
    const { unmount } = render(
      <EditModeContainer
        {...baseProps}
        cues={[videoCue]}
        onEnterShow={jest.fn()}
      />
    )

    expect(videoInstances).toHaveLength(1)
    expect(document.body.contains(videoInstances[0])).toBe(true)

    unmount()

    expect(document.body.contains(videoInstances[0])).toBe(false)
  })

  test("skips the overlay once media has already been preloaded in the background", () => {
    const onEnterShow = jest.fn()
    render(
      <EditModeContainer
        {...baseProps}
        cues={[imageCue]}
        onEnterShow={onEnterShow}
      />
    )

    // The passive preload effect (running since cues were loaded) already
    // created the Image; resolve it before entering show mode.
    act(() => {
      FakeImage.instances[0].onload?.()
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

    expect(FakeImage.instances).toHaveLength(2)
    expect(FakeImage.instances[0].src).toBe("https://example.com/back.png")
    expect(FakeImage.instances[1].src).toBe("https://example.com/front.png")
  })
})
