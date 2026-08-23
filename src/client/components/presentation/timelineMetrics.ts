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
  gap: number
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
  rowHeight: 100,
  gap: 10,
  frameHeaderHeight: 55,
  rowHeaderWidth: 120,
}

/**
 * Distance from the top of the grid container to the first lane, i.e. the frame
 * header band plus the gap under it. This is the origin every hit-test uses.
 */
export const timelineRowsTopOffset = (
  metrics: TimelineMetrics = TIMELINE_METRICS
): number => metrics.frameHeaderHeight + metrics.gap

/**
 * Lane offset measured from the first lane -- the coordinate space of the
 * react-grid-layout box and the empty-cell backdrop.
 */
export const laneOffset = (
  y: number,
  metrics: TimelineMetrics = TIMELINE_METRICS
): number => y * (metrics.rowHeight + metrics.gap)

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
  laneCount * metrics.rowHeight + Math.max(laneCount - 1, 0) * metrics.gap

export const columnLeft = (
  x: number,
  metrics: TimelineMetrics = TIMELINE_METRICS
): number => x * (metrics.columnWidth + metrics.gap)

export const gridContentWidth = (
  indexCount: number,
  metrics: TimelineMetrics = TIMELINE_METRICS
): number =>
  indexCount * metrics.columnWidth + Math.max(indexCount - 1, 0) * metrics.gap
