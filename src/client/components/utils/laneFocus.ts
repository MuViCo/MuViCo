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
 * How much a focused lane grows.
 *
 * Bounded by the 10px inter-lane gap: at rowHeight 100 a 1.12 scale adds 12px,
 * i.e. 6px on each side, which stays inside the gap and never overlaps the
 * neighbouring lane.
 */
export const LANE_FOCUS_SCALE = 1.12

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
 * The transform for a focused cue.
 *
 * Vertical growth is the full scale. Horizontal growth is pinned to the same
 * absolute number of pixels a single-column cue would gain, because a cue's
 * width follows its frame span: a ten-frame cue is 1590px wide, and scaling
 * that uniformly would add 95px per side and plough into its lane neighbours.
 * Holding the horizontal overhang at a constant ~9px per side keeps the effect
 * readable at every span, at the cost of slight anisotropy on long cues.
 */
export const focusTransform = (
  spanColumns: number,
  columnWidth: number,
  gap: number
): string => {
  const width = spanColumns * columnWidth + Math.max(spanColumns - 1, 0) * gap
  const scaleX =
    width > 0
      ? 1 + ((LANE_FOCUS_SCALE - 1) * columnWidth) / width
      : LANE_FOCUS_SCALE

  return `scale(${Number(scaleX.toFixed(4))}, ${LANE_FOCUS_SCALE})`
}

/**
 * Extra height a focused lane takes, in px.
 *
 * The lanes cannot actually change height -- react-grid-layout uses a single
 * rowHeight for every row and the gutter mirrors it with fixed CSS tracks, so a
 * real height change would desynchronise both from every hit test. The
 * neighbours are instead translated apart by half this each, which reads as the
 * focused lane pushing them aside while the underlying grid is untouched.
 */
export const laneFocusBleed = (rowHeight: number): number =>
  rowHeight * (LANE_FOCUS_SCALE - 1)

/**
 * Vertical offset for a lane at `rowIndex` while `focusedRowIndex` is focused.
 *
 * Lanes above move up, lanes below move down, the focused lane stays put. This
 * is presentation only: the hit-test arithmetic still runs on the untransformed
 * grid, so a click within the few pixels a lane has shifted can land on its
 * neighbour. Bounded by half the bleed, which is 6px at the default metrics.
 */
export const laneFocusShift = (
  rowIndex: number,
  focusedRowIndex: number,
  rowHeight: number
): number => {
  if (focusedRowIndex < 0 || rowIndex === focusedRowIndex) return 0
  const half = laneFocusBleed(rowHeight) / 2
  return rowIndex < focusedRowIndex ? -half : half
}
