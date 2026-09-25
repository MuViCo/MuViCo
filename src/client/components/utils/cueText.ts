export const DEFAULT_TEXT_COLOR = "#ffffff"
export const DEFAULT_TEXT_SIZE = 8
export const MIN_TEXT_SIZE = 1
export const MAX_TEXT_SIZE = 100
export const TEXT_SIZE_SLIDER_MIN = 2
export const TEXT_SIZE_SLIDER_MAX = 40
export const MAX_TEXT_LENGTH = 500

interface TextFields {
  text?: unknown
  textColor?: unknown
  textSize?: unknown
}

export const isTextCue = (cue: TextFields | null | undefined): boolean =>
  typeof cue?.text === "string" && cue.text.length > 0

export const normalizeTextSize = (size: unknown): number => {
  const numericSize = Number(size)

  if (!Number.isFinite(numericSize) || size === null || size === "") {
    return DEFAULT_TEXT_SIZE
  }

  return Math.min(MAX_TEXT_SIZE, Math.max(MIN_TEXT_SIZE, numericSize))
}

export const normalizeTextColor = (color: unknown): string =>
  typeof color === "string" && /^#([0-9A-F]{3}){1,2}$/i.test(color)
    ? color
    : DEFAULT_TEXT_COLOR

export const textSnippet = (text: unknown, maxLength = 30): string => {
  const firstLine = String(text ?? "")
    .split("\n")[0]
    .trim()

  return firstLine.length > maxLength
    ? `${firstLine.slice(0, maxLength - 1).trimEnd()}…`
    : firstLine
}

export const textCellBackground = (color: unknown): string => {
  const hex = normalizeTextColor(color).slice(1)
  const full =
    hex.length === 3
      ? hex
          .split("")
          .map((digit) => digit + digit)
          .join("")
      : hex
  const [red, green, blue] = [0, 2, 4].map((start) =>
    parseInt(full.slice(start, start + 2), 16)
  )
  const luminance = (0.299 * red + 0.587 * green + 0.114 * blue) / 255

  return luminance > 0.6 ? "#2a2540" : "#ece8f7"
}
