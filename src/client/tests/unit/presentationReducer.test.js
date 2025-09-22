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
} from "../../redux/presentationReducer.js"
import presentationService from "../../services/presentation.js"
import { configureStore } from "@reduxjs/toolkit"

jest.mock("../../services/presentation.js", () => ({
  get: jest.fn(),
  removeCue: jest.fn(),
  addCue: jest.fn(),
  remove: jest.fn(),
  updateCue: jest.fn(),
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
})

// Test Reducer Logic
describe("presentationReducer reducer", () => {
  const initialState = {
    cues: null,
    name: "",
  }

  it("should handle setPresentationInfo", () => {
    const cues = [{ _id: 1, name: "Test Cue" }]
    const name = "My Presentation"
    const action = { type: setPresentationInfo.type, payload: { cues, name } }
    const expectedState = { ...initialState, cues, name }

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
    const expectedState = { ...initialState, cues: null, name: "" }

    expect(reducer(initialState, action)).toEqual(expectedState)
  })

  it("should handle removePresentation when state is not null", () => {
    const initialStateWithCues = {
      ...initialState,
      cues: [
        { _id: 1, name: "Test Cue" },
        { _id: 2, name: "Another Cue" },
      ],
      name: "My Presentation"
    }
    const action = { type: removePresentation.type }
    const expectedState = { ...initialState, cues: null }

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
})
