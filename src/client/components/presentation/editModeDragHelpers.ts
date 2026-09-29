import type { Cue, CueType, NewCueDragData } from "../../types"
import mediaStore from "./mediaFileStore"

/*
* helper functions for managing drag-and-drop interactions in the presentation editor, including calculating span overrides for cues being dragged over occupied cells,
extracting cue type from drag data, and retrieving drag data from the data transfer object during a drag event.
* These functions help ensure that cues are placed correctly on the grid and that the appropriate previews are shown during dragging.
 */

export type SpanOverrideMap = Record<string, number>

export const areSpanOverrideMapsEqual = (
  firstMap: SpanOverrideMap,
  secondMap: SpanOverrideMap
) => {
  const firstKeys = Object.keys(firstMap)
  const secondKeys = Object.keys(secondMap)

  if (firstKeys.length !== secondKeys.length) {
    return false
  }

  return firstKeys.every(
    (key) => Number(firstMap[key]) === Number(secondMap[key])
  )
}

export const getContinuationShrinkSpanOverrides = ({
  xIndex,
  yIndex,
  draggedCueId,
  isValidDropCell = true,
  getCueAtPosition,
}: {
  xIndex: number
  yIndex: number
  cueType?: string
  draggedCueId?: string | null
  isValidDropCell?: boolean
  getCueAtPosition: (xIndex: number, yIndex: number) => Cue | undefined
}): SpanOverrideMap => {
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

export const getCueTypeFromDragData = (
  dragData: NewCueDragData | null
): CueType | null => {
  if (!dragData || dragData.type !== "newCueFromForm") {
    return null
  }

  return dragData.elementType === "sound" ? "audio" : "visual"
}

export const getDragDataFromDataTransfer = (
  dataTransfer: DataTransfer | null
): NewCueDragData | null => {
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
  } catch {
    const cachedDragData = mediaStore.getActiveDragData()
    return cachedDragData?.type === "newCueFromForm" ? cachedDragData : null
  }
}
