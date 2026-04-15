import React, { useCallback, useEffect, forwardRef, useMemo, useRef, useState } from "react"
import {
  Box,
  Button,
  VStack,
  HStack,
  useColorModeValue,
} from "@chakra-ui/react"
import "react-grid-layout/css/styles.css"
import { useDispatch, useSelector } from "react-redux"
import {
  fetchPresentationInfo,
} from "../../redux/presentationReducer"
import settingsIcon from "../../public/icons/Presentationsettings.svg"
import { Responsive, WidthProvider } from "react-grid-layout"
import "react-resizable/css/styles.css"
import EditMode from "./EditMode"
import CuesForm from "./CuesForm"
import ShowModeButtons from "./ShowModeButtons"
import Screen from "./Screen"
import TutorialGuide from "../tutorial/TutorialGuide"
import { presentationTutorialSteps } from "../data/tutorialSteps"
import { isType } from "../utils/fileTypeUtils"
import KeyboardHandler from "../utils/keyboardHandler"
import { buildCueVisualSpanMap, getCueVisualSpanFromMap } from "../utils/cueVisualSpanUtils"


const ResponsiveGridLayout = WidthProvider(Responsive)

// Screens display component
const ScreensDisplay = ({
  screenCount = 3,
  cues = [],
  cueIndex = 0,
  indexCount = 0,
  editModeBackground,
  screens = {},
  toggleScreenVisibility = () => { },
}) => {
  const cueVisualSpanMap = useMemo(
    () => buildCueVisualSpanMap(cues, indexCount),
    [cues, indexCount]
  )

  const getCleanUrl = (file = {}) => {
    const url = file?.url || ""
    return String(url).split("?")[0].split("#")[0]
  }

  const isImageFile = (file = {}) => {
    if (isType.image(file)) return true
    return /\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i.test(getCleanUrl(file))
  }

  const isVideoFile = (file = {}) => {
    if (isType.video(file)) return true
    return /\.(mp4|webm|ogg|mov|m4v)$/i.test(getCleanUrl(file))
  }

  // Get the current cue for the screen
  const getCurrentCueForScreen = (screenNumber) => {
    if (!cues || cues.length === 0) return null

    const currentIndex = Number(cueIndex)

    const cueForScreen = cues
      .filter((cue) => Number(cue.screen) === Number(screenNumber))
      .sort((firstCue, secondCue) => Number(secondCue.index) - Number(firstCue.index))
      .find((cue) => {
        const cueStartIndex = Number(cue.index)
        const cueSpan = getCueVisualSpanFromMap(cue, cueVisualSpanMap)
        const cueEndIndex = cueStartIndex + cueSpan - 1
        return currentIndex >= cueStartIndex && currentIndex <= cueEndIndex
      })

    return cueForScreen || null
  }

  return (
    <div style={{ display: "flex", justifyContent: "space-evenly", alignItems: "stretch", flexWrap: "wrap", backgroundColor: editModeBackground, gap: "10px", padding: "10px", paddingBottom: "15px", width: "100%", height: "100%", overflow: "hidden" }}>
      {Array.from({ length: screenCount }).map((_, index) => {
        const screenNumber = index + 1
        const screenData = getCurrentCueForScreen(screenNumber)

        return (
          <div key={screenNumber} style={{ flex: 1, display: "flex", flexDirection: "column", backgroundColor: "black", color: "white", overflow: "hidden", position: "relative" }}>
            <div style={{ position: "absolute", top: "10px", left: "10px", zIndex: 10 }}>Screen {screenNumber}</div>
            <Button
              size="xs"
              colorScheme={screens[screenNumber] ? "red" : "purple"}
              onClick={() => toggleScreenVisibility(screenNumber)}
              style={{ position: "absolute", top: "10px", right: "10px", zIndex: 10 }}
            >
              {screens[screenNumber] ? "Close" : "Open"}
            </Button>
            {screenData ? (
              screenData?.file?.url ? (
                isImageFile(screenData.file) ? (
                  <img
                    src={screenData.file.url}
                    alt={screenData.name}
                    style={{ width: "100%", height: "100%", objectFit: "contain", aspectRatio: "16/9" }}
                  />
                ) : isVideoFile(screenData.file) ? (
                  <video
                    src={screenData.file.url}
                    style={{ width: "100%", height: "100%", objectFit: "contain", aspectRatio: "16/9" }}
                    autoPlay
                    loop
                    muted
                    playsInline
                  />
                ) : (
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", flex: 1 }}>
                    Unsupported content type
                  </div>
                )
              ) : (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flex: 1,
                    width: "100%",
                    height: "100%",
                    backgroundColor: screenData.color || "#333",
                  }}
                >

                </div>
              )
            ) : (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", flex: 1 }}>
                No content
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

// Custom resize handle component for the bottom edge (South) of the layout items.
const VSCodeVerticalHandle = forwardRef((props, ref) => {
  const { handleAxis, ...restProps } = props

  // Only render for the "South" (bottom) axis
  if (handleAxis !== "s") return null

  return (
    <div
      ref={ref}
      className="custom-bottom-handle"
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        bottom: "0px", // Centers the hit area on the bottom edge
        height: "16px",  // The "Hit Area"
        cursor: "ns-resize", // North-South resize cursor
        zIndex: 10,
        display: "flex",
        alignItems: "center",
        transition: "background 0.2s",
      }}
      {...restProps}
    >
      {/* The actual visible line */}
      <div className="visible-line" style={{
        width: "100%",
        height: "2px",
        backgroundColor: "transparent",
        transition: "background-color 0.2s"
      }} />

      <style>{`
            .custom-bottom-handle:hover .visible-line {
              background-color: #9244ff !important;
              }
              /* Keep the line purple while dragging */
              .react-resizable-prop-dragging .visible-line {
              background-color: #9244ff !important;
              }
          `}</style>
    </div>
  )
})


// Layout for different components of the editor
class MyFirstGrid extends React.Component {
  render() {
    const {
      id,
      screenCount,
      cues,
      isToolboxOpen,
      setIsToolboxOpen,
      isShowMode,
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
      toggleScreenMirroring = () => { },
      toggleAllScreens = () => { },
      mirroring = {},
      autoplayInterval = 1,
      toggleAutoplay = () => { },
      isAutoplaying = false,
      toggleAutoplayInterval = () => { },
      onOpenTutorial = () => { },
      editModeBackground,
      panelBackground,
      outlineColor,
    } = this.props

    const safeScreenCount = Number(screenCount) || 1
    const timelineRows = safeScreenCount + 2 // screen rows + audio row + frame header row
    const timelineHeightPx = (timelineRows * 110) + 20 // row(100px) + gap(10px) + buffer
    const rowStepPx = 75 // react-grid rowHeight(60) + vertical margin(15)
    const editWorkspaceRowsWide = Math.max(10, Math.ceil(timelineHeightPx / rowStepPx))
    const editWorkspaceRowsNarrow = editWorkspaceRowsWide + 6 // room for media pool under timeline

    const layouts = {
      lg: [
        { i: "header", x: 0, y: 0, w: 16, h: 1, isResizable: false, resizeHandles: [] },
        { i: "screensPreview", x: 0, y: 0, w: 16, h: 5 },
        { i: "showModeControls", x: 0, y: 6, w: 16, h: 1, isResizable: false, resizeHandles: [] },
        { i: "editWorkspace", x: 0, y: 6, w: 16, h: editWorkspaceRowsWide },
      ],
      md: [
        { i: "header", x: 0, y: 0, w: 16, h: 1, isResizable: false, resizeHandles: [] },
        { i: "screensPreview", x: 0, y: 0, w: 16, h: 5 },
        { i: "showModeControls", x: 0, y: 6, w: 16, h: 1, isResizable: false, resizeHandles: [] },
        { i: "editWorkspace", x: 0, y: 6, w: 16, h: editWorkspaceRowsWide },
        // { i: "header", x: 0, y: 0, w: 12, h: 1, isResizable: false, resizeHandles: [] },
        // { i: "screensPreview", x: 0, y: 0, w: 12, h: 5 },
        // { i: "showModeControls", x: 0, y: 6, w: 12, h: 1, isResizable: false, resizeHandles: [] },
        // { i: "editWorkspace", x: 0, y: 7, w: 8, h: 14 },
        // { i: "cueEditorForm", x: 8, y: 7, w: 4, h: 14, isResizable: false, resizeHandles: [] },
      ],
      sm: [
        { i: "header", x: 0, y: 0, w: 16, h: 1, isResizable: false, resizeHandles: [] },
        { i: "screensPreview", x: 0, y: 0, w: 16, h: 5 },
        { i: "showModeControls", x: 0, y: 6, w: 16, h: 1, isResizable: false, resizeHandles: [] },
        { i: "editWorkspace", x: 7, y: 0, w: 16, h: editWorkspaceRowsNarrow },
        // { i: "header", x: 0, y: 0, w: 6, h: 1, isResizable: false, resizeHandles: [] },
        // { i: "screensPreview", x: 0, y: 0, w: 6, h: 5 },
        // { i: "showModeControls", x: 0, y: 2, w: 6, h: 1, isResizable: false, resizeHandles: [] },
        // { i: "editWorkspace", x: 0, y: 2, w: 6, h: 14 },
        // { i: "cueEditorForm", x: 0, y: 7, w: 7, h: 7, isResizable: false, resizeHandles: [] },

      ],
      xs: [
        { i: "header", x: 0, y: 0, w: 16, h: 1, isResizable: false, resizeHandles: [] },
        { i: "screensPreview", x: 0, y: 0, w: 16, h: 5 },
        { i: "showModeControls", x: 0, y: 6, w: 16, h: 1, isResizable: false, resizeHandles: [] },
        { i: "editWorkspace", x: 7, y: 0, w: 16, h: editWorkspaceRowsNarrow },
        // { i: "header", x: 0, y: 0, w: 4, h: 1, isResizable: false, resizeHandles: [] },
        // { i: "screensPreview", x: 0, y: 0, w: 4, h: 5 },
        // { i: "showModeControls", x: 0, y: 2, w: 4, h: 1, isResizable: false, resizeHandles: [] },
        // { i: "editWorkspace", x: 0, y: 2, w: 4, h: 14 },
        // { i: "cueEditorForm", x: 0, y: 7, w: 4, h: 7, isResizable: false, resizeHandles: [] },
      ],
      // xxs: [
      //   { i: "header", x: 0, y: 0, w: 2, h: 1, isResizable: false, resizeHandles: [] },
      //   { i: "screensPreview", x: 0, y: 0, w: 2, h: 5 },
      //   { i: "showModeControls", x: 0, y: 2, w: 2, h: 1, isResizable: false, resizeHandles: [] },
      //   { i: "editWorkspace", x: 0, y: 2, w: 2, h: 14 },
      //   { i: "cueEditorForm", x: 0, y: 7, w: 2, h: 7, isResizable: false, resizeHandles: [] },
      // ],
    }



    // Formatting the grid layout for the editor, using react-grid-layout. 
    // The layout is responsive and changes based on the screen size. 
    // Each grid item (a, b, c) represents a different component of the editor, 
    // such as the cue list, preview area, and toolbox.
    return (
      <div style={{ width: "100%", minHeight: "100vh", backgroundColor: editModeBackground }}>
        <style>{`
          .no-resize-handle .react-resizable-handle {
            display: none !important;
          }
        `}</style>
        <ResponsiveGridLayout
          className="layout"
          layouts={layouts}
          breakpoints={{ lg: 1200, md: 1200, sm: 700, xs: 600 }}
          cols={{ lg: 16, md: 16, sm: 16, xs: 16 }}
          rows={{ lg: 20, md: 20, sm: 20, xs: 20 }}
          isDraggable={false}
          isResizable={true}
          resizeHandles={["s"]}
          autoSize={true}
          rowHeight={60}
          margin={[15, 15]}
          containerPadding={[80, 8]}
          resizeHandle={(axis, ref) => <VSCodeVerticalHandle handleAxis={axis} ref={ref} />}

          style={{ width: "100%", backgroundColor: editModeBackground }}
        >

          <Box
            display="flex"
            alignItems="center"
            gap="12px"
            padding="12px 20px"
            backgroundColor={panelBackground}
            outline={outlineColor}
            borderRadius="8px"
            key="header"
          >
            <Button
              aria-label="Presentation Settings"
              className="edit-mode-btn edit-mode-btn-settings"
            >
              <img src={settingsIcon} alt="" width="24" height="24" />
            </Button>
            <Button className="edit-mode-btn edit-mode-btn-show-mode">
              Go to Show Mode
            </Button>
            <Box as="h1" fontSize="30px" margin="0" fontWeight="bold">
              EDIT MODE
            </Box>
            <Button
              className="edit-mode-btn edit-mode-btn-tutorial"
              onClick={onOpenTutorial}
            >
              Tutorial
            </Button>
          </Box>

          <div style={{ backgroundColor: panelBackground, outline: outlineColor, borderRadius: "8px" }} classname="screenspreview" key="screensPreview">
            <ScreensDisplay
              screenCount={screenCount}
              cues={cues}
              cueIndex={cueIndex}
              indexCount={indexCount}
              editModeBackground={panelBackground}
              screens={screens}
              toggleScreenVisibility={toggleScreenVisibility}
            />

          </div>
          <div style={{ backgroundColor: editModeBackground, borderRadius: "8px" }} className="no-resize-handle" key="showModeControls">
            <KeyboardHandler
              onNext={() => updateCue("Next")}
              onPrevious={() => updateCue("Previous")}
            />
            <ShowModeButtons
              screens={screens}
              toggleScreenVisibility={toggleScreenVisibility}
              toggleScreenMirroring={toggleScreenMirroring}
              toggleAllScreens={toggleAllScreens}
              mirroring={mirroring}
              cueIndex={cueIndex}
              updateCue={updateCue}
              indexCount={indexCount}
              autoplayInterval={autoplayInterval}
              toggleAutoplay={toggleAutoplay}
              isAutoplaying={isAutoplaying}
              toggleAutoplayInterval={toggleAutoplayInterval}

            />
          </div>

          <div style={{}} className="edit-workspace" key="editWorkspace">
            <div style={{}}>
              <div className="edit-mode-workspace">

                <div className="edit-mode-timeline" style={{
                  overflow: "scroll", height: "100%", width: "100%", outline: "outlineColor", borderRadius: "8px", backgroundColor: "panelBackground", boxSizing: "border-box", flexGrow: "1"
                }}>

                  <EditMode
                    id={id}
                    cues={cues}
                    isToolboxOpen={isToolboxOpen}
                    setIsToolboxOpen={setIsToolboxOpen}
                    isShowMode={isShowMode}
                    cueIndex={cueIndex}
                    isAudioMuted={isAudioMuted}
                    toggleAudioMute={toggleAudioMute}
                    indexCount={indexCount}
                  />
                </div>

                <div className="edit-mode-cue-form" style={{
                  height: "100%", outline: "outlineColor", borderRadius: "8px", backgroundColor: "panelBackground", boxSizing: "border-box", padding: "10px", paddingLeft: "5px", paddingTop: "5px", paddingRight: "5px",
                  paddingBottom: "5px"
                }}>

                  {/* <div style={{ backgroundColor: panelBackground, outline: outlineColor, paddingLeft: "25px", paddingTop: "25px", paddingRight: "25px", borderRadius: "8px" }} className="no-resize-handle force-no-resize" key="cueEditorForm"> */}
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
                  {/* </div> */}
                </div>
              </div>
            </div>
          </div>

        </ResponsiveGridLayout>
      </div>
    )
  }
}



const EditModeContainer = ({
  id,
  cues,
  isToolboxOpen,
  setIsToolboxOpen,
  isShowMode,
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
  const screenCount = presentation?.screenCount

  const [screens, setScreens] = useState({})
  const [mirroring, setMirroring] = useState({})
  const [isAutoplaying, setIsAutoplaying] = useState(false)
  const [autoplayInterval, setAutoplayInterval] = useState(5)
  const [isTutorialOpen, setIsTutorialOpen] = useState(false)
  const autoplayTimerRef = useRef(null)
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
    const screenNumbers = [...new Set((cues || []).map((cue) => cue.screen))]
    const visibility = {}
    screenNumbers.forEach((screenNumber) => {
      visibility[screenNumber] = false
    })
    setScreens(visibility)
    setMirroring({})
  }, [cues])

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

  const toggleScreenMirroring = (screenNumber, targetScreen) => {
    setMirroring((prevMirroring) => {
      const updatedMirroring = { ...prevMirroring }
      if (targetScreen) {
        updatedMirroring[screenNumber] = targetScreen
      } else {
        delete updatedMirroring[screenNumber]
      }
      return updatedMirroring
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

  console.log("Rendering EditMode with cues:", id, cues, isToolboxOpen, isShowMode, cueIndex, isAudioMuted, indexCount)

  console.log("Fetched presentation info:", cues, presentation)


  return <>
    <MyFirstGrid
      id={id}
      screenCount={screenCount}
      cues={cues}
      isToolboxOpen={isToolboxOpen}
      setIsToolboxOpen={setIsToolboxOpen}
      isShowMode={isShowMode}
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
      toggleScreenMirroring={toggleScreenMirroring}
      toggleAllScreens={toggleAllScreens}
      mirroring={mirroring}
      autoplayInterval={autoplayInterval}
      toggleAutoplay={toggleAutoplay}
      isAutoplaying={isAutoplaying}
      toggleAutoplayInterval={toggleAutoplayInterval}
      onOpenTutorial={handleOpenTutorial}
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
