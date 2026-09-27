import { render } from "@testing-library/react"
import "@testing-library/jest-dom"
import CueAudioPlayers from "../../components/presentation/CueAudioPlayers"

const track = (overrides = {}) => ({
  id: "track-1",
  src: "https://example.com/track.mp3",
  loop: false,
  continuePlayback: false,
  ...overrides,
})

describe("CueAudioPlayers", () => {
  let playSpy
  let pauseSpy

  beforeEach(() => {
    playSpy = jest
      .spyOn(window.HTMLMediaElement.prototype, "play")
      .mockResolvedValue(undefined)
    pauseSpy = jest
      .spyOn(window.HTMLMediaElement.prototype, "pause")
      .mockImplementation(() => {})
  })

  afterEach(() => {
    playSpy.mockRestore()
    pauseSpy.mockRestore()
  })

  test("plays a track when shouldAutoPlay is on", () => {
    render(<CueAudioPlayers tracks={[track()]} shouldAutoPlay />)

    expect(playSpy).toHaveBeenCalledTimes(1)
  })

  test("does not play a track when shouldAutoPlay is off and nothing was requested", () => {
    render(<CueAudioPlayers tracks={[track()]} shouldAutoPlay={false} />)

    expect(playSpy).not.toHaveBeenCalled()
  })

  test("renders nothing for a track with no source", () => {
    const { container } = render(
      <CueAudioPlayers tracks={[track({ src: undefined })]} shouldAutoPlay />
    )

    expect(container.querySelector("audio")).toBeNull()
    expect(playSpy).not.toHaveBeenCalled()
  })

  test("plays every current track, each with its own element", () => {
    render(
      <CueAudioPlayers
        tracks={[
          track({ id: "a", src: "https://example.com/a.mp3" }),
          track({ id: "b", src: "https://example.com/b.mp3" }),
        ]}
        shouldAutoPlay
      />
    )

    expect(playSpy).toHaveBeenCalledTimes(2)
  })

  test("sets the loop attribute from the track", () => {
    const { container } = render(
      <CueAudioPlayers tracks={[track({ loop: true })]} shouldAutoPlay />
    )

    expect(container.querySelector("audio")).toHaveAttribute("loop")
  })

  test("removes the audio element once its track is no longer current", () => {
    const { container, rerender } = render(
      <CueAudioPlayers tracks={[track()]} shouldAutoPlay />
    )
    expect(container.querySelector("audio")).not.toBeNull()

    rerender(<CueAudioPlayers tracks={[]} shouldAutoPlay />)

    expect(container.querySelector("audio")).toBeNull()
  })

  test("keeps a looping track playing once shouldAutoPlay turns off, once started", () => {
    const { rerender } = render(
      <CueAudioPlayers
        tracks={[track({ loop: true })]}
        shouldAutoPlay
        allowContinuousAudio
      />
    )
    expect(playSpy).toHaveBeenCalledTimes(1)

    rerender(
      <CueAudioPlayers
        tracks={[track({ loop: true })]}
        shouldAutoPlay={false}
        allowContinuousAudio
      />
    )

    expect(pauseSpy).not.toHaveBeenCalled()
  })

  test("does not manually start a track that is not in the manually-playing set", () => {
    render(
      <CueAudioPlayers
        tracks={[track()]}
        shouldAutoPlay={false}
        manuallyPlayingTrackIds={{ "some-other-track": true }}
      />
    )

    expect(playSpy).not.toHaveBeenCalled()
  })

  test("plays a track that is manually toggled on, even with auto-play off", () => {
    render(
      <CueAudioPlayers
        tracks={[track()]}
        shouldAutoPlay={false}
        manuallyPlayingTrackIds={{ "track-1": true }}
      />
    )

    expect(playSpy).toHaveBeenCalledTimes(1)
  })

  test("pauses a manually playing track when it is toggled off", () => {
    const { rerender } = render(
      <CueAudioPlayers
        tracks={[track()]}
        shouldAutoPlay={false}
        manuallyPlayingTrackIds={{ "track-1": true }}
      />
    )
    expect(playSpy).toHaveBeenCalledTimes(1)

    rerender(
      <CueAudioPlayers
        tracks={[track()]}
        shouldAutoPlay={false}
        manuallyPlayingTrackIds={{ "track-1": false }}
      />
    )

    expect(pauseSpy).toHaveBeenCalledTimes(1)
  })

  test("toggling a track back on plays it again", () => {
    const { rerender } = render(
      <CueAudioPlayers
        tracks={[track()]}
        shouldAutoPlay={false}
        manuallyPlayingTrackIds={{ "track-1": true }}
      />
    )
    rerender(
      <CueAudioPlayers
        tracks={[track()]}
        shouldAutoPlay={false}
        manuallyPlayingTrackIds={{ "track-1": false }}
      />
    )
    expect(playSpy).toHaveBeenCalledTimes(1)

    rerender(
      <CueAudioPlayers
        tracks={[track()]}
        shouldAutoPlay={false}
        manuallyPlayingTrackIds={{ "track-1": true }}
      />
    )

    expect(playSpy).toHaveBeenCalledTimes(2)
  })

  test("a different track being manually on does not start this one", () => {
    render(
      <CueAudioPlayers
        tracks={[track({ id: "a" }), track({ id: "b" })]}
        shouldAutoPlay={false}
        manuallyPlayingTrackIds={{ b: true }}
      />
    )

    expect(playSpy).toHaveBeenCalledTimes(1)
  })

  test("manually playing a second track does not pause a track already playing", () => {
    const { rerender } = render(
      <CueAudioPlayers
        tracks={[track({ id: "a" }), track({ id: "b" })]}
        shouldAutoPlay={false}
        manuallyPlayingTrackIds={{ a: true }}
      />
    )
    expect(playSpy).toHaveBeenCalledTimes(1)
    const pauseCallsBeforeSecondRequest = pauseSpy.mock.calls.length

    rerender(
      <CueAudioPlayers
        tracks={[track({ id: "a" }), track({ id: "b" })]}
        shouldAutoPlay={false}
        manuallyPlayingTrackIds={{ a: true, b: true }}
      />
    )

    expect(playSpy).toHaveBeenCalledTimes(2)
    expect(pauseSpy.mock.calls.length).toBe(pauseCallsBeforeSecondRequest)
  })

  test("pausing one track does not stop another that is still manually on", () => {
    const { rerender } = render(
      <CueAudioPlayers
        tracks={[track({ id: "a" }), track({ id: "b" })]}
        shouldAutoPlay={false}
        manuallyPlayingTrackIds={{ a: true, b: true }}
      />
    )
    expect(playSpy).toHaveBeenCalledTimes(2)

    rerender(
      <CueAudioPlayers
        tracks={[track({ id: "a" }), track({ id: "b" })]}
        shouldAutoPlay={false}
        manuallyPlayingTrackIds={{ a: false, b: true }}
      />
    )

    expect(pauseSpy).toHaveBeenCalledTimes(1)
  })

  test("does not crash for a track with no id when nothing is manually playing", () => {
    expect(() =>
      render(
        <CueAudioPlayers
          tracks={[track({ id: undefined })]}
          shouldAutoPlay={false}
        />
      )
    ).not.toThrow()
    expect(playSpy).not.toHaveBeenCalled()
  })
})
