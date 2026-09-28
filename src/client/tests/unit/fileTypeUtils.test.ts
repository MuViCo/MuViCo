/*
 * File type utility tests.
 * Verifies image/video/audio MIME detection for valid and invalid file types.
 */
import {
  isType,
  getAudioRow,
  isAudioRow,
  isAudioCue,
  isCueTypeCompatibleWithRow,
  isInsidePresentationGridCell,
  isAudioMimeType,
  isImageOrVideoMimeType,
  getAllowedMimeTypesForScreen,
  VALID_AUDIO_MIME_TYPES,
  VALID_VISUAL_MIME_TYPES,
} from "../../components/utils/fileTypeUtils"

describe("isType utility function", () => {
  test("should return true when called with valid values", () => {
    const mockImageFile = { type: "image/png" }
    const mockVideoFile = { type: "video/mp4" }
    const mockAudioFile = { type: "audio/wav" }

    expect(isType.image(mockImageFile)).toBe(true)
    expect(isType.video(mockVideoFile)).toBe(true)
    expect(isType.audio(mockAudioFile)).toBe(true)
  })

  test("should return false when called with invalid values", () => {
    const mockFile = { type: "file/imaginary" }

    expect(isType.image(mockFile)).toBe(false)
    expect(isType.video(mockFile)).toBe(false)
    expect(isType.audio(mockFile)).toBe(false)
  })
})

describe("audio row arithmetic", () => {
  test("the audio row sits just below the last screen", () => {
    expect(getAudioRow(1)).toBe(2)
    expect(getAudioRow(4)).toBe(5)
  })

  test("accepts the string values that come out of form fields and grid data", () => {
    expect(getAudioRow("3")).toBe(4)
    expect(isAudioRow("5", "4")).toBe(true)
  })

  test("isAudioRow only matches the row directly below the screens", () => {
    expect(isAudioRow(3, 2)).toBe(true)
    expect(isAudioRow(2, 2)).toBe(false)
    expect(isAudioRow(1, 2)).toBe(false)
  })
})

describe("isAudioCue", () => {
  test("trusts an explicit cueType over the cue's row", () => {
    // A stored cueType wins even when the screen would say otherwise.
    expect(isAudioCue({ cueType: "audio", screen: 1 }, 3)).toBe(true)
    expect(isAudioCue({ cueType: "visual", screen: 4 }, 3)).toBe(false)
  })

  test("falls back to the row when the cue has no cueType", () => {
    expect(isAudioCue({ screen: 4 }, 3)).toBe(true)
    expect(isAudioCue({ screen: 2 }, 3)).toBe(false)
  })

  test("treats a missing cue as not an audio cue", () => {
    expect(isAudioCue(null, 3)).toBe(false)
    expect(isAudioCue(undefined, 3)).toBe(false)
  })
})

describe("isCueTypeCompatibleWithRow", () => {
  test("audio cues belong on the audio row and nowhere else", () => {
    expect(isCueTypeCompatibleWithRow("audio", 4, 3)).toBe(true)
    expect(isCueTypeCompatibleWithRow("audio", 2, 3)).toBe(false)
  })

  test("visual cues belong on any row except the audio one", () => {
    expect(isCueTypeCompatibleWithRow("visual", 2, 3)).toBe(true)
    expect(isCueTypeCompatibleWithRow("visual", 4, 3)).toBe(false)
  })

  test("an unknown cue type is treated as visual", () => {
    expect(isCueTypeCompatibleWithRow(undefined, 2, 3)).toBe(true)
    expect(isCueTypeCompatibleWithRow(undefined, 4, 3)).toBe(false)
  })
})

describe("isInsidePresentationGridCell", () => {
  const grid = { indexCount: 5, screenCount: 2 }

  test("accepts cells within the timeline and the screen rows", () => {
    expect(
      isInsidePresentationGridCell({ xIndex: 0, yIndex: 1, ...grid })
    ).toBe(true)
    // yIndex 3 is the audio row for two screens, which is still inside.
    expect(
      isInsidePresentationGridCell({ xIndex: 4, yIndex: 3, ...grid })
    ).toBe(true)
  })

  test("rejects cells outside the timeline", () => {
    expect(
      isInsidePresentationGridCell({ xIndex: -1, yIndex: 1, ...grid })
    ).toBe(false)
    expect(
      isInsidePresentationGridCell({ xIndex: 5, yIndex: 1, ...grid })
    ).toBe(false)
  })

  test("rejects the header row above and anything below the audio row", () => {
    expect(
      isInsidePresentationGridCell({ xIndex: 0, yIndex: 0, ...grid })
    ).toBe(false)
    expect(
      isInsidePresentationGridCell({ xIndex: 0, yIndex: 4, ...grid })
    ).toBe(false)
  })
})

describe("mime type predicates", () => {
  test("isAudioMimeType matches only the audio family", () => {
    expect(isAudioMimeType("audio/mpeg")).toBe(true)
    expect(isAudioMimeType("image/png")).toBe(false)
  })

  test("isImageOrVideoMimeType matches images and videos", () => {
    expect(isImageOrVideoMimeType("image/png")).toBe(true)
    expect(isImageOrVideoMimeType("video/mp4")).toBe(true)
    expect(isImageOrVideoMimeType("audio/mpeg")).toBe(false)
  })

  test("both default to a missing mime type being neither", () => {
    expect(isAudioMimeType()).toBe(false)
    expect(isImageOrVideoMimeType()).toBe(false)
  })
})

describe("getAllowedMimeTypesForScreen", () => {
  test("offers audio formats on the audio row", () => {
    expect(getAllowedMimeTypesForScreen(3, 2)).toBe(VALID_AUDIO_MIME_TYPES)
  })

  test("offers image and video formats on the screen rows", () => {
    expect(getAllowedMimeTypesForScreen(1, 2)).toBe(VALID_VISUAL_MIME_TYPES)
  })
})
