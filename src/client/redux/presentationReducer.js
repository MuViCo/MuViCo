import { createSlice } from "@reduxjs/toolkit"
import presentationService from "../services/presentation"

const initialState = {
  presentationInfo: null,
}

const presentationSlice = createSlice({
  name: "presentation",
  initialState,
  reducers: {
    setPresentationInfo(state, action) {
      state.presentationInfo = action.payload
    },
    deleteCue(state, action) {
      state.presentationInfo.cues = state.presentationInfo.cues.filter(
        (cue) => cue._id !== action.payload
      )
    },
    addCue(state, action) {
      state.presentationInfo.cues.push(action.payload)
    },
    updateCue(state, action) {
      const updatedCue = action.payload
      state.presentationInfo.cues = state.presentationInfo.cues.map((cue) =>
        cue._id === updatedCue._id ? updatedCue : cue
      )
    },
    removePresentation(state) {
      state.presentationInfo = null
    },
  },
})

export const {
  setPresentationInfo,
  deleteCue,
  addCue,
  updateCue,
  removePresentation,
} = presentationSlice.actions

export default presentationSlice.reducer


export const fetchPresentationInfo = (id) => async (dispatch) => {
  try {
    const presentation = await presentationService.get(id)
    dispatch(setPresentationInfo(presentation))
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
    const formData = new FormData()
    formData.append("index", movedCue.cueIndex)
    formData.append("screen", movedCue.screen)
    formData.append("cueId", movedCue.cueId)
    const updatedCue = await presentationService.updateCue(id, movedCue.cueId, formData)
    dispatch(updateCue(updatedCue))
  } catch (error) {
    const errorMessage = error.response?.data?.error || "An error occurred"
    console.error(errorMessage)
    throw new Error(errorMessage)
  }
}
