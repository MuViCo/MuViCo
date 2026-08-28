/**
 * Geometry of the edit-mode timeline.
 *
 * The timeline is three independent DOM subtrees -- the left lane gutter
 * (a CSS grid), the frame header row (another CSS grid) and the react-grid-layout
 * body -- which stay aligned only because they all compute positions from the
 * same four numbers. Those numbers used to be four `const`s in EditMode plus an
 * independently recomputed copy of frameHeaderHeight in EditModeHeaders, so a
 * change in one place silently misaligned the others.
 *
 * The helpers below are the only place the row/column arithmetic is written.
 * They take an optional metrics argument because GridLayoutComponent and
 * EditModeHeaders receive their geometry as props (the tests pass other values),
 * and this module is the default source for the caller rather than a hard
 * dependency of the leaf components.
 */

export interface TimelineMetrics {
  columnWidth: number
  rowHeight: number
  /** Gap between frame columns. */
  gap: number
  /**
   * Gap between lane rows. Separate from the column gap because the two are
   * read differently: columns are frames in time and want air between them,
   * while lanes are tracks of one screen and want to read as a stack.
   */
  rowGap: number
  /** Frame-header band height. Previously `Math.max(rowHeight - 45, 0)`. */
  frameHeaderHeight: number
  /** Width of a lane header cell in the left gutter. */
  rowHeaderWidth: number
}

/**
 * Declared against the interface rather than `as const`: callers override
 * individual fields (`{ ...TIMELINE_METRICS, rowHeight }`) and literal types
 * would reject a plain number there.
 */
export const TIMELINE_METRICS: TimelineMetrics = {
  columnWidth: 150,
  // Compact tracks with a tight gutter, the way a video editor stacks them.
  // 100/10 gave a spreadsheet of large cells; at 72/6 more of the timeline is
  // on screen and the clips, rather than the grid, carry the eye.
  rowHeight: 60,
  // Wide enough for the add-layer control to sit in the gutter between two
  // groups. The gutter and the grid both derive from this, so widening it keeps
  // the two aligned; narrowing it below the control height puts the buttons on
  // top of the next group instead.
  gap: 14,
  // Wide, and shared by the lane gutter and the react-grid-layout body so the
  // two stay aligned. Lanes of the same screen then reach towards each other by
  // LANE_KNIT and close most of it, which is what lets one number give a screen's
  // layers a narrow gap and the screens themselves a wide one.
  rowGap: 40,
  // Every hit-test derives its origin from this, so the band can be resized
  // here alone. Was 55 (rowHeight - 45) when it was computed in two places.
  frameHeaderHeight: 34,
  // Wide enough for the track icon, its label and its controls on one line,
  // like a video editor's track header.
  rowHeaderWidth: 168,
}

/**
 * Distance from the top of the grid container to the first lane, i.e. the frame
 * header band plus the gap under it. This is the origin every hit-test uses.
 */
export const timelineRowsTopOffset = (
  metrics: TimelineMetrics = TIMELINE_METRICS
): number => metrics.frameHeaderHeight + metrics.rowGap

/**
 * Lane offset measured from the first lane -- the coordinate space of the
 * react-grid-layout box and the empty-cell backdrop.
 */
export const laneOffset = (
  y: number,
  metrics: TimelineMetrics = TIMELINE_METRICS
): number => y * (metrics.rowHeight + metrics.rowGap)

/**
 * Lane offset measured from the top of the grid container -- the coordinate
 * space of the absolutely positioned overlays. Distinct from laneOffset by the
 * frame header band; conflating the two is the easiest mistake here.
 */
export const laneTop = (
  y: number,
  metrics: TimelineMetrics = TIMELINE_METRICS
): number => timelineRowsTopOffset(metrics) + laneOffset(y, metrics)

/** Height of `laneCount` consecutive lanes, including the gaps between them. */
export const laneSpanHeight = (
  laneCount: number,
  metrics: TimelineMetrics = TIMELINE_METRICS
): number =>
  laneCount * metrics.rowHeight + Math.max(laneCount - 1, 0) * metrics.rowGap

export const columnLeft = (
  x: number,
  metrics: TimelineMetrics = TIMELINE_METRICS
): number => x * (metrics.columnWidth + metrics.gap)

export const gridContentWidth = (
  indexCount: number,
  metrics: TimelineMetrics = TIMELINE_METRICS
): number =>
  indexCount * metrics.columnWidth + Math.max(indexCount - 1, 0) * metrics.gap
