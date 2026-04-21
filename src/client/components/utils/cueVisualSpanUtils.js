/** buildCueVisualSpanMap.js
 * Builds a map of visual spans for each cue in a presentation.
 */

export const buildCueVisualSpanMap = (cues, indexCount) => {
  const cuesByScreen = new Map()

  cues.forEach((cue) => {
    const cueId = cue?._id
    const cueIndex = Number(cue?.index)
    const cueScreen = Number(cue?.screen)

    if (!cueId || !Number.isInteger(cueIndex) || !Number.isInteger(cueScreen)) {
      return
    }

    if (!cuesByScreen.has(cueScreen)) {
      cuesByScreen.set(cueScreen, [])
    }

    cuesByScreen.get(cueScreen).push(cue)
  })
  // Sort cues within each screen by index and calculate visual spans
  // Visual span is determined by the distance to the next cue on the same screen, 
  // or to the end of the index range if it's the last cue.
  const spanMap = new Map()
  cuesByScreen.forEach((screenCues) => {
    const sortedCues = screenCues
      .slice()
      .sort((a, b) => Number(a.index) - Number(b.index))

    sortedCues.forEach((cue, cuePosition) => {
      const nextCue = sortedCues[cuePosition + 1]
      const cueIndex = Number(cue.index)
      const endIndex = nextCue ? Number(nextCue.index) - 1 : indexCount - 1
      spanMap.set(cue._id, Math.max(1, endIndex - cueIndex + 1))
    })
  })

  return spanMap
}

export const getCueVisualSpanFromMap = (cue, cueVisualSpanMap) => {
  return cueVisualSpanMap.get(cue?._id) ?? 1
}