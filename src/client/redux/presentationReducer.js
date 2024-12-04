import { createSlice } from "@reduxjs/toolkit"
import presentationService from "../services/presentation"
import { createFormData } from "../components/utils/formDataUtils"
import { getFileType } from "../components/utils/fileTypeUtils"

const initialState = {
  cues: [],
}

const presentationSlice = createSlice({
  name: "presentation",
  initialState,
  reducers: {
    setPresentationInfo(state, action) {
      let cues = action.payload
      if (cues) {
        cues = cues.map(cue => ({
          ...cue,
          fileType: getFileType(cue.file.url)
        }))
      }
      state.cues = cues
    },
    deleteCue(state, action) {
      state.cues = state.cues.filter((cue) => cue._id !== action.payload)
    },
    addCue(state, action) {
      state.cues.push(action.payload)
    },
    editCue(state, action) {
      const cueToChange = action.payload
      const updatedCues = state.cues.map((cue) =>
          cue._id !== cueToChange._id ? cue : cueToChange,
        )
      state.cues = updatedCues
    },
    removePresentation(state) {
      state.cues = null
    },
  },
})

export const {
  setPresentationInfo,
  deleteCue,
  addCue,
  editCue,
  removePresentation,
} = presentationSlice.actions

export default presentationSlice.reducer


export const fetchPresentationInfo = (id) => async (dispatch) => {
  try {
    const presentation = await presentationService.get(id)
    dispatch(setPresentationInfo(presentation.cues))
  } catch (error) {
    const errorMessage = error.response?.data?.error || "An error occurred"
    console.error(errorMessage)
    throw new Error(errorMessage)
  }
}

export const removeCue = (presentationId, cueId) => async (dispatch) => {
  try {
    await presentationService.removeCue(presentationId, cueId)
    dispatch(deleteCue(cueId))
  } catch (error) {
    const errorMessage = error.response?.data?.error || "An error occurred"
    console.error(errorMessage)
    throw new Error(errorMessage)
  }
}

export const createCue = (id, formData) => async (dispatch) => {
  try {
    const updatedPresentation = await presentationService.addCue(id, formData)
    const newCue = updatedPresentation.cues.find(
      (cue) => cue.index === Number(formData.get("index")) && cue.screen === Number(formData.get("screen"))
    )
    dispatch(addCue(newCue))
  } catch (error) {
    const errorMessage = error.response?.data?.error || "An error occurred"
    console.error(errorMessage)
    throw new Error(errorMessage)
  }
}

export const deletePresentation = (id) => async (dispatch) => {
  try {
    await presentationService.remove(id)
    dispatch(removePresentation())
  } catch (error) {
    const errorMessage = error.response?.data?.error || "An error occurred"
    console.error(errorMessage)
    throw new Error(errorMessage)
  }
}

export const updatePresentation = (id, movedCue) => async (dispatch) => {
  try {
    const formData = createFormData(
      movedCue.index,
      movedCue.cueName,
      movedCue.screen,
      movedCue.file,
      movedCue.cueId
    )
    const updatedCue = await presentationService.updateCue(id, movedCue.cueId, formData)
    dispatch(editCue(updatedCue))
  } catch (error) {
    const errorMessage = error.response?.data?.error || "An error occurred"
    console.error(errorMessage)
    throw new Error(errorMessage)
  }
}


