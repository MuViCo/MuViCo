const DEFAULT_CUE_WIDTH_UNITS = 1

const getCueWidthUnits = (cue) => {
  const parsedWidth = Number(cue?.cueWidth ?? cue?.w)
  if (Number.isInteger(parsedWidth) && parsedWidth >= DEFAULT_CUE_WIDTH_UNITS) {
    return parsedWidth
  }
  return DEFAULT_CUE_WIDTH_UNITS
}

const buildCueCellMap = (cues) => {
  const cueCellMap = new Map()

  for (const cue of cues) {
    const cueWidth = getCueWidthUnits(cue)
    for (let xOffset = 0; xOffset < cueWidth; xOffset += 1) {
      cueCellMap.set(`${Number(cue.index) + xOffset}:${Number(cue.screen)}`, cue)
    }
  }

  return cueCellMap
}

const getCueCellKey = (xIndex, yIndex) => {
  return `${Number(xIndex)}:${Number(yIndex)}`
}

const getCueAtGridCell = (cueByGridCell, xIndex, yIndex) => {
  return cueByGridCell.get(getCueCellKey(xIndex, yIndex)) || null
}

const getGridPositionFromPointer = (event, containerElement, columnWidth, rowHeight, gap) => {
  const dropX = event.clientX
  const containerRect = containerElement.getBoundingClientRect()
  const containerScrollLeft = containerElement.scrollLeft

  const relativeDropX = dropX - containerRect.left
  const absoluteDropX = relativeDropX + containerScrollLeft
  const dropY = event.clientY - containerRect.top

  const cellWidthWithGap = columnWidth + gap
  const cellHeightWithGap = rowHeight + gap

  const yIndex = Math.floor(dropY / cellHeightWithGap)
  const xIndex = Math.floor(absoluteDropX / cellWidthWithGap)

  return { xIndex, yIndex }
}

export {
  DEFAULT_CUE_WIDTH_UNITS,
  getCueWidthUnits,
  buildCueCellMap,
  getCueCellKey,
  getCueAtGridCell,
  getGridPositionFromPointer,
}