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