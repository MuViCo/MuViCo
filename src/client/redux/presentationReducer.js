import { createSlice } from "@reduxjs/toolkit"
import presentationService from "../services/presentation"
import { createFormData } from "../components/utils/formDataUtils"
import { saveIndexCount, saveScreenCount } from "./presentationThunks"

const initialState = {
  cues: [],
  audioCues: [],
  name: "",
  screenCount: null,
  indexCount: 5,
  saving: false,
}

const presentationSlice = createSlice({
  name: "presentation",
  initialState,
  reducers: {
    setPresentationInfo(state, action) {
      state.cues = action.payload.cues
      state.audioCues = action.payload.audioCues
      state.name = action.payload.name
      state.screenCount = action.payload.screenCount
      state.indexCount = action.payload.indexCount
    },
    deleteCue(state, action) {
      state.cues = state.cues.filter((cue) => cue._id !== action.payload)
    },
    deleteAudioCue(state, action) {
      state.audioCues = state.audioCues.filter((cue) => cue._id !== action.payload)
    },
    addCue(state, action) {
      state.cues.push(action.payload)
    },
    addAudioCue(state, action) {
      state.audioCues.push(action.payload)
    },
    editCue(state, action) {
      const cueToChange = action.payload
      const updatedCues = state.cues.map((cue) =>
        cue._id !== cueToChange._id ? cue : cueToChange
      )
      state.cues = updatedCues
    },
    editAudioCue(state, action) {
      const cueToChange = action.payload
      const updatedCues = state.audioCues.map((cue) =>
        cue._id !== cueToChange._id ? cue : cueToChange
      )
      state.audioCues = updatedCues
    },
    removePresentation(state) {
      state.cues = null
      state.audioCues = []
      state.name = ""
      state.screenCount = null
      state.indexCount = null
    },
    incrementIndexCount(state) {
      state.indexCount += 1
    },
    decrementIndexCount(state) {
      state.indexCount -= 1
    },
    incrementScreenCount(state) {
      state.screenCount += 1
    },
    decrementScreenCount(state) {
      state.screenCount -= 1
    },
  },
  extraReducers: builder => {
    builder
      .addCase(saveIndexCount.pending, state => {
        state.saving = true
      })
      .addCase(saveIndexCount.fulfilled, (state, action) => {
        state.saving = false
        const newIndexCount = action.payload.indexCount
        state.indexCount = newIndexCount
        state.cues = state.cues.filter(cue => cue.index < newIndexCount)
      })
      .addCase(saveIndexCount.rejected, state => {
        state.saving = false
      })
      .addCase(saveScreenCount.pending, state => {
        state.saving = true
      })
      .addCase(saveScreenCount.fulfilled, (state, action) => {
        state.saving = false
        
        if (action.payload.screenCount !== undefined) {
          const newScreenCount = action.payload.screenCount
          const removedCuesCount = action.payload.removedCuesCount
          
          state.screenCount = newScreenCount
          
          if (removedCuesCount > 0) {
            state.cues = state.cues.filter(cue => cue.screen <= newScreenCount)
          }
        }
      })
      .addCase(saveScreenCount.rejected, state => {
        state.saving = false
      })
  },
})

export const {
  setPresentationInfo,
  deleteCue,
  deleteAudioCue,
  addCue,
  addAudioCue,
  editCue,
  editAudioCue,
  removePresentation,
  incrementIndexCount,
  decrementIndexCount,
  incrementScreenCount,
  decrementScreenCount,
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
      (cue) =>
        cue.index === Number(formData.get("index")) &&
        cue.screen === Number(formData.get("screen"))
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

export const updatePresentation =
  (presentationId, updatedCueData, cueId) => async (dispatch) => {
    try {
      const formData = createFormData(
        updatedCueData.index,
        updatedCueData.cueName,
        updatedCueData.screen,
        updatedCueData.file,
        updatedCueData.cueId || cueId,
        updatedCueData.loop
      )

      const updatedCue = await presentationService.updateCue(
        presentationId,
        updatedCueData.cueId || cueId,
        formData
      )
      dispatch(editCue(updatedCue))

      return { payload: updatedCue }
    } catch (error) {
      const errorMessage = error.response?.data?.error || "An error occurred"
      console.error(errorMessage)
      throw new Error(errorMessage)
    }
  }

export const updatePresentationSwappedCues =
  (presentationId, firstUpdatedCue, secondUpdatedCue) => async (dispatch) => {
    try {
      const firstFormData = createFormData(
        firstUpdatedCue.index,
        firstUpdatedCue.name,
        firstUpdatedCue.screen,
        firstUpdatedCue.file,
        firstUpdatedCue._id,
        firstUpdatedCue.loop
      )

      const secondFormData = createFormData(
        secondUpdatedCue.index,
        secondUpdatedCue.name,
        secondUpdatedCue.screen,
        secondUpdatedCue.file,
        secondUpdatedCue._id,
        secondUpdatedCue.loop
      )

      const [updatedFirstCue, updatedSecondCue] = await Promise.all([
        presentationService.updateCue(
          presentationId,
          firstUpdatedCue._id,
          firstFormData
        ),
        presentationService.updateCue(
          presentationId,
          secondUpdatedCue._id,
          secondFormData
        ),
      ])

      dispatch(editCue(updatedFirstCue))
      dispatch(editCue(updatedSecondCue))
    } catch (error) {
      const errorMessage = error.response?.data?.error || "An error occurred"
      console.error(errorMessage)
      throw new Error(errorMessage)
    }
  }
