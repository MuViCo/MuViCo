export const isType = {
  image: (file) => file?.type?.includes("image"),
  video: (file) => file?.type?.includes("video"),
  audio: (file) => file?.type?.includes("audio"),
}

export const VALID_VISUAL_MIME_TYPES = [
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/gif",
  "image/bmp",
  "image/webp",
  "image/avif",
  "image/apng",
  "image/ico",
  "image/jfif",
  "image/jpe",
  "image/svg+xml",
  "video/mp4",
  "video/3gpp",
]

export const VALID_AUDIO_MIME_TYPES = [
  "audio/mpeg",
  "audio/wav",
  "audio/vnd.wave",
]

export const getAudioRow = (screenCount) => Number(screenCount) + 1

export const isAudioRow = (screen, screenCount) => Number(screen) === getAudioRow(screenCount)

export const isAudioCue = (cue, screenCount) => {
  if (cue?.cueType) {
    return cue.cueType === "audio"
  }

  return isAudioRow(cue?.screen, screenCount)
}

export const isAudioMimeType = (mimeType = "") => mimeType.startsWith("audio/")

export const isImageOrVideoMimeType = (mimeType = "") =>
  mimeType.startsWith("image/") || mimeType.startsWith("video/")

export const getAllowedMimeTypesForScreen = (screen, screenCount) =>
  isAudioRow(screen, screenCount) ? VALID_AUDIO_MIME_TYPES : VALID_VISUAL_MIME_TYPES
