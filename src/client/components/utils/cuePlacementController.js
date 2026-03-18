import { getCueWidthUnits, getCueAtGridCell } from "./cueGridUtils"

const canPlaceCueAtIndex = ({
  candidateIndex,
  cueWidth,
  screen,
  indexCount,
  cueByGridCell,
  cueIdsToIgnore,
  blockedRange = null,
}) => {
  if (candidateIndex < 0 || candidateIndex + cueWidth > indexCount) {
    return false
  }

  for (let xOffset = 0; xOffset < cueWidth; xOffset += 1) {
    const x = candidateIndex + xOffset
    if (blockedRange && x >= blockedRange.start && x < blockedRange.end) {
      return false
    }

    const occupyingCue = getCueAtGridCell(cueByGridCell, x, screen)
    if (occupyingCue && !cueIdsToIgnore.has(occupyingCue._id)) {
      return false
    }
  }

  return true
}

const findLeftMostAvailableIndex = ({
  cueWidth,
  screen,
  indexCount,
  cueByGridCell,
  cueIdsToIgnore,
  blockedRange = null,
}) => {
  const maxStartIndex = indexCount - cueWidth
  for (let candidateIndex = 0; candidateIndex <= maxStartIndex; candidateIndex += 1) {
    if (canPlaceCueAtIndex({
      candidateIndex,
      cueWidth,
      screen,
      indexCount,
      cueByGridCell,
      cueIdsToIgnore,
      blockedRange,
    })) {
      return candidateIndex
    }
  }

  return null
}

const resolveCueSwapPlacement = ({
  selectedCue,
  targetCue,
  selectedCueNextIndex,
  targetCueNextIndex,
  indexCount,
  cueByGridCell,
}) => {
  const selectedCueWidth = getCueWidthUnits(selectedCue)
  const targetCueWidth = getCueWidthUnits(targetCue)
  const swapOnSameScreen = Number(selectedCue.screen) === Number(targetCue.screen)
  const cueIdsToIgnore = new Set([selectedCue._id, targetCue._id])

  const selectedOutOfBounds =
    selectedCueNextIndex < 0 || selectedCueNextIndex + selectedCueWidth > indexCount

  let resolvedTargetCueIndex = targetCueNextIndex
  let selectedPlacementBlockedRange = null

  if (swapOnSameScreen) {
    const selectedRange = {
      start: selectedCueNextIndex,
      end: selectedCueNextIndex + selectedCueWidth,
    }

    const leftMostIndex = findLeftMostAvailableIndex({
      cueWidth: targetCueWidth,
      screen: selectedCue.screen,
      indexCount,
      cueByGridCell,
      cueIdsToIgnore,
      blockedRange: selectedRange,
    })

    if (leftMostIndex === null) {
      return {
        ok: false,
        reason: "no-valid-target-slot",
      }
    }

    resolvedTargetCueIndex = leftMostIndex
    selectedPlacementBlockedRange = {
      start: resolvedTargetCueIndex,
      end: resolvedTargetCueIndex + targetCueWidth,
    }
  }

  const selectedHasSpace = canPlaceCueAtIndex({
    candidateIndex: selectedCueNextIndex,
    cueWidth: selectedCueWidth,
    screen: targetCue.screen,
    indexCount,
    cueByGridCell,
    cueIdsToIgnore,
    blockedRange: selectedPlacementBlockedRange,
  })

  const targetOutOfBounds =
    resolvedTargetCueIndex < 0 || resolvedTargetCueIndex + targetCueWidth > indexCount

  if (selectedOutOfBounds || targetOutOfBounds || !selectedHasSpace) {
    return {
      ok: false,
      reason: "out-of-bounds-or-overlap",
    }
  }

  const newTargetCue = {
    ...targetCue,
    index: resolvedTargetCueIndex,
    screen: selectedCue.screen,
  }

  const newSelectedCue = {
    ...selectedCue,
    index: selectedCueNextIndex,
    screen: targetCue.screen,
  }

  const hasAudioCue = newTargetCue.cueType === "audio" || newSelectedCue.cueType === "audio"

  if (hasAudioCue && !(newTargetCue.cueType === "audio" && newSelectedCue.cueType === "audio")) {
    return {
      ok: false,
      reason: "audio-type-mismatch",
    }
  }

  return {
    ok: true,
    newTargetCue,
    newSelectedCue,
  }
}

export {
  canPlaceCueAtIndex,
  findLeftMostAvailableIndex,
  resolveCueSwapPlacement,
}
