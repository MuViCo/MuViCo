/** Presentation Reducer
 * This reducer manages the state of the presentation, including cues, name, screen count,
 * and index count. It also handles actions related to fetching presentation info,
 * adding/editing/deleting cues, and updating presentation settings. The reducer uses
 * Redux Toolkit's createSlice for cleaner code and better state management.
 */

import { createSlice } from "@reduxjs/toolkit"
import presentationService from "../services/presentation"
import { createFormData } from "../components/utils/formDataUtils"
import { saveIndexCount, saveScreenCount } from "./presentationThunks"

const initialState = {
  cues: [],
  name: "",
  screenCount: null,
  indexCount: 5,
  pendingSaves: 0,
}
/** * The presentationSlice manages the state of the presentation, including cues, name, screen count,
 * and index count. It defines reducers for setting presentation info, adding/editing/deleting cues,
 * and updating presentation settings. It also handles asynchronous actions for saving index and screen counts.
 */
const presentationSlice = createSlice({
  name: "presentation",
  initialState,
  reducers: {
    setPresentationInfo(state, action) {
      state.cues = action.payload.cues
      state.name = action.payload.name
      state.screenCount = action.payload.screenCount
      state.indexCount = action.payload.indexCount
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
        cue._id !== cueToChange._id ? cue : cueToChange
      )
      state.cues = updatedCues
    },
    removePresentation(state) {
      state.cues = initialState.cues
      state.name = initialState.name
      state.screenCount = initialState.screenCount
      state.indexCount = initialState.indexCount
      state.pendingSaves = initialState.pendingSaves
    },
    beginSave(state) {
      state.pendingSaves += 1
    },
    endSave(state) {
      state.pendingSaves = Math.max(0, state.pendingSaves - 1)
    },
    incrementIndexCount(state) {
      state.indexCount += 1
    },
    decrementIndexCount(state) {
      if (state.indexCount > 1) {
        state.indexCount -= 1
      }
    },
    incrementScreenCount(state) {
      state.screenCount += 1
    },
    decrementScreenCount(state) {
      if (state.screenCount > 1) {
        state.screenCount -= 1
      }
    },
    updateNameOnly(state, action) {
      state.name = action.payload
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(saveIndexCount.pending, (state) => {
        state.pendingSaves += 1
      })
      .addCase(saveIndexCount.fulfilled, (state, action) => {
        state.pendingSaves = Math.max(0, state.pendingSaves - 1)
        const newIndexCount = action.payload.indexCount
        state.indexCount = newIndexCount
        state.cues = state.cues.filter((cue) => cue.index < newIndexCount)
      })
      .addCase(saveIndexCount.rejected, (state) => {
        state.pendingSaves = Math.max(0, state.pendingSaves - 1)
      })
      .addCase(saveScreenCount.pending, (state) => {
        state.pendingSaves += 1
      })
      .addCase(saveScreenCount.fulfilled, (state, action) => {
        state.pendingSaves = Math.max(0, state.pendingSaves - 1)

        if (action.payload.screenCount !== undefined) {
          const newScreenCount = action.payload.screenCount
          const removedCuesCount = action.payload.removedCuesCount

          state.screenCount = newScreenCount

          if (removedCuesCount > 0) {
            state.cues = state.cues.filter(
              (cue) => cue.screen <= newScreenCount
            )
          }
        }
      })
      .addCase(saveScreenCount.rejected, (state) => {
        state.pendingSaves = Math.max(0, state.pendingSaves - 1)
      })
  },
})

export const {
  setPresentationInfo,
  deleteCue,
  addCue,
  editCue,
  removePresentation,
  incrementIndexCount,
  decrementIndexCount,
  incrementScreenCount,
  decrementScreenCount,
  updateNameOnly,
  beginSave,
  endSave,
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
  dispatch(beginSave())
  try {
    await presentationService.removeCue(presentationId, cueId)
    dispatch(deleteCue(cueId))
  } catch (error) {
    const errorMessage = error.response?.data?.error || "An error occurred"
    console.error(errorMessage)
    throw new Error(errorMessage)
  } finally {
    dispatch(endSave())
  }
}

export const createCue = (id, formData) => async (dispatch) => {
  dispatch(beginSave())
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
  } finally {
    dispatch(endSave())
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
    dispatch(beginSave())
    try {
      const formData = createFormData(
        updatedCueData.index,
        updatedCueData.cueName,
        updatedCueData.screen,
        updatedCueData.file,
        updatedCueData.cueId || cueId,
        updatedCueData.color,
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
    } finally {
      dispatch(endSave())
    }
  }

export const swapCues =
  (presentationId, firstUpdatedCue, secondUpdatedCue) => async (dispatch) => {
    dispatch(beginSave())
    try {
      const swapPayload = {
        firstCueId: firstUpdatedCue._id,
        secondCueId: secondUpdatedCue._id,
        firstIndex: firstUpdatedCue.index,
        firstScreen: firstUpdatedCue.screen,
        secondIndex: secondUpdatedCue.index,
        secondScreen: secondUpdatedCue.screen,
      }

      const { firstCue: updatedFirstCue, secondCue: updatedSecondCue } =
        await presentationService.swapCues(presentationId, swapPayload)

      dispatch(editCue(updatedFirstCue))
      dispatch(editCue(updatedSecondCue))
    } catch (error) {
      const errorMessage = error.response?.data?.error || "An error occurred"
      console.error(errorMessage)
      throw new Error(errorMessage)
    } finally {
      dispatch(endSave())
    }
  }

export const shiftPresentationIndexes =
  (presentationId, startIndex, direction) => async (dispatch) => {
    dispatch(beginSave())
    try {
      const result = await presentationService.shiftIndexes(
        presentationId,
        startIndex,
        direction
      )
      await dispatch(fetchPresentationInfo(presentationId))
      return result
    } catch (error) {
      const errorMessage = error.response?.data?.error || "An error occurred"
      console.error(errorMessage)
      throw new Error(errorMessage)
    } finally {
      dispatch(endSave())
    }
  }

export const updatePresentationName =
  (presentationId, newName) => async (dispatch, getState) => {
    dispatch(beginSave())
    try {
      const updated = await presentationService.updatePresentationName(
        presentationId,
        newName
      )
      dispatch(updateNameOnly(updated.name))
    } catch (error) {
      const errorMessage = error.response?.data?.error || "An error occurred"
      console.error(errorMessage)
      throw new Error(errorMessage)
    } finally {
      dispatch(endSave())
    }
  }
