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
 * Extra height a focused lane takes, in px.
 *
 * The group frame grows by the same amount, so the frame still encloses its
 * lanes; the growth is absorbed by the gutter between groups, which is why it
 * must stay under that gap.
 */
export const LANE_FOCUS_GROWTH = 0.15

export const laneFocusBleed = (rowHeight: number): number =>
  Math.round(rowHeight * LANE_FOCUS_GROWTH)

/**
 * How much a lane gives up while a lane in another group holds focus.
 *
 * Taken inside the lane's own grid track rather than from it: the track height
 * is the coordinate the frame columns, the cue positions and every hit test are
 * built on, so shrinking it would slide the gutter out of step with the rows it
 * labels. Only the cell drawn in the track gets shorter, centred, which reads as
 * the lane receding without moving anything.
 *
 * This is also why the growth above stays at or below the inter-group gap: the
 * focused lane's extra height has to fit in the gutter, and dimming the others
 * frees no room there.
 */
export const LANE_DIM_SHRINK = 0.1

export const laneDimShrink = (rowHeight: number): number =>
  Math.round(rowHeight * LANE_DIM_SHRINK)

/**
 * How much taller (or shorter) a lane is drawn than its grid track.
 *
 * The focused lane gains `laneFocusBleed`, every other lane gives up
 * `laneDimShrink`, and with nothing focused every lane matches its track. The
 * two are sized so the growth fits in the space the neighbours give up plus the
 * row gap, which is what lets the effect stay inside the group: the group's
 * frame never changes size, so the spacing between screens is the same whether
 * a lane is focused or not.
 */
export const laneFocusDelta = (
  rowIndex: number,
  focusedRowIndex: number,
  rowHeight: number
): number => {
  if (focusedRowIndex < 0) return 0
  return rowIndex === focusedRowIndex
    ? laneFocusBleed(rowHeight)
    : -laneDimShrink(rowHeight)
}

/**
 * Offset that keeps a resized lane centred on its track, so it grows and
 * shrinks about its own middle instead of hanging off the top.
 *
 * Presentation only -- hit-testing still runs on the untouched track, so a click
 * within half a delta of a boundary can land on the neighbouring lane.
 */
export const laneFocusOffset = (
  rowIndex: number,
  focusedRowIndex: number,
  rowHeight: number
): number => -laneFocusDelta(rowIndex, focusedRowIndex, rowHeight) / 2

export const GROUP_INSET = 12
