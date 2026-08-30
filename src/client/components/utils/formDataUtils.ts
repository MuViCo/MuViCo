/**
 * formDataUtils.ts
 * Utility functions for creating and handling FormData objects for cues.
 */

import type { CueFileMeta, CueUploadFile } from "../../types"

/**
 * Creates and populates a FormData object for a cue.
 *
 * The positional parameters are kept as they are; collapsing them into an
 * options object would mean touching every call site.
 *
 * FormData.append only accepts `string | Blob`, so the numeric and boolean
 * fields below are wrapped in String(). That is behaviour-identical: append
 * already stringifies whatever it is given.
 */
export const createFormData = (
  index: number,
  name: string,
  screen: number,
  // Either a File being uploaded or the stored metadata of an existing one;
  // both reach this function through CueUpdateInput.file. Both carry name and
  // an optional driveId, which is all this reads.
  file: CueUploadFile | CueFileMeta | null | undefined,
  cueId?: string,
  color?: string,
  loop?: boolean,
  layer: number = 0,
  opacity: number = 1,
  continuePlayback: boolean = false,
  // Omitted (the default) means "don't touch the cue's existing span" on the
  // server -- only callers that actually mean to add/change/clear a span
  // (the Multi-screen picker) need to pass this.
  spanScreens?: number[]
): FormData => {
  const formData = new FormData()
  formData.append("index", String(index))
  formData.append("cueName", name)
  formData.append("screen", String(screen))
  formData.append("layer", String(layer))
  formData.append("opacity", String(opacity))

  if (file || file === null) {
    // TODO(ts): `file` is deliberately allowed to be null here. Appending null
    // yields the literal string "null", which multer treats as a text field so
    // req.file stays undefined -- that is how the server is told to clear the
    // media. Wrapping it in String() or skipping the append would change the
    // request body, so this is a cast rather than a conversion.
    formData.append("image", file as unknown as Blob)
  }
  if (file && file.driveId) {
    formData.append("driveId", file.driveId)
  }
  if (cueId) {
    formData.append("cueId", cueId)
  }
  if (color) {
    formData.append("color", color)
  }
  if (loop === undefined) {
    formData.append("loop", String(false))
  } else {
    formData.append("loop", String(loop))
  }
  formData.append("continuePlayback", String(Boolean(continuePlayback)))
  if (spanScreens !== undefined) {
    formData.append("spanScreens", JSON.stringify(spanScreens))
  }

  return formData
}
