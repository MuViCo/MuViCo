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
 * Screens are not assumed to be the same height. A 4:3 output next to a
 * 16:9 one, or two windows sized differently, give stages of different
 * heights; the canvas takes the tallest, and a shorter screen shows the
 * band of it that it physically covers, centered. Sizes share one unit,
 * whichever the caller uses: pixels from live popups, or ratios against a
 * height of 1 for the editor previews, where every tile is drawn the same
 * height. A screen whose size isn't known yet (its popup isn't open) falls
 * back to the average of the spanned screens that are, or to
 * DEFAULT_SCREEN_WIDTH at the canvas height.
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

export interface ScreenBox {
  width: number
  height: number
}

export interface ScreenSpanLayout {
  /** Combined width of every spanned screen laid side by side. */
  canvasWidth: number
  /** Height of the canvas: that of the tallest spanned screen. */
  canvasHeight: number
  /** Screen number -> where its own box sits in the canvas. */
  boxes: Record<number, ScreenBox & { left: number; top: number }>
  /** The media's drawn box, relative to the canvas's top-left corner. */
  media: { width: number; height: number; left: number; top: number }
}

export interface ScreenSpanOptions {
  fill?: SpanFill
  position?: SpanPosition
}

const averageKnownBox = (
  spanScreens: number[],
  boxMap: Record<number, ScreenBox>
): ScreenBox => {
  const known = spanScreens
    .map((screenNumber) => boxMap[screenNumber])
    .filter(
      (box): box is ScreenBox => Boolean(box) && box.width > 0 && box.height > 0
    )

  if (known.length === 0) {
    return { width: DEFAULT_SCREEN_WIDTH, height: DEFAULT_SCREEN_WIDTH / 2 }
  }

  return {
    width: known.reduce((sum, box) => sum + box.width, 0) / known.length,
    height: known.reduce((sum, box) => sum + box.height, 0) / known.length,
  }
}

/** 0 = start, 0.5 = middle, 1 = end, per axis. */
const anchorOf = (position: SpanPosition): { x: number; y: number } => ({
  x: position.includes("left") ? 0 : position.includes("right") ? 1 : 0.5,
  y: position.includes("top") ? 0 : position.includes("bottom") ? 1 : 0.5,
})

/**
 * @param spanScreens screen numbers this cue spans, any order (sorted here).
 * @param boxMap each spanned screen's own box, screen number -> size.
 * @param mediaAspectRatio the media's own width/height. Pass a positive
 *   finite number; while it's still loading, don't call this yet (there is
 *   no sane layout to compute without it).
 */
export const computeScreenSpanLayout = (
  spanScreens: number[],
  boxMap: Record<number, ScreenBox>,
  mediaAspectRatio: number,
  options: ScreenSpanOptions = {}
): ScreenSpanLayout => {
  const orderedScreens = [...spanScreens].sort((a, b) => a - b)
  const fallback = averageKnownBox(orderedScreens, boxMap)

  const sizes = orderedScreens.map((screenNumber) => {
    const box = boxMap[screenNumber]
    return box && box.width > 0 && box.height > 0 ? box : fallback
  })

  const canvasWidth = sizes.reduce((sum, box) => sum + box.width, 0)
  // The tallest screen sets the canvas; a shorter one covers a band of it.
  const canvasHeight = sizes.reduce(
    (tallest, box) => Math.max(tallest, box.height),
    0
  )

  let cumulativeOffset = 0
  const boxes: ScreenSpanLayout["boxes"] = {}
  orderedScreens.forEach((screenNumber, position) => {
    const box = sizes[position]
    boxes[screenNumber] = {
      ...box,
      left: cumulativeOffset,
      // Centered, so a shorter screen loses as much above as below rather
      // than hanging off one edge.
      top: (canvasHeight - box.height) / 2,
    }
    cumulativeOffset += box.width
  })

  const fill = options.fill ?? DEFAULT_SPAN_FILL
  const anchor = anchorOf(options.position ?? DEFAULT_SPAN_POSITION)

  if (!(mediaAspectRatio > 0) || !(canvasHeight > 0)) {
    return {
      canvasWidth,
      canvasHeight,
      boxes,
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
    boxes,
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

/**
 * Each screen's box from its declared ratio, against a shared height of 1.
 * For the editor previews, where every tile is drawn the same height and
 * only their shapes differ.
 */
export const screenBoxesFromRatios = (
  spanScreens: number[],
  screenAspectRatios: Record<string, string> | null | undefined,
  fallback?: string | null
): Record<number, ScreenBox> =>
  Object.fromEntries(
    spanScreens.map((screenNumber) => [
      screenNumber,
      {
        width: parseAspectRatio(
          resolveScreenAspectRatio(screenAspectRatios, screenNumber, fallback)
        ),
        height: 1,
      },
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
  const box = layout.boxes[screenNumber]
  if (!box || box.width <= 0 || box.height <= 0) {
    return { left: "0%", top: "0%", width: "100%", height: "100%" }
  }

  const pct = (value: number, basis: number) => `${(value / basis) * 100}%`

  return {
    left: pct(layout.media.left - box.left, box.width),
    top: pct(layout.media.top - box.top, box.height),
    width: pct(layout.media.width, box.width),
    height: pct(layout.media.height, box.height),
  }
}
