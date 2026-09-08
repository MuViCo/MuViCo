/*
 * Cue type utility for screen-based cue classification and MIME validation.
 * Defines allowed cue types and whitelisted MIME types for visual/audio media.
 */
import type { CueType } from "../types"

export const VALID_CUE_TYPES: CueType[] = ["visual", "audio"]

export const MAX_VISUAL_LAYERS = 3
export const MAX_AUDIO_TRACKS = 2
export const getMaxLayers = (cueType: CueType) =>
  cueType === "audio" ? MAX_AUDIO_TRACKS : MAX_VISUAL_LAYERS

const VALID_VIDEO_MIME_TYPES = ["video/mp4", "video/3gpp"]
const VALID_IMAGE_MIME_TYPES = [
  "image/jpeg",
  "image/gif",
  "image/apng",
  "image/bmp",
  "image/png",
  "image/svg+xml",
  "image/webp",
  "image/vnd.microsoft.icon",
  "image/avif",
  "image/x-win-bitmap",
]
const VALID_AUDIO_MIME_TYPES = ["audio/mpeg", "audio/wav", "audio/vnd.wave"]

export const getAudioRow = (screenCount: number | string) =>
  Number(screenCount) + 1

export const isAudioScreen = (
  screen: number | string,
  screenCount: number | string
) => Number(screen) === getAudioRow(screenCount)

export const getCueTypeFromScreen = (
  screen: number | string,
  screenCount: number | string
): CueType => (isAudioScreen(screen, screenCount) ? "audio" : "visual")

export const isAudioMimeType = (mimeType = "") => mimeType.startsWith("audio/")

const getFileTypeFromMime = (mimeType = "") => {
  if (mimeType.startsWith("image/")) {
    return "image"
  }

  if (mimeType.startsWith("video/")) {
    return "video"
  }

  if (mimeType.startsWith("audio/")) {
    return "audio"
  }

  return ""
}

export const isAllowedMimeType = (mimeType = "") => {
  const fileType = getFileTypeFromMime(mimeType)

  if (fileType === "image") {
    return VALID_IMAGE_MIME_TYPES.includes(mimeType)
  }

  if (fileType === "video") {
    return VALID_VIDEO_MIME_TYPES.includes(mimeType)
  }

  if (fileType === "audio") {
    return VALID_AUDIO_MIME_TYPES.includes(mimeType)
  }

  return false
}
