/*
 * the main component for the presentation editor, responsible for rendering the overall layout and managing state for the editor.
 * It includes the header with presentation title and settings, the screen preview area, playback controls, and the workspace which contains the cue list and cue form.
 * It also handles interactions such as toggling screen visibility, autoplaying cues, and opening the tutorial guide.
 * The component uses react-grid-layout for responsive layout and Chakra UI for styling.
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react"
import {
  Box,
  Button,
  FormLabel,
  HStack,
  Icon,
  Select,
  Text,
  VStack,
} from "@chakra-ui/react"
import { FiPlay } from "react-icons/fi"
import "react-grid-layout/css/styles.css"
import { useAppDispatch, useAppSelector } from "../../redux/hooks"
import { laneScreenFromKey } from "../utils/laneFocus"

import type { Dispatch, SetStateAction } from "react"
import type { Cue, CueUpdateInput, ScoreDocument } from "../../types"
import {
  fetchPresentationInfo,
  updatePresentation,
} from "../../redux/presentationReducer"
import { saveOutputAspectRatio } from "../../redux/presentationThunks"
import { isFullFrame } from "../utils/cueFrame"

import type { CueFrame } from "../utils/cueFrame"
import settingsIcon from "../../public/icons/Presentationsettings.svg"
import ClickablePopover from "../utils/ClickablePopover"
import EditMode from "./EditMode"
import EditorDock from "./EditorDock"
import PresentationPlaybackControls from "./PresentationPlaybackControls"
import CueAudioPlayers from "./CueAudioPlayers"
import type { AudioTrack } from "./CueAudioPlayers"
import PresentationTitle from "./PresentationTitle"
import SharePresentationButton from "./SharePresentationButton"
import { ReadOnlyProvider, useReadOnly } from "../utils/ReadOnlyContext"
import StatusTooltip from "./StatusToolTip"
import Screen from "./Screen"
import TutorialGuide from "../tutorial/TutorialGuide"
import { presentationTutorialSteps } from "../data/tutorialSteps"
import {
  getAudioRow,
  isImageFile,
  isType,
  isVideoFile,
} from "../utils/fileTypeUtils"
import KeyboardHandler from "../utils/keyboardHandler"
import makeResizable from "../utils/ResizeElement"
import { ScreensDisplay } from "./ScreensDisplay"
import {
  DEFAULT_OUTPUT_ASPECT_RATIO,
  OUTPUT_ASPECT_RATIO_OPTIONS,
  resolveScreenAspectRatio,
} from "../../../constants.js"
import ShowMode from "./ShowMode"
import {
  buildCueVisualSpanMap,
  getCueVisualSpanFromMap,
} from "../utils/cueVisualSpanUtils"
import { getLookaheadFrameIndices } from "../utils/showLookaheadUtils"
import { TRANSITION_SYNC_BUFFER_MS } from "../../utils/syncedTransition"

// How many frames ahead of the live cue to keep preloaded while show mode
// is active.
const SHOW_LOOKAHEAD_FRAMES = 2

// Standard HTTP validators used to detect whether a frozen media URL's
// underlying content has changed since it was last downloaded (e.g. an
// uploaded file was replaced in place, reusing the same URL/S3 key -- this
// happens for media-library-owned files shared across cues).
interface MediaValidators {
  etag: string | null
  lastModified: string | null
  contentLength: string | null
}

type MediaItemStatus = "pending" | "loading" | "done" | "failed"

// Don't revalidate an already-frozen URL more often than this -- freezeMediaUrl
// can be called again for the same URL on every cues/lookahead effect run.
const MEDIA_VALIDATION_MIN_INTERVAL_MS = 15000

// Disk-backed cache for frozen media bytes, keyed by the file's stable
// storage id (not the presigned URL, which rotates every time the
// presentation is re-fetched). Survives reloads and is shared across every
// same-origin window/tab -- unlike the in-memory Blob/ObjectURL map below,
// which is per-document.
const MEDIA_DISK_CACHE_NAME = "muvico-show-media-v1"
const mediaDiskCacheKeyFor = (id: string) =>
  `/__muvico_media_cache__/${encodeURIComponent(id)}`

const getMediaDiskCache = async (): Promise<Cache | null> => {
  if (typeof caches === "undefined") return null
  try {
    return await caches.open(MEDIA_DISK_CACHE_NAME)
  } catch (error) {
    console.warn("Show mode: media disk cache unavailable", error)
    return null
  }
}

const readMediaValidators = (response: Response): MediaValidators => {
  const headers = response.headers as Headers | undefined
  return {
    etag: headers?.get?.("etag") ?? null,
    lastModified: headers?.get?.("last-modified") ?? null,
    contentLength: headers?.get?.("content-length") ?? null,
  }
}

const mediaValidatorsMatch = (
  previous: MediaValidators | null,
  next: MediaValidators | null
): boolean => {
  if (!previous || !next) return false
  const previousHasAny =
    previous.etag || previous.lastModified || previous.contentLength
  const nextHasAny = next.etag || next.lastModified || next.contentLength
  // Neither request returned anything usable to compare -- can't prove
  // staleness, so don't force a re-download on every revalidation.
  if (!previousHasAny || !nextHasAny) return true
  if (previous.etag && next.etag) return previous.etag === next.etag
  return (
    previous.lastModified === next.lastModified &&
    previous.contentLength === next.contentLength
  )
}

// Lightweight check for whether a URL's content has changed: a 1-byte
// ranged GET, not HEAD -- these are S3 presigned URLs signed for GET only,
// so HEAD is rejected with a 403 every single time (not just "sometimes"),
// which only spammed the console with CORS errors for no benefit. Fails
// soft (null) on any error -- callers treat "can't validate" as "assume
// unchanged" rather than breaking the freeze pipeline.
const fetchMediaValidators = async (
  url: string
): Promise<MediaValidators | null> => {
  try {
    const rangeResponse = await fetch(url, {
      headers: { Range: "bytes=0-0" },
    })
    if (rangeResponse.ok || rangeResponse.status === 206) {
      return readMediaValidators(rangeResponse)
    }
    return null
  } catch (error) {
    console.warn("Show mode: media validation request failed", url, error)
    return null
  }
}

interface EditModeContainerProps {
  id: string
  cues: Cue[]
  isToolboxOpen: boolean
  setIsToolboxOpen: (open: boolean) => void
  transitionType: string
  onTransitionChange: (value: string) => void
  cueIndex: number
  setCueIndex: Dispatch<SetStateAction<number>>
  isAudioMuted: boolean
  toggleAudioMute: () => void
  indexCount: number

  /**
   * Forwarded to the create/edit path of CuesForm, which is unreachable from
   * the current UI -- index.jsx supplies none of these. Optional so the types
   * describe what actually arrives. See the note at the top of CuesForm.jsx.
   */
  addCue?: (cueData: CueUpdateInput) => void | Promise<void>
  onClose?: () => void
  position?: { index: number; screen: number } | null
  cueData?: Cue | null
  /**
   * Frame navigation. CuesForm's dead create/edit path calls this with a
   * different shape entirely; that file stays .jsx and is unchecked.
   */
  updateCue: (direction: "Next" | "Previous") => void
  isAudioMode?: boolean
  isShowMode?: boolean
  onEnterShow?: () => void
  onExitShow?: () => void
  sharedToken?: string
}

