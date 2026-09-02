/*
 * createFormData unit tests.
 * Covers the optional fields, the numeric/boolean stringification and the
 * deliberate null-file case that tells the server to clear a cue's media.
 */
import { createFormData } from "../../components/utils/formDataUtils"

import type { CueUploadFile } from "../../types"

const makeFile = (driveId?: string): CueUploadFile => {
  const file = new File(["data"], "clip.mp4", { type: "video/mp4" })
  if (driveId) {
    ;(file as CueUploadFile).driveId = driveId
  }
  return file as CueUploadFile
}

describe("createFormData", () => {
  test("stringifies the numeric and boolean fields", () => {
    const formData = createFormData(2, "Cue name", 1, null)

    expect(formData.get("index")).toBe("2")
    expect(formData.get("cueName")).toBe("Cue name")
    expect(formData.get("screen")).toBe("1")
    // Defaults applied by the signature rather than by the caller.
    expect(formData.get("layer")).toBe("0")
    expect(formData.get("opacity")).toBe("1")
    expect(formData.get("loop")).toBe("false")
    expect(formData.get("continuePlayback")).toBe("false")
  })

  test("forwards explicit layer, opacity, loop and continuePlayback", () => {
    const formData = createFormData(
      0,
      "Cue",
      2,
      null,
      undefined,
      "#ff0000",
      true,
      3,
      0.5,
      true
    )

    expect(formData.get("layer")).toBe("3")
    expect(formData.get("opacity")).toBe("0.5")
    expect(formData.get("loop")).toBe("true")
    expect(formData.get("continuePlayback")).toBe("true")
    expect(formData.get("color")).toBe("#ff0000")
  })

  test("appends driveId only when the file carries one", () => {
    const withDrive = createFormData(0, "Cue", 1, makeFile("drive-123"))
    expect(withDrive.get("driveId")).toBe("drive-123")

    const withoutDrive = createFormData(0, "Cue", 1, makeFile())
    expect(withoutDrive.get("driveId")).toBeNull()
  })

  test("omits cueId and color when they are not supplied", () => {
    const formData = createFormData(0, "Cue", 1, null)

    expect(formData.get("cueId")).toBeNull()
    expect(formData.get("color")).toBeNull()
  })

  test("includes cueId when supplied", () => {
    const formData = createFormData(0, "Cue", 1, null, "cue-1")

    expect(formData.get("cueId")).toBe("cue-1")
  })

  test("appends a null file so the server clears the media", () => {
    // Passing null is deliberate: it serialises to the string "null", which
    // multer reads as a text field, leaving req.file undefined.
    const cleared = createFormData(0, "Cue", 1, null)
    expect(cleared.get("image")).toBe("null")

    // undefined means "leave the existing media alone", so nothing is appended.
    const untouched = createFormData(0, "Cue", 1, undefined)
    expect(untouched.get("image")).toBeNull()
  })

  test("appends mediaId as its own scalar field when a cue is built from the library", () => {
    const formData = createFormData(
      0,
      "Cue",
      1,
      null,
      undefined,
      undefined,
      false,
      0,
      1,
      false,
      undefined,
      "media-9"
    )

    expect(formData.get("mediaId")).toBe("media-9")
  })

  test("omits mediaId when the cue carries an uploaded file instead", () => {
    const formData = createFormData(0, "Cue", 1, null)

    expect(formData.get("mediaId")).toBeNull()
  })
})
