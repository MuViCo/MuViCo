import React, { useState, useRef, useEffect, useMemo } from "react"
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
  swapCues,
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
import useEditModeDragPreviewState from "./useEditModeDragPreviewState"
import useEditModeDragPreviewController from "./useEditModeDragPreviewController"
import { buildCueVisualSpanMap, getCueVisualSpanFromMap } from "../utils/cueVisualSpanUtils"
import { RowHeaders, ColumnHeaders } from "./EditModeHeaders"
import {
  getContinuationShrinkSpanOverrides,
  getCueTypeFromDragData,
  getDragDataFromDataTransfer,
} from "./editModeDragHelpers"
import StatusTooltip from "./StatusToolTip"
import CustomAlert from "../utils/CustomAlert"
import Dialog from "../utils/AlertDialog"
import { useCustomToast } from "../utils/toastUtils"
import { SpeakerIcon, SpeakerMutedIcon } from "../../lib/icons"
import { AddIcon, ChevronDownIcon, MinusIcon } from "@chakra-ui/icons"
import screenIcon from "../../public/icons/screen.svg"
import {
  getAudioRow,
  isCueTypeCompatibleWithRow,
  isInsidePresentationGridCell,
  isAudioMimeType,
  isImageOrVideoMimeType,
} from "../utils/fileTypeUtils"
import mediaStore from "./mediaFileStore"


