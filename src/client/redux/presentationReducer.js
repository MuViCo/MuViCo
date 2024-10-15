import { createSlice } from "@reduxjs/toolkit"
import presentationService from "../services/presentation"

const initialState = {
  presentationInfo: null,
  gridLayout: [],
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
      state.presentationInfo = action.payload
    },
    removePresentation(state) {
      state.presentationInfo = null
    },
    updateCue(state, action) {
      const updatedCue = action.payload
      const cueIndex = state.presentationInfo.cues.findIndex(cue => cue._id === updatedCue._id)
      if (cueIndex !== -1) {
        state.presentationInfo.cues[cueIndex] = updatedCue
      } else {
        console.warn(`Cue with id ${updatedCue._id} not found`)
      }
    },
  },
})

export const {
  setPresentationInfo,
  deleteCue,
  saveGridState,
  addCue,
} = presentationSlice.actions

export default presentationSlice.reducer


export const fetchPresentationInfo = (id) => async (dispatch) => {
  try {
    const presentation = await presentationService.get(id)
    dispatch(setPresentationInfo(presentation))
  } catch (error) {
    console.error(error)
  }
}

export const removeCue = (presentationId, cueId) => async (dispatch) => {
  try {
    await presentationService.removeCue(presentationId, cueId)
    dispatch(deleteCue(cueId))
  } catch (error) {
    console.error(error)
  }
}

export const createOrUpdateCue = (id, formData) => async (dispatch) => {
  try {
    const updatedPresentation = await presentationService.addOrUpdateCue(id, formData)
    const cueId = formData.get("cueId")

    if (cueId) {
      dispatch(updateCue(updatedPresentation))
    } else {
      dispatch(addCue(updatedPresentation))
    }
  } catch (error) {
    console.error(error)
  }
}

export const deletePresentation = (id) => async (dispatch) => {
  try {
    await presentationService.remove(id)
    dispatch(removePresentation())
  } catch (error) {
    console.error(error)
  }
}