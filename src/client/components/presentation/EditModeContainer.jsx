import React, { useEffect, forwardRef } from "react"
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
import { isType } from "../utils/fileTypeUtils"

const ResponsiveGridLayout = WidthProvider(Responsive)

// Screens display component
const ScreensDisplay = ({ screenCount = 3, cues = [], cueIndex = 0, editModeBackground }) => {
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
    const cueForScreen = cues.find(cue => cue.screen === screenNumber && cue.index === cueIndex)
    return cueForScreen || null
  }

  return (
    <div style={{ display: "flex", justifyContent: "space-evenly", alignItems: "stretch", flexWrap: "wrap", backgroundColor: editModeBackground, gap: "10px", padding: "10px", width: "100%", height: "100%", overflow: "hidden" }}>
      {Array.from({ length: screenCount }).map((_, index) => {
        const screenNumber = index + 1
        const screenData = getCurrentCueForScreen(screenNumber)

        return (
          <div key={screenNumber} style={{ flex: 1, display: "flex", flexDirection: "column", backgroundColor: "black", color: "white", overflow: "hidden", position: "relative" }}>
            <div style={{ position: "absolute", top: "10px", left: "10px", zIndex: 10 }}>Screen {screenNumber}</div>
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
      editModeBackground,
      panelBackground,
      outlineColor,
    } = this.props
    const layouts = {
      lg: [
        { i: "screensPreview", x: 0, y: 0, w: 12, h: 5 },
        { i: "showModeControls", x: 0, y: 5, w: 12, h: 1, isResizable: false, resizeHandles: [] },
        { i: "editWorkspace", x: 0, y: 7, w: 9, h: 10 },
        { i: "cueEditorForm", x: 9, y: 5, w: 3, h: 14, isResizable: false, resizeHandles: [] },
        { i: "header", x: 0, y: 0, w: 12, h: 1, isResizable: false, resizeHandles: [] },
      ],
      md: [
        { i: "screensPreview", x: 0, y: 0, w: 10, h: 5 },
        { i: "showModeControls", x: 0, y: 2, w: 10, h: 1, isResizable: false, resizeHandles: [] },
        { i: "editWorkspace", x: 0, y: 2, w: 10, h: 14 },
        { i: "cueEditorForm", x: 8, y: 7, w: 10, h: 14, isResizable: false, resizeHandles: [] },
        { i: "header", x: 0, y: 0, w: 10, h: 1, isResizable: false, resizeHandles: [] },
      ],
      sm: [
        { i: "screensPreview", x: 0, y: 0, w: 6, h: 5 },
        { i: "showModeControls", x: 0, y: 2, w: 6, h: 1, isResizable: false, resizeHandles: [] },
        { i: "editWorkspace", x: 0, y: 2, w: 6, h: 14 },
        { i: "cueEditorForm", x: 6, y: 6, w: 7, h: 7, isResizable: false, resizeHandles: [] },
        { i: "header", x: 0, y: 0, w: 6, h: 1, isResizable: false, resizeHandles: [] },

      ],
      xs: [
        { i: "screensPreview", x: 0, y: 0, w: 4, h: 5 },
        { i: "showModeControls", x: 0, y: 2, w: 4, h: 1, isResizable: false, resizeHandles: [] },
        { i: "editWorkspace", x: 0, y: 2, w: 4, h: 14 },
        { i: "cueEditorForm", x: 2, y: 6, w: 4, h: 7, isResizable: false, resizeHandles: [] },
        { i: "header", x: 0, y: 0, w: 4, h: 1, isResizable: false, resizeHandles: [] },
      ],
      xxs: [
        { i: "screensPreview", x: 0, y: 0, w: 2, h: 5 },
        { i: "showModeControls", x: 0, y: 2, w: 2, h: 1, isResizable: false, resizeHandles: [] },
        { i: "editWorkspace", x: 0, y: 2, w: 2, h: 14 },
        { i: "cueEditorForm", x: 0, y: 6, w: 2, h: 7, isResizable: false, resizeHandles: [] },
        { i: "header", x: 0, y: 0, w: 2, h: 1, isResizable: false, resizeHandles: [] },
      ],
    }



    // Formatting the grid layout for the editor, using react-grid-layout. 
    // The layout is responsive and changes based on the screen size. 
    // Each grid item (a, b, c) represents a different component of the editor, 
    // such as the cue list, preview area, and toolbox.
    return (
      <div style={{ width: "100vw", minHeight: "100vh", backgroundColor: editModeBackground }}>
        <style>{`
          .no-resize-handle .react-resizable-handle {
            display: none !important;
          }
        `}</style>
        <ResponsiveGridLayout
          className="layout"
          layouts={layouts}
          breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
          cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
          rows={{ lg: 20, md: 14, sm: 10, xs: 10, xxs: 10 }}
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
            <Button className="edit-mode-btn edit-mode-btn-tutorial">
              Tutorial
            </Button>
          </Box>
          
          <div style={{ backgroundColor: panelBackground, outline: outlineColor, borderRadius: "8px" }} key="screensPreview">
            <ScreensDisplay screenCount={screenCount} cues={cues} cueIndex={cueIndex} editModeBackground={panelBackground} />
            
          </div>
          <div style= {{ backgroundColor: editModeBackground, borderRadius: "8px" }} className="no-resize-handle" key="showModeControls">
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

          <div style={{ backgroundColor: "panelBackground",outline:"outlineColor",boxSizing: "border-box", paddingLeft: "5px", paddingTop: "5px", paddingRight: "5px", 
            paddingBottom: "5px", borderRadius: "8px"}}  key="editWorkspace">
            <div style={{overflow: "scroll", height:"100%", width:"100%",outline: outlineColor, borderRadius: "8px", backgroundColor: panelBackground, boxSizing: "border-box", padding: "10px" }}>
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
          </div>
          {/* <div
            style={{
              backgroundColor: panelBackground,
              outline: outlineColor,
              padding: "10px",
              borderRadius: "8px",
              boxSizing: "border-box",
              height: "100%",
              minHeight: 0,
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
            }}
            key="editWorkspace" */}
          
            {/* <EditMode
              id={id}
              cues={cues}
              isToolboxOpen={isToolboxOpen}
              setIsToolboxOpen={setIsToolboxOpen}
              isShowMode={isShowMode}
              cueIndex={cueIndex}
              isAudioMuted={isAudioMuted}
              toggleAudioMute={toggleAudioMute}
              indexCount={indexCount}
            /> */}
          {/* </div> */}
            
          <div style={{ backgroundColor: panelBackground, outline: outlineColor, paddingLeft: "25px", paddingTop: "25px", paddingRight: "25px", borderRadius: "8px" }} className="no-resize-handle" key="cueEditorForm">
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
  cueIndex,
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
  const editModeBackground = useColorModeValue("#a081b1", "#120d14")
  const panelBackground = useColorModeValue("#e2c4ee", "#312238")
  const outlineColor = useColorModeValue("2px solid #8f6ca1", "2px solid #572b6e")

  const dispatch = useDispatch()
  const presentation = useSelector((state) => state.presentation)
  const screenCount = presentation?.screenCount

  useEffect(() => {
    dispatch(fetchPresentationInfo(id))
  }, [id, dispatch])

  useEffect(() => {
    const previousBodyBackgroundColor = document.body.style.backgroundColor
    const previousBodyBackgroundImage = document.body.style.backgroundImage

    document.body.style.backgroundColor = editModeBackground
    document.body.style.backgroundImage = "none"

    return () => {
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
      editModeBackground={editModeBackground}
      panelBackground={panelBackground}
      outlineColor={outlineColor}
    />
  </>



}
export default EditModeContainer
