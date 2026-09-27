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

  test("does not manually start a track that has no play request", () => {
    render(
      <CueAudioPlayers
        tracks={[track()]}
        shouldAutoPlay={false}
        playRequest={{ trackId: "some-other-track", token: 1 }}
      />
    )

    expect(playSpy).not.toHaveBeenCalled()
  })

  test("plays a track when it is manually requested, even with auto-play off", () => {
    render(
      <CueAudioPlayers
        tracks={[track()]}
        shouldAutoPlay={false}
        playRequest={{ trackId: "track-1", token: 1 }}
      />
    )

    expect(playSpy).toHaveBeenCalledTimes(1)
  })

  test("plays again when the same track is manually requested a second time", () => {
    const { rerender } = render(
      <CueAudioPlayers
        tracks={[track()]}
        shouldAutoPlay={false}
        playRequest={{ trackId: "track-1", token: 1 }}
      />
    )
    expect(playSpy).toHaveBeenCalledTimes(1)

    rerender(
      <CueAudioPlayers
        tracks={[track()]}
        shouldAutoPlay={false}
        playRequest={{ trackId: "track-1", token: 2 }}
      />
    )

    expect(playSpy).toHaveBeenCalledTimes(2)
  })

  test("a repeated render with the same request token does not replay the track", () => {
    const { rerender } = render(
      <CueAudioPlayers
        tracks={[track()]}
        shouldAutoPlay={false}
        playRequest={{ trackId: "track-1", token: 1 }}
      />
    )
    expect(playSpy).toHaveBeenCalledTimes(1)

    rerender(
      <CueAudioPlayers
        tracks={[track({ loop: true })]}
        shouldAutoPlay={false}
        playRequest={{ trackId: "track-1", token: 1 }}
      />
    )

    expect(playSpy).toHaveBeenCalledTimes(1)
  })

  test("a request for a different track does not start this one", () => {
    render(
      <CueAudioPlayers
        tracks={[track({ id: "a" }), track({ id: "b" })]}
        shouldAutoPlay={false}
        playRequest={{ trackId: "b", token: 1 }}
      />
    )

    expect(playSpy).toHaveBeenCalledTimes(1)
  })

  test("does not crash for a track with no id when there is no play request", () => {
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
