/** screenSpanLayout.ts
 * Pure geometry for a cue whose image spans several physical screens.
 *
 * Screens are laid out left-to-right in ascending screen-number order (no
 * reordering UI -- this matches how screens are already numbered). The image
 * is fit ("contain") against the combined width of every spanned screen, so
 * the whole picture keeps one consistent scale and vertical framing across
 * screen boundaries; each screen then shows the horizontal slice at its own
 * offset. A screen whose real width isn't known yet (its popup isn't open)
 * falls back to the average of the spanned screens whose width IS known, or
 * DEFAULT_SCREEN_WIDTH if none are.
 */

export const DEFAULT_SCREEN_WIDTH = 800

export interface ScreenSpanLayout {
  /** Combined width, in px, of every spanned screen laid side by side. */
  canvasWidth: number
  /** Height, in px, the image is scaled to across that combined width. */
  canvasHeight: number
  /** Screen number -> this screen's horizontal offset into the canvas. */
  offsets: Record<number, number>
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

/**
 * @param spanScreens screen numbers this cue spans, any order (sorted here).
 * @param widthMap live/known screen widths, screen number -> px.
 * @param imageNaturalAspectRatio the image's own width/height. Pass a
 *   positive finite number; while it's still loading, don't call this yet
 *   (there is no sane layout to compute without it).
 */
export const computeScreenSpanLayout = (
  spanScreens: number[],
  widthMap: Record<number, number>,
  imageNaturalAspectRatio: number
): ScreenSpanLayout => {
  const orderedScreens = [...spanScreens].sort((a, b) => a - b)
  const fallbackWidth = averageKnownWidth(orderedScreens, widthMap)

  let cumulativeOffset = 0
  const offsets: Record<number, number> = {}
  for (const screenNumber of orderedScreens) {
    offsets[screenNumber] = cumulativeOffset
    cumulativeOffset += resolveWidth(screenNumber, widthMap, fallbackWidth)
  }

  const canvasWidth = cumulativeOffset
  const canvasHeight =
    imageNaturalAspectRatio > 0 ? canvasWidth / imageNaturalAspectRatio : 0

  return { canvasWidth, canvasHeight, offsets }
}
