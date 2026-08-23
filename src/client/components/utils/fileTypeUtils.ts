/**
 * fileTypeUtils.ts
 * Utility functions for handling file types and determining allowed MIME types for cues based on their screen.
 */

import type { Cue } from "../../types"

/**
 * A thing with a MIME type: both a browser File and a stored CueFileMeta match.
 * `type` is optional because CueFileMeta's is.
 */
type MimeTyped = { type?: string } | null | undefined

/**
 * Note these return `boolean | undefined`, not `boolean`: the optional chain
 * short-circuits when the file or its type is missing. Callers use them in
 * conditionals, where undefined and false behave identically.
 */
export const isType = {
  image: (file: MimeTyped) => file?.type?.includes("image"),
  video: (file: MimeTyped) => file?.type?.includes("video"),
  audio: (file: MimeTyped) => file?.type?.includes("audio"),
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

/**
 * The screen row reserved for audio cues, i.e. screenCount + 1.
 *
 * The numeric parameters below are `unknown` because every one of these helpers
 * runs its argument through Number(): they are called with values straight from
 * grid coordinates, form fields and parsed drag payloads. Typing them `number`
 * would push the coercion out to the call sites, which is a refactor.
 */
export const getAudioRow = (screenCount: unknown): number =>
  Number(screenCount) + 1

export const isAudioRow = (screen: unknown, screenCount: unknown): boolean =>
  Number(screen) === getAudioRow(screenCount)

export const isAudioCue = (
  cue: Partial<Cue> | null | undefined,
  screenCount: unknown
): boolean => {
  if (cue?.cueType) {
    return cue.cueType === "audio"
  }

  return isAudioRow(cue?.screen, screenCount)
}

export const isCueTypeCompatibleWithRow = (
  cueType: string | undefined,
  row: unknown,
  screenCount: unknown
): boolean =>
  cueType === "audio"
    ? isAudioRow(row, screenCount)
    : !isAudioRow(row, screenCount)

export const isInsidePresentationGridCell = ({
  xIndex,
  yIndex,
  indexCount,
  screenCount,
}: {
  xIndex: unknown
  yIndex: unknown
  indexCount: unknown
  screenCount: unknown
}): boolean => {
  const audioRow = getAudioRow(screenCount)
  return (
    Number(xIndex) >= 0 &&
    Number(xIndex) < Number(indexCount) &&
    Number(yIndex) >= 1 &&
    Number(yIndex) <= Number(audioRow)
  )
}

export const isAudioMimeType = (mimeType = ""): boolean =>
  mimeType.startsWith("audio/")

export const isImageOrVideoMimeType = (mimeType = ""): boolean =>
  mimeType.startsWith("image/") || mimeType.startsWith("video/")

export const getAllowedMimeTypesForScreen = (
  screen: unknown,
  screenCount: unknown
): string[] =>
  isAudioRow(screen, screenCount)
    ? VALID_AUDIO_MIME_TYPES
    : VALID_VISUAL_MIME_TYPES
