/**
 * presentation playback controls used in both presentation navigation and autoplay
 * Includes:
 * - Cue navigation buttons (previous/next)
 * - Autoplay toggle button
 * - Autoplay interval input
 * - Open/close all screens button
 * - Keyboard shortcuts popover
 * - Autoplay instructions popover
 * - Audio player (if audio source URL is provided)
 */
import ClickablePopover from "../utils/ClickablePopover"

import {
  Button,
  Box,
  IconButton,
  Heading,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Text,
  Tooltip,
} from "@chakra-ui/react"
import { ArrowBackIcon, ArrowForwardIcon } from "@chakra-ui/icons"
import pausebutton from "../../public/icons/pausebutton.svg"
import playbutton from "../../public/icons/playbutton.svg"
import { SpeakerIcon } from "../../lib/icons"
import CueAudioPlayers from "./CueAudioPlayers"
import type { AudioTrack } from "./CueAudioPlayers"

interface AutoplayControlsProps {
  toggleAutoplay: () => void
  isAutoplaying: boolean
}

// autoplay controls component used in both presentation navigation and autoplay
const AutoplayControls = ({
  toggleAutoplay,
  isAutoplaying,
}: AutoplayControlsProps) => {
  return (
    <Box display="flex" alignItems="center">
      <IconButton
        aria-label={isAutoplaying ? "Stop Autoplay" : "Start Autoplay"}
        onClick={toggleAutoplay}
        p={0}
        className={`show-mode-autoplay-btn ${isAutoplaying ? "show-mode-autoplay-btn-stop" : "show-mode-autoplay-btn-start"}`}
        icon={
          <img
            src={isAutoplaying ? pausebutton : playbutton}
            alt=""
            width="35"
            height="35"
            aria-hidden="true"
          />
        }
      />
    </Box>
  )
}

interface AutoplayIntervalProps {
  autoplayInterval: number
  toggleAutoplayInterval: (value: string) => void
}

// Component for adjusting autoplay interval (seconds per frame)
const AutoplayInterval = ({
  autoplayInterval,
  toggleAutoplayInterval,
}: AutoplayIntervalProps) => (
  <Box className="transport-interval" display="flex" alignItems="center">
    <Text className="transport-label">Auto</Text>
    <NumberInput
      id="autoplaytime"
      value={autoplayInterval}
      width="76px"
      size="sm"
      onChange={(valueString) => toggleAutoplayInterval(valueString)}
      min={0.1}
      step={0.1}
    >
      <NumberInputField placeholder="sec" />
      <NumberInputStepper>
        <NumberIncrementStepper />
        <NumberDecrementStepper />
      </NumberInputStepper>
    </NumberInput>
    <Text className="transport-interval-unit">sec/frame</Text>
  </Box>
)

interface ScreenToggleButtonsProps {
  screens: Record<string, boolean>
  toggleAllScreens: () => void
}

// Component for toggling all screens open/closed
const ScreenToggleButtons = ({
  screens,
  toggleAllScreens,
}: ScreenToggleButtonsProps) => {
  const allScreenNumbers = Object.keys(screens)

  const hasOpenScreen = allScreenNumbers.some(
    (screenNumber) => screens[screenNumber]
  )

  return (
    <Box display="flex" flexDirection="row" alignItems="center" gap={2}>
      <Button
        onClick={toggleAllScreens}
        size="sm"
        variant="muvico-secondary"
        id="open-all-screens-button"
        className="show-mode-open-all-btn"
        leftIcon={
          <Box
            className={
              hasOpenScreen ? "screen-status-open" : "screen-status-closed"
            }
          />
        }
      >
        {hasOpenScreen ? "Close all screens" : "Open all screens"}
      </Button>
    </Box>
  )
}

type UpdateCue = (direction: "Next" | "Previous") => void

interface CueNavigationPreviousProps {
  cueIndex: number
  updateCue: UpdateCue
}

// Component for cue navigation buttons (previous/next)
const CueNavigationPrevious = ({
  cueIndex,
  updateCue,
}: CueNavigationPreviousProps) => (
  <IconButton
    aria-label="Previous Cue"
    icon={<ArrowBackIcon boxSize={5} />}
    className="show-mode-nav-btn show-mode-nav-btn-secondary"
    onClick={() => updateCue("Previous")}
    isDisabled={cueIndex === 0}
  />
)

interface CueNavigationNextProps {
  cueIndex: number
  updateCue: UpdateCue
  indexCount: number
}

