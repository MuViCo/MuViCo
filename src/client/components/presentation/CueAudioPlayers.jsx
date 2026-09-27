import React, { useEffect, useRef } from "react"

const CueAudioPlayer = ({
  src,
  loop,
  shouldAutoPlay,
  continuePlayback,
  allowContinuousAudio,
  playRequestToken,
}) => {
  const audioRef = useRef(null)
  const hasStartedRef = useRef(false)
  const lastPlayRequestRef = useRef(undefined)

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const isFreshPlayRequest =
      playRequestToken !== undefined &&
      playRequestToken !== lastPlayRequestRef.current
    lastPlayRequestRef.current = playRequestToken

    const shouldPlayNow = Boolean(src) && (shouldAutoPlay || isFreshPlayRequest)

    if (!shouldPlayNow) {
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
  }, [
    src,
    loop,
    shouldAutoPlay,
    continuePlayback,
    allowContinuousAudio,
    playRequestToken,
  ])

  if (!src) return null
  return (
    <audio ref={audioRef} loop={loop} src={src} preload="metadata" hidden />
  )
}

const CueAudioPlayers = ({
  tracks,
  shouldAutoPlay,
  allowContinuousAudio,
  playRequest,
}) =>
  tracks.map((track, trackIndex) => (
    <CueAudioPlayer
      key={track.id || `${track.src}-${trackIndex}`}
      src={track.src}
      loop={Boolean(track.loop)}
      shouldAutoPlay={shouldAutoPlay}
      continuePlayback={Boolean(track.continuePlayback)}
      allowContinuousAudio={allowContinuousAudio}
      playRequestToken={
        playRequest && playRequest.trackId === track.id
          ? playRequest.token
          : undefined
      }
    />
  ))

export default CueAudioPlayers
