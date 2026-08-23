/** cueVisualSpanUtils.ts
 * Builds a map of visual spans for each cue in a presentation.
 */

import type { Cue } from "../../types"

export const buildCueVisualSpanMap = (
  cues: Cue[],
  indexCount: number
): Map<string, number> => {
  const cuesByLane = new Map<string, Cue[]>()

  cues.forEach((cue) => {
    const cueId = cue?._id
    const cueIndex = Number(cue?.index)
    const cueScreen = Number(cue?.screen)

    if (!cueId || !Number.isInteger(cueIndex) || !Number.isInteger(cueScreen)) {
      return
    }

    const laneKey = `${cueScreen}|${Number(cue?.layer ?? 0)}`
    if (!cuesByLane.has(laneKey)) {
      cuesByLane.set(laneKey, [])
    }

    // Non-null assertion: the has/set pair immediately above guarantees the key.
    cuesByLane.get(laneKey)!.push(cue)
  })
  const spanMap = new Map<string, number>()
  cuesByLane.forEach((screenCues) => {
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

export const getCueVisualSpanFromMap = (
  cue: Pick<Cue, "_id"> | null | undefined,
  cueVisualSpanMap: ReadonlyMap<string, number>
): number => {
  const cueId = cue?._id
  return (cueId ? cueVisualSpanMap.get(cueId) : undefined) ?? 1
}
