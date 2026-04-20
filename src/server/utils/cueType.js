const VALID_CUE_TYPES = ["visual", "audio"]

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

const getAudioRow = (screenCount) => Number(screenCount) + 1

const isAudioScreen = (screen, screenCount) => Number(screen) === getAudioRow(screenCount)

const getCueTypeFromScreen = (screen, screenCount) =>
  isAudioScreen(screen, screenCount) ? "audio" : "visual"

const isAudioMimeType = (mimeType = "") => mimeType.startsWith("audio/")

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

const isAllowedMimeType = (mimeType = "") => {
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

module.exports = {
  VALID_CUE_TYPES,
  getAudioRow,
  isAudioScreen,
  getCueTypeFromScreen,
  isAudioMimeType,
  isAllowedMimeType,
}
