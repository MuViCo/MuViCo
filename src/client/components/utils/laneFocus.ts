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
 * How far a lane cell reaches past its grid track, in px, on each side that
 * faces another lane of the same screen.
 *
 * This is what lets one number serve two spacings. The row gap is a real, wide
 * spacing shared by the lane gutter and the react-grid-layout body, so both stay
 * aligned; lanes of the same screen then reach towards each other and close most
 * of it, leaving them a narrow gap apart, while the gap at a screen's edge is
 * left untouched and reads as the space between screens. Widening the gap alone
 * could not do this: it is one value, and it would push a screen's own layers
 * apart by exactly as much as it separated the screens.
 */
export const LANE_KNIT = 16

/**
 * How far a screen's frame is drawn outside the lanes it contains, in px.
 *
 * Taken out of the space at the screen's edge, which is why that space has to be
 * more than twice this.
 */
export const GROUP_PAD = 10

/**
 * Per-lane height change and top offset.
 *
 * Two effects, composed here because both change a lane's box without moving
 * the grid track underneath it -- the track is the coordinate the frame columns
 * and every hit test are built on.
 *
 * The first is the knitting described above: each lane reaches LANE_KNIT
 * towards each sibling it has, and not at all towards the screen next door.
 *
 * The second is focus. The naive version -- grow the focused lane about its own
 * centre and leave the rest alone -- eats into the gaps on either side of it and
 * widens the ones two lanes away, so the spacing that tells layers apart, and
 * screens apart, stops holding precisely when the eye is drawn to it. So the
 * growth is borrowed instead: the focused lane gains `laneFocusBleed`, its
 * siblings each give up an equal share, and each lane is shifted by the running
 * total of what came before it. Consecutive lanes stay exactly one gap apart by
 * construction, and because the shares sum to zero the group ends where it
 * began, so the screens keep their spacing too.
 *
 * A lane in a group that does not hold focus is left at its knitted size.
 * Shrinking it would change that group's height, which is what this avoids.
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

  const bleed = laneFocusBleed(rowHeight)

  groups.forEach((group) => {
    const holdsFocus =
      focusedRowIndex >= group.startY &&
      focusedRowIndex < group.startY + group.laneCount &&
      group.laneCount > 1
    const share = holdsFocus ? bleed / (group.laneCount - 1) : 0

    let borrowed = 0
    for (let p = 0; p < group.laneCount; p += 1) {
      const y = group.startY + p
      const reachUp = p > 0 ? LANE_KNIT : 0
      const reachDown = p < group.laneCount - 1 ? LANE_KNIT : 0
      const focusDelta = holdsFocus
        ? y === focusedRowIndex
          ? bleed
          : -share
        : 0

      delta[y] = reachUp + reachDown + focusDelta
      offset[y] = borrowed - reachUp
      borrowed += focusDelta
    }
  })

  return { delta, offset }
}