// Component for cue navigation buttons (previous/next)
const CueNavigationNext = ({
  cueIndex,
  updateCue,
  indexCount,
}: CueNavigationNextProps) => (
  <IconButton
    aria-label="Next Cue"
    icon={<ArrowForwardIcon boxSize={5} />}
    className="show-mode-nav-btn show-mode-nav-btn-secondary"
    onClick={() => updateCue("Next")}
    isDisabled={cueIndex === indexCount - 1}
  />
)

const getTrackLabel = (track: AudioTrack, index: number) => {
  if (track.name) return track.name
  const sourceName = String(track.src || "")
    .split("?")[0]
    .split("/")
    .pop()
  return sourceName || `Audio ${index + 1}`
}

interface AudioTrackStatusProps {
  tracks: AudioTrack[]
  isAutoplaying: boolean
}

const AudioTrackStatus = ({ tracks, isAutoplaying }: AudioTrackStatusProps) => {
  if (tracks.length === 0) return null

  return (
    <Box
      className="transport-audio-status"
      role="group"
      aria-label="Active audio tracks"
    >
      <SpeakerIcon className="transport-audio-icon" />
      <Box className="transport-audio-tracks">
        {tracks.map((track, index) => {
          const label = getTrackLabel(track, index)
          return (
            <Tooltip key={track.id || `${track.src}-${index}`} label={label}>
              <Box className="transport-audio-track">
                <Text className="transport-audio-name">{label}</Text>
                {track.loop && (
                  <Text className="transport-audio-loop">loop</Text>
                )}
              </Box>
            </Tooltip>
          )
        })}
      </Box>
      <Box
        className={isAutoplaying ? "audio-state-playing" : "audio-state-ready"}
        aria-label={isAutoplaying ? "Audio playing" : "Audio ready"}
      />
    </Box>
  )
}

interface PresentationPlaybackControlsProps {
  screens: Record<string, boolean>
  toggleAllScreens: () => void
  cueIndex: number
  updateCue: UpdateCue
  indexCount: number
  autoplayInterval: number
  toggleAutoplay: () => void
  isAutoplaying: boolean
  toggleAutoplayInterval: (value: string) => void
  audioSourceURL?: string
  audioLoop?: boolean
  audioTracks?: AudioTrack[]
  allowContinuousAudio?: boolean
  renderAudioPlayers?: boolean
}

// Shared playback controls for presentation navigation and autoplay.
const PresentationPlaybackControls = ({
  screens,
  toggleAllScreens,
  cueIndex,
  updateCue,
  indexCount,
  autoplayInterval,
  toggleAutoplay,
  isAutoplaying,
  toggleAutoplayInterval,
  audioSourceURL,
  audioLoop = false,
  audioTracks = [],
  allowContinuousAudio = false,
  renderAudioPlayers = true,
}: PresentationPlaybackControlsProps) => {
  const resolvedAudioTracks =
    audioTracks.length > 0
      ? audioTracks
      : audioSourceURL
        ? [
            {
              id: audioSourceURL,
              src: audioSourceURL,
              loop: audioLoop,
              continuePlayback: false,
            },
          ]
        : []

  return (
    <Box
      className="presentation-transport"
      display="flex"
      alignItems="center"
      width="100%"
    >
      <Box
        id="presentation-frame-navigation"
        display="flex"
        alignItems="center"
        className="transport-navigation"
      >
        <CueNavigationPrevious cueIndex={cueIndex} updateCue={updateCue} />
        <AutoplayControls
          toggleAutoplay={toggleAutoplay}
          isAutoplaying={isAutoplaying}
        />
        <CueNavigationNext
          cueIndex={cueIndex}
          updateCue={updateCue}
          indexCount={indexCount}
        />
        <Box className="transport-divider" />
        <Box className="transport-frame-label">
          <Heading as="h2" size="sm" whiteSpace="nowrap">
            {cueIndex > 0 ? `Frame ${cueIndex}` : "Frame 0"}
          </Heading>
          <Text className="transport-frame-total">/ {indexCount}</Text>
        </Box>
      </Box>
      <Box className="transport-secondary-controls">
        <AutoplayInterval
          autoplayInterval={autoplayInterval}
          toggleAutoplayInterval={toggleAutoplayInterval}
        />
        <ScreenToggleButtons
          screens={screens}
          toggleAllScreens={toggleAllScreens}
        />
      </Box>
      <AudioTrackStatus
        tracks={resolvedAudioTracks.filter((track) => track.src)}
        isAutoplaying={isAutoplaying}
      />
      {renderAudioPlayers && (
        <CueAudioPlayers
          tracks={resolvedAudioTracks}
          shouldAutoPlay={isAutoplaying}
          allowContinuousAudio={allowContinuousAudio}
        />
      )}
    </Box>
  )
}

export default PresentationPlaybackControls
