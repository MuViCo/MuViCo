import { useCallback, useEffect, useRef } from "react"
import { getAudioRow } from "../utils/fileTypeUtils"

const useEditModeDragPreviewController = ({
  containerRef,
  columnWidth,
  rowHeight,
  gap,
  indexCount,
  screenCount,
  selectedCue,
  setDragCursorMode,
  clearInternalDragSpanPreview,
  setInternalDragSpanOverridesIfChanged,
  getContinuationPreviewSpanOverrides,
  dragPreviewValidBorder,
  dragPreviewInvalidBorder,
  dragPreviewValidBg,
  dragPreviewInvalidBg,
}) => {
  const hoverPreviewRef = useRef(null)
  const hoverCellRef = useRef(null)
  const dragCursorPreviewRef = useRef(null)
  const dragPlacementPreviewRef = useRef(null)
  const dragCursorPositionRef = useRef(null)
  const dragLatestPointerRef = useRef(null)
  const dragPreviewFrameRef = useRef(null)
  const dragPreviewCellRef = useRef(null)

  const hideHoverPreview = useCallback(() => {
    hoverCellRef.current = null

    if (hoverPreviewRef.current) {
      hoverPreviewRef.current.style.display = "none"
    }
  }, [])

  const showHoverPreview = (xIndex, yIndex) => {
    if (!hoverPreviewRef.current) {
      return
    }

    const nextCell = `${xIndex}:${yIndex}`
    if (hoverCellRef.current === nextCell) {
      return
    }

    hoverCellRef.current = nextCell
    hoverPreviewRef.current.style.display = "block"
    hoverPreviewRef.current.style.left = `${xIndex * (columnWidth + gap)}px`
    hoverPreviewRef.current.style.top = `${yIndex * (rowHeight + gap)}px`
  }

  const updateDragPreviewCell = (nextCell) => {
    const previousCell = dragPreviewCellRef.current
    const sameCell =
      (!previousCell && !nextCell) ||
      (previousCell &&
        nextCell &&
        Number(previousCell.xIndex) === Number(nextCell.xIndex) &&
        Number(previousCell.yIndex) === Number(nextCell.yIndex))

    if (sameCell) {
      return false
    }

    dragPreviewCellRef.current = nextCell
    return true
  }

  const getPointerPosition = (event) => {
    const containerRect = containerRef.current?.getBoundingClientRect()
    return {
      x: containerRect
        ? event.clientX - containerRect.left + containerRef.current.scrollLeft
        : event.clientX,
      y: containerRect
        ? event.clientY - containerRect.top + containerRef.current.scrollTop
        : event.clientY,
    }
  }

  const hideDragPlacementPreview = () => {
    if (dragPlacementPreviewRef.current) {
      dragPlacementPreviewRef.current.style.display = "none"
    }
  }

  const applyDragPreviewFromPointer = (pointerPosition) => {
    if (!pointerPosition) {
      return
    }

    dragCursorPositionRef.current = pointerPosition

    if (dragCursorPreviewRef.current) {
      dragCursorPreviewRef.current.style.transform = `translate3d(${pointerPosition.x + 10}px, ${pointerPosition.y + 10}px, 0)`
    }

    const xIndex = Math.floor(pointerPosition.x / (columnWidth + gap))
    const yIndex = Math.floor(pointerPosition.y / (rowHeight + gap))
    const audioRowIndex = getAudioRow(screenCount)
    const isInsideGrid =
      xIndex >= 0 &&
      xIndex < indexCount &&
      yIndex >= 1 &&
      yIndex <= audioRowIndex

    if (!isInsideGrid || !selectedCue) {
      setDragCursorMode("grabbing")
      updateDragPreviewCell(null)
      hideDragPlacementPreview()
      clearInternalDragSpanPreview()
      return
    }

    const selectedCueIsAudio = selectedCue.cueType === "audio"
    const isValidDropCell =
      (selectedCueIsAudio && yIndex === audioRowIndex) ||
      (!selectedCueIsAudio && yIndex !== audioRowIndex)

    setDragCursorMode(isValidDropCell ? "grabbing" : "not-allowed")

    updateDragPreviewCell({ xIndex, yIndex })

    const continuationShrinkSpanOverrides = getContinuationPreviewSpanOverrides(
      xIndex,
      yIndex,
      selectedCue.cueType,
      selectedCue._id
    )
    setInternalDragSpanOverridesIfChanged(continuationShrinkSpanOverrides)

    if (dragPlacementPreviewRef.current) {
      dragPlacementPreviewRef.current.style.display = "block"
      dragPlacementPreviewRef.current.style.transform = `translate3d(${xIndex * (columnWidth + gap)}px, ${yIndex * (rowHeight + gap)}px, 0)`
      dragPlacementPreviewRef.current.style.borderColor = isValidDropCell
        ? dragPreviewValidBorder
        : dragPreviewInvalidBorder
      dragPlacementPreviewRef.current.style.background = isValidDropCell
        ? dragPreviewValidBg
        : dragPreviewInvalidBg
    }
  }

  const cancelDragPreviewFrame = () => {
    if (dragPreviewFrameRef.current) {
      cancelAnimationFrame(dragPreviewFrameRef.current)
      dragPreviewFrameRef.current = null
    }
  }

  const primeDragPreviewFromEvent = (event) => {
    const pointerPosition = getPointerPosition(event)
    dragLatestPointerRef.current = pointerPosition
    applyDragPreviewFromPointer(pointerPosition)
  }

  const scheduleDragPreviewFromEvent = (event) => {
    dragLatestPointerRef.current = getPointerPosition(event)

    if (dragPreviewFrameRef.current) {
      return
    }

    dragPreviewFrameRef.current = requestAnimationFrame(() => {
      dragPreviewFrameRef.current = null
      applyDragPreviewFromPointer(dragLatestPointerRef.current)
    })
  }

  const resetDragPointerTracking = () => {
    dragLatestPointerRef.current = null
    dragCursorPositionRef.current = null
  }

  useEffect(() => {
    return () => {
      cancelDragPreviewFrame()
    }
  }, [])

  return {
    hoverPreviewRef,
    dragCursorPreviewRef,
    dragPlacementPreviewRef,
    hideHoverPreview,
    showHoverPreview,
    updateDragPreviewCell,
    hideDragPlacementPreview,
    applyDragPreviewFromPointer,
    cancelDragPreviewFrame,
    primeDragPreviewFromEvent,
    scheduleDragPreviewFromEvent,
    resetDragPointerTracking,
  }
}

export default useEditModeDragPreviewController
