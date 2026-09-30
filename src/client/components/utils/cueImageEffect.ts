export const DEFAULT_IMAGE_EFFECT = "none"

export const IMAGE_EFFECTS = [
  { value: "none", label: "None" },
  { value: "fade", label: "Fade in/out" },
] as const

export type ImageEffect = (typeof IMAGE_EFFECTS)[number]["value"]

export const isValidImageEffect = (value: unknown): value is ImageEffect =>
  IMAGE_EFFECTS.some((effect) => effect.value === value)

export const normalizeImageEffect = (value: unknown): ImageEffect =>
  isValidImageEffect(value) ? value : DEFAULT_IMAGE_EFFECT

export const DEFAULT_IMAGE_EFFECT_SPEED = 1
export const MIN_IMAGE_EFFECT_SPEED = 0.25
export const MAX_IMAGE_EFFECT_SPEED = 4
export const IMAGE_EFFECT_BASE_SECONDS = 4

export const normalizeImageEffectSpeed = (value: unknown): number => {
  const speed = Number(value)

  if (!Number.isFinite(speed) || value === null || value === "") {
    return DEFAULT_IMAGE_EFFECT_SPEED
  }

  return Math.min(
    MAX_IMAGE_EFFECT_SPEED,
    Math.max(MIN_IMAGE_EFFECT_SPEED, speed)
  )
}

export const imageEffectDurationSeconds = (value: unknown): number =>
  IMAGE_EFFECT_BASE_SECONDS / normalizeImageEffectSpeed(value)
