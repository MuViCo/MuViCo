/**
 * How a media-library entry is previewed and dragged.
 *
 * Many stored entries claim `image/jpeg` when the file is really a video: the
 * type was never recorded and the schema default filled in. So the filename
 * decides whenever the stored type is missing or is that default.
 */

import type { MediaLibraryItem, NewCueDragData } from "../../types"

export type MediaKind = "image" | "video" | "audio"

/** presentationSchema's default, indistinguishable from "not recorded". */
const SCHEMA_DEFAULT_MIME = "image/jpeg"

const EXTENSION_MIME: Record<string, string> = {
  mp4: "video/mp4",
  "3gp": "video/3gpp",
  mp3: "audio/mpeg",
  wav: "audio/wav",
  gif: "image/gif",
  png: "image/png",
  webp: "image/webp",
  svg: "image/svg+xml",
  avif: "image/avif",
  bmp: "image/bmp",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
}

const mimeFromName = (name?: string): string | undefined => {
  const extension = name?.split(".").pop()?.toLowerCase()
  return extension ? EXTENSION_MIME[extension] : undefined
}

/** The stored type, unless it is unset or the default and the name knows better. */
export const effectiveMimeType = (item: {
  type?: string
  name?: string
}): string | undefined => {
  if (item.type && item.type !== SCHEMA_DEFAULT_MIME) {
    return item.type
  }

  return mimeFromName(item.name) ?? item.type
}

export const mediaKind = (item: {
  type?: string
  name?: string
}): MediaKind => {
  const mimeType = effectiveMimeType(item)
  if (mimeType?.startsWith("audio/")) return "audio"
  if (mimeType?.startsWith("video/")) return "video"
  return "image"
}

/** Audio drags as "sound" with a soundId, everything else as "media". */
export const dragDataForMedia = (item: MediaLibraryItem): NewCueDragData =>
  mediaKind(item) === "audio"
    ? {
        type: "newCueFromForm",
        cueName: item.name,
        elementType: "sound",
        soundId: item.id,
        mimeType: effectiveMimeType(item),
      }
    : {
        type: "newCueFromForm",
        cueName: item.name,
        elementType: "media",
        mediaId: item.id,
        mimeType: effectiveMimeType(item),
        previewUrl: item.url,
      }
