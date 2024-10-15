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
    saveGridState(state, action) {
      state.gridLayout = action.payload
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

export const updatePresentation = (id, layout) => async (dispatch) => {
  try {
    for (const cue of layout) {
      const formData = new FormData()
      formData.append("index", cue.cueIndex)
      formData.append("screen", cue.screen)
      formData.append("cueId", cue.id)
      await presentationService.addOrUpdateCue(id, formData)
    }
    const updatedPresentation = await presentationService.get(id)
    dispatch(setPresentationInfo(updatedPresentation))

  } catch (error) {
    console.error(error)
  }
}

export const saveGrid = (layout) => async (dispatch) => {
  dispatch(saveGridState(layout))
}