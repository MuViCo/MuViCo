/** screenSpanLayout.ts
 * Pure geometry for a cue whose media spans several physical screens.
 *
 * Screens are laid out left-to-right in ascending screen-number order (no
 * reordering UI -- this matches how screens are already numbered). Together
 * they form one canvas; the media is scaled into that canvas as a whole, so
 * it keeps one consistent scale and framing across screen boundaries, and
 * each screen then shows the slice at its own offset.
 *
 * `cover` scales the media until it fills the canvas, cropping whichever
 * axis overflows. `contain` scales it until it fits, leaving bands on
 * whichever axis is short. Either way `position` anchors the media in the
 * canvas, which picks what gets cropped or where the bands fall.
 *
 * Widths and the canvas height share one unit, whichever the caller uses:
 * pixels from live popups, or ratios against a height of 1 for the editor
 * previews. A screen whose width isn't known yet (its popup isn't open)
 * falls back to the average of the spanned screens whose width IS known, or
 * DEFAULT_SCREEN_WIDTH if none are.
 */

import {
  parseAspectRatio,
  resolveScreenAspectRatio,
} from "../../../constants.js"

export const DEFAULT_SCREEN_WIDTH = 800

export type SpanFill = "cover" | "contain"

export type SpanPosition =
  | "top-left"
  | "top"
  | "top-right"
  | "left"
  | "center"
  | "right"
  | "bottom-left"
  | "bottom"
  | "bottom-right"

export const SPAN_FILLS: SpanFill[] = ["cover", "contain"]

/** Row-major, so a 3x3 picker can render it as-is. */
export const SPAN_POSITIONS: SpanPosition[] = [
  "top-left",
  "top",
  "top-right",
  "left",
  "center",
  "right",
  "bottom-left",
  "bottom",
  "bottom-right",
]

export const DEFAULT_SPAN_FILL: SpanFill = "cover"
export const DEFAULT_SPAN_POSITION: SpanPosition = "center"

export interface ScreenSpanLayout {
  /** Combined width of every spanned screen laid side by side. */
  canvasWidth: number
  /** Height of the canvas, i.e. of one screen. */
  canvasHeight: number
  /** Screen number -> this screen's horizontal offset into the canvas. */
  offsets: Record<number, number>
  /** Screen number -> the width used for it, resolved or fallen back. */
  widths: Record<number, number>
  /** The media's drawn box, relative to the canvas's top-left corner. */
  media: { width: number; height: number; left: number; top: number }
}

export interface ScreenSpanOptions {
  /** Height of one screen, in the same unit as the widths. */
  canvasHeight: number
  fill?: SpanFill
  position?: SpanPosition
}

const resolveWidth = (
  screenNumber: number,
  widthMap: Record<number, number>,
  fallbackWidth: number
): number => widthMap[screenNumber] ?? fallbackWidth

const averageKnownWidth = (
  spanScreens: number[],
  widthMap: Record<number, number>
): number => {
  const knownWidths = spanScreens
    .map((screenNumber) => widthMap[screenNumber])
    .filter((width): width is number => typeof width === "number")

  if (knownWidths.length === 0) {
    return DEFAULT_SCREEN_WIDTH
  }

  return knownWidths.reduce((sum, width) => sum + width, 0) / knownWidths.length
}

/** 0 = start, 0.5 = middle, 1 = end, per axis. */
const anchorOf = (position: SpanPosition): { x: number; y: number } => ({
  x: position.includes("left") ? 0 : position.includes("right") ? 1 : 0.5,
  y: position.includes("top") ? 0 : position.includes("bottom") ? 1 : 0.5,
})

/**
 * @param spanScreens screen numbers this cue spans, any order (sorted here).
 * @param widthMap live/known screen widths, screen number -> px.
 * @param mediaAspectRatio the media's own width/height. Pass a positive
 *   finite number; while it's still loading, don't call this yet (there is
 *   no sane layout to compute without it).
 */
export const computeScreenSpanLayout = (
  spanScreens: number[],
  widthMap: Record<number, number>,
  mediaAspectRatio: number,
  options: ScreenSpanOptions
): ScreenSpanLayout => {
  const orderedScreens = [...spanScreens].sort((a, b) => a - b)
  const fallbackWidth = averageKnownWidth(orderedScreens, widthMap)

  let cumulativeOffset = 0
  const offsets: Record<number, number> = {}
  const widths: Record<number, number> = {}
  for (const screenNumber of orderedScreens) {
    offsets[screenNumber] = cumulativeOffset
    widths[screenNumber] = resolveWidth(screenNumber, widthMap, fallbackWidth)
    cumulativeOffset += widths[screenNumber]
  }

  const canvasWidth = cumulativeOffset
  const canvasHeight = options.canvasHeight
  const fill = options.fill ?? DEFAULT_SPAN_FILL
  const anchor = anchorOf(options.position ?? DEFAULT_SPAN_POSITION)

  if (!(mediaAspectRatio > 0) || !(canvasHeight > 0)) {
    return {
      canvasWidth,
      canvasHeight,
      offsets,
      widths,
      media: { width: canvasWidth, height: canvasHeight, left: 0, top: 0 },
    }
  }

  // Treat the media as aspectRatio wide by 1 tall, then scale it until it
  // covers the canvas (cropping the overflowing axis) or fits inside it
  // (leaving bands on the short one).
  const scaleToFillWidth = canvasWidth / mediaAspectRatio
  const scaleToFillHeight = canvasHeight
  const scale =
    fill === "cover"
      ? Math.max(scaleToFillWidth, scaleToFillHeight)
      : Math.min(scaleToFillWidth, scaleToFillHeight)

  const width = mediaAspectRatio * scale
  const height = scale

  return {
    canvasWidth,
    canvasHeight,
    offsets,
    widths,
    // Negative when the media overflows, which is how the anchor picks the
    // cropped side; positive when it is short, which places the bands.
    media: {
      width,
      height,
      left: (canvasWidth - width) * anchor.x,
      top: (canvasHeight - height) * anchor.y,
    },
  }
}

export const screenWidthMapFromRatios = (
  spanScreens: number[],
  screenAspectRatios: Record<string, string> | null | undefined,
  fallback?: string | null
): Record<number, number> =>
  Object.fromEntries(
    spanScreens.map((screenNumber) => [
      screenNumber,
      parseAspectRatio(
        resolveScreenAspectRatio(screenAspectRatios, screenNumber, fallback)
      ),
    ])
  )

/**
 * The media's box as CSS percentages of one screen's own box, ready for an
 * absolutely positioned child of a full-size, overflow-hidden container.
 *
 * Percentages rather than pixels so the same numbers serve a live popup and
 * a scaled-down editor preview, and left/width resolve against the screen's
 * width while top/height resolve against its height -- which is what an
 * absolutely positioned child does.
 */
export const spanMediaStyle = (
  layout: ScreenSpanLayout,
  screenNumber: number
): { left: string; top: string; width: string; height: string } => {
  const screenWidth = layout.widths[screenNumber] ?? layout.canvasWidth
  const screenHeight = layout.canvasHeight
  const offset = layout.offsets[screenNumber] ?? 0
  const pct = (value: number, basis: number) =>
    `${basis > 0 ? (value / basis) * 100 : 0}%`

  return {
    left: pct(layout.media.left - offset, screenWidth),
    top: pct(layout.media.top, screenHeight),
    width: pct(layout.media.width, screenWidth),
    height: pct(layout.media.height, screenHeight),
  }
}
