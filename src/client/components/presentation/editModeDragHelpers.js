/*
* helper functions for managing drag-and-drop interactions in the presentation editor, including calculating span overrides for cues being dragged over occupied cells, 
extracting cue type from drag data, and retrieving drag data from the data transfer object during a drag event. 
* These functions help ensure that cues are placed correctly on the grid and that the appropriate previews are shown during dragging.
 */
import { isCueTypeCompatibleWithRow } from "../utils/fileTypeUtils"
import mediaStore from "./mediaFileStore"

export const areSpanOverrideMapsEqual = (firstMap, secondMap) => {
  const firstKeys = Object.keys(firstMap)
  const secondKeys = Object.keys(secondMap)

  if (firstKeys.length !== secondKeys.length) {
    return false
  }

  return firstKeys.every((key) => Number(firstMap[key]) === Number(secondMap[key]))
}

export const getContinuationShrinkSpanOverrides = ({
  xIndex,
  yIndex,
  cueType,
  draggedCueId,
  screenCount,
  getCueAtPosition,
}) => {
  const isValidDropCell = isCueTypeCompatibleWithRow(cueType, yIndex, screenCount)

  if (!isValidDropCell) {
    return {}
  }

  const occupiedCue = getCueAtPosition(xIndex, yIndex)
  if (!occupiedCue || occupiedCue.cueType !== "visual") {
    return {}
  }

  const occupiedCueIndex = Number(occupiedCue.index)
  if (occupiedCueIndex === Number(xIndex)) {
    return {}
  }

  if (draggedCueId && occupiedCue._id === draggedCueId) {
    return {}
  }

  return {
    [occupiedCue._id]: Math.max(1, Number(xIndex) - occupiedCueIndex),
  }
}

export const getCueTypeFromDragData = (dragData) => {
  if (!dragData || dragData.type !== "newCueFromForm") {
    return null
  }

  return dragData.elementType === "sound" ? "audio" : "visual"
}

export const getDragDataFromDataTransfer = (dataTransfer) => {
  try {
    const dataStr =
      dataTransfer?.getData("application/json") ||
      dataTransfer?.getData("text/plain")

    if (dataStr) {
      const dragData = JSON.parse(dataStr)
      if (dragData?.type === "newCueFromForm") {
        return dragData
      }
    }

    const cachedDragData = mediaStore.getActiveDragData()
    return cachedDragData?.type === "newCueFromForm" ? cachedDragData : null
  } catch (error) {
    const cachedDragData = mediaStore.getActiveDragData()
    return cachedDragData?.type === "newCueFromForm" ? cachedDragData : null
  }
}
