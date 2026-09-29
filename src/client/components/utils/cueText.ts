export const DEFAULT_TEXT_COLOR = "#ffffff"
export const DEFAULT_TEXT_SIZE = 8
export const MIN_TEXT_SIZE = 1
export const MAX_TEXT_SIZE = 100
export const TEXT_SIZE_SLIDER_MIN = 2
export const TEXT_SIZE_SLIDER_MAX = 40
export const MAX_TEXT_LENGTH = 500

export const DEFAULT_TEXT_EFFECT = "none"

export const TEXT_EFFECTS = [
  { value: "none", label: "None" },
  { value: "crawl", label: "Star Wars crawl" },
  { value: "scroll-up", label: "Scroll up" },
  { value: "scroll-down", label: "Scroll down" },
] as const

export type TextEffect = (typeof TEXT_EFFECTS)[number]["value"]

export const isValidTextEffect = (value: unknown): value is TextEffect =>
  TEXT_EFFECTS.some((effect) => effect.value === value)

export const normalizeTextEffect = (value: unknown): TextEffect =>
  isValidTextEffect(value) ? value : DEFAULT_TEXT_EFFECT

export const DEFAULT_TEXT_EFFECT_SPEED = 1
export const MIN_TEXT_EFFECT_SPEED = 0.25
export const MAX_TEXT_EFFECT_SPEED = 4
export const TEXT_EFFECT_BASE_SECONDS = 22

export const normalizeTextEffectSpeed = (value: unknown): number => {
  const speed = Number(value)

  if (!Number.isFinite(speed) || value === null || value === "") {
    return DEFAULT_TEXT_EFFECT_SPEED
  }

  return Math.min(MAX_TEXT_EFFECT_SPEED, Math.max(MIN_TEXT_EFFECT_SPEED, speed))
}

export const textEffectDurationSeconds = (value: unknown): number =>
  TEXT_EFFECT_BASE_SECONDS / normalizeTextEffectSpeed(value)

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
