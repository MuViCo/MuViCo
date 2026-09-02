/**
 * How a media-library entry is previewed and dragged, derived from its MIME
 * type.
 *
 * The media and audio pools were merged into one grid, so the kind is no longer
 * implied by which list an item came from -- it has to be read off the type.
 */

import type { MediaLibraryItem, NewCueDragData } from "../../types"

export type MediaKind = "image" | "video" | "audio"

export const mediaKind = (mimeType?: string): MediaKind => {
  if (mimeType?.startsWith("audio/")) return "audio"
  if (mimeType?.startsWith("video/")) return "video"
  return "image"
}

/**
 * Audio still travels as elementType "sound" with a soundId, and everything
 * else as "media" with a mediaId, so the drop handler's contract is unchanged.
 */
export const dragDataForMedia = (item: MediaLibraryItem): NewCueDragData =>
  mediaKind(item.type) === "audio"
    ? {
        type: "newCueFromForm",
        cueName: item.name,
        elementType: "sound",
        soundId: item.id,
        mimeType: item.type,
      }
    : {
        type: "newCueFromForm",
        cueName: item.name,
        elementType: "media",
        mediaId: item.id,
        mimeType: item.type,
        previewUrl: item.url,
      }
