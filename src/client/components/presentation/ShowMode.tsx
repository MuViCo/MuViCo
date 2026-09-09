import {
  Box,
  Button,
  HStack,
  Icon,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Text,
} from "@chakra-ui/react"
import {
  FiBookOpen,
  FiChevronDown,
  FiGrid,
  FiMonitor,
  FiSkipBack,
} from "react-icons/fi"
import { useCallback, useEffect, useMemo, useState } from "react"
import type { Dispatch, SetStateAction } from "react"
import type { Cue, ScoreDocument } from "../../types"
import KeyboardHandler from "../utils/keyboardHandler"
import ShowMonitorWindow from "./ShowMonitorWindow"
import ShowScoreViewer from "./ShowScoreViewer"
import ShowScreenPreview from "./ShowScreenPreview"

type ShowView = "music" | "control"
type MonitorView = "score" | "wall" | null
type PageMode = "two" | "scroll"

interface AudioTrack {
  id: string
  name: string
  layer: number
  loop: boolean
  continuePlayback: boolean
}

interface ShowModeProps {
  presentationName: string
  screenCount: number
  scores: ScoreDocument[]
  cueIndex: number
  indexCount: number
  screens: Record<string, boolean>
  audioTracks: AudioTrack[]
  autoplayInterval: number
  isAutoplaying: boolean
  isBlackout: boolean
  getActiveCuesForScreen: (screenNumber: number, index: number) => Cue[]
  onSetCueIndex: Dispatch<SetStateAction<number>>
  onPrevious: () => void
  onNext: () => void
  onToggleAutoplay: () => void
  onToggleBlackout: () => void
  onToggleScreen: (screenNumber: number) => void
  onExit: () => void
}

const formatDuration = (seconds: number) => {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const remaining = seconds % 60
  return [hours, minutes, remaining]
    .map((part) => String(part).padStart(2, "0"))
    .join(":")
}

const cueStackKey = (cues: Cue[]) =>
  cues
    .map(
      (cue) =>
        `${cue._id}:${cue.index}:${cue.layer}:${cue.opacity}:${cue.file?.url ?? cue.color}`
    )
    .join("|")

const ShowCueList = ({
  cueIndex,
  indexCount,
  scores,
  onSelect,
}: {
  cueIndex: number
  indexCount: number
  scores: ScoreDocument[]
  onSelect: (index: number) => void
}) => {
  const markedFrames = new Set(
    scores.flatMap((score) => score.markers.map((marker) => marker.frameIndex))
  )

  return (
    <Box className="show-cue-list" role="list" aria-label="Cue list">
      {Array.from({ length: indexCount }, (_, index) => {
        const state =
          index === cueIndex
            ? "live"
            : index === Math.min(cueIndex + 1, indexCount - 1)
              ? "next"
              : "idle"
        return (
          <Button
            key={index}
            className="show-cue-chip"
            data-state={state}
            aria-label={`Go to frame ${index}`}
            onClick={() => onSelect(index)}
          >
            {index}
            {markedFrames.has(index) && <Box className="show-cue-marker-dot" />}
          </Button>
        )
      })}
    </Box>
  )
}

const ShowAudioStrip = ({ tracks }: { tracks: AudioTrack[] }) => (
  <Box className="show-audio-strip" aria-label="Active audio tracks">
    <Text className="show-section-label">Audio</Text>
    {tracks.length ? (
      tracks.map((track) => (
        <Box key={track.id} className="show-audio-track">
          <Box className="show-audio-meter">
            <Box />
            <Box />
            <Box />
            <Box />
          </Box>
          <Text title={track.name}>{track.name}</Text>
          <Text as="span">A{track.layer + 1}</Text>
          {track.loop && <Text as="span">Loop</Text>}
        </Box>
      ))
    ) : (
      <Text className="show-muted">No active audio</Text>
    )}
  </Box>
)

const ShowScreenWall = ({
  screenCount,
  screens,
  cueIndex,
  getActiveCuesForScreen,
  onToggleScreen,
}: Pick<
  ShowModeProps,
  | "screenCount"
  | "screens"
  | "cueIndex"
  | "getActiveCuesForScreen"
  | "onToggleScreen"
>) => (
  <Box className="show-screen-wall">
    {Array.from({ length: screenCount }, (_, index) => {
      const screenNumber = index + 1
      return (
        <ShowScreenPreview
          key={screenNumber}
          screenNumber={screenNumber}
          cues={getActiveCuesForScreen(screenNumber, cueIndex)}
          isOnline={Boolean(screens[screenNumber])}
          onOpen={() => onToggleScreen(screenNumber)}
        />
      )
    })}
  </Box>
)

