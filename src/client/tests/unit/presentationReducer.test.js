import reducer, {
  setPresentationInfo,
  deleteCue,
  addCue,
  removePresentation,
  editCue,
} from "../../redux/presentationReducer.js"

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
  }

  it("should handle setPresentationInfo", () => {
    const cues = [{ _id: 1, name: "Test Cue" }]
    const action = { type: setPresentationInfo.type, payload: cues }
    const expectedState = { ...initialState, cues }

    expect(reducer(initialState, action)).toEqual(expectedState)
  })

  it("should handle deleteCue", () => {
    const initialStateWithCues = {
      ...initialState,
      cues: [
        { _id: 1, name: "Test Cue" },
        { _id: 2, name: "Another Cue" },
      ],
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
    const expectedState = { ...initialState, cues: null }

    expect(reducer(initialState, action)).toEqual(expectedState)
  })

  it("should handle removePresentation when state is not null", () => {
    const initialStateWithCues = {
      ...initialState,
      cues: [
        { _id: 1, name: "Test Cue" },
        { _id: 2, name: "Another Cue" },
      ],
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
