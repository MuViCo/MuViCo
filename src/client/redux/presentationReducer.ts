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
  ImportScoreInput,
  Presentation,
  ShiftIndexesResponse,
  ScoreDocument,
  ScoreMarker,
  ScoreMarkerInput,
  UploadScoreInput,
} from "../types"
import type { RootState } from "./store"

export interface PresentationState {
  cues: Cue[]
  scores: ScoreDocument[]
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
  scores: [],
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
      state.scores = action.payload.scores ?? []
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
    setScores(state, action: PayloadAction<ScoreDocument[]>) {
      state.scores = action.payload
    },
    addScore(state, action: PayloadAction<ScoreDocument>) {
      state.scores.push(action.payload)
    },
    removeScoreFromState(state, action: PayloadAction<string>) {
      state.scores = state.scores.filter(
        (score) => score._id !== action.payload
      )
    },
    addScoreMarker(
      state,
      action: PayloadAction<{ scoreId: string; marker: ScoreMarker }>
    ) {
      const score = state.scores.find(
        (item) => item._id === action.payload.scoreId
      )
      if (score) {
        score.markers = [...(score.markers ?? []), action.payload.marker]
      }
    },
    updateScoreMarkerInState(
      state,
      action: PayloadAction<{ scoreId: string; marker: ScoreMarker }>
    ) {
      const score = state.scores.find(
        (item) => item._id === action.payload.scoreId
      )
      if (score) {
        score.markers = (score.markers ?? []).map((marker) =>
          marker._id === action.payload.marker._id
            ? action.payload.marker
            : marker
        )
      }
    },
    removeScoreMarkerFromState(
      state,
      action: PayloadAction<{ scoreId: string; markerId: string }>
    ) {
      const score = state.scores.find(
        (item) => item._id === action.payload.scoreId
      )
      if (score) {
        score.markers = (score.markers ?? []).filter(
          (marker) => marker._id !== action.payload.markerId
        )
      }
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
      state.scores = initialState.scores
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
  setScores,
  addScore,
  removeScoreFromState,
  addScoreMarker,
  updateScoreMarkerInState,
  removeScoreMarkerFromState,
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

export const fetchScores =
  (id: string): AppThunk<ScoreDocument[]> =>
  async (dispatch) => {
    try {
      const scores = await presentationService.getScores(id)
      dispatch(setScores(scores))
      return scores
    } catch (error) {
      const errorMessage = error.response?.data?.error || "An error occurred"
      console.error(errorMessage)
      throw new Error(errorMessage)
    }
  }

export const uploadScorePdf =
  (presentationId: string, input: UploadScoreInput): AppThunk<ScoreDocument> =>
  async (dispatch) => {
    dispatch(beginSave())
    try {
      const score = await presentationService.uploadScorePdf(
        presentationId,
        input
      )
      dispatch(addScore(score))
      return score
    } catch (error) {
      const errorMessage = error.response?.data?.error || "An error occurred"
      console.error(errorMessage)
      throw new Error(errorMessage)
    } finally {
      dispatch(endSave())
    }
  }

export const importImslpScore =
  (presentationId: string, input: ImportScoreInput): AppThunk<ScoreDocument> =>
  async (dispatch) => {
    dispatch(beginSave())
    try {
      const score = await presentationService.importImslpScore(
        presentationId,
        input
      )
      dispatch(addScore(score))
      return score
    } catch (error) {
      const errorMessage = error.response?.data?.error || "An error occurred"
      console.error(errorMessage)
      throw new Error(errorMessage)
    } finally {
      dispatch(endSave())
    }
  }

export const deleteScoreDocument =
  (presentationId: string, scoreId: string): AppThunk =>
  async (dispatch) => {
    dispatch(beginSave())
    try {
      await presentationService.deleteScore(presentationId, scoreId)
      dispatch(removeScoreFromState(scoreId))
    } catch (error) {
      const errorMessage = error.response?.data?.error || "An error occurred"
      console.error(errorMessage)
      throw new Error(errorMessage)
    } finally {
      dispatch(endSave())
    }
  }

export const createScoreMarker =
  (
    presentationId: string,
    scoreId: string,
    markerInput: ScoreMarkerInput
  ): AppThunk<ScoreMarker> =>
  async (dispatch) => {
    dispatch(beginSave())
    try {
      const marker = await presentationService.createScoreMarker(
        presentationId,
        scoreId,
        markerInput
      )
      dispatch(addScoreMarker({ scoreId, marker }))
      return marker
    } catch (error) {
      const errorMessage = error.response?.data?.error || "An error occurred"
      console.error(errorMessage)
      throw new Error(errorMessage)
    } finally {
      dispatch(endSave())
    }
  }

export const updateScoreMarker =
  (
    presentationId: string,
    scoreId: string,
    markerId: string,
    markerInput: ScoreMarkerInput
  ): AppThunk<ScoreMarker> =>
  async (dispatch) => {
    dispatch(beginSave())
    try {
      const marker = await presentationService.updateScoreMarker(
        presentationId,
        scoreId,
        markerId,
        markerInput
      )
      dispatch(updateScoreMarkerInState({ scoreId, marker }))
      return marker
    } catch (error) {
      const errorMessage = error.response?.data?.error || "An error occurred"
      console.error(errorMessage)
      throw new Error(errorMessage)
    } finally {
      dispatch(endSave())
    }
  }

export const deleteScoreMarker =
  (presentationId: string, scoreId: string, markerId: string): AppThunk =>
  async (dispatch) => {
    dispatch(beginSave())
    try {
      await presentationService.deleteScoreMarker(
        presentationId,
        scoreId,
        markerId
      )
      dispatch(removeScoreMarkerFromState({ scoreId, markerId }))
    } catch (error) {
      const errorMessage = error.response?.data?.error || "An error occurred"
      console.error(errorMessage)
      throw new Error(errorMessage)
    } finally {
      dispatch(endSave())
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
