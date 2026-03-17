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
import GridLayout from "react-grid-layout";
import "react-resizable/css/styles.css";
import {
  getAudioRow,
  isAudioMimeType,
  isImageOrVideoMimeType,
} from "../utils/fileTypeUtils"

const theme = extendTheme({})



class MyFirstGrid extends React.Component {
  render() {
    // layout is an array of objects, see the demo for more complete usage
    const layout = [
      { i: "a", x: 0, y: 0, w: 3, h: 1},
      { i: "b", x: 0, y: 1, w: 3, h: 1},
      { i: "c", x: 0, y: 2, w: 3, h: 1},
      { i: "d", x: 3, y: 0, w: 1, h: 10}
    ];
    return (
      <GridLayout
        className="layout"
        layout={layout}
        cols={4}
        maxRows={3}
        
        width={1920}
        style={{ backgroundColor: "lightgray" }}
        isDraggable={false}
        resizeHandles={[ "s" ]}
        autoSize={true}
      >
        <div style={{ backgroundColor:"gray"}}key="a">a</div>
        <div style={{ backgroundColor:"gray"}}key="b">b</div>
        <div style={{ backgroundColor:"gray"}}key="c">c</div>
        <div style={{ backgroundColor:"black"}}key="d">d</div>

      </GridLayout>
    );
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