// setCueIndex stays in the container: EditorLayout navigates frames through
// updateCue rather than setting the index itself.
interface EditorLayoutProps extends Omit<
  EditModeContainerProps,
  "setCueIndex"
> {
  presentationName: string
  screenCount: number
  outputAspectRatio: string
  screenAspectRatios: Record<string, string>
  onScreenAspectRatioChange: (screen: number, ratio: string) => void
  onSetCueFrame: (cue: Cue, frame: CueFrame) => void
  screens: Record<string, boolean>
  toggleScreenVisibility: (screenNumber: number) => void
  toggleAllScreens: () => void
  autoplayInterval: number
  toggleAutoplay: () => void
  isAutoplaying: boolean
  audioSourceURL: string
  audioLoop: boolean
  audioTracks: AudioTrack[]
  scores: ScoreDocument[]
  allowContinuousAudio: boolean
  toggleAutoplayInterval: (valueString: string) => void
  onOpenTutorial: () => void
  editModeBackground: string
  panelBackground: string
  panelBorderColor: string
  focusedLaneKey: string | null
  focusedScreen: number | null
  onOutputAspectRatioChange: (ratio: string) => void
  onFocusLane: (laneKey: string | null) => void
  onSelectFrame: (index: number) => void
  onEnterShow: () => void
  isPreparingShow?: boolean
}

