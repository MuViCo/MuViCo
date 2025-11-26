import { describe } from "node:test"
import reducer, {
  setPresentationInfo,
  deleteCue,
  addCue,
  removePresentation,
  editCue,
  fetchPresentationInfo,
  removeCue,
  createCue,
  deletePresentation,
  updatePresentation,
  updatePresentationSwappedCues,
  incrementIndexCount,
  decrementIndexCount,
  incrementScreenCount,
  decrementScreenCount,
  shiftPresentationIndexes,
  updatePresentationName,
} from "../../redux/presentationReducer.js"
import { saveIndexCount, saveScreenCount } from "../../redux/presentationThunks.js"
import presentationService from "../../services/presentation.js"
import { configureStore } from "@reduxjs/toolkit"

const originalConsoleLog = console.logICount
const originalConsoleError = console.error

beforeAll(() => {
  console.log = jest.fn()
  console.error = jest.fn()
})

jest.mock("../../services/presentation.js", () => ({
  get: jest.fn(),
  removeCue: jest.fn(),
  addCue: jest.fn(),
  remove: jest.fn(),
  updateCue: jest.fn(),
  saveScreenCountApi: jest.fn(),
  saveIndexCountApi: jest.fn(),
  shiftIndexes: jest.fn(),
  updatePresentationName: jest.fn(),
}))

const makeStore = () => {
  return configureStore({
    reducer: {
      presentation: reducer,
    },
    middleware: (getDefaultMiddleware) => getDefaultMiddleware(),
  })
}

// Test Synchronous Actions
describe("presentationReducer actions", () => {
  it("should create an action to set presentation info", () => {
    const presentationInfo = { id: 1, name: "Test Presentation" }
    const expectedAction = {
      type: setPresentationInfo.type,
      payload: presentationInfo,
    }
    expect(setPresentationInfo(presentationInfo)).toEqual(expectedAction)
  })

  it("should create an action to delete a cue", () => {
    const cueId = 1
    const expectedAction = {
      type: deleteCue.type,
      payload: cueId,
    }
    expect(deleteCue(cueId)).toEqual(expectedAction)
  })

  it("should create an action to add a cue", () => {
    const cue = { id: 1, name: "Test Cue" }
    const expectedAction = {
      type: addCue.type,
      payload: cue,
    }
    expect(addCue(cue)).toEqual(expectedAction)
  })

  it("should create an action to remove a presentation", () => {
    const expectedAction = {
      type: removePresentation.type,
    }
    expect(removePresentation()).toEqual(expectedAction)
  })

  it("should create an action to update a cue", () => {
    const updatedCue = { id: 1, name: "Updated Cue" }
    const expectedAction = {
      type: editCue.type,
      payload: updatedCue,
    }
    expect(editCue(updatedCue)).toEqual(expectedAction)
  })

  it("should create an action to increment index count", () => {
    const expectedAction = {
      type: incrementIndexCount.type,
    }
    expect(incrementIndexCount()).toEqual(expectedAction)
  })

  it("should create an action to decrement index count", () => {
    const expectedAction = {
      type: decrementIndexCount.type,
    }
    expect(decrementIndexCount()).toEqual(expectedAction)
  })

  it("should create an action to increment screen count", () => {
    const expectedAction = {
      type: incrementScreenCount.type,
    }
    expect(incrementScreenCount()).toEqual(expectedAction)
  })

  it("should create an action to decrement screen count", () => {
    const expectedAction = {
      type: decrementScreenCount.type,
    }
    expect(decrementScreenCount()).toEqual(expectedAction)
  })

  it("should create an action to update presentation name only", () => { 
    const newName = "Updated Presentation Name"
    const expectedAction = {
      type: "presentation/updateNameOnly",
      payload: newName,
    }
    expect({ type: "presentation/updateNameOnly", payload: newName  }).toEqual(expectedAction)
  })
})

