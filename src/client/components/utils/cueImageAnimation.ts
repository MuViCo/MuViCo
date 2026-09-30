import {
  imageEffectDurationSeconds,
  normalizeImageEffect,
} from "./cueImageEffect"

const FADE_KEYFRAMES_NAME = "muvico-cue-image-fade"

interface ImageEffectFields {
  imageEffect?: string
  imageEffectSpeed?: number
  imageEffectLoop?: boolean
}

export const imageEffectAnimation = (
  cue: ImageEffectFields | null | undefined,
  prefersReducedMotion: boolean
): string | undefined => {
  const resolvedEffect = normalizeImageEffect(cue?.imageEffect)
  if (resolvedEffect === "none" || prefersReducedMotion) {
    return undefined
  }

  const duration = `${imageEffectDurationSeconds(cue?.imageEffectSpeed)}s`
  return `${FADE_KEYFRAMES_NAME} ${duration} ease-in-out ${cue?.imageEffectLoop ? "infinite" : "forwards"}`
}
