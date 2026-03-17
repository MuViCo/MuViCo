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

const theme = extendTheme({})

const ResponsiveGridLayout = WidthProvider(Responsive)



class MyFirstGrid extends React.Component {
  render() {
    const layouts = {
      lg: [
        { i: "a", x: 0, y: 0, w: 9, h: 2 },
        { i: "b", x: 0, y: 2, w: 9, h: 2 },
        { i: "c", x: 9, y: 0, w: 3, h: 6 },
      ],
      md: [
        { i: "a", x: 0, y: 0, w: 7, h: 2 },
        { i: "b", x: 0, y: 2, w: 7, h: 2 },
        { i: "c", x: 7, y: 0, w: 3, h: 6 },
      ],
      sm: [
        { i: "a", x: 0, y: 0, w: 4, h: 2 },
        { i: "b", x: 0, y: 2, w: 4, h: 2 },
        { i: "c", x: 0, y: 6, w: 4, h: 4 },
      ],
      xs: [
        { i: "a", x: 0, y: 0, w: 4, h: 2 },
        { i: "b", x: 0, y: 2, w: 4, h: 2 },
        { i: "c", x: 0, y: 6, w: 4, h: 4 },
      ],
      xxs: [
        { i: "a", x: 0, y: 0, w: 2, h: 2 },
        { i: "b", x: 0, y: 2, w: 2, h: 2 },
        { i: "c", x: 0, y: 6, w: 2, h: 4 },
      ],
    }

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
          <div style={{ backgroundColor: "gray" }} key="a">a</div>
          <div style={{ backgroundColor: "gray" }} key="b">b</div>
          <div style={{ backgroundColor: "black" }} key="c">c</div>
        </ResponsiveGridLayout>
      </div>
    )
  }
}

const EditMode = ({
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


return <>
  <MyFirstGrid />
</>

}
export default EditMode
