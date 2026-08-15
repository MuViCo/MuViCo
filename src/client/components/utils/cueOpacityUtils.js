export const DEFAULT_CUE_OPACITY = 1

export const normalizeCueOpacity = (opacity) => {
  const numericOpacity = Number(opacity)

  if (!Number.isFinite(numericOpacity)) {
    return DEFAULT_CUE_OPACITY
  }

  return Math.min(1, Math.max(0, numericOpacity))
}

export const opacityPercentFromCue = (cue) =>
  Math.round(normalizeCueOpacity(cue?.opacity) * 100)

export const opacityFromPercent = (percent) =>
  normalizeCueOpacity(Number(percent) / 100)
