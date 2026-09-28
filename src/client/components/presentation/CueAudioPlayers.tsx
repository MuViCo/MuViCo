import { useEffect, useRef } from "react"

export interface AudioTrack {
  id?: string
  src: string
  loop: boolean
  continuePlayback?: boolean
  layer?: number
  name?: string
}

interface CueAudioPlayerProps {
  src: string
  loop: boolean
  shouldPlay: boolean
  continuePlayback: boolean
  allowContinuousAudio: boolean
}

const CueAudioPlayer = ({
  src,
  loop,
  shouldPlay,
  continuePlayback,
  allowContinuousAudio,
}: CueAudioPlayerProps) => {
  const audioRef = useRef<HTMLAudioElement | null>(null)
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

interface CueAudioPlayersProps {
  tracks: AudioTrack[]
  shouldAutoPlay: boolean
  allowContinuousAudio: boolean
  manuallyPlayingTrackIds?: Record<string, boolean>
}

const CueAudioPlayers = ({
  tracks,
  shouldAutoPlay,
  allowContinuousAudio,
  manuallyPlayingTrackIds,
}: CueAudioPlayersProps) =>
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