const ShowTransport = ({
  cueIndex,
  indexCount,
  nextChanges,
  scores,
  isAutoplaying,
  isBlackout,
  autoplayInterval,
  onPrevious,
  onNext,
  onSelect,
  onToggleAutoplay,
  onToggleBlackout,
  large,
}: {
  cueIndex: number
  indexCount: number
  nextChanges: number[]
  scores: ScoreDocument[]
  isAutoplaying: boolean
  isBlackout: boolean
  autoplayInterval: number
  onPrevious: () => void
  onNext: () => void
  onSelect: (index: number) => void
  onToggleAutoplay: () => void
  onToggleBlackout: () => void
  large?: boolean
}) => (
  <Box className={`show-transport ${large ? "show-transport-large" : ""}`}>
    <Button
      className="show-previous"
      aria-label="Previous frame"
      isDisabled={cueIndex <= 0}
      onClick={onPrevious}
    >
      <Icon as={FiSkipBack} />
    </Button>
    <Button
      className="show-go"
      isDisabled={cueIndex >= indexCount - 1}
      onClick={onNext}
    >
      GO
      {large && cueIndex < indexCount - 1 && (
        <Text as="span">Frame {cueIndex + 1}</Text>
      )}
    </Button>
    {!large && (
      <Box className="show-next-change">
        <Text>Frame {Math.min(cueIndex + 1, indexCount - 1)} will change</Text>
        <Text>
          {nextChanges.length
            ? nextChanges.map((screen) => `Display ${screen}`).join(" · ")
            : "No display changes"}
        </Text>
      </Box>
    )}
    <ShowCueList
      cueIndex={cueIndex}
      indexCount={indexCount}
      scores={scores}
      onSelect={onSelect}
    />
    <Button
      className="show-auto"
      data-active={isAutoplaying}
      onClick={onToggleAutoplay}
    >
      Auto {isAutoplaying ? "on" : "off"} · {autoplayInterval}s
    </Button>
    <Button
      className="show-blackout"
      data-active={isBlackout}
      onClick={onToggleBlackout}
    >
      Blackout{isBlackout ? " on" : ""}
    </Button>
  </Box>
)