const theme = extendTheme({})


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
  const bgColorHover = useColorModeValue(
    "rgba(154, 109, 151, 0.8)",
    "rgba(72, 26, 68, 0.8)"
  )
  const dragPreviewValidBg = useColorModeValue(
    "rgba(127, 212, 238, 0.18)",
    "rgba(127, 212, 238, 0.24)"
  )
  const dragPreviewInvalidBg = useColorModeValue(
    "rgba(229, 138, 156, 0.2)",
    "rgba(229, 138, 156, 0.28)"
  )
  const dragPreviewValidBorder = useColorModeValue("#7fd4ee", "#9be2f7")
  const dragPreviewInvalidBorder = useColorModeValue("#e58a9c", "#f0a2b1")
  const dragPreviewOriginBorder = useColorModeValue("#c9b7f8", "#d8c8ff")
  const bgColorIndex = useColorModeValue("rgb(240, 197, 255)", "gray.200")
  const bgCurrentFrame = useColorModeValue("purple.500", "purple.200")
  const showToast = useCustomToast()
  const dispatch = useDispatch()
  const presentation = useSelector((state) => state.presentation)
  const containerRef = useRef(null)

  const [status, setStatus] = useState("saved")
  const [selectedCue, setSelectedCue] = useState(null)

  const [doubleClickPosition, setDoubleClickPosition] = useState({
    xIndex: 0,
    yIndex: 0,
  })
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)
  const [confirmMessage, setConfirmMessage] = useState("")
  const [confirmAction, setConfirmAction] = useState(() => () => { })
  const [showAlert, setShowAlert] = useState(false)
  const [alertData, setAlertData] = useState({})

  const xLabels = useMemo(() => (
    Array.from({ length: indexCount }, (_, index) =>
      index === 0 ? "Frame 0" : `Frame ${index}`)
  ), [indexCount])
  const visualCues = useMemo(() => cues.filter(cue => cue.cueType === "visual"), [cues])

  const yLabels = useMemo(() => {
    const labels = Array.from(
      { length: presentation.screenCount },
      (_, index) => `Screen ${index + 1}`
    )

    // Add audio row separately (always at the end)
    labels.push("Audio files")
    return labels
  }, [presentation.screenCount])

  const [isDragging, setIsDragging] = useState(false)
  const [dragCursorMode, setDragCursorMode] = useState("default")
  const [isCopied, setIsCopied] = useState(false)
  const [copiedCue, setCopiedCue] = useState(null)
  const {
    poolDragPreviewCell,
    previewCueSpanOverrides,
    clearExternalDragPreview,
    clearInternalDragSpanPreview,
    setExternalDragSpanOverridesIfChanged,
    setInternalDragSpanOverridesIfChanged,
    setPoolDragPreviewCellIfChanged,
  } = useEditModeDragPreviewState()
  useOutsideClick({
    ref: containerRef,
    handler: () => {
      if (isCopied && !isConfirmOpen) {
        clearExternalPlacementPreview()
        showToast({
          title: "Cancelled copying",
          description: "Copying has been cancelled.",
          status: "info",
        })
        setDragCursorMode("default")
        setIsCopied(false)
        setCopiedCue(null)
        setShowAlert(false)
        setAlertData({})
      }
    },
  })

  const clickTimeout = useRef(null)
  const wasCopiedRef = useRef(false)
  const dragStartPointerRef = useRef(null)
  const dragHasMovedRef = useRef(false)
  const headerActionsRef = useRef({
    addIndex: () => { },
    removeIndex: () => { },
    increaseScreenCount: () => { },
    decreaseScreenCount: () => { },
    toggleAudioMute: () => { },
  })

  const columnWidth = 150
  const rowHeight = 100
  const gap = 10
  const frameHeaderHeight = Math.max(rowHeight - 45, 0)
  const dragPreviewYOffset = Math.max(rowHeight - frameHeaderHeight, 0)
  const dragCommitDistancePx = 4

  const cueVisualSpanMap = useMemo(() => buildCueVisualSpanMap(cues, indexCount), [cues, indexCount])

  const getCueEndIndex = (cue) => Number(cue.index) + getCueVisualSpanFromMap(cue, cueVisualSpanMap) - 1

  const cueOccupiesSlot = (cue, xIndex, yIndex) => (
    Number(cue.screen) === Number(yIndex) &&
    Number(xIndex) >= Number(cue.index) &&
    Number(xIndex) <= getCueEndIndex(cue)
  )

  const getCueAtPosition = (xIndex, yIndex) => (
    cues.find((cue) => cueOccupiesSlot(cue, xIndex, yIndex))
  )

  const getAnchorCueAtPosition = (xIndex, yIndex) => (
    cues.find(
      (cue) => Number(cue.index) === Number(xIndex) && Number(cue.screen) === Number(yIndex)
    )
  )

  const getContinuationPreviewSpanOverrides = (xIndex, yIndex, cueType, draggedCueId) => {
    return getContinuationShrinkSpanOverrides({
      xIndex,
      yIndex,
      cueType,
      draggedCueId,
      screenCount: presentation.screenCount,
      getCueAtPosition,
    })
  }

  const {
    hoverPreviewRef,
    dragCursorPreviewRef,
    dragPlacementPreviewRef,
    externalPlacementPreviewRef,
    hideHoverPreview,
    showHoverPreview,
    updateDragPreviewCell,
    hideDragPlacementPreview,
    hideExternalPlacementPreview,
    cancelDragPreviewFrame,
    clearExternalPlacementPreview,
    primeDragPreviewFromEvent,
    scheduleDragPreviewFromEvent,
    scheduleExternalPreviewFromEvent,
    resetDragPointerTracking,
    setDragPlacementLockedToAnchor,
  } = useEditModeDragPreviewController({
    containerRef,
    columnWidth,
    rowHeight,
    headerRowHeight: frameHeaderHeight,
    gap,
    indexCount,
    screenCount: presentation.screenCount,
    selectedCue,
    setDragCursorMode,
    clearExternalDragPreview,
    clearInternalDragSpanPreview,
    setExternalDragSpanOverridesIfChanged,
    setInternalDragSpanOverridesIfChanged,
    getContinuationPreviewSpanOverrides,
    dragPreviewValidBorder,
    dragPreviewInvalidBorder,
    dragPreviewValidBg,
    dragPreviewInvalidBg,
  })

  useEffect(() => {
    if (!isToolboxOpen) {
      setSelectedCue(null)
    }
  }, [isToolboxOpen])

  useEffect(() => {
    if (isDragging) {
      return
    }

    if (isCopied) {
      setDragCursorMode("copy")
      return
    }

    setDragCursorMode("default")
  }, [isCopied, isDragging])

  useEffect(() => {
    if (selectedCue && !cues.some((cue) => cue._id === selectedCue._id)) {
      setSelectedCue(null)
    }
  }, [cues, selectedCue])

  useEffect(() => {
    hideHoverPreview()
  }, [cues, indexCount, presentation.screenCount, isShowMode, hideHoverPreview])

  useEffect(() => {
    const clearTransientPreviews = () => {
      clearExternalDragPreview()
      hideHoverPreview()
    }

    window.addEventListener("drop", clearTransientPreviews)
    window.addEventListener("dragend", clearTransientPreviews)

    return () => {
      window.removeEventListener("drop", clearTransientPreviews)
      window.removeEventListener("dragend", clearTransientPreviews)
    }
  }, [clearExternalDragPreview, hideHoverPreview])

  const handleIndexHasData = async (index) => {
    setConfirmMessage(
      `Frame ${index} has existing elements. Deleting this frame will also delete all elements on this frame. Delete anyway?`
    )
    setConfirmAction(() => async () => {
      setIsConfirmOpen(false)

      // Remove all cues that are on the selected index
      const cuesOnIndex = cues.filter((c) => Number(c.index) === Number(index))
      for (const cue of cuesOnIndex) {
        try {
          await dispatch(removeCue(id, cue._id))
        } catch (err) {
          console.error("Failed to remove cue on index during confirm:", err)
        }
      }

      // Get all cues after this index, shift them to the left
      const cuesToShift = cues.filter((c) => Number(c.index) > Number(index))
      if (index !== indexCount - 1) {
        try {
          await dispatch(shiftPresentationIndexes(id, index, "left"))
          showToast({
            title: "Removed frame in between and its elements",
            description: `Removed old Frame ${index} and all its elements.${cuesToShift.length > 0 ? ` Moved ${cuesToShift.length} element(s) backwards.` : ""}`,
            status: "success",
          })
        } catch (err) {
          console.error("Failed to shift cues after deleting index:", err)
        }
      }

      // Remove last index
      await performRemoveIndex(indexCount - 1)
    })
    setIsConfirmOpen(true)
  }

  const handleAddIndex = async (index) => {
    const originalIndexCount = indexCount
    const cuesAfter = cues.filter((cue) => Number(cue.index) > Number(index))

    if (originalIndexCount < 101) {
      setStatus("loading")
      try {
        dispatch(incrementIndexCount())
        await dispatch(saveIndexCount({ id, indexCount: originalIndexCount + 1 }))

        const cuesToShift = cuesAfter.slice().sort((a, b) => Number(b.index) - Number(a.index))

        // Create new data for the elements in the new positions
        const updatePromises = cuesToShift.map((cue) => {
          const formData = createFormData(
            Number(cue.index) + 1,
            cue.name,
            cue.screen,
            cue.file,
            cue._id,
            cue.color,
            cue.loop
          )

          return presentationService.updateCue(id, cue._id, formData)
        })

        // We wait for all the promises to resolve
        const updatedCues = await Promise.all(updatePromises)

        // Then update cues
        for (const updated of updatedCues) {
          dispatch(editCue(updated))
        }

        setStatus("saved")
        if (cuesToShift.length > 0) {
          showToast({
            title: "Frame added in between",
            description: `Added a new frame after ${index === 0 ? "Starting Frame" : `Frame ${index}`}. Moved ${cuesToShift.length} element(s) forward.`,
            status: "success",
          })
        }
      } catch (error) {
        console.error("Error shifting cues when adding index:", error)
        dispatch(decrementIndexCount())
        await dispatch(saveIndexCount({ id, indexCount: originalIndexCount }))
        setStatus("saved")
        showToast({ title: "Error", description: error.message || "Failed to add index", status: "error" })
      }
    }
  }

  const handleRemoveIndex = async (index) => {
    if (indexCount <= 1) {
      showToast({
        title: "Minimum indexes required",
        description: "Cannot have less than 1 index",
        status: "warning",
      })
      return
    }

    const cuesInIndex = cues.filter((cue) => Number(cue.index) === Number(index))
    if (cuesInIndex.length > 0) {
      handleIndexHasData(index)
      return
    }

    // Get all cues after this index, shift them to the left
    const cuesAfter = cues.filter((cue) => Number(cue.index) > Number(index))

    if (cuesAfter.length === 0) {
      // Just remove last index if no cues to move
      await performRemoveIndex(indexCount - 1)
      return
    }

    setStatus("loading")
    try {
      const cuesToShift = cuesAfter.slice().sort((a, b) => Number(a.index) - Number(b.index))

      // Create new data for the elements in the new positions
      const updatePromises = cuesToShift.map((cue) => {
        const formData = createFormData(
          Number(cue.index) - 1,
          cue.name,
          cue.screen,
          cue.file,
          cue._id,
          cue.color,
          cue.loop
        )

        return presentationService.updateCue(id, cue._id, formData)
      })

      const updatedCues = await Promise.all(updatePromises)

      for (const updated of updatedCues) {
        dispatch(editCue(updated))
      }

      await performRemoveIndex(indexCount - 1)
      setStatus("saved")
      // We never reach here if there were existing elements on the removed index, as handleIndexHasData handles that case (so different toast)
      showToast({
        title: "Removed frame in between",
        description: `Removed old Frame ${index}. Moved ${cuesToShift.length} element(s) backwards.`,
        status: "success",
      })
    } catch (error) {
      console.error("Error shifting cues when removing index:", error)
      showToast({ title: "Error", description: error.message || "Failed to remove index", status: "error" })
      setStatus("saved")
    }
  }

  const performRemoveIndex = async (indexToRemove) => {
    if (indexCount > 1) {
      setStatus("loading")
      dispatch(decrementIndexCount())
      await dispatch(saveIndexCount({ id, indexCount: indexToRemove }))
      setStatus("saved")
    }
  }

  const handleIncreaseScreenCount = async () => {
    if (presentation.screenCount >= 8) {
      showToast({
        title: "Maximum screens reached",
        description: "Cannot add more than 8 screens",
        status: "warning",
      })
      return
    }

    try {
      const newScreenNumber = presentation.screenCount + 1
      const audioCues = cues.filter(cue => cue.cueType === "audio")

      dispatch(incrementScreenCount())
      await dispatch(saveScreenCount({ id, screenCount: newScreenNumber }))

      for (const audioCue of audioCues) {
        const updatedCue = {
          cueId: audioCue._id,
          cueName: audioCue.name,
          index: audioCue.index,
          screen: newScreenNumber + 1,
          file: audioCue.file,
          loop: audioCue.loop
        }
        await dispatch(updatePresentation(id, updatedCue))

        const updatedCueForState = {
          ...audioCue,
          screen: updatedCue.screen
        }
        dispatch(editCue(updatedCueForState))
      }

      if (audioCues.length > 0) {
        await dispatch(fetchPresentationInfo(id))
      }

      const formData = createFormData(
        0,
        `initial element for screen ${newScreenNumber}`,
        newScreenNumber,
        null
      )

      await dispatch(createCue(id, formData))

      showToast({
        title: "Screen added",
        description: `Screen ${newScreenNumber} has been added with initial element`,
        status: "success",
      })
    } catch (error) {
      dispatch(decrementScreenCount()) // Revert on error
      showToast({
        title: "Error",
        description: error.message || "Failed to add screen",
        status: "error",
      })
    }
  }

  const handleDecreaseScreenCount = async () => {
    if (presentation.screenCount <= 1) {
      showToast({
        title: "Minimum screens required",
        description: "Cannot have less than 1 screen",
        status: "warning",
      })
      return
    }

    const screenToRemove = presentation.screenCount
    const cuesOnScreen = visualCues.filter(cue => cue.screen === screenToRemove)

    if (cuesOnScreen.length > 0) {
      setConfirmMessage(
        `Screen ${screenToRemove} has existing elements. Deleting this screen will also delete all elements on this screen. Delete anyway?`
      )
      setConfirmAction(() => async () => {
        setIsConfirmOpen(false)
        await performScreenRemoval()
      })
      setIsConfirmOpen(true)
      return
    }

    await performScreenRemoval()
  }

  const performScreenRemoval = async () => {
    try {
      const currentScreenCount = presentation.screenCount
      const audioCues = cues.filter(cue => cue.cueType === "audio")

      dispatch(decrementScreenCount())
      const result = await dispatch(saveScreenCount({ id, screenCount: currentScreenCount - 1 }))

      for (const audioCue of audioCues) {
        const updatedCue = {
          cueId: audioCue._id,
          cueName: audioCue.name,
          index: audioCue.index,
          screen: (currentScreenCount - 1) + 1,
          file: audioCue.file,
          loop: audioCue.loop
        }

        await dispatch(updatePresentation(id, updatedCue))

        const updatedCueForState = {
          ...audioCue,
          screen: updatedCue.screen
        }
        dispatch(editCue(updatedCueForState))
      }

      if (audioCues.length > 0) {
        await dispatch(fetchPresentationInfo(id))
      }

      // Show appropriate message based on whether cues were removed
      const removedCuesCount = result.payload?.removedCuesCount || 0
      if (removedCuesCount > 0) {
        showToast({
          title: "Screen removed",
          description: `Screen ${currentScreenCount} removed along with ${removedCuesCount} cue(s)`,
          status: "success",
        })
      } else {
        showToast({
          title: "Screen removed",
          description: `Screen ${currentScreenCount} has been removed`,
          status: "success",
        })
      }
    } catch (error) {
      dispatch(incrementScreenCount()) // Revert on error
      showToast({
        title: "Error",
        description: error.message || "Failed to remove screen",
        status: "error",
      })
    }
  }

  const handleMouseDown = (event) => {
    if (event.button !== 0) {
      return
    }

    if (isCopied) {
      return
    }

    if (event.target.closest("button, [role='menuitem'], input, textarea, select, a")) {
      return
    }

    const { xIndex, yIndex } = getPosition(
      event,
      containerRef,
      columnWidth,
      rowHeight,
      gap
    )

    if (cueExists(xIndex, yIndex)) {
      const movingCue = getCueAtPosition(xIndex, yIndex)
      setSelectedCue(movingCue)
      updateDragPreviewCell({
        xIndex: Number(movingCue.index),
        yIndex: Number(movingCue.screen),
      })

      if (event.target.closest(".react-grid-item")) {
        event.preventDefault()
        setIsDragging(true)
        setDragCursorMode("grabbing")
        setDragPlacementLockedToAnchor(true)
        dragStartPointerRef.current = {
          clientX: event.clientX,
          clientY: event.clientY,
        }
        dragHasMovedRef.current = false
        hideHoverPreview()
        primeDragPreviewFromEvent(event)
      } else {
        setIsDragging(false)
        setDragCursorMode("default")
        setDragPlacementLockedToAnchor(false)
        dragStartPointerRef.current = null
        dragHasMovedRef.current = false
        updateDragPreviewCell(null)
        clearInternalDragSpanPreview()
        resetDragPointerTracking()
        hideDragPlacementPreview()
        cancelDragPreviewFrame()
      }
    }
  }

  const handlePaste = async (event) => {
    if (event.target.closest("button")) return
    if (!isCopied || !copiedCue) return

    if (event.target.closest(".x-index-label")) {
      clearExternalPlacementPreview()
      setDragCursorMode("default")
      setIsCopied(false)
      setCopiedCue(null)
      setShowAlert(false)
      setAlertData({})
      showToast({
        title: "Cancelled copying",
        description: "Copying has been cancelled.",
        status: "info",
      })
      return
    }

    if (!containerRef?.current) {
      console.error("Container ref is not available")
      return
    }

    const { xIndex, yIndex } = getPosition(
      event,
      containerRef,
      columnWidth,
      rowHeight,
      gap
    )

    const hoveredCue = getCueAtPosition(xIndex, yIndex)
    const isBlockedCell = Boolean(hoveredCue && hoveredCue._id === copiedCue._id)
    const isInsideGrid = isInsidePresentationGridCell({
      xIndex,
      yIndex,
      indexCount,
      screenCount: presentation.screenCount,
    })
    const isValidDropCell =
      isCueTypeCompatibleWithRow(copiedCue.cueType, yIndex, presentation.screenCount) &&
      !isBlockedCell

    if (!isInsideGrid) {
      clearExternalPlacementPreview()
      setDragCursorMode("default")
      setIsCopied(false)
      setCopiedCue(null)
      setShowAlert(false)
      setAlertData({})
      showToast({
        title: "Cancelled copying",
        description: "Copying has been cancelled.",
        status: "info",
      })
      return
    }

    if (isBlockedCell) {
      return
    }

    if (!isValidDropCell) {
      showToast({
        title: "Only audio files on the audio row.",
        description: "Click on an appropriate row to paste the element.",
        status: "error",
      })
      return
    }

    const newCueData = await createNewCueData(xIndex, yIndex, copiedCue)
    await addCue(newCueData)
    console.log("Pasted cue data: ", newCueData)
  }

  const updateCopiedCuePreview = (event) => {
    scheduleExternalPreviewFromEvent(event, {
      cueType: copiedCue?.cueType,
      draggedCueId: copiedCue?._id,
      idleCursor: "copy",
      isHeaderCell: Boolean(event.target.closest(".x-index-label")),
      isBlockedCell: (xIndex, yIndex) => {
        const hoveredCue = getCueAtPosition(xIndex, yIndex)
        return Boolean(hoveredCue && hoveredCue._id === copiedCue?._id)
      },
    })
  }

  const createNewCueData = async (xIndex, yIndex, copiedCue) => {
    let fileObj = null
    if (copiedCue.file) {

      fileObj = await fetchFileFromUrl(
        copiedCue.file.url,
        copiedCue.file.name
      )
      if (copiedCue.file.driveId) {
        fileObj.driveId = copiedCue.file.driveId
      }
    }


    return {
      index: xIndex,
      cueName: `${copiedCue.name} copy`,
      screen: yIndex,
      file: fileObj,
      fileName: copiedCue.file ? (copiedCue.file.name || "blank.png") : null,
      color: copiedCue.color,
      loop: copiedCue.loop,
    }
  }

  const resetDragInteraction = ({ clearSpanPreview = true } = {}) => {
    setIsDragging(false)
    setDragCursorMode("default")
    setDragPlacementLockedToAnchor(false)
    dragStartPointerRef.current = null
    dragHasMovedRef.current = false
    updateDragPreviewCell(null)
    if (clearSpanPreview) {
      clearInternalDragSpanPreview()
    }
    hideDragPlacementPreview()
    cancelDragPreviewFrame()
    resetDragPointerTracking()
  }

  const handleMouseMove = (event) => {
    if (isDragging) {
      if (!dragHasMovedRef.current && dragStartPointerRef.current) {
        const deltaX = event.clientX - dragStartPointerRef.current.clientX
        const deltaY = event.clientY - dragStartPointerRef.current.clientY
        if (Math.hypot(deltaX, deltaY) >= dragCommitDistancePx) {
          dragHasMovedRef.current = true
          setDragPlacementLockedToAnchor(false)
        }
      }

      scheduleDragPreviewFromEvent(event)

      hideHoverPreview()
      return
    }

    if (isCopied && copiedCue) {
      hideHoverPreview()
      updateCopiedCuePreview(event)
      return
    }

    if (event.target.closest(".x-index-label")) {
      hideHoverPreview()
      return
    }
    const { xIndex, yIndex } = getPosition(
      event,
      containerRef,
      columnWidth,
      rowHeight,
      gap
    )

    const cueExists = Boolean(getCueAtPosition(xIndex, yIndex))

    if (
      !cueExists &&
      xIndex >= 0 &&
      xIndex < indexCount &&
      yIndex <= getAudioRow(presentation.screenCount) &&
      yIndex >= 1
    ) {
      showHoverPreview(xIndex, yIndex)
    } else {
      hideHoverPreview()
    }
  }

  useEffect(() => {
    if (wasCopiedRef.current && !isCopied) {
      clearExternalPlacementPreview()
    }

    wasCopiedRef.current = isCopied
  }, [clearExternalPlacementPreview, isCopied])

  const handleMouseUp = async (event) => {
    const wasDragging = isDragging
    const dragStartPointer = dragStartPointerRef.current
    const didDragMove = Boolean(
      dragHasMovedRef.current ||
      (dragStartPointer &&
        Math.hypot(
          event.clientX - dragStartPointer.clientX,
          event.clientY - dragStartPointer.clientY
        ) >= dragCommitDistancePx)
    )
    resetDragInteraction({ clearSpanPreview: !wasDragging })
    const { xIndex, yIndex } = getPosition(
      event,
      containerRef,
      columnWidth,
      rowHeight,
      gap
    )

    if (wasDragging && selectedCue) {
      if (!didDragMove) {
        clearInternalDragSpanPreview()
        return
      }

      const targetCue = getAnchorCueAtPosition(xIndex, yIndex)
      if (targetCue && selectedCue !== targetCue) {
        await handleElementPositionChange(selectedCue, targetCue)
        clearInternalDragSpanPreview()
        return
      }

      const moveToSamePosition =
        Number(selectedCue.index) === Number(xIndex) &&
        Number(selectedCue.screen) === Number(yIndex)

      if (moveToSamePosition) {
        clearInternalDragSpanPreview()
        return
      }

      const isInsideGrid = isInsidePresentationGridCell({
        xIndex,
        yIndex,
        indexCount,
        screenCount: presentation.screenCount,
      })
      const isValidDropCell = isCueTypeCompatibleWithRow(
        selectedCue.cueType,
        yIndex,
        presentation.screenCount
      )

      if (!isInsideGrid) {
        clearInternalDragSpanPreview()
        return
      }

      if (!isValidDropCell) {
        showToast({
          title: "Cannot move this file type here",
          description: "Keep audio elements to the audio row and visual elements to the visual rows.",
          status: "error",
        })
        clearInternalDragSpanPreview()
        return
      }

      const movedCue = {
        ...selectedCue,
        index: xIndex,
        cueName: selectedCue.name,
        screen: yIndex,
      }

      setSelectedCue(null)
      await dispatchUpdateCue(selectedCue._id, movedCue)
      clearInternalDragSpanPreview()
      return
    }

    if (wasDragging) {
      clearInternalDragSpanPreview()
      return
    }

    if (!wasDragging) {
      if (clickTimeout.current) {
        clearTimeout(clickTimeout.current)
        clickTimeout.current = null
        handleDoubleClick(event)
      } else {
        clickTimeout.current = setTimeout(() => {
          clickTimeout.current = null
        }, 300)
      }
    }
  }

  const handleGridDragOver = (event) => {
    event.preventDefault()
    hideHoverPreview()

    if (isShowMode || !containerRef.current) {
      clearExternalDragPreview()
      return
    }

    const dragData = getDragDataFromDataTransfer(event.dataTransfer)
    const dragCueType = getCueTypeFromDragData(dragData)
    if (!dragCueType) {
      clearExternalDragPreview()
      return
    }

    const { xIndex, yIndex } = getPosition(
      event,
      containerRef,
      columnWidth,
      rowHeight,
      gap
    )

    const isInsideGrid = isInsidePresentationGridCell({
      xIndex,
      yIndex,
      indexCount,
      screenCount: presentation.screenCount,
    })

    if (!isInsideGrid) {
      clearExternalDragPreview()
      return
    }

    const isValidDropCell = isCueTypeCompatibleWithRow(
      dragCueType,
      yIndex,
      presentation.screenCount
    )
    const continuationShrinkSpanOverrides = getContinuationPreviewSpanOverrides(
      xIndex,
      yIndex,
      dragCueType,
      null
    )

    setExternalDragSpanOverridesIfChanged(continuationShrinkSpanOverrides)
    setPoolDragPreviewCellIfChanged({ xIndex, yIndex, isValidDropCell })
  }

  const handleGridDragLeave = (event) => {
    const gridRect = event.currentTarget.getBoundingClientRect()
    const pointerInsideGrid =
      event.clientX >= gridRect.left &&
      event.clientX <= gridRect.right &&
      event.clientY >= gridRect.top &&
      event.clientY <= gridRect.bottom

    if (!pointerInsideGrid) {
      clearExternalDragPreview()
    }
  }

  const layout = cues.map((cue) => ({
    i: cue._id.toString(),
    x: cue.index,
    y: cue.screen,
    w: getCueVisualSpanFromMap(cue, cueVisualSpanMap),
    h: 1,
    static: false,
  }))

  const addCue = async (cueData) => {
    setStatus("loading")
    const { index, cueName, screen, file, loop, color } = cueData

    //Check if cue with same index and screen already exists
    const existingCue = cues.find(
      (cue) => cue.index === Number(index) && cue.screen === Number(screen)
    )

    if (existingCue) {
      await handleCueExists(existingCue, cueData)
      return
    }

    const formData = createFormData(
      index,
      cueName,
      screen,
      file || "",
      undefined,
      color,
      loop || false
    )

    try {
      await dispatch(createCue(id, formData))

      setTimeout(() => {
        setStatus("saved")
        showToast({
          title: "Element added",
          description: `Element ${cueName} added to screen ${screen}`,
          status: "success",
        })
      }, 300)
    } catch (error) {
      const errorMessage = error.message
      showToast({ title: "Error", description: errorMessage, status: "error" })
    }
  }

  const handleCueExists = async (existingCue, newCueData) => {
    setConfirmMessage(
      `Frame ${newCueData.index} element already exists on screen ${newCueData.screen}. Do you want to replace it?`
    )
    setConfirmAction(() => async () => {
      const updatedCueData = {
        ...newCueData,
        _id: existingCue._id,
        cueName: newCueData.cueName,
      }

      await dispatchUpdateCue(existingCue._id, updatedCueData)
      setIsConfirmOpen(false)
    })
    setIsConfirmOpen(true)
  }

  const fetchFileFromUrl = async (url, fileName) => {
    const response = await fetch(url)
    const blob = await response.blob()
    return new File([blob], fileName, { type: blob.type })
  }

  const updateCue = async (previousCueId, updatedCue) => {
    const previousStillExists = cues.some((cue) => cue._id === previousCueId)
    if (!previousStillExists) {
      await addCue(updatedCue)
      return
    }

    const existingCue = cues.find(
      (cue) =>
        cue.index === Number(updatedCue.index) &&
        cue.screen === Number(updatedCue.screen)
    )

    if (existingCue && existingCue._id !== previousCueId) {
      await handleExistingCueUpdate(existingCue, updatedCue, previousCueId)
      return
    }
    await dispatchUpdateCue(previousCueId, updatedCue)
  }



  const handleExistingCueUpdate = async (
    existingCue,
    updatedCue,
    previousCueId
  ) => {
    setConfirmMessage(
      `${updatedCue.index} element already exists on screen ${updatedCue.screen}. Do you want to replace it?`
    )

    setConfirmAction(() => async () => {
      const updatedCueData = await createUpdatedCueData(existingCue, updatedCue)
      await dispatch(removeCue(id, previousCueId))
      await dispatchUpdateCue(existingCue._id, updatedCueData)
      setIsConfirmOpen(false)
    })
    setIsConfirmOpen(true)
  }

  const createUpdatedCueData = async (existingCue, updatedCue) => {
    let fileObj = null
    if (updatedCue.file) {
      fileObj = await fetchFileFromUrl(
        updatedCue.file.url,
        updatedCue.file.name
      )
    }

    if (updatedCue.file.driveId) {
      fileObj.driveId = updatedCue.file.driveId
    }

    return {
      ...existingCue,
      index: updatedCue.index,
      cueName: updatedCue.cueName,
      screen: updatedCue.screen,
      file: fileObj,
      fileName: updatedCue.fileName,
    }
  }

  const cueExists = (xIndex, yIndex) => {
    return Boolean(getCueAtPosition(xIndex, yIndex))
  }

  const anchorCueExists = (xIndex, yIndex) => {
    return Boolean(getAnchorCueAtPosition(xIndex, yIndex))
  }

  const handleDoubleClick = (event) => {
    if (event.target.closest(".x-index-label")) {
      return
    }

    const { xIndex, yIndex } = getPosition(
      event,
      containerRef,
      columnWidth,
      rowHeight,
      gap
    )

    if (yIndex < 1 || yIndex > getAudioRow(presentation.screenCount)) {
      return
    }

    if (xIndex < 0 || xIndex >= indexCount) {
      return
    }

    const cue = getCueAtPosition(xIndex, yIndex)

    if (cue) {
      setSelectedCue(cue)
      setIsToolboxOpen(true)
    } else {
      setSelectedCue(null)
      setDoubleClickPosition({ index: xIndex, screen: yIndex })
      setIsToolboxOpen(true)
    }
  }

  const dispatchUpdateCue = async (cueId, updatedCue) => {
    setStatus("loading")
    try {
      await dispatch(updatePresentation(id, updatedCue, cueId))
      setTimeout(() => {
        setStatus("saved")
        showToast({
          title: "Element updated",
          description: `Element ${updatedCue.cueName} updated on screen ${updatedCue.screen}`,
          status: "success",
        })
      }, 300)
    } catch (error) {
      console.error(error)
      showToast({
        title: "Error",
        description: error.message || "An error occurred",
        status: "error",
      })
    }
  }

  const handleToolboxSave = async (updatedCue) => {
    if (!selectedCue) {
      return
    }

    await dispatchUpdateCue(selectedCue._id, updatedCue)
    setSelectedCue(null)
    setIsToolboxOpen(false)
  }

  const dispatchSwapCues = async (newTargetCue, newSelectedCue) => {
    setStatus("loading")
    try {
      await dispatch(
        swapCues(id, newTargetCue, newSelectedCue)
      )
      setStatus("saved")
    } catch (error) {
      console.error(error)
      setStatus("saved")
      showToast({
        title: "Error",
        description: error.message || "An error occurred",
        status: "error",
      })
    }
  }

  const getPosition = (event, containerRef, columnWidth, rowHeight, gap) => {
    const dropX = event.clientX
    const containerRect = containerRef.current.getBoundingClientRect()
    const containerScrollLeft = containerRef.current.scrollLeft

    const relativeDropX = dropX - containerRect.left
    const absoluteDropX = relativeDropX + containerScrollLeft
    const dropY = event.clientY - containerRect.top
    const yAdjustedForHeader = dropY + dragPreviewYOffset

    const cellWidthWithGap = columnWidth + gap
    const cellHeightWithGap = rowHeight + gap

    const yIndex = Math.floor(yAdjustedForHeader / cellHeightWithGap)
    const xIndex = Math.floor(absoluteDropX / cellWidthWithGap)

    return { xIndex, yIndex }
  }

  const handleElementPositionChange = async (selectedCue, targetCue) => {
    const newTargetCue = {
      ...targetCue,
      index: selectedCue.index,
      screen: selectedCue.screen,
    }

    const newSelectedCue = {
      ...selectedCue,
      index: targetCue.index,
      screen: targetCue.screen,
    }

    const hasAudioCue = newTargetCue.cueType === "audio" || newSelectedCue.cueType === "audio"

    if (hasAudioCue) {
      if (!(newTargetCue.cueType === "audio" && newSelectedCue.cueType === "audio")) {
        showToast({
          title: "Error",
          description: "You cannot swap elements with audio files",
          status: "error",
        })
        setSelectedCue(null)
        return
      } else {
        await dispatchSwapCues(newTargetCue, newSelectedCue)
        setSelectedCue(null)
      }
    } else {
      await dispatchSwapCues(newTargetCue, newSelectedCue)
      setSelectedCue(null)
    }
  }

  const handleCueReplace = async (xIndex, yIndex, file) => {
    const existingCue = getCueAtPosition(xIndex, yIndex)
    if (!existingCue) return

    const updatedCue = {
      ...existingCue,
      index: xIndex,
      cueName: file.name,
      screen: yIndex,
      file: file,
    }

    await dispatchUpdateCue(existingCue._id, updatedCue)
    setIsConfirmOpen(false)
  }

  const handleDrop = async (event) => {
    event.preventDefault()
    clearExternalDragPreview()

    if (isShowMode) {
      return
    }

    let dragData = null
    try {
      const dataStr = event.dataTransfer.getData("application/json")
      if (dataStr) dragData = JSON.parse(dataStr)
    } catch (e) {
      // ignore parsing error
    }

    const files = Array.from(event.dataTransfer.files)
    const mediaFiles = files.filter(
      (file) => isImageOrVideoMimeType(file?.type) || isAudioMimeType(file?.type)
    )

    if (mediaFiles.length === 0 && !dragData) {
      return
    }

    const { xIndex, yIndex } = getPosition(
      event,
      containerRef,
      columnWidth,
      rowHeight,
      gap
    )

    if (dragData && dragData.type === "newCueFromForm") {
      const audioRowIndex = getAudioRow(presentation.screenCount)
      const colorCueName = (dragData.cueName || "").trim()
      
      // Handle different element types from the three boxes
      if (dragData.elementType === "color") {
        // Color element - no file
        const dataToSave = {
          index: xIndex,
          cueName: colorCueName,
          screen: yIndex,
          file: null,
          color: dragData.color,
        }

        await addCue(dataToSave)
        return
      } 
      else if (dragData.elementType === "media" || dragData.elementType === "sound") {
        // Media or sound element - has a file
        const isSound = dragData.elementType === "sound"
        const fileId = isSound ? dragData.soundId : dragData.mediaId
        
        // Retrieve the file from mediaStore
        const file = mediaStore.getFile(fileId)
        
        if (!file) {
          showToast({
            title: "File not found",
            description: "The file could not be found. Please try uploading again.",
            status: "error",
          })
          return
        }
        
        // Validate screen placement
        if (isSound && yIndex !== audioRowIndex && xIndex < indexCount) {
          showToast({
            title: "Only audio on audio row",
            description: "Drag audio files to the audio row.",
            status: "error",
          })
          return
        }
        if (!isSound && yIndex === audioRowIndex && xIndex < indexCount) {
          showToast({
            title: "Only images/videos on screen rows",
            description: "Drag media to screen rows, not the audio row.",
            status: "error",
          })
          return
        }
        
        // Create cue with the actual file
        const dataToSave = {
          index: xIndex,
          cueName: dragData.cueName,
          screen: yIndex,
          file: file,
        }
        
        await addCue(dataToSave)
        
        // Clean up the file from store after successful creation
        mediaStore.removeFile(fileId)
        return
      }
      
      // Default color-based element (legacy support)
      const dataToSave = {
        index: xIndex,
        cueName: colorCueName,
        screen: yIndex,
        file: null,
        color: dragData.color,
      }

      await addCue(dataToSave)
      return
    }

    const file = mediaFiles[0]
    const audioRowIndex = getAudioRow(presentation.screenCount)

    if (isImageOrVideoMimeType(file?.type) && xIndex < indexCount && yIndex === audioRowIndex) {
      showToast({
        title: "Only audio files on the audio row.",
        description: "Click on an appropriate row to paste the element.",
        status: "error",
      })
      return
    }
    if (isAudioMimeType(file?.type) && yIndex !== audioRowIndex && xIndex < indexCount) {
      showToast({
        title: "Only images/videos on screen rows.",
        description: "Click on an appropriate row to paste the element.",
        status: "error",
      })
      return
    }

    if (anchorCueExists(xIndex, yIndex)) {
      setConfirmMessage(
        `Index ${xIndex} element already exists on screen ${yIndex}. Do you want to replace it?`
      )
      setConfirmAction(() => async () => {
        handleCueReplace(xIndex, yIndex, file)
      })
      setIsConfirmOpen(true)
      return
    }
    const formData = createFormData(xIndex, file.name, yIndex, file)

    try {
      await dispatch(createCue(id, formData))
      showToast({
        title: "Element added",
        description: `Element ${file.name} added to screen ${yIndex}`,
        status: "success",
      })
    } catch (error) {
      const errorMessage = error.message || "An error occurred"
      showToast({
        title: "Error",
        description: errorMessage,
        status: "error",
      })
    }
  }

  headerActionsRef.current = {
    addIndex: handleAddIndex,
    removeIndex: handleRemoveIndex,
    increaseScreenCount: handleIncreaseScreenCount,
    decreaseScreenCount: handleDecreaseScreenCount,
    toggleAudioMute,
  }

  return (
    <ChakraProvider theme={theme}>
      <CustomAlert
        showAlert={showAlert}
        alertData={alertData}
      />
      <div
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        data-testid="drop-area"
        style={{
          height: "100%",
          minHeight: 0,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <Box
          display="flex"
          width="100%"
          marginTop="0px"
          height="100%"
          minHeight={0}
          overflow="visible"
        >
          <Box
            className="screen-boxes"
            display="grid"
            gridTemplateRows={`${frameHeaderHeight}px repeat(${yLabels.length}, ${rowHeight}px)`}
            gap={`${gap}px`}
            left={0}
            zIndex={2}
            bg={"transparent"}
            flexShrink={0}
          >
            <Box h={`${frameHeaderHeight}px`} bg="transparent" />

            <RowHeaders
              yLabels={yLabels}
              gap={gap}
              rowHeight={rowHeight}
              columnWidth={columnWidth}
              isShowMode={isShowMode}
              screenCount={presentation.screenCount}
              isAudioMuted={isAudioMuted}
              screenIcon={screenIcon}
              headerActionsRef={headerActionsRef}
            />
          </Box>
          <Box
            position="relative"
            pointerEvents={isShowMode ? "none" : "auto"}
            minHeight={0}
            sx={{
              ".layout > .react-grid-placeholder": {
                background: bgColorHover,
                borderRadius: "16px",
                opacity: 1,
                transitionDuration: "0s",
              },
              ".layout .react-grid-item, .layout .react-grid-item *": {
                userSelect: "none",
                WebkitUserSelect: "none",
              },
              ".layout .react-grid-item img, .layout .react-grid-item video": {
                WebkitUserDrag: "none",
              },
            }}
          >
            <Box
              height={`${(yLabels.length + 1) * (rowHeight + gap)}px`}
              minHeight="100%"
              width="100%"
              position="relative"
              cursor={isDragging || isCopied ? dragCursorMode : "default"}
              data-testid="edit-mode-grid-container"
              ref={containerRef}
              onDoubleClick={handleDoubleClick}
              onMouseDownCapture={handleMouseDown}
              onMouseMove={handleMouseMove}
              onDragOver={handleGridDragOver}
              onDragLeave={handleGridDragLeave}
              onDragStart={(event) => {
                if (event.target.closest(".react-grid-item")) {
                  event.preventDefault()
                }
              }}
              onMouseLeave={() => {
                hideHoverPreview()

                if (isDragging) {
                  resetDragInteraction()
                  return
                }

                if (isCopied) {
                  clearExternalPlacementPreview()
                  setDragCursorMode("copy")
                }

                updateDragPreviewCell(null)
                clearInternalDragSpanPreview()
                hideDragPlacementPreview()
                if (!isCopied) {
                  setDragCursorMode("default")
                }
              }}
              onMouseUp={handleMouseUp}
              onClick={handlePaste}
            >
              <Box
                className="index-boxes"
                display="grid"
                gridTemplateColumns={`repeat(${xLabels.length}, ${columnWidth}px)`}
                gap={`${gap}px`}
                position="sticky"
                top={0}
                zIndex={1}
                bg={"transparent"}
                mb={`${gap}px`}
              >
                <ColumnHeaders
                  xLabels={xLabels}
                  cueIndex={cueIndex}
                  bgCurrentFrame={bgCurrentFrame}
                  bgColorIndex={bgColorIndex}
                  rowHeight={rowHeight}
                  columnWidth={columnWidth}
                  isShowMode={isShowMode}
                  indexCount={indexCount}
                  headerActionsRef={headerActionsRef}
                />
              </Box>
              <Box pointerEvents={isDragging ? "none" : "auto"}>
                <GridLayoutComponent
                  layout={layout}
                  cues={cues}
                  containerRef={containerRef}
                  columnWidth={columnWidth}
                  rowHeight={rowHeight}
                  gap={gap}
                  setIsCopied={setIsCopied}
                  setCopiedCue={setCopiedCue}
                  id={id}
                  isShowMode={isShowMode}
                  cueIndex={cueIndex}
                  isAudioMuted={isAudioMuted}
                  setSelectedCue={setSelectedCue}
                  setIsToolboxOpen={setIsToolboxOpen}
                  indexCount={indexCount}
                  setShowAlert={setShowAlert}
                  setAlertData={setAlertData}
                  screenCount={presentation.screenCount}
                  isDragging={isDragging}
                  draggingCueId={isDragging && selectedCue ? selectedCue._id : null}
                  previewCueSpanOverrides={previewCueSpanOverrides}
                  isCopied={isCopied}
                  interactionCursor={!isDragging && isCopied ? dragCursorMode : null}
                />
              </Box>

              {!isDragging && poolDragPreviewCell && (
                <Box
                  data-testid="pool-drag-placement-preview"
                  data-valid-drop-cell={poolDragPreviewCell.isValidDropCell ? "true" : "false"}
                  position="absolute"
                  left="0px"
                  top="0px"
                  transform={`translate3d(${poolDragPreviewCell.xIndex * (columnWidth + gap)}px, ${(poolDragPreviewCell.yIndex * (rowHeight + gap)) - dragPreviewYOffset}px, 0)`}
                  width={`${columnWidth}px`}
                  height={`${rowHeight}px`}
                  borderRadius="16px"
                  border="2px dashed"
                  borderColor={poolDragPreviewCell.isValidDropCell ? dragPreviewValidBorder : dragPreviewInvalidBorder}
                  bg={poolDragPreviewCell.isValidDropCell ? dragPreviewValidBg : dragPreviewInvalidBg}
                  boxShadow="0 4px 12px rgba(0, 0, 0, 0.16)"
                  pointerEvents="none"
                  zIndex={20}
                />
              )}

              {!isDragging && isCopied && (
                <Box
                  data-testid="copy-drag-placement-preview"
                  ref={externalPlacementPreviewRef}
                  data-valid-drop-cell="false"
                  position="absolute"
                  left="0px"
                  top="0px"
                  transform="translate3d(0, 0, 0)"
                  width={`${columnWidth}px`}
                  height={`${rowHeight}px`}
                  borderRadius="16px"
                  border="2px dashed"
                  borderColor={dragPreviewInvalidBorder}
                  bg={dragPreviewInvalidBg}
                  boxShadow="0 4px 12px rgba(0, 0, 0, 0.16)"
                  pointerEvents="none"
                  zIndex={20}
                  display="none"
                  style={{ willChange: "transform" }}
                />
              )}

              {isDragging && selectedCue && (
                <Box
                  data-testid="drag-placement-preview"
                  ref={dragPlacementPreviewRef}
                  position="absolute"
                  left="0px"
                  top="0px"
                  transform="translate3d(0, 0, 0)"
                  width={`${columnWidth}px`}
                  height={`${rowHeight}px`}
                  borderRadius="16px"
                  border="2px dashed"
                  borderColor={dragPreviewInvalidBorder}
                  bg={dragPreviewInvalidBg}
                  boxShadow="0 4px 12px rgba(0, 0, 0, 0.16)"
                  pointerEvents="none"
                  zIndex={20}
                  display="none"
                  style={{ willChange: "transform" }}
                />
              )}

              {isDragging && selectedCue && (
                <Box
                  data-testid="drag-cursor-preview"
                  ref={dragCursorPreviewRef}
                  position="absolute"
                  left="0px"
                  top="0px"
                  transform="translate3d(10px, 10px, 0)"
                  width={`${columnWidth}px`}
                  height={`${rowHeight}px`}
                  borderRadius="16px"
                  border="2px solid"
                  borderColor={dragPreviewOriginBorder}
                  boxShadow="0 12px 30px rgba(0,0,0,0.35), inset 0 0 0 1px rgba(18, 24, 38, 0.5)"
                  overflow="hidden"
                  pointerEvents="none"
                  zIndex={30}
                  opacity={0.92}
                  style={{ willChange: "transform" }}
                >
                  {selectedCue.file?.type?.startsWith("image/") && selectedCue.file?.url ? (
                    <Box
                      as="img"
                      src={selectedCue.file.url}
                      alt={selectedCue.name}
                      width="100%"
                      height="100%"
                      objectFit="cover"
                    />
                  ) : (
                    <Box
                      width="100%"
                      height="100%"
                      bg={selectedCue.color || "rgba(32,32,32,0.9)"}
                    />
                  )}

                  {selectedCue.name?.trim() && (
                    <Text
                      position="absolute"
                      bottom="6px"
                      left="8px"
                      right="8px"
                      color="white"
                      fontWeight="bold"
                      bg="rgba(0, 0, 0, 0.55)"
                      borderRadius="6px"
                      px={2}
                      py={1}
                      whiteSpace="nowrap"
                      overflow="hidden"
                      textOverflow="ellipsis"
                      textAlign="center"
                      style={{ textShadow: "1px 1px 2px rgb(0, 0, 0)" }}
                    >
                      {selectedCue.name}
                    </Text>
                  )}
                </Box>
              )}

              <Box
                data-testid="hover-preview"
                ref={hoverPreviewRef}
                position="absolute"
                left="0px"
                top="0px"
                width={`${columnWidth}px`}
                height={`${rowHeight}px`}
                bg={bgColorHover}
                borderRadius="16"
                transition="0"
                zIndex={-1}
                pointerEvents="none"
                display="none"
              />
            </Box>
          </Box>

          <ToolBox
            isOpen={isToolboxOpen}
            cue={selectedCue}
            onSave={handleToolboxSave}
            onClose={() => {
              setSelectedCue(null)
              setIsToolboxOpen(false)
            }}
          />
        </Box>
        <Box
          position="fixed"
          top="20%"
          right="5%"
          display="flex"
          alignItems="center"
          zIndex={1}
        ></Box>
        <Box
          position="fixed"
          top="11%"
          right="5%"
          display="flex"
          alignItems="center"
          zIndex={1}
        >
          <StatusTooltip status={status} />
        </Box>
        <Dialog
          isOpen={isConfirmOpen}
          onClose={() => setIsConfirmOpen(false)}
          onConfirm={confirmAction}
          message={confirmMessage}
        />
      </div>
    </ChakraProvider>
  )
}
 export default EditMode
