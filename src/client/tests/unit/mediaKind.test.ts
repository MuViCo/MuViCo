/*
 * mediaKind unit tests.
 * Covers deriving a media entry's kind from its stored type, the fallback to
 * the filename when that type is missing or is the schema default, and the
 * drag payload built from the result.
 */
import {
  dragDataForMedia,
  effectiveMimeType,
  mediaKind,
} from "../../components/utils/mediaKind"

describe("effectiveMimeType", () => {
  test("keeps a stored type that says something", () => {
    expect(effectiveMimeType({ type: "video/mp4", name: "a.png" })).toBe(
      "video/mp4"
    )
  })

  test("falls back to the extension when no type was recorded", () => {
    expect(effectiveMimeType({ name: "clip.mp4" })).toBe("video/mp4")
  })

  test("overrides the schema default, which is indistinguishable from unset", () => {
    // Cues written before the upload routes recorded `type` all read back as
    // image/jpeg, whatever was actually stored.
    expect(effectiveMimeType({ type: "image/jpeg", name: "clip.mp4" })).toBe(
      "video/mp4"
    )
  })

  test("leaves a genuine jpeg alone", () => {
    expect(effectiveMimeType({ type: "image/jpeg", name: "photo.jpg" })).toBe(
      "image/jpeg"
    )
  })

  test("keeps the default when the filename says nothing useful", () => {
    expect(
      effectiveMimeType({ type: "image/jpeg", name: "no-extension" })
    ).toBe("image/jpeg")
    expect(effectiveMimeType({ type: "image/jpeg", name: "a.xyz" })).toBe(
      "image/jpeg"
    )
  })
})

describe("mediaKind", () => {
  test("reads video, audio and image off the effective type", () => {
    expect(mediaKind({ type: "video/mp4", name: "a" })).toBe("video")
    expect(mediaKind({ type: "audio/wav", name: "a" })).toBe("audio")
    expect(mediaKind({ type: "image/png", name: "a" })).toBe("image")
  })

  test("recognises a mislabelled legacy video by its filename", () => {
    expect(mediaKind({ type: "image/jpeg", name: "vanha.mp4" })).toBe("video")
    expect(mediaKind({ type: "image/jpeg", name: "theme.mp3" })).toBe("audio")
  })

  test("treats anything unrecognised as an image", () => {
    expect(mediaKind({})).toBe("image")
  })
})

describe("dragDataForMedia", () => {
  test("sends audio as a sound, carrying the corrected type", () => {
    const dragData = dragDataForMedia({
      id: "media-1",
      name: "theme.mp3",
      type: "image/jpeg",
    })

    expect(dragData.elementType).toBe("sound")
    expect(dragData.soundId).toBe("media-1")
    expect(dragData.mimeType).toBe("audio/mpeg")
    expect(dragData.mediaId).toBeUndefined()
  })

  test("sends everything else as media, with the preview url", () => {
    const dragData = dragDataForMedia({
      id: "media-2",
      name: "clip.mp4",
      type: "image/jpeg",
      url: "https://example.com/media-2",
    })

    expect(dragData.elementType).toBe("media")
    expect(dragData.mediaId).toBe("media-2")
    expect(dragData.mimeType).toBe("video/mp4")
    expect(dragData.previewUrl).toBe("https://example.com/media-2")
  })
})
