export const DEFAULT_CUE_OPACITY = 1

/**
 * Clamps arbitrary input to a 0..1 opacity, falling back to the default for
 * anything non-numeric. The parameter is `unknown` because sanitising untrusted
 * input is the whole point of this function: callers pass cue fields, form
 * values and parsed drag payloads.
 */
export const normalizeCueOpacity = (opacity: unknown): number => {
  const numericOpacity = Number(opacity)

  if (!Number.isFinite(numericOpacity)) {
    return DEFAULT_CUE_OPACITY
  }

  return Math.min(1, Math.max(0, numericOpacity))
}

export const opacityPercentFromCue = (
  cue: { opacity?: unknown } | null | undefined
): number => Math.round(normalizeCueOpacity(cue?.opacity) * 100)

export const opacityFromPercent = (percent: unknown): number =>
  normalizeCueOpacity(Number(percent) / 100)
