import React, { useCallback, useEffect, useMemo, useRef, useState } from "react"
import {
  Box,
  Button,
  useColorModeValue,
} from "@chakra-ui/react"
import "react-grid-layout/css/styles.css"
import { useDispatch, useSelector } from "react-redux"
import {
  fetchPresentationInfo,
} from "../../redux/presentationReducer"
import settingsIcon from "../../public/icons/Presentationsettings.svg"
import EditMode from "./EditMode"
import CuesForm from "./CuesForm"
import PresentationPlaybackControls from "./PresentationPlaybackControls"
import PresentationTitle from "./PresentationTitle"
import Screen from "./Screen"
import TutorialGuide from "../tutorial/TutorialGuide"
import { presentationTutorialSteps } from "../data/tutorialSteps"
import { getAudioRow, isType, isAudioRow } from "../utils/fileTypeUtils"
import KeyboardHandler from "../utils/keyboardHandler"
import makeResizable from "../utils/ResizeElement"
import { ScreensDisplay } from "./ScreensDisplay"


// Base component for different subcomponents of the editor
function EditorLayout(props) {
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
    addCue = () => { },
    onClose = () => { },
    position,
    cueData,
    updateCue = () => { },
    isAudioMode = false,
    screens = {},
    toggleScreenVisibility = () => { },
    toggleAllScreens = () => { },
    autoplayInterval = 1,
    toggleAutoplay = () => { },
    isAutoplaying = false,
    audioSourceURL = "",
    toggleAutoplayInterval = () => { },
    onOpenTutorial = () => { },
    editModeBackground,
    panelBackground,
    outlineColor,
  } = props


  useEffect(() => {
    const screen_preview_element = document.querySelector("#screen_preview")
    const resize_handle_element = document.querySelector("#screen_resize_handle")

    makeResizable(screen_preview_element, resize_handle_element) // Using the entire container as the handle for resizing

    const timeline_element = document.querySelector("#timeline")
    const timeline_resize_handle_element = document.querySelector("#timeline_resize_handle")

    makeResizable(timeline_element, timeline_resize_handle_element) // Using the entire container as the handle for resizing
  }, [])


  // Formatting the grid layout for the editor, using react-grid-layout. 
  // The layout is responsive and changes based on the screen size. 
  // Each grid item (a, b, c) represents a different component of the editor, 
  // such as the cue list, preview area, and toolbox.
  return (
    <div style={{ width: "100%", minHeight: "100vh", backgroundColor: editModeBackground, display: "flex", flexDirection: "column", gap: "2rem", padding: "2rem" }}>
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
        <Button
          aria-label="Presentation Settings"
          className="edit-mode-btn edit-mode-btn-settings"
        >
          <img src={settingsIcon} alt="" width="24" height="24" />
        </Button>
        <Box position="absolute" left="50%" transform="translateX(-50%)">
          <PresentationTitle
            id={id}
            presentationName={presentationName}
          />
        </Box>
        <Button
          className="edit-mode-btn edit-mode-btn-tutorial"
          onClick={onOpenTutorial}
        >
          Tutorial
        </Button>
      </Box>

      <div id="screen_preview" style={{ backgroundColor: panelBackground, outline: outlineColor, borderRadius: "8px" }} className="screenspreview" key="screensPreview">
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
      <div style={{ backgroundColor: editModeBackground, borderRadius: "8px" }} className="no-resize-handle" key="playbackControls">
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
        />
      </div>

      <div className="edit-workspace" key="editWorkspace">
        <div>
          <div className="edit-mode-workspace">

            <div id="timeline" className="edit-mode-timeline" style={{
              height: "100%", width: "100%", outline: outlineColor, borderRadius: "8px", backgroundColor: panelBackground, boxSizing: "border-box", flexGrow: "1"
            }}>

              <div id="edit-mode-scroll" >
                <EditMode
                  id={id}
                  cues={cues}
                  isToolboxOpen={isToolboxOpen}
                  setIsToolboxOpen={setIsToolboxOpen}
                  cueIndex={cueIndex}
                  isAudioMuted={isAudioMuted}
                  toggleAudioMute={toggleAudioMute}
                  indexCount={indexCount}
                  style={{ zIndex: 1 }}
                />

              </div>
              <div id="timeline_resize_handle" className="resize_handle"></div>

            </div>

            <div className="edit-mode-cue-form" style={{
              height: "100%", outline: outlineColor, borderRadius: "8px", backgroundColor: panelBackground, boxSizing: "border-box", padding: "10px", paddingLeft: "5px", paddingTop: "5px", paddingRight: "5px",
              paddingBottom: "5px"
            }}>
              <CuesForm
                className="cue-editor-form"
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


const EditModeContainer = ({
  id,
  cues,
  isToolboxOpen,
  setIsToolboxOpen,
  transitionType,
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
}) => {
  const editModeBackground = useColorModeValue("#ffffff", "#120d14")
  const panelBackground = useColorModeValue("#eedef7", "#312238")
  const outlineColor = useColorModeValue("2px solid #572b6e", "2px solid #572b6e")

  const dispatch = useDispatch()
  const presentation = useSelector((state) => state.presentation)
  const presentationName = presentation?.name
  const screenCount = presentation?.screenCount

  const [screens, setScreens] = useState({})
  const [mirroring, setMirroring] = useState({})
  const [isAutoplaying, setIsAutoplaying] = useState(false)
  const [autoplayInterval, setAutoplayInterval] = useState(5)
  const [isTutorialOpen, setIsTutorialOpen] = useState(false)
  const autoplayTimerRef = useRef(null)
  const audioPreloadedUrlsRef = useRef(new Set())
  const cueIndexRef = useRef(cueIndex)

  const cuesByScreen = useMemo(() => {
    return (cues || []).reduce((acc, cue) => {
      if (!acc[cue.screen]) {
        acc[cue.screen] = {}
      }
      acc[cue.screen][cue.index] = cue
      return acc
    }, {})
  }, [cues])

  useEffect(() => {
    const screenNumbers = [...new Set(
      (cues || [])
        .filter((cue) => !isAudioRow(cue.screen, screenCount))
        .map((cue) => cue.screen)
    )]
    const visibility = {}
    screenNumbers.forEach((screenNumber) => {
      visibility[screenNumber] = false
    })
    setScreens(visibility)
    setMirroring({})
  }, [cues, screenCount])

  const toggleScreenVisibility = (screenNumber) => {
    setScreens((prev) => ({
      ...prev,
      [screenNumber]: !prev[screenNumber],
    }))
  }

  const toggleAllScreens = () => {
    setScreens((prev) => {
      const updated = { ...prev }
      const allScreenNumbers = Object.keys(updated)
      const hasOpenScreen = allScreenNumbers.some((screenNumber) => updated[screenNumber])

      allScreenNumbers.forEach((screenNumber) => {
        updated[screenNumber] = !hasOpenScreen
      })

      return updated
    })
  }

  const getLastValidCue = (screenNumber, index) => {
    let currentIndex = index

    while (currentIndex >= 0) {
      if (cuesByScreen[screenNumber]?.[currentIndex]) {
        return cuesByScreen[screenNumber][currentIndex]
      }
      currentIndex -= 1
    }

    return {}
  }

  const audioRow = getAudioRow(screenCount)
  const currentAudioCue = getLastValidCue(audioRow, cueIndex)
  const currentAudioFile = currentAudioCue?.file
  const currentAudioSrc = currentAudioFile?.url || (currentAudioFile?.name ? `/${currentAudioFile.name}` : "")
  const isCurrentCueAudio = Boolean(currentAudioCue && isType.audio(currentAudioFile))

  const handleScreenClose = useCallback((screenNumber) => {
    setScreens((prev) => ({
      ...prev,
      [screenNumber]: false,
    }))
  }, [])

  useEffect(() => {
    cueIndexRef.current = cueIndex
  }, [cueIndex])

  const toggleAutoplay = () => {
    setIsAutoplaying((prev) => {
      const next = !prev
      if (next && typeof setCueIndex === "function") {
        setCueIndex(0)
      }
      return next
    })
  }

  const toggleAutoplayInterval = (valueString) => {
    const parsed = Number(valueString)
    if (!Number.isFinite(parsed)) {
      return
    }

    setAutoplayInterval(Math.max(0.1, parsed))
  }

  const handleOpenTutorial = useCallback(() => {
    const helpButton = document.querySelector(".help-button")
    if (helpButton && typeof helpButton.click === "function") {
      helpButton.click()
      return
    }

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
        setIsAutoplaying(false)
        return
      }

      if (typeof setCueIndex === "function") {
        setCueIndex((prevIndex) => Math.min(indexCount - 1, prevIndex + 1))
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
      setIsAutoplaying(false)
    }
  }, [cueIndex, indexCount, isAutoplaying])

  useEffect(() => {
    const audioCues = (cues || []).filter((cue) =>
      isAudioRow(cue.screen, screenCount) && cue.file?.url && isType.audio(cue.file)
    )

    audioCues.forEach((cue) => {
      const url = cue.file.url
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


  return <>

    <EditorLayout
      id={id}
      presentationName={presentationName}
      screenCount={screenCount}
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
      screens={screens}
      toggleScreenVisibility={toggleScreenVisibility}
      toggleAllScreens={toggleAllScreens}
      autoplayInterval={autoplayInterval}
      toggleAutoplay={toggleAutoplay}
      isAutoplaying={isAutoplaying}
      toggleAutoplayInterval={toggleAutoplayInterval}
      onOpenTutorial={handleOpenTutorial}
      audioSourceURL={currentAudioSrc}
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
      const sourceScreen = mirroredScreen ? mirroredScreen : screenNumber
      const screenData = getLastValidCue(sourceScreen, cueIndex)

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
}

export default EditModeContainer
