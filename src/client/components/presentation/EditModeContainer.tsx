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
  Select,
  useColorModeValue,
} from "@chakra-ui/react"
import "react-grid-layout/css/styles.css"
import { useAppDispatch, useAppSelector } from "../../redux/hooks"

import type { Dispatch, SetStateAction } from "react"
import type { Cue, CueUpdateInput } from "../../types"
import { fetchPresentationInfo } from "../../redux/presentationReducer"
import settingsIcon from "../../public/icons/Presentationsettings.svg"
import ClickablePopover from "../utils/ClickablePopover"
import EditMode from "./EditMode"
import CuesForm from "./CuesForm"
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
  allowContinuousAudio: boolean
  toggleAutoplayInterval: (valueString: string) => void
  onOpenTutorial: () => void
  editModeBackground: string
  panelBackground: string
  outlineColor: string
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
    allowContinuousAudio = false,
    toggleAutoplayInterval = () => {},
    onOpenTutorial = () => {},
    editModeBackground,
    panelBackground,
    outlineColor,
  } = props

  useEffect(() => {
    const panes = [
      ["#screen_preview", "#screen_resize_handle"],
      ["#timeline", "#timeline_resize_handle"],
    ]

    const disposers = panes.flatMap(([paneSelector, handleSelector]) => {
      const pane = document.querySelector<HTMLElement>(paneSelector)
      const handle = document.querySelector<HTMLElement>(handleSelector)
      return pane && handle ? [makeResizable(pane, handle)] : []
    })

    return () => disposers.forEach((dispose) => dispose())
  }, [])

  // Formatting the grid layout for the editor, using react-grid-layout.
  // The layout is responsive and changes based on the screen size.
  // Each grid item (a, b, c) represents a different component of the editor,
  // such as the cue list, preview area, and toolbox.
  return (
    <div
      style={{
        width: "100%",
        minHeight: "100vh",
        backgroundColor: editModeBackground,
        display: "flex",
        flexDirection: "column",
        gap: "2rem",
        padding: "2rem",
      }}
    >
      <Box
        display="flex"
        alignItems="center"
        justifyContent="space-between"
        gap="12px"
        padding="12px 20px"
        backgroundColor={panelBackground}
        outline={outlineColor}
        borderRadius="8px"
        position="relative"
        key="header"
      >
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
          >
            <img src={settingsIcon} alt="" width="24" height="24" />
          </Button>
        </ClickablePopover>

        <Box position="absolute" left="50%" transform="translateX(-50%)">
          <PresentationTitle id={id} presentationName={presentationName} />
        </Box>
        <Button
          className="edit-mode-btn edit-mode-btn-tutorial"
          onClick={onOpenTutorial}
        >
          Tutorial
        </Button>
      </Box>
      <div
        id="screen_preview"
        style={{
          backgroundColor: panelBackground,
          outline: outlineColor,
          borderRadius: "8px",
        }}
        className="screenspreview"
        key="screensPreview"
      >
        <ScreensDisplay
          screenCount={screenCount}
          cues={cues}
          cueIndex={cueIndex}
          indexCount={indexCount}
          editModeBackground={panelBackground}
          screens={screens}
          toggleScreenVisibility={toggleScreenVisibility}
        />

        <div id="screen_resize_handle" className="resize_handle"></div>
      </div>
      <div
        style={{
          backgroundColor: editModeBackground,
          borderRadius: "8px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
        className="no-resize-handle"
        key="playbackControls"
      >
        <KeyboardHandler
          onNext={() => updateCue("Next")}
          onPrevious={() => updateCue("Previous")}
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
          // PresentationPlaybackControls is still .jsx and defaults this prop
          // to [], which infers never[]. Drops away when it is migrated.
          audioTracks={audioTracks as never[]}
          allowContinuousAudio={allowContinuousAudio}
        />
        <Box mr={4}>
          <StatusTooltip />
        </Box>
      </div>

      <div className="edit-workspace" key="editWorkspace">
        <div>
          <div className="edit-mode-workspace">
            <div
              id="timeline"
              className="edit-mode-timeline"
              style={{
                height: "100%",
                width: "100%",
                outline: outlineColor,
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
                />
              </div>
              <div id="timeline_resize_handle" className="resize_handle"></div>
            </div>

            <div
              className="edit-mode-cue-form"
              style={{
                height: "100%",
                outline: outlineColor,
                borderRadius: "8px",
                backgroundColor: panelBackground,
                boxSizing: "border-box",
                padding: "10px",
                paddingLeft: "5px",
                paddingTop: "5px",
                paddingRight: "5px",
                paddingBottom: "5px",
              }}
            >
              <CuesForm
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
  const editModeBackground = useColorModeValue("#ffffff", "#120d14")
  const panelBackground = useColorModeValue("#eedef7", "#312238")
  const outlineColor = useColorModeValue(
    "2px solid #572b6e",
    "2px solid #572b6e"
  )

  const dispatch = useAppDispatch()
  const presentation = useAppSelector((state) => state.presentation)
  const presentationName = presentation?.name
  const screenCount = presentation?.screenCount

  const [screens, setScreens] = useState<Record<string, boolean>>({})
  const [mirroring, setMirroring] = useState<Record<string, number>>({})
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

  // Initialize screen visibility state based on cues and screen count
  // - creates a visibility object with keys for each screen number and
  // values set to false (hidden) by default, then updates the state whenever cues or screen count changes
  useEffect(() => {
    const screenNumbers: number[] = [
      ...new Set<number>(
        (cues || [])
          .filter((cue) => !isAudioRow(cue.screen, screenCount))
          .map((cue) => Number(cue.screen))
      ),
    ]
    const visibility: Record<string, boolean> = {}
    screenNumbers.forEach((screenNumber) => {
      visibility[screenNumber] = false
    })
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
      .filter((cue) => Number(cue.screen) === Number(screenNumber))
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
        setCueIndex(0)
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
        outlineColor={outlineColor}
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
          />
        )
      })}
    </>
  )
}

export default EditModeContainer
