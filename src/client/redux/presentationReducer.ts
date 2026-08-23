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

import type {
  PayloadAction,
  ThunkAction,
  UnknownAction,
} from "@reduxjs/toolkit"
import type {
  Cue,
  CueUpdateInput,
  Presentation,
  ShiftIndexesResponse,
} from "../types"
import type { RootState } from "./store"

export interface PresentationState {
  cues: Cue[]
  /**
   * Null until a presentation is loaded. The server default is 1, but nothing
   * has been fetched yet at startup, and removePresentation resets to null.
   */
  screenCount: number | null
  name: string
  indexCount: number
  pendingSaves: number
}

/**
 * Return type of the hand-written thunks below. UnknownAction is RTK 2's
 * replacement for the removed AnyAction. The type parameter carries the
 * resolved value for the two thunks whose callers use it.
 */
type AppThunk<R = void> = ThunkAction<
  Promise<R>,
  RootState,
  unknown,
  UnknownAction
>

const initialState: PresentationState = {
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
    setPresentationInfo(state, action: PayloadAction<Presentation>) {
      state.cues = action.payload.cues
      state.name = action.payload.name
      state.screenCount = action.payload.screenCount
      state.indexCount = action.payload.indexCount
    },
    deleteCue(state, action: PayloadAction<string>) {
      state.cues = state.cues.filter((cue) => cue._id !== action.payload)
    },
    addCue(state, action: PayloadAction<Cue>) {
      state.cues.push(action.payload)
    },
    editCue(state, action: PayloadAction<Cue>) {
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
      // `null + 1` is 1 in JavaScript and `(null ?? 0) + 1` is 1, so this is the
      // same value the untyped version produced from the initial null state.
      state.screenCount = (state.screenCount ?? 0) + 1
    },
    decrementScreenCount(state) {
      // `null > 1` and `0 > 1` are both false, so the guard behaves identically
      // when no presentation has been loaded.
      if ((state.screenCount ?? 0) > 1) {
        state.screenCount = (state.screenCount ?? 0) - 1
      }
    },
    updateNameOnly(state, action: PayloadAction<string>) {
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
              (cue) => cue.cueType === "audio" || cue.screen <= newScreenCount
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

export const fetchPresentationInfo =
  (id: string): AppThunk =>
  async (dispatch) => {
    try {
      const presentation = await presentationService.get(id)
      dispatch(setPresentationInfo(presentation))
    } catch (error) {
      const errorMessage = error.response?.data?.error || "An error occurred"
      console.error(errorMessage)
      throw new Error(errorMessage)
    }
  }

export const removeCue =
  (presentationId: string, cueId: string): AppThunk =>
  async (dispatch) => {
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

export const createCue =
  (id: string, formData: FormData): AppThunk =>
  async (dispatch) => {
    dispatch(beginSave())
    try {
      const updatedPresentation = await presentationService.addCue(id, formData)
      const newCue = updatedPresentation.cues.find(
        (cue) =>
          cue.index === Number(formData.get("index")) &&
          cue.screen === Number(formData.get("screen")) &&
          Number(cue.layer ?? 0) === Number(formData.get("layer") ?? 0)
      )
      // TODO(ts): BUG -- find() returns undefined when no cue in the server's
      // response matches the index/screen/layer that was just submitted, and this
      // then pushes undefined into state.cues, where the next read of cue._id
      // throws. The cast preserves that behaviour exactly; guarding here would
      // silently drop a cue the server did create, which the e2e suite cannot
      // verify either way. Tracked separately.
      dispatch(addCue(newCue as Cue))
    } catch (error) {
      const errorMessage = error.response?.data?.error || "An error occurred"
      console.error(errorMessage)
      throw new Error(errorMessage)
    } finally {
      dispatch(endSave())
    }
  }

export const deletePresentation =
  (id: string): AppThunk =>
  async (dispatch) => {
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
  (
    presentationId: string,
    updatedCueData: CueUpdateInput,
    cueId?: string
  ): AppThunk<{ payload: Cue }> =>
  async (dispatch) => {
    dispatch(beginSave())
    try {
      const formData = createFormData(
        updatedCueData.index,
        updatedCueData.cueName,
        updatedCueData.screen,
        updatedCueData.file,
        updatedCueData.cueId || cueId,
        updatedCueData.color,
        updatedCueData.loop,
        updatedCueData.layer ?? 0,
        updatedCueData.opacity ?? 1,
        updatedCueData.continuePlayback ?? false
      )
      // TODO(ts): both cueId sources are optional, so this is undefined when
      // neither is supplied and the request URL ends in "/undefined". Every
      // current caller passes one; the cast records the gap rather than adding
      // a guard whose failure mode would be different from today's.
      const updatedCue = await presentationService.updateCue(
        presentationId,
        (updatedCueData.cueId || cueId) as string,
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
  (
    presentationId: string,
    firstUpdatedCue: Cue,
    secondUpdatedCue: Cue
  ): AppThunk =>
  async (dispatch) => {
    dispatch(beginSave())
    try {
      const swapPayload = {
        firstCueId: firstUpdatedCue._id,
        secondCueId: secondUpdatedCue._id,
        firstIndex: firstUpdatedCue.index,
        firstScreen: firstUpdatedCue.screen,
        firstLayer: firstUpdatedCue.layer ?? 0,
        secondIndex: secondUpdatedCue.index,
        secondScreen: secondUpdatedCue.screen,
        secondLayer: secondUpdatedCue.layer ?? 0,
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
  (
    presentationId: string,
    startIndex: number,
    direction: "left" | "right"
  ): AppThunk<ShiftIndexesResponse> =>
  async (dispatch) => {
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
  (presentationId: string, newName: string): AppThunk =>
  async (dispatch, getState) => {
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