// Base component for different subcomponents of the editor
function EditorLayout(props: EditorLayoutProps) {
  const readOnly = useReadOnly()
  const {
    id,
    presentationName,
    screenCount,
    outputAspectRatio,
    screenAspectRatios,
    onScreenAspectRatioChange,
    onSetCueFrame,
    onOutputAspectRatioChange,
    cues,
    isToolboxOpen,
    setIsToolboxOpen,
    cueIndex,
    isAudioMuted,
    toggleAudioMute,
    indexCount,
    addCue = () => {},
    onClose = () => {},
    position,
    cueData,
    updateCue = () => {},
    isAudioMode = false,
    transitionType,
    onTransitionChange = () => {},
    screens = {},
    toggleScreenVisibility = () => {},
    toggleAllScreens = () => {},
    autoplayInterval = 1,
    toggleAutoplay = () => {},
    isAutoplaying = false,
    audioSourceURL = "",
    audioLoop = false,
    audioTracks = [],
    scores = [],
    allowContinuousAudio = false,
    toggleAutoplayInterval = () => {},
    onOpenTutorial = () => {},
    editModeBackground,
    panelBackground,
    panelBorderColor,
    focusedLaneKey,
    focusedScreen,
    onFocusLane,
    onSelectFrame,
    onEnterShow,
    isPreparingShow = false,
  } = props

  useEffect(() => {
    const panes = [
      ["#screen_preview", "#screen_resize_handle"],
      ["#timeline", "#timeline_resize_handle"],
    ]

    const disposers = panes.flatMap(([paneSelector, handleSelector]) => {
      const pane = document.querySelector<HTMLElement>(paneSelector)
      const handle = document.querySelector<HTMLElement>(handleSelector)
      if (!pane || !handle) return []

      // The shell is viewport-locked, so an unbounded drag would push the other
      // panes off screen with no way to get them back. Rather than recomputing
      // the layout, express the ceiling as "how much slack the sibling can give
      // up": the pair's combined height is invariant during a drag, so this is
      // exactly "the sum still fits", and it re-resolves on every mousemove and
      // therefore survives a window resize mid-drag.
      const sibling = pane.parentElement
        ?.nextElementSibling as HTMLElement | null

      return [
        makeResizable(pane, handle, {
          minHeight: 128,
          maxHeight: () =>
            sibling
              ? pane.offsetHeight + sibling.offsetHeight - 96
              : Number.POSITIVE_INFINITY,
        }),
      ]
    })

    return () => disposers.forEach((dispose) => dispose())
  }, [])

  return (
    <div
      className="editor-shell"
      style={{ backgroundColor: editModeBackground }}
    >
      <Box
        className="editor-context-bar"
        display="flex"
        alignItems="center"
        justifyContent="space-between"
        gap="12px"
        minH="52px"
        padding="8px 14px"
        backgroundColor={panelBackground}
        borderBottom="1px solid"
        borderColor={panelBorderColor}
      >
        <HStack minW={0} spacing={3}>
          <ClickablePopover
            label={
              <Box>
                <FormLabel
                  htmlFor="transition-type-select"
                  mb={2}
                  fontWeight={700}
                >
                  Transition Type:
                </FormLabel>
                <Select
                  id="transition-type-select"
                  data-testid="transition-type-select"
                  value={transitionType}
                  onChange={(e) => onTransitionChange(e.target.value)}
                >
                  <option value="fade">Fade</option>
                  <option value="slide-left">Slide From Left</option>
                  <option value="slide-right">Slide From Right</option>
                  <option value="zoom">Zoom</option>
                  <option value="none">None</option>
                </Select>

                <FormLabel
                  htmlFor="output-aspect-ratio-select"
                  mt={4}
                  mb={2}
                  fontWeight={700}
                >
                  Output shape, all screens:
                </FormLabel>
                <Select
                  id="output-aspect-ratio-select"
                  data-testid="output-aspect-ratio-select"
                  value={outputAspectRatio}
                  isDisabled={readOnly}
                  onChange={(e) => onOutputAspectRatioChange(e.target.value)}
                >
                  {OUTPUT_ASPECT_RATIO_OPTIONS.map(
                    (option: { value: string; label: string }) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    )
                  )}
                </Select>
                <Text fontSize="xs" mt={2} opacity={0.75}>
                  The shape of your projectors. Picking here applies it to every
                  screen and clears any per-screen choice. To set one screen on
                  its own, use the selector on its preview tile.
                </Text>
              </Box>
            }
          >
            <Button
              aria-label="Presentation Settings"
              className="edit-mode-btn edit-mode-btn-settings"
              variant="muvico-primary"
            >
              <img src={settingsIcon} alt="" width="20" height="20" />
            </Button>
          </ClickablePopover>

          <Box minW={0}>
            <PresentationTitle id={id} presentationName={presentationName} />
          </Box>
        </HStack>
        <HStack spacing={2}>
          <Button
            className="edit-mode-btn edit-mode-btn-tutorial"
            variant="muvico-secondary"
            onClick={onOpenTutorial}
          >
            Tutorial
          </Button>
          {!readOnly && <SharePresentationButton presentationId={id} />}
          <Button
            className="edit-mode-btn"
            variant="muvico-primary"
            leftIcon={<Icon as={FiPlay} />}
            onClick={onEnterShow}
            isDisabled={isPreparingShow}
          >
            Show mode
          </Button>
        </HStack>
      </Box>
      <div
        id="screen_preview"
        style={{
          backgroundColor: panelBackground,
          borderBottom: `1px solid ${panelBorderColor}`,
        }}
        className="screenspreview"
      >
        <ScreensDisplay
          screenCount={screenCount}
          cues={cues}
          cueIndex={cueIndex}
          indexCount={indexCount}
          editModeBackground={panelBackground}
          screens={screens}
          toggleScreenVisibility={toggleScreenVisibility}
          focusedScreen={focusedScreen}
          outputAspectRatio={outputAspectRatio}
          screenAspectRatios={screenAspectRatios}
          onScreenAspectRatioChange={
            readOnly ? undefined : onScreenAspectRatioChange
          }
          onSetCueFrame={readOnly ? undefined : onSetCueFrame}
          focusedLaneKey={focusedLaneKey}
          onFocusLane={onFocusLane}
        />

        <div id="screen_resize_handle" className="resize_handle"></div>
      </div>
      <div
        style={{
          backgroundColor: editModeBackground,
          borderBottom: `1px solid ${panelBorderColor}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
        className="no-resize-handle editor-transport-bar"
      >
        <KeyboardHandler
          onNext={() => updateCue("Next")}
          onPrevious={() => updateCue("Previous")}
          onTogglePlay={toggleAutoplay}
        />
        <PresentationPlaybackControls
          screens={screens}
          toggleAllScreens={toggleAllScreens}
          cueIndex={cueIndex}
          updateCue={updateCue}
          indexCount={indexCount}
          autoplayInterval={autoplayInterval}
          toggleAutoplay={toggleAutoplay}
          isAutoplaying={isAutoplaying}
          toggleAutoplayInterval={toggleAutoplayInterval}
          audioSourceURL={audioSourceURL}
          audioLoop={audioLoop}
          audioTracks={audioTracks}
          allowContinuousAudio={allowContinuousAudio}
          renderAudioPlayers={false}
        />
        <Box className="editor-save-status">
          <StatusTooltip />
        </Box>
      </div>

      <div className="edit-workspace">
        <div>
          <div className="edit-mode-workspace">
            <div
              id="timeline"
              className="edit-mode-timeline"
              style={{
                height: "100%",
                width: "100%",
                border: `1px solid ${panelBorderColor}`,
                borderRadius: "8px",
                backgroundColor: panelBackground,
                boxSizing: "border-box",
                flexGrow: "1",
              }}
            >
              <div id="edit-mode-scroll">
                <EditMode
                  id={id}
                  cues={cues}
                  isToolboxOpen={isToolboxOpen}
                  setIsToolboxOpen={setIsToolboxOpen}
                  cueIndex={cueIndex}
                  isAudioMuted={isAudioMuted}
                  toggleAudioMute={toggleAudioMute}
                  indexCount={indexCount}
                  focusedLaneKey={focusedLaneKey}
                  onFocusLane={onFocusLane}
                  isAutoplaying={isAutoplaying}
                  autoplayInterval={autoplayInterval}
                  onSelectFrame={onSelectFrame}
                  outputAspectRatio={outputAspectRatio}
                />
              </div>
              <div id="timeline_resize_handle" className="resize_handle"></div>
            </div>

            <div
              className="edit-mode-cue-form"
              style={{
                height: "100%",
                border: `1px solid ${panelBorderColor}`,
                borderRadius: "8px",
                backgroundColor: panelBackground,
                boxSizing: "border-box",
                padding: "5px",
              }}
            >
              <EditorDock
                presentationId={id}
                scores={scores}
                addCue={addCue}
                onClose={onClose}
                position={position}
                cues={cues}
                cueData={cueData}
                updateCue={updateCue}
                screenCount={screenCount}
                isAudioMode={isAudioMode}
                indexCount={indexCount}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Shown instead of the grid on phone widths (see the matching media
          query in styles.css) -- editing the screens x frames grid needs
          real estate the grid itself has no way to shrink to. */}
      <div className="edit-workspace-mobile-notice">
        <p className="edit-workspace-mobile-notice-title">
          Editing needs a bigger screen
        </p>
        <p className="edit-workspace-mobile-notice-body">
          Use a tablet or a computer to build the grid. You can still preview
          and play this presentation here.
        </p>
      </div>
    </div>
  )
}

// The main container component for the presentation editor, responsible for managing state and rendering the EditorLayout and other components such as the tutorial guide and screen previews.
const EditModeContainer = ({
  id,
  cues,
  isToolboxOpen,
  setIsToolboxOpen,
  transitionType,
  onTransitionChange,
  cueIndex,
  setCueIndex,
  isAudioMuted,
  toggleAudioMute,
  indexCount,
  addCue,
  onClose,
  position,
  cueData,
  updateCue,
  isAudioMode,
  isShowMode = false,
  onEnterShow = () => {},
  onExitShow = () => {},
  sharedToken,
}: EditModeContainerProps) => {
  const editModeBackground = "var(--muvico-canvas)"
  const panelBackground = "var(--muvico-surface)"
  const panelBorderColor = "var(--muvico-border)"

  const dispatch = useAppDispatch()
  const presentation = useAppSelector((state) => state.presentation)
  const presentationName = presentation?.name
  const screenCount = presentation?.screenCount
  const outputAspectRatio =
    presentation?.outputAspectRatio ?? DEFAULT_OUTPUT_ASPECT_RATIO
  const screenAspectRatios = presentation?.screenAspectRatios ?? {}
  const handleOutputAspectRatioChange = useCallback(
    (ratio: string) => {
      void dispatch(saveOutputAspectRatio({ id, outputAspectRatio: ratio }))
    },
    [dispatch, id]
  )
  const handleSetCueFrame = useCallback(
    (cue: Cue, frame: CueFrame) => {
      void dispatch(
        updatePresentation(
          id,
          {
            ...cue,
            cueName: cue.name,
            frame: isFullFrame(frame) ? null : frame,
          },
          cue._id
        )
      )
    },
    [dispatch, id]
  )
  const handleScreenAspectRatioChange = useCallback(
    (screen: number, ratio: string) => {
      void dispatch(
        saveOutputAspectRatio({ id, outputAspectRatio: ratio, screen })
      )
    },
    [dispatch, id]
  )

  /**
   * Which timeline lane is focused, as a stable "group:layer" key.
   *
   * Lives here rather than in EditMode because ScreensDisplay is a sibling and
   * needs the derived screen number. Kept separate from EditMode's selectedCue,
   * which is reset on toolbox close, on save, on a committed move and when the
   * cue leaves the store -- a lane outlives all of those.
   */
  const [focusedLaneKey, setFocusedLaneKey] = useState<string | null>(null)
  const [screens, setScreens] = useState<Record<string, boolean>>({})
  const [mirroring, setMirroring] = useState<Record<string, number>>({})
  // Live pixel width of each open screen popup, reported by <Screen> on
  // mount and on resize. Only screens actually referenced by some cue's
  // spanScreens need to be tracked -- see handleScreenWidthChange below.
  // Same-JS-context portal architecture (see Screen.jsx), so this is plain
  // React state, no cross-window messaging involved.
  const [screenWidths, setScreenWidths] = useState<Record<number, number>>({})
  const spannedScreenNumbers = useMemo(() => {
    const spanned = new Set<number>()
    for (const cue of cues || []) {
      cue.spanScreens?.forEach((screenNumber) => spanned.add(screenNumber))
    }
    return spanned
  }, [cues])
  const handleScreenWidthChange = useCallback(
    (screenNumber: number, width: number) => {
      if (!spannedScreenNumbers.has(screenNumber)) return
      setScreenWidths((prev) =>
        prev[screenNumber] === width ? prev : { ...prev, [screenNumber]: width }
      )
    },
    [spannedScreenNumbers]
  )
  const [isAutoplaying, setIsAutoplaying] = useState(false)
  const [autoplayEnded, setAutoplayEnded] = useState(false)
  const [autoplayInterval, setAutoplayInterval] = useState(5)
  const [isTutorialOpen, setIsTutorialOpen] = useState(false)
  const [isBlackout, setIsBlackout] = useState(false)
  const [isAudioArmed, setIsAudioArmed] = useState(false)
  const [audioAdvanceMode, setAudioAdvanceMode] = useState<"auto" | "manual">(
    "auto"
  )
  const [manuallyPlayingTrackIds, setManuallyPlayingTrackIds] = useState<
    Record<string, boolean>
  >({})
  const autoplayTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  // Media freezing: every image/video/audio URL gets fetched to a Blob and
  // swapped for an Object URL so show mode's popups never touch the network
  // (or a since-rotated S3 presigned URL) again once preloaded.
  // originalUrl -> objectUrl, only set once a fetch actually resolves.
  const mediaBlobUrlsRef = useRef<Map<string, string>>(new Map())
  // originalUrl -> in-flight/settled freeze promise, resolving to the
  // objectUrl on success or the original URL as a fallback on failure.
  const mediaFreezePromisesRef = useRef<Map<string, Promise<string>>>(new Map())
  // originalUrl set once its freeze attempt has settled either way, so the
  // show-mode entry gate can tell "already attempted" from "still pending"
  // without inspecting promise internals.
  const mediaSettledUrlsRef = useRef<Set<string>>(new Set())
  // Mirrors mediaBlobUrlsRef as render-visible state so Screen/CueAudioPlayers
  // re-render with the frozen URL once it's ready.
  const [frozenMediaUrls, setFrozenMediaUrls] = useState<
    Record<string, string>
  >({})
  // Every media URL referenced by the current cues, tracked so a cue being
  // edited/removed can have its frozen Blob revoked instead of leaked.
  const liveMediaUrlsRef = useRef<Set<string>>(new Set())
  // originalUrl -> validators (ETag/Last-Modified/Content-Length) captured
  // when that URL was last frozen or revalidated.
  const mediaValidatorsRef = useRef<Map<string, MediaValidators>>(new Map())
  // originalUrl -> timestamp of the last revalidation attempt, so repeat
  // freezeMediaUrl calls for an already-frozen URL don't hammer the network.
  const mediaLastValidatedAtRef = useRef<Map<string, number>>(new Map())
  // originalUrl -> in-flight revalidation, so concurrent freezeMediaUrl
  // calls for the same URL share one validation request.
  const mediaValidationPromisesRef = useRef<Map<string, Promise<void>>>(
    new Map()
  )
  // URLs whose freeze attempt most recently failed, surfaced as a distinct
  // status in the loading overlay. Cleared once a later attempt succeeds or
  // the URL drops out of use.
  const [mediaFailedUrls, setMediaFailedUrls] = useState<Set<string>>(new Set())
  const [isPreparingShow, setIsPreparingShow] = useState(false)
  const [preloadProgress, setPreloadProgress] = useState<{
    loaded: number
    total: number
    items: Array<{ url: string; label: string }>
  }>({ loaded: 0, total: 0, items: [] })
  const cueIndexRef = useRef(cueIndex)

  const cueVisualSpanMap = useMemo(
    () => buildCueVisualSpanMap(cues, indexCount),
    [cues, indexCount]
  )

  // Revoke every frozen Object URL when the presentation editor itself
  // unmounts (leaving the presentation entirely) -- nothing left to show
  // media from past this point.
  useEffect(() => {
    const blobUrls = mediaBlobUrlsRef.current
    return () => {
      blobUrls.forEach((objectUrl) => URL.revokeObjectURL(objectUrl))
      blobUrls.clear()
    }
  }, [])

  const transitionAt = useMemo(
    () => Date.now() + TRANSITION_SYNC_BUFFER_MS,
    [cueIndex]
  )

  // Initialize screen visibility state for every screen number (1..screenCount)
  // - creates a visibility object with keys for each screen number and
  // values set to false (hidden) by default, then updates the state whenever cues or screen count changes
  useEffect(() => {
    const visibility: Record<string, boolean> = {}
    for (
      let screenNumber = 1;
      screenNumber <= (screenCount ?? 0);
      screenNumber += 1
    ) {
      visibility[screenNumber] = false
    }
    // Only add defaults for screen numbers we haven't seen yet - keep
    // existing screens' open/closed state untouched so that editing a cue
    // doesn't close every currently open presentation window
    setScreens((prev) => ({ ...visibility, ...prev }))
    setMirroring({})
  }, [cues, screenCount])

  // Open or close a window for a specific screen
  const toggleScreenVisibility = (screenNumber: number) => {
    setScreens((prev) => ({
      ...prev,
      [screenNumber]: !prev[screenNumber],
    }))
  }

  // Open or close windows for all screens at once - if any screen is currently open, this will close all screens, otherwise it will open all screens
  const toggleAllScreens = () => {
    setScreens((prev) => {
      const updated = { ...prev }
      const allScreenNumbers = Object.keys(updated)
      const hasOpenScreen = allScreenNumbers.some(
        (screenNumber) => updated[screenNumber]
      )

      allScreenNumbers.forEach((screenNumber) => {
        updated[screenNumber] = !hasOpenScreen
      })

      return updated
    })
  }

  const getActiveCuesForScreen = (
    screenNumber: number,
    index: number
  ): Cue[] => {
    const currentIndex = Number(index)

    return (cues || [])
      .filter(
        (cue) =>
          Number(cue.screen) === Number(screenNumber) ||
          cue.spanScreens?.includes(Number(screenNumber))
      )
      .filter((cue) => {
        const cueStartIndex = Number(cue.index)
        const cueSpan = getCueVisualSpanFromMap(cue, cueVisualSpanMap)
        const cueEndIndex = cueStartIndex + cueSpan - 1
        return currentIndex >= cueStartIndex && currentIndex <= cueEndIndex
      })
      .sort(
        (firstCue, secondCue) =>
          Number(secondCue.layer ?? 0) - Number(firstCue.layer ?? 0)
      )
  }

  // null for audio lanes and for a screen that no longer exists, so a stale
  // focus highlights nothing rather than pointing at a missing tile.
  const focusedScreen = laneScreenFromKey(focusedLaneKey, screenCount ?? 0)

  const audioRow = getAudioRow(screenCount)
  const currentAudioTracks = getActiveCuesForScreen(audioRow, cueIndex)
    .sort(
      (firstCue, secondCue) =>
        Number(firstCue.layer ?? 0) - Number(secondCue.layer ?? 0)
    )
    .filter((cue) => isType.audio(cue?.file))
    .map((cue) => {
      const file = cue.file
      const rawSrc = file?.url || (file?.name ? `/${file.name}` : "")
      // Resolve to the frozen Object URL once its Blob has downloaded, so
      // the audio element never re-hits a (possibly token-rotated) S3 URL.
      const src = rawSrc ? (frozenMediaUrls[rawSrc] ?? rawSrc) : rawSrc

      return {
        id: cue._id || `${cue.screen}-${cue.layer ?? 0}-${cue.index}`,
        src,
        loop: Boolean(cue.loop),
        continuePlayback: Boolean(cue.continuePlayback),
        layer: Number(cue.layer ?? 0),
        name: cue.name,
      }
    })
    .filter((track) => track.src)
  const currentAudioCue = currentAudioTracks[0] || {}
  const currentAudioSrc = currentAudioCue.src || ""
  const isCurrentCueAudio = currentAudioTracks.length > 0
  const currentAudioLoop = Boolean(currentAudioCue.loop)

  const handleScreenClose = useCallback((screenNumber: string | number) => {
    setScreens((prev) => ({
      ...prev,
      [screenNumber]: false,
    }))
  }, [])

  useEffect(() => {
    cueIndexRef.current = cueIndex
  }, [cueIndex])

  const toggleAutoplay = () => {
    setAutoplayEnded(false)
    setIsAutoplaying((prev) => {
      const next = !prev
      if (next && typeof setCueIndex === "function") {
        // Play from where the playhead is. Rewinding unconditionally made sense
        // while the only way to reach a frame was to step through it, but now
        // that a frame can be selected by clicking its header, it threw that
        // choice away on every press. The one case that still rewinds is the
        // last frame, where playing forward has nothing to show.
        setCueIndex((current: number) =>
          current >= indexCount - 1 ? 0 : current
        )
      }
      return next
    })
  }

  const toggleAutoplayInterval = (valueString: string) => {
    const parsed = Number(valueString)
    if (!Number.isFinite(parsed)) {
      return
    }

    setAutoplayInterval(Math.max(0.1, parsed))
  }

  const handleOpenTutorial = useCallback(() => {
    setIsTutorialOpen(true)
  }, [])

  useEffect(() => {
    if (!isAutoplaying) {
      if (autoplayTimerRef.current) {
        clearInterval(autoplayTimerRef.current)
      }
      return
    }

    autoplayTimerRef.current = setInterval(() => {
      const currentIndex = cueIndexRef.current
      if (currentIndex >= indexCount - 1) {
        setAutoplayEnded(true)
        setIsAutoplaying(false)
        return
      }

      if (typeof setCueIndex === "function") {
        setCueIndex((prevIndex: number) =>
          Math.min(indexCount - 1, prevIndex + 1)
        )
        return
      }

      updateCue("Next")
    }, autoplayInterval * 1000)

    return () => {
      if (autoplayTimerRef.current) {
        clearInterval(autoplayTimerRef.current)
      }
    }
  }, [isAutoplaying, autoplayInterval, indexCount, setCueIndex, updateCue])

  useEffect(() => {
    if (isAutoplaying && cueIndex >= indexCount - 1) {
      setAutoplayEnded(true)
      setIsAutoplaying(false)
    }
  }, [cueIndex, indexCount, isAutoplaying])

  // Freeze a media URL by fetching its full bytes into a Blob and swapping
  // it for an Object URL -- this is what actually guarantees zero network
  // access (and no exposure to a since-rotated S3 presigned URL) once show
  // mode is running, unlike the old cache-warming approach of just setting
  // img/video.src and waiting for a load event. Covers images, videos and
  // audio alike. Dedupes by URL: a repeat call returns the same in-flight
  // or settled promise rather than re-fetching -- unless the URL was
  // already frozen, in which case it's revalidated first (ETag/Last-
  // Modified/Content-Length) so a file replaced in place under the same
  // URL doesn't keep serving stale content forever.
  //
  // `id` is the file's stable storage handle (cue.file.id), unlike `url`
  // which is a presigned S3 URL regenerated on every presentation re-fetch.
  // The disk cache (CacheStorage) is keyed by `id` so a freeze from an
  // earlier session/reload or a sibling window can be reused without
  // re-downloading, even though its presigned URL has since rotated.
  const freezeMediaUrl = useCallback(
    (
      url: string,
      kind: "image" | "video" | "audio",
      id: string
    ): Promise<string> => {
      const promiseCache = mediaFreezePromisesRef.current
      const cached = promiseCache.get(url)
      const existingBlobUrl = mediaBlobUrlsRef.current.get(url)

      if (cached && existingBlobUrl) {
        const lastValidatedAt = mediaLastValidatedAtRef.current.get(url) ?? 0
        if (Date.now() - lastValidatedAt < MEDIA_VALIDATION_MIN_INTERVAL_MS) {
          return cached
        }

        let validation = mediaValidationPromisesRef.current.get(url)
        if (!validation) {
          validation = (async () => {
            const nextValidators = await fetchMediaValidators(url)
            mediaLastValidatedAtRef.current.set(url, Date.now())

            if (!nextValidators) {
              // Validation request itself failed -- keep serving the
              // cached Blob rather than treating that as staleness.
              return
            }

            const previousValidators =
              mediaValidatorsRef.current.get(url) ?? null
            if (mediaValidatorsMatch(previousValidators, nextValidators)) {
              mediaValidatorsRef.current.set(url, nextValidators)
              return
            }

            // Content changed under the same URL -- drop the stale Blob so
            // the recursive call below re-downloads it, and evict it from
            // the disk cache too so a reload doesn't resurrect stale bytes.
            URL.revokeObjectURL(existingBlobUrl)
            mediaBlobUrlsRef.current.delete(url)
            mediaValidatorsRef.current.delete(url)
            promiseCache.delete(url)
            mediaSettledUrlsRef.current.delete(url)
            setFrozenMediaUrls((prev) => {
              if (!(url in prev)) return prev
              const next = { ...prev }
              delete next[url]
              return next
            })
            const diskCache = await getMediaDiskCache()
            await diskCache?.delete(mediaDiskCacheKeyFor(id))
          })().finally(() => {
            mediaValidationPromisesRef.current.delete(url)
          })
          mediaValidationPromisesRef.current.set(url, validation)
        }

        return validation.then(() => freezeMediaUrl(url, kind, id))
      }

      if (cached) {
        return cached
      }

      const promise = (async () => {
        const diskCacheKey = mediaDiskCacheKeyFor(id)
        try {
          const diskCache = await getMediaDiskCache()
          const cachedResponse = await diskCache?.match(diskCacheKey)
          if (cachedResponse) {
            const blob = await cachedResponse.blob()
            const objectUrl = URL.createObjectURL(blob)
            mediaBlobUrlsRef.current.set(url, objectUrl)
            mediaLastValidatedAtRef.current.set(url, Date.now())
            setFrozenMediaUrls((prev) =>
              prev[url] === objectUrl ? prev : { ...prev, [url]: objectUrl }
            )
            setMediaFailedUrls((prev) => {
              if (!prev.has(url)) return prev
              const next = new Set(prev)
              next.delete(url)
              return next
            })
            return objectUrl
          }

          const response = await fetch(url)
          if (response && response.ok === false) {
            throw new Error(
              `Failed to fetch ${kind} for show mode preload (status ${response.status})`
            )
          }
          const validators = readMediaValidators(response)
          const blob = await response.blob()
          const objectUrl = URL.createObjectURL(blob)
          mediaBlobUrlsRef.current.set(url, objectUrl)
          mediaValidatorsRef.current.set(url, validators)
          mediaLastValidatedAtRef.current.set(url, Date.now())
          setFrozenMediaUrls((prev) =>
            prev[url] === objectUrl ? prev : { ...prev, [url]: objectUrl }
          )
          setMediaFailedUrls((prev) => {
            if (!prev.has(url)) return prev
            const next = new Set(prev)
            next.delete(url)
            return next
          })
          if (diskCache) {
            try {
              await diskCache.put(diskCacheKey, new Response(blob))
            } catch (error) {
              console.warn(
                "Show mode: failed to persist media to disk cache",
                error
              )
            }
          }
          return objectUrl
        } catch (error) {
          // Freeze failed (network error, CORS, rotated token, ...). Fall
          // back to the live URL rather than leaving the media stuck
          // waiting forever -- Screen/CueAudioPlayers will fetch it live
          // from S3 when they render, same as before this change.
          console.error(
            `Show mode: failed to preload ${kind}, falling back to live URL`,
            url,
            error
          )
          setMediaFailedUrls((prev) =>
            prev.has(url) ? prev : new Set(prev).add(url)
          )
          return url
        } finally {
          mediaSettledUrlsRef.current.add(url)
        }
      })()

      promiseCache.set(url, promise)
      return promise
    },
    []
  )

  // Derives a media item's status for the loading overlay from the same
  // refs/state freezeMediaUrl itself maintains, rather than a parallel
  // piece of state that could drift out of sync.
  const getMediaItemStatus = (url: string): MediaItemStatus => {
    if (frozenMediaUrls[url]) return "done"
    if (mediaFailedUrls.has(url)) return "failed"
    if (mediaFreezePromisesRef.current.has(url)) return "loading"
    return "pending"
  }

  // De-dupes by file URL (same media reused across cues counts once) and
  // keeps a human-readable label for the loading overlay. Back layers (the
  // highest `layer` numbers -- see Screen.tsx's zIndex = 100 - layer) are
  // queued first so they're never left waiting behind front-layer loads.
  const collectMediaItems = useCallback((cueList: Cue[]) => {
    const items = new Map<
      string,
      { kind: "image" | "video" | "audio"; label: string; id: string }
    >()
    const backToFront = [...cueList].sort(
      (a, b) => Number(b.layer ?? 0) - Number(a.layer ?? 0)
    )

    backToFront.forEach((cue) => {
      const file = cue.file
      if (!file?.url || items.has(file.url)) return
      // Falls back to the url itself when a file somehow has no id (should
      // not happen for library/cue media) so freezing still works, just
      // without the stable disk-cache key.
      const id = file.id || file.url

      // isImageFile/isVideoFile fall back to a URL extension check when
      // file.type is missing/stale -- the strict isType.image/video (MIME
      // only) silently dropped those files from the preload queue instead
      // of erroring, which looked like "images never prepare" while videos
      // (whose type happened to be set correctly) preloaded fine.
      if (isImageFile(file)) {
        items.set(file.url, {
          kind: "image",
          label: cue.name || file.name || "image",
          id,
        })
      } else if (isVideoFile(file)) {
        items.set(file.url, {
          kind: "video",
          label: cue.name || file.name || "vidéo",
          id,
        })
      } else if (isType.audio(file)) {
        items.set(file.url, {
          kind: "audio",
          label: cue.name || file.name || "audio",
          id,
        })
      }
    })

    return items
  }, [])

  // Revoke frozen Blobs for URLs no longer referenced by any cue (media
  // swapped out or cue deleted) instead of leaking them until unmount.
  useEffect(() => {
    const currentUrls = new Set<string>()
    collectMediaItems(cues || []).forEach((_value, url) => {
      currentUrls.add(url)
    })

    const previousUrls = liveMediaUrlsRef.current
    previousUrls.forEach((url) => {
      if (currentUrls.has(url)) return

      const blobUrl = mediaBlobUrlsRef.current.get(url)
      if (blobUrl) {
        URL.revokeObjectURL(blobUrl)
        mediaBlobUrlsRef.current.delete(url)
        setFrozenMediaUrls((prev) => {
          if (!(url in prev)) return prev
          const next = { ...prev }
          delete next[url]
          return next
        })
      }
      mediaFreezePromisesRef.current.delete(url)
      mediaSettledUrlsRef.current.delete(url)
      mediaValidatorsRef.current.delete(url)
      mediaLastValidatedAtRef.current.delete(url)
      mediaValidationPromisesRef.current.delete(url)
      setMediaFailedUrls((prev) => {
        if (!prev.has(url)) return prev
        const next = new Set(prev)
        next.delete(url)
        return next
      })
    })

    liveMediaUrlsRef.current = currentUrls
  }, [cues, collectMediaItems])

  // Cues active at a given frame index across every screen, independent of
  // which screen displays them -- used to look ahead to upcoming frames'
  // media rather than just the current one.
  const getCuesActiveAtIndex = useCallback(
    (index: number): Cue[] =>
      (cues || []).filter((cue) => {
        const cueStartIndex = Number(cue.index)
        const cueSpan = getCueVisualSpanFromMap(cue, cueVisualSpanMap)
        const cueEndIndex = cueStartIndex + cueSpan - 1
        return index >= cueStartIndex && index <= cueEndIndex
      }),
    [cues, cueVisualSpanMap]
  )

  // The entry preload gate only covers media that's needed before show mode
  // opens. During an active show, advancing frames can still hit media that
  // was never touched (e.g. a cue added after entry, or a race with the
  // initial preload) -- so keep the next couple of frames warmed up while
  // the current one is on screen.
  useEffect(() => {
    if (!isShowMode) return

    getLookaheadFrameIndices(
      cueIndex,
      indexCount,
      SHOW_LOOKAHEAD_FRAMES
    ).forEach((lookaheadIndex) => {
      const mediaItems = collectMediaItems(getCuesActiveAtIndex(lookaheadIndex))
      mediaItems.forEach(({ kind, id }, url) => {
        freezeMediaUrl(url, kind, id)
      })
    })
  }, [
    isShowMode,
    cueIndex,
    indexCount,
    getCuesActiveAtIndex,
    collectMediaItems,
    freezeMediaUrl,
  ])

  // Guards against overlapping handleEnterShow calls: exiting show mode
  // doesn't cancel an in-flight preload (the underlying fetches have no
  // AbortController), so re-entering show mode quickly starts a second
  // Promise.all while the first is still resolving. Both would otherwise
  // write to the same preloadProgress state, and the stale call's `loaded`
  // (counted against ITS OWN total) could outlive and overwrite the new
  // call's total -- e.g. "45/27 médias chargés". Each call stamps its own
  // session id and only the latest one is allowed to touch state.
  const preloadSessionRef = useRef(0)

  const handleEnterShow = useCallback(async () => {
    const mediaItems = collectMediaItems(cues || [])
    const entries = Array.from(mediaItems.entries())
    const total = entries.length

    if (total === 0) {
      onEnterShow()
      return
    }

    const initialLoaded = entries.filter(([url]) =>
      mediaSettledUrlsRef.current.has(url)
    ).length

    if (initialLoaded === total) {
      onEnterShow()
      return
    }

    const sessionId = (preloadSessionRef.current += 1)

    setPreloadProgress({
      loaded: initialLoaded,
      total,
      items: entries.map(([url, { label }]) => ({ url, label })),
    })
    setIsPreparingShow(true)

    let loaded = initialLoaded
    await Promise.all(
      entries.map(async ([url, { kind, id }]) => {
        await freezeMediaUrl(url, kind, id)
        loaded += 1
        if (preloadSessionRef.current !== sessionId) return
        setPreloadProgress((prev) => ({ ...prev, loaded }))
      })
    )

    if (preloadSessionRef.current !== sessionId) return
    setIsPreparingShow(false)
    onEnterShow()
  }, [cues, onEnterShow, collectMediaItems, freezeMediaUrl])

  useEffect(() => {
    if (sharedToken) return
    dispatch(fetchPresentationInfo(id))
  }, [id, dispatch, sharedToken])

  useEffect(() => {
    const hasSeenTutorial = localStorage.getItem("hasSeenHelp_presentation")
    if (!hasSeenTutorial) {
      setIsTutorialOpen(true)
    }
  }, [])

  useEffect(() => {
    if (!isShowMode) {
      setIsBlackout(false)
      setIsAudioArmed(false)
      setManuallyPlayingTrackIds({})
    }
  }, [isShowMode])

  useEffect(() => {
    const previousBodyBackgroundColor = document.body.style.backgroundColor
    const previousBodyBackgroundImage = document.body.style.backgroundImage

    document.body.style.backgroundColor = editModeBackground
    document.body.style.backgroundImage = "none"

    return () => {
      if (autoplayTimerRef.current) {
        clearInterval(autoplayTimerRef.current)
      }
      document.body.style.backgroundColor = previousBodyBackgroundColor
      document.body.style.backgroundImage = previousBodyBackgroundImage
    }
  }, [editModeBackground])

  return (
    <ReadOnlyProvider value={Boolean(sharedToken)}>
      {isShowMode ? (
        <ShowMode
          presentationName={presentationName}
          screenCount={screenCount ?? 1}
          outputAspectRatio={outputAspectRatio}
          screenAspectRatios={screenAspectRatios}
          scores={presentation.scores}
          cueIndex={cueIndex}
          indexCount={indexCount}
          screens={screens}
          audioTracks={currentAudioTracks}
          autoplayInterval={autoplayInterval}
          isAutoplaying={isAutoplaying}
          isBlackout={isBlackout}
          isAudioArmed={isAudioArmed}
          audioAdvanceMode={audioAdvanceMode}
          playingTrackIds={manuallyPlayingTrackIds}
          getActiveCuesForScreen={getActiveCuesForScreen}
          onSetCueIndex={setCueIndex}
          onPrevious={() => updateCue("Previous")}
          onNext={() => updateCue("Next")}
          onToggleAutoplay={toggleAutoplay}
          onToggleBlackout={() => setIsBlackout((active) => !active)}
          onToggleAudioArmed={() => setIsAudioArmed((armed) => !armed)}
          onToggleAudioAdvanceMode={() =>
            setAudioAdvanceMode((mode) => (mode === "auto" ? "manual" : "auto"))
          }
          onToggleTrackPlay={(trackId: string) =>
            setManuallyPlayingTrackIds((previous) => ({
              ...previous,
              [trackId]: !previous[trackId],
            }))
          }
          onToggleScreen={toggleScreenVisibility}
          onExit={() => {
            setIsBlackout(false)
            onExitShow()
          }}
        />
      ) : (
        <EditorLayout
          id={id}
          presentationName={presentationName}
          screenCount={screenCount ?? 1}
          outputAspectRatio={outputAspectRatio}
          screenAspectRatios={screenAspectRatios}
          onScreenAspectRatioChange={handleScreenAspectRatioChange}
          onSetCueFrame={handleSetCueFrame}
          onOutputAspectRatioChange={handleOutputAspectRatioChange}
          scores={presentation.scores}
          focusedLaneKey={focusedLaneKey}
          focusedScreen={focusedScreen}
          onFocusLane={setFocusedLaneKey}
          onSelectFrame={setCueIndex}
          onEnterShow={handleEnterShow}
          isPreparingShow={isPreparingShow}
          cues={cues}
          isToolboxOpen={isToolboxOpen}
          setIsToolboxOpen={setIsToolboxOpen}
          cueIndex={cueIndex}
          isAudioMuted={isAudioMuted}
          toggleAudioMute={toggleAudioMute}
          indexCount={indexCount}
          addCue={addCue}
          onClose={onClose}
          position={position}
          cueData={cueData}
          updateCue={updateCue}
          isAudioMode={isAudioMode}
          transitionType={transitionType}
          onTransitionChange={onTransitionChange}
          screens={screens}
          toggleScreenVisibility={toggleScreenVisibility}
          toggleAllScreens={toggleAllScreens}
          autoplayInterval={autoplayInterval}
          toggleAutoplay={toggleAutoplay}
          isAutoplaying={isAutoplaying}
          toggleAutoplayInterval={toggleAutoplayInterval}
          onOpenTutorial={handleOpenTutorial}
          audioSourceURL={currentAudioSrc}
          audioLoop={currentAudioLoop}
          audioTracks={currentAudioTracks}
          allowContinuousAudio={autoplayEnded}
          editModeBackground={editModeBackground}
          panelBackground={panelBackground}
          panelBorderColor={panelBorderColor}
        />
      )}

      <CueAudioPlayers
        tracks={currentAudioTracks}
        shouldAutoPlay={
          isShowMode
            ? isAudioArmed && audioAdvanceMode === "auto"
            : isAutoplaying
        }
        allowContinuousAudio={autoplayEnded}
        manuallyPlayingTrackIds={
          isShowMode ? manuallyPlayingTrackIds : undefined
        }
      />

      <TutorialGuide
        steps={presentationTutorialSteps}
        isOpen={isTutorialOpen}
        onClose={() => setIsTutorialOpen(false)}
        storageKey={"hasSeenHelp_presentation"}
      />

      {isPreparingShow && (
        <Box
          position="fixed"
          inset={0}
          zIndex={2000}
          bg="blackAlpha.800"
          display="flex"
          alignItems="center"
          justifyContent="center"
        >
          <VStack spacing={4} color="white" width="360px">
            <Text fontSize="lg" fontWeight="semibold">
              Préparation du show…
            </Text>
            <Box
              width="100%"
              height="10px"
              borderRadius="full"
              bg="whiteAlpha.300"
              overflow="hidden"
            >
              <Box
                width={`${
                  preloadProgress.total > 0
                    ? (preloadProgress.loaded / preloadProgress.total) * 100
                    : 0
                }%`}
                height="100%"
                borderRadius="full"
                bg="purple.300"
                transition="width 0.2s ease-out"
              />
            </Box>
            <Text fontSize="sm" opacity={0.8}>
              {preloadProgress.loaded}/{preloadProgress.total} médias chargés
            </Text>
            {preloadProgress.items.length > 0 && (
              <Box
                width="100%"
                maxHeight="200px"
                overflowY="auto"
                bg="whiteAlpha.100"
                borderRadius="md"
                p={2}
                textAlign="left"
              >
                {preloadProgress.items.map((item) => {
                  const status = getMediaItemStatus(item.url)
                  return (
                    <HStack
                      key={item.url}
                      spacing={2}
                      py="2px"
                      data-testid="preload-item"
                      data-status={status}
                    >
                      <Box
                        boxSize="8px"
                        borderRadius="full"
                        flexShrink={0}
                        bg={
                          status === "done"
                            ? "green.300"
                            : status === "failed"
                              ? "red.400"
                              : status === "loading"
                                ? "purple.300"
                                : "whiteAlpha.400"
                        }
                      />
                      <Text
                        fontSize="xs"
                        noOfLines={1}
                        color={
                          status === "failed" ? "red.300" : "whiteAlpha.900"
                        }
                      >
                        {item.label}
                      </Text>
                    </HStack>
                  )
                })}
              </Box>
            )}
          </VStack>
        </Box>
      )}

      {Object.keys(screens).map((screenNumber) => {
        const mirroredScreen = mirroring[screenNumber]
        const sourceScreen = mirroredScreen
          ? mirroredScreen
          : Number(screenNumber)
        const screenData = getActiveCuesForScreen(sourceScreen, cueIndex)

        return (
          <Screen
            key={screenNumber}
            screenData={screenData}
            screenNumber={screenNumber}
            isVisible={screens[screenNumber]}
            onClose={handleScreenClose}
            transitionType={transitionType}
            transitionAt={transitionAt}
            screenWidths={screenWidths}
            onWidthChange={handleScreenWidthChange}
            isBlackout={isBlackout}
            mediaUrlOverrides={frozenMediaUrls}
            outputAspectRatio={resolveScreenAspectRatio(
              screenAspectRatios,
              sourceScreen,
              outputAspectRatio
            )}
          />
        )
      })}
    </ReadOnlyProvider>
  )
}

export default EditModeContainer