const ShowMode = ({
  presentationName,
  screenCount,
  scores,
  cueIndex,
  indexCount,
  screens,
  audioTracks,
  autoplayInterval,
  isAutoplaying,
  isBlackout,
  getActiveCuesForScreen,
  onSetCueIndex,
  onPrevious,
  onNext,
  onToggleAutoplay,
  onToggleBlackout,
  onToggleScreen,
  onExit,
}: ShowModeProps) => {
  const [view, setView] = useState<ShowView>("music")
  const [pageMode, setPageMode] = useState<PageMode>("two")
  const [autoPageTurn, setAutoPageTurn] = useState(true)
  const [monitorView, setMonitorView] = useState<MonitorView>(null)
  const [elapsed, setElapsed] = useState(0)
  const [clock, setClock] = useState(() => new Date())
  const selectedScore = scores[0] ?? null
  const onlineCount = Object.values(screens).filter(Boolean).length
  const nextIndex = Math.min(cueIndex + 1, Math.max(indexCount - 1, 0))

  useEffect(() => {
    const timer = window.setInterval(() => {
      setElapsed((value) => value + 1)
      setClock(new Date())
    }, 1000)
    return () => window.clearInterval(timer)
  }, [])

  const nextChanges = useMemo(
    () =>
      Array.from({ length: screenCount }, (_, index) => index + 1).filter(
        (screenNumber) =>
          cueStackKey(getActiveCuesForScreen(screenNumber, cueIndex)) !==
          cueStackKey(getActiveCuesForScreen(screenNumber, nextIndex))
      ),
    [cueIndex, getActiveCuesForScreen, nextIndex, screenCount]
  )

  const closeMonitor = useCallback(() => setMonitorView(null), [])

  return (
    <Box className="show-mode-shell">
      <KeyboardHandler
        onNext={onNext}
        onPrevious={onPrevious}
        onTogglePlay={onToggleAutoplay}
      />
      <Box className="show-topbar">
        <Box className="show-badge">
          <Box />
          SHOW
        </Box>
        <Text className="show-title">{presentationName}</Text>
        <Box className="show-divider" />
        <Box className="show-clock-group">
          <Text>Elapsed</Text>
          <Text style={{ fontVariantNumeric: "tabular-nums" }}>
            {formatDuration(elapsed)}
          </Text>
        </Box>
        <Text
          className="show-wall-clock"
          style={{ fontVariantNumeric: "tabular-nums" }}
        >
          {clock.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
          })}
        </Text>
        <Box flex="1" />
        <Box className="show-segmented show-view-switch">
          <Button
            data-active={view === "music"}
            onClick={() => setView("music")}
          >
            <Icon as={FiBookOpen} /> Music stand
          </Button>
          <Button
            data-active={view === "control"}
            onClick={() => setView("control")}
          >
            <Icon as={FiGrid} /> Control room
          </Button>
        </Box>
        <Menu>
          <MenuButton
            as={Button}
            className="show-monitor-button"
            data-active={Boolean(monitorView)}
            leftIcon={<Icon as={FiMonitor} />}
            rightIcon={<Icon as={FiChevronDown} />}
          >
            {monitorView ? "Monitor live" : "Monitor"}
          </MenuButton>
          <MenuList className="show-monitor-menu">
            <MenuItem onClick={() => setMonitorView("score")}>
              Score only
            </MenuItem>
            <MenuItem onClick={() => setMonitorView("wall")}>
              Screen wall
            </MenuItem>
            {monitorView && (
              <MenuItem onClick={closeMonitor}>Close monitor</MenuItem>
            )}
          </MenuList>
        </Menu>
        <Box className="show-display-status">
          <Box
            className={`show-online-dot ${onlineCount ? "is-online" : ""}`}
          />
          <Text>
            {onlineCount} / {screenCount} displays online
          </Text>
        </Box>
        {isBlackout && (
          <Box className="show-blackout-status">Output blackout</Box>
        )}
        <Button className="show-exit" onClick={onExit}>
          Exit
        </Button>
      </Box>

      {view === "music" ? (
        <Box className="show-main show-main-music">
          <Box className="show-music-primary">
            <ShowScoreViewer
              score={selectedScore}
              cueIndex={cueIndex}
              pageMode={pageMode}
              autoPageTurn={autoPageTurn}
              onPageModeChange={setPageMode}
              onAutoPageTurnChange={setAutoPageTurn}
            />
            <ShowTransport
              large
              cueIndex={cueIndex}
              indexCount={indexCount}
              nextChanges={nextChanges}
              scores={scores}
              isAutoplaying={isAutoplaying}
              isBlackout={isBlackout}
              autoplayInterval={autoplayInterval}
              onPrevious={onPrevious}
              onNext={onNext}
              onSelect={onSetCueIndex}
              onToggleAutoplay={onToggleAutoplay}
              onToggleBlackout={onToggleBlackout}
            />
          </Box>
          <Box className="show-music-rail">
            <ShowScreenPreview
              screenNumber={1}
              cues={getActiveCuesForScreen(1, cueIndex)}
              label="LIVE · Screen 1"
              compact
            />
            <Box className="show-mini-screen-grid">
              {Array.from(
                { length: Math.max(0, screenCount - 1) },
                (_, index) => {
                  const screenNumber = index + 2
                  return (
                    <ShowScreenPreview
                      key={screenNumber}
                      screenNumber={screenNumber}
                      cues={getActiveCuesForScreen(screenNumber, cueIndex)}
                      label={`Screen ${screenNumber}`}
                      compact
                    />
                  )
                }
              )}
            </Box>
            <ShowScreenPreview
              screenNumber={1}
              cues={getActiveCuesForScreen(1, nextIndex)}
              label={`NEXT · Frame ${nextIndex}`}
              compact
            />
            <ShowCueList
              cueIndex={cueIndex}
              indexCount={indexCount}
              scores={scores}
              onSelect={onSetCueIndex}
            />
            <ShowAudioStrip tracks={audioTracks} />
          </Box>
        </Box>
      ) : (
        <Box className="show-main show-main-control">
          <Box className="show-control-primary">
            <ShowScreenWall
              screenCount={screenCount}
              screens={screens}
              cueIndex={cueIndex}
              getActiveCuesForScreen={getActiveCuesForScreen}
              onToggleScreen={onToggleScreen}
            />
            <ShowTransport
              cueIndex={cueIndex}
              indexCount={indexCount}
              nextChanges={nextChanges}
              scores={scores}
              isAutoplaying={isAutoplaying}
              isBlackout={isBlackout}
              autoplayInterval={autoplayInterval}
              onPrevious={onPrevious}
              onNext={onNext}
              onSelect={onSetCueIndex}
              onToggleAutoplay={onToggleAutoplay}
              onToggleBlackout={onToggleBlackout}
            />
            <ShowAudioStrip tracks={audioTracks} />
          </Box>
          <Box className="show-control-score">
            <HStack justify="space-between">
              <Text className="show-section-label">Score</Text>
              <Button
                size="xs"
                variant="muvico-secondary"
                onClick={() => setView("music")}
              >
                Expand
              </Button>
            </HStack>
            <ShowScoreViewer
              compact
              score={selectedScore}
              cueIndex={cueIndex}
              pageMode="two"
              autoPageTurn
            />
          </Box>
        </Box>
      )}

      {monitorView && (
        <ShowMonitorWindow
          title={`${presentationName} · ${monitorView === "score" ? "Score" : "Screen wall"}`}
          onClose={closeMonitor}
        >
          <Box className="show-monitor-output">
            {monitorView === "score" ? (
              <ShowScoreViewer
                score={selectedScore}
                cueIndex={cueIndex}
                pageMode={pageMode}
                autoPageTurn
                compact
              />
            ) : (
              <ShowScreenWall
                screenCount={screenCount}
                screens={screens}
                cueIndex={cueIndex}
                getActiveCuesForScreen={getActiveCuesForScreen}
                onToggleScreen={onToggleScreen}
              />
            )}
          </Box>
        </ShowMonitorWindow>
      )}
    </Box>
  )
}

export default ShowMode
