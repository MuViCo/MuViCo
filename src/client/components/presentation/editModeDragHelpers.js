import { getAudioRow } from "../utils/fileTypeUtils"

export const areSpanOverrideMapsEqual = (firstMap, secondMap) => {
  const firstKeys = Object.keys(firstMap)
  const secondKeys = Object.keys(secondMap)

  if (firstKeys.length !== secondKeys.length) {
    return false
  }

  return firstKeys.every((key) => Number(firstMap[key]) === Number(secondMap[key]))
}

export const arePoolDragPreviewCellsEqual = (firstCell, secondCell) => {
  if (!firstCell && !secondCell) {
    return true
  }

  if (!firstCell || !secondCell) {
    return false
  }

  return (
    Number(firstCell.xIndex) === Number(secondCell.xIndex) &&
    Number(firstCell.yIndex) === Number(secondCell.yIndex) &&
    Boolean(firstCell.isValidDropCell) === Boolean(secondCell.isValidDropCell)
  )
}

export const isValidCueTypeForRow = (cueType, yIndex, audioRowIndex) => {
  return cueType === "audio"
    ? Number(yIndex) === Number(audioRowIndex)
    : Number(yIndex) !== Number(audioRowIndex)
}

export const getContinuationShrinkSpanOverrides = ({
  xIndex,
  yIndex,
  cueType,
  draggedCueId,
  screenCount,
  getCueAtPosition,
}) => {
  const audioRowIndex = getAudioRow(screenCount)
  const isValidDropCell = isValidCueTypeForRow(cueType, yIndex, audioRowIndex)

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
    const dataStr = dataTransfer?.getData("application/json")
    if (!dataStr) {
      return null
    }

    const dragData = JSON.parse(dataStr)
    return dragData?.type === "newCueFromForm" ? dragData : null
  } catch (error) {
    return null
  }
}
