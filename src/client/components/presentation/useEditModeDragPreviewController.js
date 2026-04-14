import { useCallback, useEffect, useRef } from "react"
import {
  isCueTypeCompatibleWithRow,
  isInsidePresentationGridCell,
} from "../utils/fileTypeUtils"

const applyPlacementPreviewStyles = ({
  previewElement,
  xIndex,
  yIndex,
  columnWidth,
  rowHeight,
  gap,
  yOffset = 0,
  isValidDropCell,
  validBorder,
  invalidBorder,
  validBg,
  invalidBg,
  setValidityAttribute = false,
}) => {
  if (!previewElement) {
    return
  }

  previewElement.style.display = "block"
  previewElement.style.transform = `translate3d(${xIndex * (columnWidth + gap)}px, ${(yIndex * (rowHeight + gap)) - yOffset}px, 0)`
  previewElement.style.borderColor = isValidDropCell
    ? validBorder
    : invalidBorder
  previewElement.style.background = isValidDropCell
    ? validBg
    : invalidBg

  if (setValidityAttribute) {
    previewElement.setAttribute(
      "data-valid-drop-cell",
      isValidDropCell ? "true" : "false"
    )
  }
}

const useEditModeDragPreviewController = ({
  containerRef,
  columnWidth,
  rowHeight,
  headerRowHeight,
  gap,
  indexCount,
  screenCount,
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
}) => {
  const hoverPreviewRef = useRef(null)
  const hoverCellRef = useRef(null)
  const dragCursorPreviewRef = useRef(null)
  const dragPlacementPreviewRef = useRef(null)
  const dragCursorPositionRef = useRef(null)
  const dragLatestPointerRef = useRef(null)
  const dragPreviewFrameRef = useRef(null)
  const dragPreviewCellRef = useRef(null)
  const dragPlacementLockedToAnchorRef = useRef(false)
  const dragPreviewYOffset = Math.max(rowHeight - (headerRowHeight ?? rowHeight), 0)
  const externalPlacementPreviewRef = useRef(null)
  const externalCursorPreviewRef = useRef(null)
  const externalCursorSurfaceRef = useRef(null)
  const externalCursorImageRef = useRef(null)
  const externalCursorLabelRef = useRef(null)
  const externalCursorContentRef = useRef({
    name: "",
    imageUrl: "",
    color: "rgba(32,32,32,0.9)",
  })
  const externalLatestPreviewInputRef = useRef(null)
  const externalPreviewFrameRef = useRef(null)
  const externalPreviewCellRef = useRef(null)

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
    hoverPreviewRef.current.style.top = `${(yIndex * (rowHeight + gap)) - dragPreviewYOffset}px`
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

  const hideExternalPlacementPreview = () => {
    if (externalPlacementPreviewRef.current) {
      externalPlacementPreviewRef.current.style.display = "none"
    }
  }

  const hideExternalCursorPreview = () => {
    if (externalCursorPreviewRef.current) {
      externalCursorPreviewRef.current.style.display = "none"
    }

    if (externalCursorLabelRef.current) {
      externalCursorLabelRef.current.style.display = "none"
      externalCursorLabelRef.current.textContent = ""
    }

    if (externalCursorImageRef.current) {
      externalCursorImageRef.current.style.display = "none"
      externalCursorImageRef.current.removeAttribute("src")
    }

    if (externalCursorSurfaceRef.current) {
      externalCursorSurfaceRef.current.style.display = "block"
    }

    externalCursorContentRef.current = {
      name: "",
      imageUrl: "",
      color: "rgba(32,32,32,0.9)",
    }
  }

  const applyDragPreviewFromPointer = useCallback((pointerPosition) => {
    if (!pointerPosition) {
      return
    }

    dragCursorPositionRef.current = pointerPosition

    if (dragCursorPreviewRef.current) {
      dragCursorPreviewRef.current.style.transform = `translate3d(${pointerPosition.x + 10}px, ${pointerPosition.y + 10}px, 0)`
    }

    const pointerXIndex = Math.floor(pointerPosition.x / (columnWidth + gap))
    const pointerYIndex = Math.floor((pointerPosition.y + dragPreviewYOffset) / (rowHeight + gap))
    const lockPlacementToAnchor = Boolean(
      dragPlacementLockedToAnchorRef.current && selectedCue
    )
    const xIndex = lockPlacementToAnchor
      ? Number(selectedCue.index)
      : pointerXIndex
    const yIndex = lockPlacementToAnchor
      ? Number(selectedCue.screen)
      : pointerYIndex

    if (!selectedCue) {
      setDragCursorMode("grabbing")
      updateDragPreviewCell(null)
      hideDragPlacementPreview()
      clearInternalDragSpanPreview()
      return
    }

    const isInsideGrid = isInsidePresentationGridCell({
      xIndex,
      yIndex,
      indexCount,
      screenCount,
    })

    if (!isInsideGrid) {
      setDragCursorMode("grabbing")
      updateDragPreviewCell(null)
      hideDragPlacementPreview()
      clearInternalDragSpanPreview()
      return
    }

    const isValidDropCell = isCueTypeCompatibleWithRow(
      selectedCue.cueType,
      yIndex,
      screenCount
    )

    setDragCursorMode(isValidDropCell ? "grabbing" : "not-allowed")

    updateDragPreviewCell({ xIndex, yIndex })

    const continuationShrinkSpanOverrides = getContinuationPreviewSpanOverrides(
      xIndex,
      yIndex,
      selectedCue.cueType,
      selectedCue._id
    )
    setInternalDragSpanOverridesIfChanged(continuationShrinkSpanOverrides)

    applyPlacementPreviewStyles({
      previewElement: dragPlacementPreviewRef.current,
      xIndex,
      yIndex,
      columnWidth,
      rowHeight,
      gap,
      yOffset: dragPreviewYOffset,
      isValidDropCell,
      validBorder: dragPreviewValidBorder,
      invalidBorder: dragPreviewInvalidBorder,
      validBg: dragPreviewValidBg,
      invalidBg: dragPreviewInvalidBg,
    })
  }, [
    clearInternalDragSpanPreview,
    columnWidth,
    dragPreviewInvalidBg,
    dragPreviewInvalidBorder,
    dragPreviewValidBg,
    dragPreviewValidBorder,
    dragPreviewYOffset,
    gap,
    getContinuationPreviewSpanOverrides,
    indexCount,
    rowHeight,
    screenCount,
    selectedCue,
    setDragCursorMode,
    setInternalDragSpanOverridesIfChanged,
  ])

  const cancelDragPreviewFrame = () => {
    if (dragPreviewFrameRef.current) {
      cancelAnimationFrame(dragPreviewFrameRef.current)
      dragPreviewFrameRef.current = null
    }
  }

  const cancelExternalPreviewFrame = () => {
    if (externalPreviewFrameRef.current) {
      cancelAnimationFrame(externalPreviewFrameRef.current)
      externalPreviewFrameRef.current = null
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

  const updateExternalPreviewCell = (nextCell) => {
    const previousCell = externalPreviewCellRef.current
    const sameCell =
      (!previousCell && !nextCell) ||
      (previousCell &&
        nextCell &&
        Number(previousCell.xIndex) === Number(nextCell.xIndex) &&
        Number(previousCell.yIndex) === Number(nextCell.yIndex) &&
        Boolean(previousCell.isValidDropCell) === Boolean(nextCell.isValidDropCell))

    if (sameCell) {
      return false
    }

    externalPreviewCellRef.current = nextCell
    return true
  }

  const clearExternalPlacementPreview = useCallback(() => {
    cancelExternalPreviewFrame()
    externalLatestPreviewInputRef.current = null
    updateExternalPreviewCell(null)
    hideExternalPlacementPreview()
    hideExternalCursorPreview()
    clearExternalDragPreview()
  }, [clearExternalDragPreview])

  const applyExternalPreviewFromInput = useCallback((input) => {
    const idleCursor = input?.idleCursor || "copy"

    if (!input || !input.cueType || !containerRef.current) {
      clearExternalPlacementPreview()
      return
    }

    if (input.isHeaderCell) {
      clearExternalPlacementPreview()
      setDragCursorMode(idleCursor)
      return
    }

    const pointerPosition = input.pointerPosition
    if (!pointerPosition) {
      clearExternalPlacementPreview()
      setDragCursorMode(idleCursor)
      return
    }

    const xIndex = Math.floor(pointerPosition.x / (columnWidth + gap))
    const yIndex = Math.floor((pointerPosition.y + dragPreviewYOffset) / (rowHeight + gap))
    const isInsideGrid = isInsidePresentationGridCell({
      xIndex,
      yIndex,
      indexCount,
      screenCount,
    })

    if (!isInsideGrid) {
      clearExternalPlacementPreview()
      setDragCursorMode(idleCursor)
      return
    }

    if (externalCursorPreviewRef.current) {
      if (input.cursorPreview) {
        externalCursorPreviewRef.current.style.display = "block"
        externalCursorPreviewRef.current.style.transform = `translate3d(${pointerPosition.x + 10}px, ${pointerPosition.y + 10}px, 0)`

        const previewName = (input.cursorPreview.name || "").trim()
        const previewImageUrl = input.cursorPreview.imageUrl || ""
        const previewColor = input.cursorPreview.color || "rgba(32,32,32,0.9)"
        const previousCursorContent = externalCursorContentRef.current

        if (
          previousCursorContent.name !== previewName ||
          previousCursorContent.imageUrl !== previewImageUrl ||
          previousCursorContent.color !== previewColor
        ) {
          if (externalCursorLabelRef.current) {
            externalCursorLabelRef.current.textContent = previewName
            externalCursorLabelRef.current.style.display = previewName ? "block" : "none"
          }

          if (externalCursorImageRef.current && externalCursorSurfaceRef.current) {
            if (previewImageUrl) {
              externalCursorImageRef.current.src = previewImageUrl
              externalCursorImageRef.current.style.display = "block"
              externalCursorSurfaceRef.current.style.display = "none"
            } else {
              externalCursorImageRef.current.style.display = "none"
              externalCursorImageRef.current.removeAttribute("src")
              externalCursorSurfaceRef.current.style.display = "block"
              externalCursorSurfaceRef.current.style.background = previewColor
            }
          }

          externalCursorContentRef.current = {
            name: previewName,
            imageUrl: previewImageUrl,
            color: previewColor,
          }
        }
      } else {
        hideExternalCursorPreview()
      }
    }

    const isValidDropCell =
      isCueTypeCompatibleWithRow(input.cueType, yIndex, screenCount) &&
      !input.isBlockedCell?.(xIndex, yIndex)
    setDragCursorMode(isValidDropCell ? idleCursor : "not-allowed")

    const didCellChange = updateExternalPreviewCell({ xIndex, yIndex, isValidDropCell })
    if (!didCellChange) {
      return
    }

    if (input.enableContinuationPreview === false) {
      setExternalDragSpanOverridesIfChanged({})
    } else {
      const continuationShrinkSpanOverrides = getContinuationPreviewSpanOverrides(
        xIndex,
        yIndex,
        input.cueType,
        input.draggedCueId || null
      )
      setExternalDragSpanOverridesIfChanged(continuationShrinkSpanOverrides)
    }

    applyPlacementPreviewStyles({
      previewElement: externalPlacementPreviewRef.current,
      xIndex,
      yIndex,
      columnWidth,
      rowHeight,
      gap,
      yOffset: dragPreviewYOffset,
      isValidDropCell,
      validBorder: dragPreviewValidBorder,
      invalidBorder: dragPreviewInvalidBorder,
      validBg: dragPreviewValidBg,
      invalidBg: dragPreviewInvalidBg,
      setValidityAttribute: true,
    })
  }, [
    clearExternalPlacementPreview,
    columnWidth,
    containerRef,
    dragPreviewInvalidBg,
    dragPreviewInvalidBorder,
    dragPreviewValidBg,
    dragPreviewValidBorder,
    dragPreviewYOffset,
    gap,
    getContinuationPreviewSpanOverrides,
    indexCount,
    rowHeight,
    screenCount,
    setDragCursorMode,
    setExternalDragSpanOverridesIfChanged,
  ])

  const scheduleExternalPreviewFromEvent = (event, options = {}) => {
    externalLatestPreviewInputRef.current = {
      pointerPosition: getPointerPosition(event),
      cueType: options.cueType,
      draggedCueId: options.draggedCueId || null,
      idleCursor: options.idleCursor || "copy",
      isHeaderCell: Boolean(options.isHeaderCell),
      isBlockedCell: options.isBlockedCell,
      cursorPreview: options.cursorPreview || null,
      enableContinuationPreview: options.enableContinuationPreview !== false,
    }

    if (externalPreviewFrameRef.current) {
      return
    }

    externalPreviewFrameRef.current = requestAnimationFrame(() => {
      externalPreviewFrameRef.current = null
      applyExternalPreviewFromInput(externalLatestPreviewInputRef.current)
    })
  }

  const setDragPlacementLockedToAnchor = (isLocked) => {
    dragPlacementLockedToAnchorRef.current = Boolean(isLocked)
  }

  useEffect(() => {
    if (!selectedCue || !dragLatestPointerRef.current) {
      return
    }

    // When drag starts, refs mount on the next render; re-apply latest pointer so previews spawn at cursor.
    applyDragPreviewFromPointer(dragLatestPointerRef.current)
  }, [selectedCue, applyDragPreviewFromPointer])

  useEffect(() => {
    return () => {
      cancelDragPreviewFrame()
      cancelExternalPreviewFrame()
    }
  }, [])

  return {
    hoverPreviewRef,
    dragCursorPreviewRef,
    dragPlacementPreviewRef,
    externalPlacementPreviewRef,
    externalCursorPreviewRef,
    externalCursorSurfaceRef,
    externalCursorImageRef,
    externalCursorLabelRef,
    hideHoverPreview,
    showHoverPreview,
    updateDragPreviewCell,
    hideDragPlacementPreview,
    hideExternalPlacementPreview,
    applyDragPreviewFromPointer,
    cancelDragPreviewFrame,
    clearExternalPlacementPreview,
    primeDragPreviewFromEvent,
    scheduleDragPreviewFromEvent,
    scheduleExternalPreviewFromEvent,
    resetDragPointerTracking,
    setDragPlacementLockedToAnchor,
  }
}

export default useEditModeDragPreviewController