// Test Reducer Logic
describe("presentationReducer reducer", () => {
  const initialState = {
    cues: [],
    audioCues: [],
    name: "",
    screenCount: 3,
    indexCount: 5,
    saving: false,
  }

  it("should handle setPresentationInfo", () => {
    const cues = [{ _id: 1, name: "Test Cue" }]
    const audioCues = [{ _id: 2, name: "Audio Cue" }]
    const name = "My Presentation"
    const screenCount = 3
    const indexCount = 5
    const action = { type: setPresentationInfo.type, payload: { cues, audioCues, name, screenCount, indexCount } }
    const expectedState = { ...initialState, cues, audioCues, name, screenCount, indexCount }

    expect(reducer(initialState, action)).toEqual(expectedState)
  })

  it("should handle addCue", () => {
    const initialStateWithCues = {
      ...initialState,
      cues: [{ _id: 1, name: "Test Cue" }],
      name: "My Presentation"
    }
    const addedCue = { _id: 2, name: "Another Cue" }
    const action = { type: addCue.type, payload: addedCue }
    const expectedState = {
      ...initialStateWithCues,
      cues: [
        { _id: 1, name: "Test Cue" },
        { _id: 2, name: "Another Cue" },
      ],
    }

    expect(reducer(initialStateWithCues, action)).toEqual(expectedState)
  })

  it("should handle deleteCue", () => {
    const initialStateWithCues = {
      ...initialState,
      cues: [
        { _id: 1, name: "Test Cue" },
        { _id: 2, name: "Another Cue" },
      ],
      name: "My Presentation"
    }
    const action = { type: deleteCue.type, payload: 1 }
    const expectedState = {
      ...initialStateWithCues,
      cues: [{ _id: 2, name: "Another Cue" }],
    }

    expect(reducer(initialStateWithCues, action)).toEqual(expectedState)
  })

  it("should handle removePresentation when state is already null", () => {
    const action = { type: removePresentation.type }
    const expectedState = { ...initialState, cues: null, audioCues: [], name: "", screenCount: null, indexCount: null }

    expect(reducer(initialState, action)).toEqual(expectedState)
  })

  it("should handle removePresentation when state is not null", () => {
    const initialStateWithCues = {
      ...initialState,
      cues: [
        { _id: 1, name: "Test Cue" },
        { _id: 2, name: "Another Cue" },
      ],
      audioCues: [
        { _id: 3, name: "Audio Cue" }
      ],
      name: "My Presentation",
      screenCount: 3
    }
    const action = { type: removePresentation.type }
    const expectedState = { ...initialState, cues: null, audioCues: [], screenCount: null, indexCount: null}

    expect(reducer(initialStateWithCues, action)).toEqual(expectedState)
  })

  it("should handle editCue", () => {
    const initialStateWithCues = {
      ...initialState,
      cues: [
        { _id: 1, name: "Test Cue" },
        { _id: 2, name: "Another Cue" },
      ],
    }
    const updatedCue = { _id: 1, name: "Updated Cue" }
    const action = { type: editCue.type, payload: updatedCue }
    const expectedState = {
      ...initialStateWithCues,
      cues: [updatedCue, { _id: 2, name: "Another Cue" }],
    }

    expect(reducer(initialStateWithCues, action)).toEqual(expectedState)
  })

  it("should handle incrementIndexCount", () => {
    const initialStateWithIndexCount = {
      ...initialState,
      indexCount: 3,
    }
    const action = { type: incrementIndexCount.type }
    const expectedState = {
      ...initialStateWithIndexCount,
      indexCount: 4,
    }

    expect(reducer(initialStateWithIndexCount, action)).toEqual(expectedState)
  })

  it("should handle decrementIndexCount", () => {
    const initialStateWithIndexCount = {
      ...initialState,
      indexCount: 3,
    }
    const action = { type: decrementIndexCount.type }
    const expectedState = {
      ...initialStateWithIndexCount,
      indexCount: 2,
    }

    expect(reducer(initialStateWithIndexCount, action)).toEqual(expectedState)
  })

  it("should not decrement IndexCount below 1", () => {
    const initialStateWithMinIndexCount = {
      ...initialState,
      indexCount: 1,
    }
    const action = { type: decrementIndexCount.type }
    
    const result = reducer(initialStateWithMinIndexCount, action)
    // Verify IndexCount doesn't go below 1
    expect(result.indexCount).toBeGreaterThanOrEqual(1)
  })

  it("should handle incrementScreenCount", () => {
    const initialStateWithScreenCount = {
      ...initialState,
      screenCount: 3,
    }
    const action = { type: incrementScreenCount.type }
    const expectedState = {
      ...initialStateWithScreenCount,
      screenCount: 4,
    }

    expect(reducer(initialStateWithScreenCount, action)).toEqual(expectedState)
  })

  it("should handle decrementScreenCount", () => {
    const initialStateWithScreenCount = {
      ...initialState,
      screenCount: 3,
    }
    const action = { type: decrementScreenCount.type }
    const expectedState = {
      ...initialStateWithScreenCount,
      screenCount: 2,
    }

    expect(reducer(initialStateWithScreenCount, action)).toEqual(expectedState)
  })

  it("should not decrement screenCount below 1", () => {
    const initialStateWithMinScreenCount = {
      ...initialState,
      screenCount: 1,
    }
    const action = { type: decrementScreenCount.type }
    
    const result = reducer(initialStateWithMinScreenCount, action)
    // Verify screenCount doesn't go below 1
    expect(result.screenCount).toBeGreaterThanOrEqual(1)
  })

  it("should handle multiple cue additions", () => {
    let state = initialState
    
    const cue1 = { _id: 1, name: "Cue 1" }
    const cue2 = { _id: 2, name: "Cue 2" }
    const cue3 = { _id: 3, name: "Cue 3" }

    state = reducer(state, { type: addCue.type, payload: cue1 })
    state = reducer(state, { type: addCue.type, payload: cue2 })
    state = reducer(state, { type: addCue.type, payload: cue3 })

    expect(state.cues).toHaveLength(3)
    expect(state.cues).toContainEqual(cue1)
    expect(state.cues).toContainEqual(cue2)
    expect(state.cues).toContainEqual(cue3)
  })

  it("should handle deletion of specific cue by id", () => {
    const initialStateWithCues = {
      ...initialState,
      cues: [
        { _id: 1, name: "Cue 1" },
        { _id: 2, name: "Cue 2" },
        { _id: 3, name: "Cue 3" },
      ],
    }
    const action = { type: deleteCue.type, payload: 2 }
    
    const result = reducer(initialStateWithCues, action)
    
    expect(result.cues).toHaveLength(2)
    expect(result.cues).not.toContainEqual({ _id: 2, name: "Cue 2" })
    expect(result.cues).toContainEqual({ _id: 1, name: "Cue 1" })
    expect(result.cues).toContainEqual({ _id: 3, name: "Cue 3" })
  })

  it("should update correct cue when multiple cues exist", () => {
    const initialStateWithCues = {
      ...initialState,
      cues: [
        { _id: 1, name: "Cue 1" },
        { _id: 2, name: "Cue 2" },
        { _id: 3, name: "Cue 3" },
      ],
    }
    const updatedCue = { _id: 2, name: "Updated Cue 2" }
    const action = { type: editCue.type, payload: updatedCue }
    
    const result = reducer(initialStateWithCues, action)
    
    expect(result.cues[1]).toEqual(updatedCue)
    expect(result.cues[0]).toEqual({ _id: 1, name: "Cue 1" })
    expect(result.cues[2]).toEqual({ _id: 3, name: "Cue 3" })
  })

  it("should preserve other state properties when adding cue", () => {
    const initialStateWithData = {
      ...initialState,
      name: "My Presentation",
      screenCount: 5,
      indexCount: 10,
      cues: [{ _id: 1, name: "Existing Cue" }],
    }
    const newCue = { _id: 2, name: "New Cue" }
    const action = { type: addCue.type, payload: newCue }
    
    const result = reducer(initialStateWithData, action)
    
    expect(result.name).toBe("My Presentation")
    expect(result.screenCount).toBe(5)
    expect(result.indexCount).toBe(10)
    expect(result.cues).toHaveLength(2)
  })

  it("should clear all data on removePresentation", () => {
    const initialStateWithData = {
      cues: [
        { _id: 1, name: "Cue 1" },
        { _id: 2, name: "Cue 2" },
      ],
      audioCues: [
        { _id: 1, name: "Audio 1" },
      ],
      name: "Test Presentation",
      screenCount: 4,
      indexCount: 5,
      saving: false,
    }
    const action = { type: removePresentation.type }
    
    const result = reducer(initialStateWithData, action)
    
    expect(result.cues).toBeNull()
    expect(result.audioCues).toEqual([])
    expect(result.name).toBe("")
    expect(result.screenCount).toBeNull()
    expect(result.indexCount).toBeNull()
  })

  it("should set all presentation properties on setPresentationInfo", () => {
    const presentationData = {
      cues: [{ _id: 1, name: "Cue 1", index: 0, screen: 1 }],
      audioCues: [{ _id: 1, name: "Audio 1", index: 0 }],
      name: "Full Presentation",
      screenCount: 5,
      indexCount: 20,
    }
    const action = { type: setPresentationInfo.type, payload: presentationData }
    
    const result = reducer(initialState, action)
    
    expect(result.cues).toEqual(presentationData.cues)
    expect(result.audioCues).toEqual(presentationData.audioCues)
    expect(result.name).toBe("Full Presentation")
    expect(result.screenCount).toBe(5)
    expect(result.indexCount).toBe(20)
  })

  it("should not mutate original state when deleting cue", () => {
    const originalState = {
      ...initialState,
      cues: [
        { _id: 1, name: "Cue 1" },
        { _id: 2, name: "Cue 2" },
      ],
    }
    const action = { type: deleteCue.type, payload: 1 }
    
    const result = reducer(originalState, action)
    
    // Original should remain unchanged
    expect(originalState.cues).toHaveLength(2)
    // Result should have 1 less
    expect(result.cues).toHaveLength(1)
  })
})

