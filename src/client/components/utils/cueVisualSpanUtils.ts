/** cueVisualSpanUtils.ts
 * Builds a map of visual spans for each cue in a presentation.
 */

import { occupiedScreens } from "./cueScreenSpanUtils"

import type { Cue } from "../../types"

const buildSpanMap = (
  cues: Cue[],
  indexCount: number,
  applyDuration: boolean
): Map<string, number> => {
  const cuesByLane = new Map<string, Cue[]>()

  cues.forEach((cue) => {
    const cueId = cue?._id
    const cueIndex = Number(cue?.index)
    const cueScreen = Number(cue?.screen)

    if (!cueId || !Number.isInteger(cueIndex) || !Number.isInteger(cueScreen)) {
      return
    }

    const cueLayer = Number(cue?.layer ?? 0)
    occupiedScreens(cue).forEach((screenNumber) => {
      const laneKey = `${screenNumber}|${cueLayer}`
      if (!cuesByLane.has(laneKey)) {
        cuesByLane.set(laneKey, [])
      }

      // Non-null assertion: the has/set pair immediately above guarantees the key.
      cuesByLane.get(laneKey)!.push(cue)
    })
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
      const untilNext = Math.max(1, endIndex - cueIndex + 1)
      const declared = Number(cue.duration)
      const span =
        applyDuration && Number.isInteger(declared)
          ? Math.max(1, Math.min(untilNext, declared))
          : untilNext
      const shortestSoFar = spanMap.get(cue._id)
      spanMap.set(
        cue._id,
        shortestSoFar === undefined ? span : Math.min(shortestSoFar, span)
      )
    })
  })

  return spanMap
}

export const buildCueVisualSpanMap = (
  cues: Cue[],
  indexCount: number
): Map<string, number> => buildSpanMap(cues, indexCount, true)

export const buildCueMaxSpanMap = (
  cues: Cue[],
  indexCount: number
): Map<string, number> => buildSpanMap(cues, indexCount, false)

export const getCueVisualSpanFromMap = (
  cue: Pick<Cue, "_id"> | null | undefined,
  cueVisualSpanMap: ReadonlyMap<string, number>
): number => {
  const cueId = cue?._id
  return (cueId ? cueVisualSpanMap.get(cueId) : undefined) ?? 1
}
