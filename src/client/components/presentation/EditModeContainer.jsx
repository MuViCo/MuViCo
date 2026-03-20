import React, { useState, useRef, useCallback, useEffect } from "react"
import {
  Box,
  Text,
  ChakraProvider,
  extendTheme,
  useOutsideClick,
  useColorModeValue,
  IconButton,
  Button,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Portal
} from "@chakra-ui/react"
import "react-grid-layout/css/styles.css"
import { useDispatch, useSelector } from "react-redux"
import {
  updatePresentation,
  createCue,
  removeCue,
  updatePresentationSwappedCues,
  incrementIndexCount,
  decrementIndexCount,
  incrementScreenCount,
  decrementScreenCount,
  editCue,
  shiftPresentationIndexes,
  fetchPresentationInfo,
} from "../../redux/presentationReducer"
import { saveIndexCount, saveScreenCount } from "../../redux/presentationThunks"
import { createFormData } from "../utils/formDataUtils"
import presentationService from "../../services/presentation"
import ToolBox from "./ToolBox"
import GridLayoutComponent from "./GridLayoutComponent"
import StatusTooltip from "./StatusToolTip"
import CustomAlert from "../utils/CustomAlert"
import Dialog from "../utils/AlertDialog"
import { useCustomToast } from "../utils/toastUtils"
import { SpeakerIcon, SpeakerMutedIcon } from "../../lib/icons"
import { AddIcon, ChevronDownIcon, MinusIcon } from "@chakra-ui/icons"
import { Responsive, WidthProvider } from "react-grid-layout";
import "react-resizable/css/styles.css";
import {
  getAudioRow,
  isAudioMimeType,
  isImageOrVideoMimeType,
} from "../utils/fileTypeUtils"
import EditMode from "./EditMode"

const theme = extendTheme({})

const ResponsiveGridLayout = WidthProvider(Responsive)

// Screens display component
const ScreensDisplay = ({ screenCount = 3, cues = [], cueIndex = 0 }) => {
  // Get the current cue for the screen
  const getCurrentCueForScreen = (screenNumber) => {
    if (!cues || cues.length === 0) return null
    const cueForScreen = cues.find(cue => cue.screen === screenNumber && cue.index === cueIndex)
    return cueForScreen || null
  }

  return (
    <div style={{ display: "flex", justifyContent: "space-evenly", alignItems: "stretch", flexWrap: "wrap", backgroundColor: "", gap: "10px", padding: "10px", width: "100%", height: "100%" }}>
      {Array.from({ length: screenCount }).map((_, index) => {
        const screenNumber = index + 1
        const screenData = getCurrentCueForScreen(screenNumber)

        return (
          <div key={screenNumber} style={{ flex: 1, display: "flex", flexDirection: "column", backgroundColor: "black", color: "white", overflow: "hidden", position: "relative" }}>
            <div style={{ position: "absolute", top: "10px", left: "10px", zIndex: 10 }}>Screen {screenNumber}</div>
            {screenData && screenData.file ? (
              screenData.file.url ? (
                <img 
                  src={screenData.file.url} 
                  alt={screenData.name} 
                  style={{ width: "100%", height: "100%", objectFit: "contain" }}
                />
              ) : (
                <video 
                  src={screenData.file.url}
                  style={{ width: "100%", height: "100%", objectFit: "contain" }}
                  autoPlay
                  loop
                  muted
                />
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
    } = this.props
    const layouts = {
      lg: [
        { i: "a", x: 0, y: 0, w: 10, h: 5 },
        { i: "b", x: 0, y: 2, w: 10, h: 2, isResizable: false },
        { i: "c", x: 0, y: 2, w: 10, h: 10 },
        { i: "d", x: 10, y: 0, w: 2, h: 15 },
      ],
      md: [
        { i: "a", x: 0, y: 0, w: 8, h: 5 },
        { i: "b", x: 0, y: 2, w: 8, h: 2 , isResizable: false},
        { i: "c", x: 0, y: 2, w: 8, h: 10 },
        { i: "c", x: 8, y: 0, w: 2, h: 15 },
      ],
      sm: [
        { i: "a", x: 0, y: 0, w: 7, h: 3 },
        { i: "b", x: 0, y: 2, w: 7, h: 2 ,  isResizable: false},
        { i: "c", x: 0, y: 2, w: 7, h: 7 },
        { i: "d", x: 6, y: 6, w: 7, h: 7 },
      ],
      xs: [
        { i: "a", x: 0, y: 0, w: 4, h: 3 },
        { i: "b", x: 0, y: 2, w: 4, h: 2 ,  isResizable: false},
        { i: "c", x: 0, y: 2, w: 4, h: 7 },
        { i: "d", x: 2, y: 6, w: 4, h: 7 },
      ],
      xxs: [
        { i: "a", x: 0, y: 0, w: 2, h: 3 },
        { i: "b", x: 0, y: 2, w: 2, h: 2 ,  isResizable: false},
        { i: "c", x: 0, y: 2, w: 2, h: 2 },
        { i: "d", x: 0, y: 6, w: 2, h: 7 },
      ],
    }
    // Formatting the grid layout for the editor, using react-grid-layout. 
    // The layout is responsive and changes based on the screen size. 
    // Each grid item (a, b, c) represents a different component of the editor, 
    // such as the cue list, preview area, and toolbox.
    return (
      <div style={{ width: "100vw", minHeight: "100vh", backgroundColor: "lightgray" }}>
        <ResponsiveGridLayout
          className="layout"
          layouts={layouts}
          breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
          cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
          isDraggable={false}
          isResizable={true}
          resizeHandles={["s"]}
          autoSize={true}
          rowHeight={60}
          margin={[8, 8]}
          containerPadding={[8, 8]}
          style={{ width: "100%" }}
        >
          {/* todo fix shit */}
          <div style={{ backgroundColor: "" }} key="a">
            <ScreensDisplay screenCount={screenCount} cues={cues} cueIndex={cueIndex} />
          </div>
          <div style={{ backgroundColor: "gray" }} key="b">b</div>

          <div style={{ backgroundColor: ""}} key="c">
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
            
          <div style={{ backgroundColor: "black" }} key="d">d</div>
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
}) => {

  const dispatch = useDispatch()
  const presentation = useSelector((state) => state.presentation)
  const screenCount = presentation?.screenCount

  useEffect(() => {
    dispatch(fetchPresentationInfo(id))
  }, [id, dispatch])

  console.log("Rendering EditMode with cues:", id, cues, isToolboxOpen, isShowMode, cueIndex, isAudioMuted, indexCount)

  console.log("Fetched presentation info:", cues, presentation);

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
    />
  </>

  

}
export default EditModeContainer
