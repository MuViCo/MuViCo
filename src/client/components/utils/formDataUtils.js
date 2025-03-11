// utils/formDataUtils.js

/**
 * Creates and populates a FormData object with the given parameters.
 * @param {number} index - The index of the element.
 * @param {number} screen - The screen number.
 * @param {File} file - The file to be uploaded.
 * @param {string} cueId - The ID of the cue. (optional)
 * @returns {FormData} - The populated FormData object.
 */
export const createFormData = (index, name, screen, file, cueId) => {
  const formData = new FormData()
  formData.append("index", index)
  formData.append("cueName", name)
  formData.append("screen", screen)
  if (file) {
    formData.append("image", file)
  }
  if (cueId) {
    formData.append("cueId", cueId)
  }
  return formData
}
