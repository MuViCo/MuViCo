import React, { useEffect, useRef } from "react"

const CueAudioPlayer = ({
  src,
  loop,
  shouldPlay,
  continuePlayback,
  allowContinuousAudio,
}) => {
  const audioRef = useRef(null)
  const hasStartedRef = useRef(false)

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    if (!shouldPlay) {
      if (
        (loop || continuePlayback) &&
        allowContinuousAudio &&
        hasStartedRef.current
      ) {
        return
      }
      audio.pause()
      return
    }

    const playPromise = audio.play()
    hasStartedRef.current = true
    if (playPromise?.catch) playPromise.catch(() => {})
  }, [src, loop, shouldPlay, continuePlayback, allowContinuousAudio])

  if (!src) return null
  return (
    <audio ref={audioRef} loop={loop} src={src} preload="metadata" hidden />
  )
}

const CueAudioPlayers = ({
  tracks,
  shouldAutoPlay,
  allowContinuousAudio,
  manuallyPlayingTrackIds,
}) =>
  tracks.map((track, trackIndex) => (
    <CueAudioPlayer
      key={track.id || `${track.src}-${trackIndex}`}
      src={track.src}
      loop={Boolean(track.loop)}
      shouldPlay={
        Boolean(track.src) &&
        (shouldAutoPlay || Boolean(manuallyPlayingTrackIds?.[track.id]))
      }
      continuePlayback={Boolean(track.continuePlayback)}
      allowContinuousAudio={allowContinuousAudio}
    />
  ))

export default CueAudioPlayers