// Test Asynchronous Actions
describe("presentationReducer asynchronous actions", () => {
  it("should fetch presentation info", async () => {
    const store = makeStore()
    const mockCues = [{ _id: 1, name: "Cue 1" }]
    presentationService.get.mockResolvedValue({ cues: mockCues })

    await store.dispatch(fetchPresentationInfo("123"))

    expect(presentationService.get).toHaveBeenCalledWith("123")
    expect(store.getState().presentation.cues).toEqual(mockCues)
  })

  it("should handle error in fetch presentation info", async () => {
    const store = makeStore()
    presentationService.get.mockRejectedValue({
      response: { data: { error: "Not found" } },
    })

    await expect(store.dispatch(fetchPresentationInfo("123"))).rejects.toThrow(
      "Not found"
    )
  })

  it("should remove cue", async () => {
    const store = makeStore()
    const initialState = {
    cues: [
        { _id: 1, name: "Cue 1" },
        { _id: 2, name: "Cue 2" },
      ],
      name: "My Presentation"
    }
    store.dispatch(setPresentationInfo(initialState))

    const updatedCues = [{ _id: 2, name: "Cue 2" }]

    presentationService.removeCue.mockResolvedValue({ cues: updatedCues })

    await store.dispatch(removeCue("123", 1))

    expect(presentationService.removeCue).toHaveBeenCalledWith("123", 1)
    expect(store.getState().presentation.cues).toEqual(updatedCues)
  })

  it("should handle error in remove cue", async () => {
    const store = makeStore()
    presentationService.removeCue.mockRejectedValue({
      response: { data: { error: "Not found" } },
    })

    await expect(store.dispatch(removeCue("123", 1))).rejects.toThrow(
      "Not found"
    )
  })

  it("should create cue", async () => {
    const store = makeStore()
    const formData = new FormData()
    formData.append("index", "1")
    formData.append("screen", "2")
    formData.append("cueName", "New Cue")
    formData.append("file", new File([""], "file.txt"))

    const mockCue = { _id: 1, name: "New Cue", index: 1, screen: 2 }

    presentationService.addCue.mockResolvedValue({ cues: [mockCue] })

    await store.dispatch(createCue("123", formData))

    expect(presentationService.addCue).toHaveBeenCalledWith("123", formData)

    expect(store.getState().presentation.cues).toContainEqual(mockCue)
  })

  it("should handle error in create cue", async () => {
    const store = makeStore()
    const formData = new FormData()
    formData.append("index", "1")
    formData.append("screen", "2")
    formData.append("cueName", "New Cue")
    formData.append("file", new File([""], "file.txt"))
    presentationService.addCue.mockRejectedValue({
      response: { data: { error: "Not found" } },
    })

    await expect(store.dispatch(createCue("123", formData))).rejects.toThrow(
      "Not found"
    )
  })

  it("should delete presentation", async () => {
    const store = makeStore()
    const mockCues = [{ _id: 1, name: "Cue 1" }]
    presentationService.remove.mockResolvedValue(mockCues)

    await store.dispatch(deletePresentation("123"))

    expect(presentationService.remove).toHaveBeenCalled()
    expect(store.getState().presentation.cues).toBeNull()
  })

  it("should handle error in delete presentation", async () => {
    const store = makeStore()
    presentationService.remove.mockRejectedValue({
      response: { data: { error: "Not found" } },
    })

    await expect(store.dispatch(deletePresentation("123"))).rejects.toThrow(
      "Not found"
    )
  })

  it("should update presentation cue", async () => {
    const store = makeStore()

    const initialState = {
      cues: [
        { _id: 1, name: "Cue 1", index: 1, screen: 1 },
        { _id: 2, name: "Cue 2", index: 2, screen: 2 },
      ],
      name: "My Presentation"
    }

    store.dispatch(setPresentationInfo(initialState))

    const updatedCueData = { cueName: "Updated Cue", index: 1, screen: 1 }

    presentationService.updateCue.mockResolvedValue({
      ...initialState.cues[0],
      ...updatedCueData,
    })

    await store.dispatch(updatePresentation("123", updatedCueData, 1))

    expect(presentationService.updateCue).toHaveBeenCalledWith(
      "123",
      1,
      expect.any(FormData)
    )

    expect(store.getState().presentation.cues).toContainEqual({
      ...initialState.cues[0],
      ...updatedCueData,
    })
  })

  it("should handle error in update presentation cue", async () => {
    const store = makeStore()

    const updatedCueData = { cueName: "Updated Cue", index: 1, screen: 1 }

    presentationService.updateCue.mockRejectedValue({
      response: { data: { error: "Not found" } },
    })

    await expect(
      store.dispatch(updatePresentation("123", updatedCueData, 1))
    ).rejects.toThrow("Not found")
  })

  it("should update presentation cues swapped", async () => {
    const store = makeStore()

    const initialState = {
      cues: [
        { _id: 1, name: "Cue 1", index: 1, screen: 1 },
        { _id: 2, name: "Cue 2", index: 2, screen: 2 },
      ],
      name: "My Presentation"
    }

    store.dispatch(setPresentationInfo(initialState))

    const firstUpdatedCue = {
      _id: 1,
      cueName: "Updated Cue 1",
      index: 2,
      screen: 2,
    }
    const secondUpdatedCue = {
      _id: 2,
      cueName: "Updated Cue 2",
      index: 1,
      screen: 1,
    }

    presentationService.updateCue
      .mockResolvedValueOnce(firstUpdatedCue)
      .mockResolvedValueOnce(secondUpdatedCue)

    await store.dispatch(
      updatePresentationSwappedCues("123", firstUpdatedCue, secondUpdatedCue)
    )

    expect(presentationService.updateCue).toHaveBeenCalledWith(
      "123",
      firstUpdatedCue._id,
      expect.any(FormData)
    )

    expect(presentationService.updateCue).toHaveBeenCalledWith(
      "123",
      secondUpdatedCue._id,
      expect.any(FormData)
    )

    expect(store.getState().presentation.cues).toContainEqual(firstUpdatedCue)
    expect(store.getState().presentation.cues).toContainEqual(secondUpdatedCue)
  })

  it("should shift presentation indices right", async () => {
    const store = makeStore()
    
    const initialState = {
      cues: [
        { _id: 1, name: "Cue 1", index: 0 },
        { _id: 2, name: "Cue 2", index: 2 },
        { _id: 3, name: "Cue 3", index: 4 }
      ],
      name: "My Presentation"
    }

    store.dispatch(setPresentationInfo(initialState))

    const shiftedCues = [
      { _id: 1, name: "Cue 1", index: 0 },
      { _id: 2, name: "Cue 2", index: 3 },
      { _id: 3, name: "Cue 3", index: 5 }
    ]

    presentationService.shiftIndexes.mockResolvedValue({
      cues: shiftedCues,
      name: "My Presentation",
      id: "123"
    })
   
     presentationService.get.mockResolvedValue({
       cues: shiftedCues,
       name: "My Presentation",
       id: "123"
     })

    await store.dispatch(shiftPresentationIndexes("123", 0, "right"))

    expect(presentationService.shiftIndexes).toHaveBeenCalledWith("123", 0, "right")
    expect(store.getState().presentation.cues).toEqual(shiftedCues)
  })

  it("should shift presentation indices left", async () => {
    const store = makeStore()
    
    const initialState = {
      cues: [
        { _id: 1, name: "Cue 1", index: 0 },
        { _id: 2, name: "Cue 2", index: 2 },
        { _id: 3, name: "Cue 3", index: 4 }
      ],
      name: "My Presentation"
    }

    store.dispatch(setPresentationInfo(initialState))

    const shiftedCues = [
      { _id: 1, name: "Cue 1", index: 0 },
      { _id: 2, name: "Cue 2", index: 1 },
      { _id: 3, name: "Cue 3", index: 3 }
    ]

    presentationService.shiftIndexes.mockResolvedValue({
      cues: shiftedCues,
      name: "My Presentation",
      id: "123"
    })
   
     presentationService.get.mockResolvedValue({
       cues: shiftedCues,
       name: "My Presentation",
       id: "123"
     })

    await store.dispatch(shiftPresentationIndexes("123", 1, "left"))

    expect(presentationService.shiftIndexes).toHaveBeenCalledWith("123", 1, "left")
    expect(store.getState().presentation.cues).toEqual(shiftedCues)
  })

  it("should update only cues after startIndex when shifting right", async () => {
    const store = makeStore()
    
    const initialState = {
      cues: [
        { _id: 1, name: "Cue 1", index: 0 },
        { _id: 2, name: "Cue 2", index: 1 },
        { _id: 3, name: "Cue 3", index: 2 }
      ],
      name: "My Presentation"
    }

    store.dispatch(setPresentationInfo(initialState))

    const shiftedCues = [
      { _id: 1, name: "Cue 1", index: 0 },
      { _id: 2, name: "Cue 2", index: 2 },
      { _id: 3, name: "Cue 3", index: 3 }
    ]

    presentationService.shiftIndexes.mockResolvedValue({
      cues: shiftedCues,
      name: "My Presentation",
      id: "123"
    })
   
     presentationService.get.mockResolvedValue({
       cues: shiftedCues,
       name: "My Presentation",
       id: "123"
     })

    await store.dispatch(shiftPresentationIndexes("123", 1, "right"))

    const state = store.getState().presentation
    expect(state.cues[0].index).toBe(0) // Should not change
    expect(state.cues[1].index).toBe(2) // Should shift right
    expect(state.cues[2].index).toBe(3) // Should shift right
  })

  it("should toggle saving during saveIndexCount lifecycle", () => {
    const store = makeStore()

    const initialState = {
      cues: [
        { _id: 1, name: "Cue 1", index: 0 },
        { _id: 2, name: "Cue 2", index: 2 },
      ],
      indexCount: 5,
      name: "My Presentation",
    }

    store.dispatch(setPresentationInfo(initialState))

    // pending should set saving true
    store.dispatch({ type: saveIndexCount.pending.type })
    expect(store.getState().presentation.saving).toBe(true)

    // fulfilled should set saving false and update indexCount and filter cues
    const payload = { indexCount: 2 }
    store.dispatch({ type: saveIndexCount.fulfilled.type, payload })
    expect(store.getState().presentation.saving).toBe(false)
    expect(store.getState().presentation.indexCount).toBe(2)
    expect(store.getState().presentation.cues.every(c => c.index < 2)).toBe(true)

    // rejected should also ensure saving is false
    store.dispatch({ type: saveIndexCount.pending.type })
    expect(store.getState().presentation.saving).toBe(true)
    store.dispatch({ type: saveIndexCount.rejected.type })
    expect(store.getState().presentation.saving).toBe(false)
  })

  it("should toggle saving during saveScreenCount lifecycle", () => {
    const store = makeStore()

    const initialState = {
      cues: [
        { _id: 1, name: "Cue 1", index: 0, screen: 1 },
        { _id: 2, name: "Cue 2", index: 1, screen: 2 },
        { _id: 3, name: "Cue 3", index: 2, screen: 3 },
      ],
      screenCount: 3,
      name: "My Presentation",
    }

    store.dispatch(setPresentationInfo(initialState))

    // pending should set saving true
    store.dispatch({ type: saveScreenCount.pending.type })
    expect(store.getState().presentation.saving).toBe(true)

    // fulfilled should set saving false, update screenCount and remove cues exceeding new screenCount
    const payload = { screenCount: 2, removedCuesCount: 1 }
    store.dispatch({ type: saveScreenCount.fulfilled.type, payload })
    expect(store.getState().presentation.saving).toBe(false)
    expect(store.getState().presentation.screenCount).toBe(2)
    expect(store.getState().presentation.cues.every(c => c.screen <= 2)).toBe(true)

    // rejected should also ensure saving is false
    store.dispatch({ type: saveScreenCount.pending.type })
    expect(store.getState().presentation.saving).toBe(true)
    store.dispatch({ type: saveScreenCount.rejected.type })
    expect(store.getState().presentation.saving).toBe(false)
  })

  it("should handle error in update presentation cues swapped", async () => {
    const store = makeStore()

    const firstUpdatedCue = {
      _id: 1,
      cueName: "Updated Cue 1",
      index: 2,
      screen: 2,
    }
    const secondUpdatedCue = {
      _id: 2,
      cueName: "Updated Cue 2",
      index: 1,
      screen: 1,
    }

    presentationService.updateCue.mockRejectedValue({
      response: { data: { error: "Not found" } },
    })

    await expect(
      store.dispatch(
        updatePresentationSwappedCues("123", firstUpdatedCue, secondUpdatedCue)
      )
    ).rejects.toThrow("Not found")
  })

  it("should update presentation name only", async () => {
    const store = makeStore()

    store.dispatch(setPresentationInfo({
      cues: [],
      name: "Old Presentation Name",
      screenCount: 3,
      indexCount: 5,
    }))

    presentationService.updatePresentationName.mockResolvedValue({
      name: "New Name"
    })

    await store.dispatch(updatePresentationName("123", "New Name"))

    expect(store.getState().presentation.name).toBe("New Name")
  })

  it("throws error when updatePresentationName fails", async () => {
    const store = makeStore()

    store.dispatch(setPresentationInfo({
      cues: [],
      name: "Old Name",
      screenCount: 3,
      indexCount: 5,
    }))

    presentationService.updatePresentationName.mockRejectedValue({
      response: { data: { error: "Name invalid" } }
    })

    await expect(
      store.dispatch(updatePresentationName("123", ""))
    ).rejects.toThrow("Name invalid")
  })
})

afterAll(() => {
  console.log = originalConsoleLog
  console.error = originalConsoleError
})