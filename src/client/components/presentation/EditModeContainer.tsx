/*
 * the main component for the presentation editor, responsible for rendering the overall layout and managing state for the editor.
 * It includes the header with presentation title and settings, the screen preview area, playback controls, and the workspace which contains the cue list and cue form.
 * It also handles interactions such as toggling screen visibility, autoplaying cues, and opening the tutorial guide.
 * The component uses react-grid-layout for responsive layout and Chakra UI for styling.
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Box, Button, FormLabel, HStack, Select } from "@chakra-ui/react"
import "react-grid-layout/css/styles.css"
import { useAppDispatch, useAppSelector } from "../../redux/hooks"
import { laneScreenFromKey } from "../utils/laneFocus"

import type { Dispatch, SetStateAction } from "react"
import type { Cue, CueUpdateInput, ScoreDocument } from "../../types"
import { fetchPresentationInfo } from "../../redux/presentationReducer"
import settingsIcon from "../../public/icons/Presentationsettings.svg"
import ClickablePopover from "../utils/ClickablePopover"
import EditMode from "./EditMode"
import EditorDock from "./EditorDock"
import PresentationPlaybackControls from "./PresentationPlaybackControls"
import PresentationTitle from "./PresentationTitle"
import StatusTooltip from "./StatusToolTip"
import Screen from "./Screen"
import TutorialGuide from "../tutorial/TutorialGuide"
import { presentationTutorialSteps } from "../data/tutorialSteps"
import { getAudioRow, isType, isAudioRow } from "../utils/fileTypeUtils"
import KeyboardHandler from "../utils/keyboardHandler"
import makeResizable from "../utils/ResizeElement"
import { ScreensDisplay } from "./ScreensDisplay"
import {
  buildCueVisualSpanMap,
  getCueVisualSpanFromMap,
} from "../utils/cueVisualSpanUtils"

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
}

interface AudioTrack {
  id: string
  src: string
  loop: boolean
  continuePlayback: boolean
  layer: number
  name: string
}

// setCueIndex stays in the container: EditorLayout navigates frames through
// updateCue rather than setting the index itself.
interface EditorLayoutProps
  extends Omit<EditModeContainerProps, "setCueIndex"> {
  presentationName: string
  screenCount: number
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
  onFocusLane: (laneKey: string | null) => void
  onSelectFrame: (index: number) => void
}

// Base component for different subcomponents of the editor
function EditorLayout(props: EditorLayoutProps) {
  const {
    id,
    presentationName,
    screenCount,
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
        <Button
          className="edit-mode-btn edit-mode-btn-tutorial"
          variant="muvico-secondary"
          onClick={onOpenTutorial}
        >
          Tutorial
        </Button>
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
          audioTracks={audioTracks as never[]}
          allowContinuousAudio={allowContinuousAudio}
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
}: EditModeContainerProps) => {
  const editModeBackground = "var(--muvico-canvas)"
  const panelBackground = "var(--muvico-surface)"
  const panelBorderColor = "var(--muvico-border)"

  const dispatch = useAppDispatch()
  const presentation = useAppSelector((state) => state.presentation)
  const presentationName = presentation?.name
  const screenCount = presentation?.screenCount

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
  const autoplayTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const audioPreloadedUrlsRef = useRef(new Set())
  const cueIndexRef = useRef(cueIndex)

  const cueVisualSpanMap = useMemo(
    () => buildCueVisualSpanMap(cues, indexCount),
    [cues, indexCount]
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
      const src = file?.url || (file?.name ? `/${file.name}` : "")

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

  const handleScreenClose = useCallback((screenNumber: number) => {
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

  useEffect(() => {
    const audioCues = (cues || []).filter(
      (cue) =>
        isAudioRow(cue.screen, screenCount) &&
        cue.file?.url &&
        isType.audio(cue.file)
    )

    audioCues.forEach((cue) => {
      const url = cue.file!.url as string
      if (audioPreloadedUrlsRef.current.has(url)) {
        return
      }

      const audio = new Audio()
      audio.src = url
      audio.preload = "auto"
      audio.load()

      audioPreloadedUrlsRef.current.add(url)
    })
  }, [cues, screenCount])

  useEffect(() => {
    dispatch(fetchPresentationInfo(id))
  }, [id, dispatch])

  useEffect(() => {
    const hasSeenTutorial = localStorage.getItem("hasSeenHelp_presentation")
    if (!hasSeenTutorial) {
      setIsTutorialOpen(true)
    }
  }, [])

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
    <>
      <EditorLayout
        id={id}
        presentationName={presentationName}
        screenCount={screenCount ?? 1}
        scores={presentation.scores}
        focusedLaneKey={focusedLaneKey}
        focusedScreen={focusedScreen}
        onFocusLane={setFocusedLaneKey}
        onSelectFrame={setCueIndex}
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

      <TutorialGuide
        steps={presentationTutorialSteps}
        isOpen={isTutorialOpen}
        onClose={() => setIsTutorialOpen(false)}
        storageKey={"hasSeenHelp_presentation"}
      />

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
            screenWidths={screenWidths}
            onWidthChange={handleScreenWidthChange}
          />
        )
      })}
    </>
  )
}

export default EditModeContainer
