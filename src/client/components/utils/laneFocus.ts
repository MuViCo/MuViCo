/**
 * Lane focus: which single timeline lane is currently being worked on.
 *
 * Focus is on a LANE, not on a cue, for three reasons the row model forces:
 *  - a lane can be empty (buildRowModel emits `minimumLanes` lanes whether or
 *    not any cue sits on them), and "layer 2 of screen 3 is focused" has to be
 *    expressible with no cue present;
 *  - a collapsed group is one merged lane with no `layer` at all;
 *  - the effect is a whole-row emphasis, so keying it to one cue would make the
 *    focus invisible as soon as you scroll to a frame that cue does not cover.
 *
 * Focus is deliberately separate from EditMode's `selectedCue`, which is reset
 * in five places (toolbox close, toolbox save, committed move, cue removed from
 * the store, drag teardown) and is also the drag subject. A lane outlives all of
 * those events.
 */

import type { Lane } from "../../types"

/**
 * Stable identity for a lane.
 *
 * A string rather than an object because it is compared by value as a
 * useEffect dependency in the screen strip; an object literal would change
 * identity on every render and re-fire the scroll-to on every frame change.
 *
 * The `:all` suffix marks a collapsed group's merged lane, which has no layer.
 */
export const laneKey = (
  lane: Pick<Lane, "group" | "kind" | "layer">
): string => {
  const isMerged = lane.kind === "screen" || lane.kind === "audio"
  return `${lane.group}:${isMerged ? "all" : (lane.layer ?? 0)}`
}

/**
 * The screen a focused lane belongs to, for highlighting the preview strip, or
 * null when there is no tile to highlight.
 *
 * Returns null for audio lanes. Note this deliberately does NOT go through
 * `laneScreenLayer`, which maps audio lanes to the pseudo-screen
 * `screenCount + 1` because that is what the cue records use -- feeding that to
 * the strip would try to highlight a tile that does not exist.
 *
 * Also returns null for a key whose screen has since been removed, so a stale
 * focus is inert rather than an error.
 */
export const laneScreenFromKey = (
  key: string | null | undefined,
  screenCount: number
): number | null => {
  if (!key) return null

  const match = /^screen-(\d+):/.exec(key)
  if (!match) return null

  const screen = Number(match[1])
  return screen >= 1 && screen <= Number(screenCount) ? screen : null
}

/**
 * Extra height a focused lane is drawn with, in px.
 *
 * Every pixel of it is given up by the other lanes of the same screen, so the
 * group is exactly as tall focused as not. It therefore has to stay small
 * enough that those lanes can still afford it -- with one lane the group cannot
 * afford anything, and the focus is carried by colour alone.
 */
export const LANE_FOCUS_GROWTH = 0.15

export const laneFocusBleed = (rowHeight: number): number =>
  Math.round(rowHeight * LANE_FOCUS_GROWTH)

/**
 * Per-lane height change and top offset while one lane holds focus.
 *
 * The naive version -- grow the focused lane about its own centre and leave the
 * rest alone -- eats into the gaps on either side of it and widens the ones two
 * lanes away, so the spacing that separates layers from each other and screens
 * from each other stops meaning anything precisely when the eye is drawn to it.
 *
 * Here the growth is borrowed rather than taken: the focused lane gains
 * `laneFocusBleed`, its siblings in the same screen each give up an equal share
 * of it, and each lane is shifted by the running total of what came before it.
 * Consecutive lanes then stay exactly one row gap apart -- box i+1 starts where
 * box i ends plus the gap, by construction -- and because the shares sum to
 * zero, the group ends where it began and the screens keep their spacing too.
 *
 * A lane in a group that does not hold focus is untouched. Shrinking it would
 * change that group's height, which is the one thing this is built to avoid.
 *
 * Presentation only: hit-testing still runs on the untouched grid tracks, so a
 * click near a boundary can land on the neighbouring lane.
 */
export interface LaneFocusLayout {
  /** Height change per lane, indexed by row. */
  delta: number[]
  /** Top offset per lane, indexed by row. */
  offset: number[]
}

export const laneFocusLayout = (
  groups: readonly { startY: number; laneCount: number }[],
  focusedRowIndex: number,
  rowHeight: number
): LaneFocusLayout => {
  const rowCount = groups.reduce((total, g) => total + g.laneCount, 0)
  const delta = new Array<number>(rowCount).fill(0)
  const offset = new Array<number>(rowCount).fill(0)

  const group = groups.find(
    (g) =>
      focusedRowIndex >= g.startY &&
      focusedRowIndex < g.startY + g.laneCount &&
      g.laneCount > 1
  )
  if (!group) return { delta, offset }

  const bleed = laneFocusBleed(rowHeight)
  const share = bleed / (group.laneCount - 1)

  let running = 0
  for (let y = group.startY; y < group.startY + group.laneCount; y += 1) {
    delta[y] = y === focusedRowIndex ? bleed : -share
    offset[y] = running
    running += delta[y] as number
  }

  return { delta, offset }
}

export const GROUP_INSET = 18
