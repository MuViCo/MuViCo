import reducer, {
  setPresentationInfo,
  deleteCue,
  addCue,
  removePresentation,
  updateCue,
} from '../../redux/presentationReducer.js'

// Test Synchronous Actions
describe('presentationReducer actions', () => {
  it('should create an action to set presentation info', () => {
    const presentationInfo = { id: 1, name: 'Test Presentation' }
    const expectedAction = {
      type: setPresentationInfo.type,
      payload: presentationInfo,
    }
    expect(setPresentationInfo(presentationInfo)).toEqual(expectedAction)
  })

  it('should create an action to delete a cue', () => {
    const cueId = 1
    const expectedAction = {
      type: deleteCue.type,
      payload: cueId,
    }
    expect(deleteCue(cueId)).toEqual(expectedAction)
  })

  it('should create an action to add a cue', () => {
    const cue = { id: 1, name: 'Test Cue' }
    const expectedAction = {
      type: addCue.type,
      payload: cue,
    }
    expect(addCue(cue)).toEqual(expectedAction)
  })

  it('should create an action to remove a presentation', () => {
    const expectedAction = {
      type: removePresentation.type,
    }
    expect(removePresentation()).toEqual(expectedAction)
  })

  it('should create an action to update a cue', () => {
    const updatedCue = { id: 1, name: 'Updated Cue' }
    const expectedAction = {
      type: updateCue.type,
      payload: updatedCue,
    }
    expect(updateCue(updatedCue)).toEqual(expectedAction)
  })
})

// Test Reducer Logic
describe('presentationReducer reducer', () => {
  const initialState = {
    presentationInfo: null,
    gridLayout: [],
  }

  it('should handle setPresentationInfo', () => {
    const presentationInfo = { id: 1, name: 'Test Presentation' }
    const action = { type: setPresentationInfo.type, payload: presentationInfo }
    const expectedState = { ...initialState, presentationInfo }

    expect(reducer(initialState, action)).toEqual(expectedState)
  })

  it('should handle deleteCue', () => {
    const initialStateWithCues = {
      ...initialState,
      presentationInfo: {
        cues: [{ _id: 1, name: 'Test Cue' }, { _id: 2, name: 'Another Cue' }],
      },
    }
    const action = { type: deleteCue.type, payload: 1 }
    const expectedState = {
      ...initialStateWithCues,
      presentationInfo: {
        cues: [{ _id: 2, name: 'Another Cue' }],
      },
    }

    expect(reducer(initialStateWithCues, action)).toEqual(expectedState)
  })

  it('should handle removePresentation when state is already null', () => {
    const action = { type: removePresentation.type }
    const expectedState = { ...initialState, presentationInfo: null }

    expect(reducer(initialState, action)).toEqual(expectedState)
  })

  it('should handle removePresentation when state is not null', () => {
    const initialStateWithPresentation = {
        ...initialState,
        presentationInfo: { id: 1, name: 'Test Presentation' },
    }
    const action = { type: removePresentation.type }
    const expectedState = { ...initialState, presentationInfo: null }

    expect(reducer(initialStateWithPresentation, action)).toEqual(expectedState)
    })

  it('should handle updateCue', () => {
    const initialStateWithCues = {
      ...initialState,
      presentationInfo: {
        cues: [{ _id: 1, name: 'Test Cue' }],
      },
    }
    const updatedCue = { _id: 1, name: 'Updated Cue' }
    const action = { type: updateCue.type, payload: updatedCue }
    const expectedState = {
      ...initialStateWithCues,
      presentationInfo: {
        cues: [updatedCue],
      },
    }

    expect(reducer(initialStateWithCues, action)).toEqual(expectedState)
  })
})