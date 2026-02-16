// utils/formDataUtils.js

/**
 
Creates and populates a FormData object with the given parameters.
@param {number} index - The index of the element.
@param {number} screen - The screen number.
@param {File} file - The file to be uploaded.
@param {string} cueId - The ID of the cue. (optional)
@param {string} color - The color associated with the cue. (optional)
@param {boolean} loop - Whether the cue should loop. (optional)
@param {string} name - The name of the cue.
@returns {FormData} - The populated FormData object.*/
export const createFormData = (index, name, screen, file, cueId, color, loop) => {
  const formData = new FormData()
  formData.append("index", index)
  formData.append("cueName", name)
  formData.append("screen", screen)
  
  if (file || file===null) {
  formData.append("image", file)
  }
  if (file && file.driveId) {
    formData.append("driveId", file.driveId)
  }
  if (cueId) {
    formData.append("cueId", cueId)
  }
  if (color){
    formData.append("color", color)
  }
  if (loop === undefined) {
    formData.append("loop", false)
  } else {
    formData.append("loop", loop)
  }
  
  return formData
}
