import { isType } from "../../components/utils/fileTypeUtils"

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
