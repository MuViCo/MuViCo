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

export {
  DEFAULT_CUE_WIDTH_UNITS,
  getCueWidthUnits,
  buildCueCellMap,
}