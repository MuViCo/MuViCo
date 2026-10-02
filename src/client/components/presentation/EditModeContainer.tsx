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

// Max media downloads in flight at once while preloading a show, so a
// presentation with dozens of cues doesn't open as many parallel requests.
const SHOW_PRELOAD_CONCURRENCY = 4

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

// Frozen media bytes, kept on disk and shared across windows and reloads.
// One cache per presentation, so leaving one behind is a single delete
// instead of hunting its entries down. Entries are keyed by storage id
// rather than URL: the presigned URL rotates on every presentation read,
// the id doesn't.
const MEDIA_DISK_CACHE_PREFIX = "muvico-show-media-v1-"
const mediaDiskCacheNameFor = (presentationId: string) =>
  `${MEDIA_DISK_CACHE_PREFIX}${presentationId}`
const MEDIA_DISK_CACHE_KEY_PREFIX = "/__muvico_media_cache__/"
const mediaDiskCacheKeyFor = (mediaId: string) =>
  `${MEDIA_DISK_CACHE_KEY_PREFIX}${encodeURIComponent(mediaId)}`
const mediaIdFromDiskCacheKey = (path: string) =>
  decodeURIComponent(path.slice(MEDIA_DISK_CACHE_KEY_PREFIX.length))

const getMediaDiskCache = async (
  presentationId: string
): Promise<Cache | null> => {
  if (typeof caches === "undefined") return null
  try {
    return await caches.open(mediaDiskCacheNameFor(presentationId))
  } catch (error) {
    console.warn("Show mode: media disk cache unavailable", error)
    return null
  }
}

// How many presentations keep their media on disk. Dropping every other
// presentation on the way in would make switching back and forth re-download
// everything, so keep the few most recent ones instead.
const MEDIA_DISK_CACHE_KEEP = 3

// Last-used timestamp, stored inside the cache it describes so it can't drift
// away from it and disappears with it.
const MEDIA_DISK_CACHE_STAMP_KEY = "/__muvico_last_used__"

const stampMediaDiskCache = async (cache: Cache) => {
  try {
    await cache.put(
      MEDIA_DISK_CACHE_STAMP_KEY,
      new Response(String(Date.now()))
    )
  } catch (error) {
    console.warn("Show mode: could not stamp media disk cache", error)
  }
}

const readMediaDiskCacheStamp = async (name: string): Promise<number> => {
  try {
    const cache = await caches.open(name)
    const stamp = await cache.match(MEDIA_DISK_CACHE_STAMP_KEY)
    if (!stamp) return 0
    return Number(await stamp.text()) || 0
  } catch {
    return 0
  }
}

// Media no cue references any more is dead weight, and editing a
// presentation is the only thing that can orphan it. Reconciling against the
// current cues also catches media removed from another tab or while the app
// was closed, which watching for changes would miss.
const reconcileMediaDiskCache = async (
  presentationId: string,
  liveMediaIds: Set<string>
) => {
  const cache = await getMediaDiskCache(presentationId)
  if (!cache) return
  try {
    const requests = await cache.keys()
    const orphaned = requests.filter((request) => {
      const path = new URL(request.url).pathname
      if (!path.startsWith(MEDIA_DISK_CACHE_KEY_PREFIX)) return false
      return !liveMediaIds.has(mediaIdFromDiskCacheKey(path))
    })
    await Promise.all(orphaned.map((request) => cache.delete(request)))
  } catch (error) {
    console.warn("Show mode: could not reconcile media disk cache", error)
  }
}

// Keeps the current presentation plus the most recently used ones, and drops
// the rest. Without this the browser accumulates one cache per presentation
// ever opened.
const pruneMediaDiskCaches = async (presentationId: string) => {
  if (typeof caches === "undefined") return
  try {
    const keep = mediaDiskCacheNameFor(presentationId)
    const names = (await caches.keys()).filter(
      (name) => name.startsWith(MEDIA_DISK_CACHE_PREFIX) && name !== keep
    )

    const stamped = await Promise.all(
      names.map(async (name) => ({
        name,
        lastUsed: await readMediaDiskCacheStamp(name),
      }))
    )

    // The current presentation holds one of the slots.
    const doomed = stamped
      .sort((a, b) => b.lastUsed - a.lastUsed)
      .slice(MEDIA_DISK_CACHE_KEEP - 1)

    await Promise.all(doomed.map(({ name }) => caches.delete(name)))
  } catch (error) {
    console.warn("Show mode: could not prune old media disk caches", error)
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

// Lightweight check for whether a URL's content has changed. Uses a 1-byte
// ranged GET rather than HEAD, which these presigned URLs always reject
// with a 403 since they are signed for GET. Fails soft (null) on any error
// -- callers treat "can't validate" as "assume unchanged" rather than
// breaking the freeze pipeline.
const fetchMediaValidators = async (
  url: string
): Promise<MediaValidators | null> => {
  try {
    const rangeResponse = await fetch(url, {
      headers: { Range: "bytes=0-0" },
      // Same opaque-cache trap as the download in freezeMediaUrl.
      cache: "reload",
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
  // Only what the preload is working on. How far along it is gets derived
  // from the media's own state, so the two can't disagree.
  const [preloadProgress, setPreloadProgress] = useState<{
    total: number
    items: Array<{ url: string; label: string }>
  }>({ total: 0, items: [] })
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

  useEffect(() => {
    const markUsedAndPrune = async () => {
      const cache = await getMediaDiskCache(id)
      if (cache) await stampMediaDiskCache(cache)
      await pruneMediaDiskCaches(id)
    }
    markUsedAndPrune()
  }, [id])

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
  // `mediaId` is the file's storage handle, used as the disk cache key so an
  // earlier download can be reused once its presigned `url` has rotated.
  const freezeMediaUrl = useCallback(
    (
      url: string,
      kind: "image" | "video" | "audio",
      mediaId: string
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
            // the recursive call below re-downloads it. Evict the disk copy
            // too, or a reload would bring the stale bytes right back.
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
            const diskCache = await getMediaDiskCache(id)
            await diskCache?.delete(mediaDiskCacheKeyFor(mediaId))
          })().finally(() => {
            mediaValidationPromisesRef.current.delete(url)
          })
          mediaValidationPromisesRef.current.set(url, validation)
        }

        return validation.then(() => freezeMediaUrl(url, kind, mediaId))
      }

      if (cached) {
        return cached
      }

      const promise = (async () => {
        const diskCacheKey = mediaDiskCacheKeyFor(mediaId)
        try {
          const diskCache = await getMediaDiskCache(id)
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

          // `cache: "reload"` is required, not an optimization. The editor
          // already showed these URLs through plain <img>/<video> tags,
          // whose no-cors requests leave an opaque response in the HTTP
          // cache. Reusing that entry here would fail the CORS check even
          // though the server sends the headers.
          const response = await fetch(url, { cache: "reload" })
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
    [id]
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

  // Counted from the media's own state rather than tracked alongside it, so
  // the overlay can't claim more media than it is preloading.
  const preloadDoneCount = preloadProgress.items.filter(
    (item) => getMediaItemStatus(item.url) === "done"
  ).length
  const preloadFailedCount = preloadProgress.items.filter(
    (item) => getMediaItemStatus(item.url) === "failed"
  ).length

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
      // Without an id the file still freezes, it just misses the disk cache.
      const id = file.id || file.url

      // Extension-aware checks, because a stale or missing file.type would
      // otherwise drop the file from the queue with no trace.
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
    const currentMediaIds = new Set<string>()
    collectMediaItems(cues || []).forEach(({ id: mediaId }, url) => {
      currentUrls.add(url)
      currentMediaIds.add(mediaId)
    })

    // An empty set here means the cues haven't loaded yet just as often as it
    // means every cue lost its media, and wiping a presentation's cache on a
    // transient empty render is far worse than keeping a few stale entries.
    if (currentMediaIds.size > 0) {
      reconcileMediaDiskCache(id, currentMediaIds)
    }

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
  }, [cues, collectMediaItems, id])

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

  // Leaving show mode doesn't cancel a running preload, so a quick exit and
  // re-entry leaves two of them writing to the same progress state. Only the
  // latest session id may update it; the older run finishes unnoticed.
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
      total,
      items: entries.map(([url, { label }]) => ({ url, label })),
    })
    setIsPreparingShow(true)

    let cursor = 0
    const worker = async () => {
      while (cursor < entries.length) {
        const [url, { kind, id }] = entries[cursor]
        cursor += 1
        await freezeMediaUrl(url, kind, id)
      }
    }
    await Promise.all(
      Array.from(
        { length: Math.min(SHOW_PRELOAD_CONCURRENCY, entries.length) },
        worker
      )
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
                    ? ((preloadDoneCount + preloadFailedCount) /
                        preloadProgress.total) *
                      100
                    : 0
                }%`}
                height="100%"
                borderRadius="full"
                bg="purple.300"
                transition="width 0.2s ease-out"
              />
            </Box>
            <Text fontSize="sm" opacity={0.8}>
              {preloadDoneCount}/{preloadProgress.total} médias chargés
              {preloadFailedCount > 0 &&
                ` (${preloadFailedCount} échec${preloadFailedCount > 1 ? "s" : ""})`}
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
                sx={{
                  scrollbarWidth: "thin",
                  scrollbarColor: "rgba(255, 255, 255, 0.25) transparent",
                  "&::-webkit-scrollbar": { width: "6px" },
                  "&::-webkit-scrollbar-track": { background: "transparent" },
                  "&::-webkit-scrollbar-thumb": {
                    background: "rgba(255, 255, 255, 0.25)",
                    borderRadius: "9999px",
                  },
                  "&::-webkit-scrollbar-thumb:hover": {
                    background: "rgba(255, 255, 255, 0.4)",
                  },
                  // Chrome draws stepper arrows at both ends unless they are
                  // explicitly removed.
                  "&::-webkit-scrollbar-button": {
                    display: "none",
                    width: 0,
                    height: 0,
                  },
                  "&::-webkit-scrollbar-corner": { background: "transparent" },
                }}
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
