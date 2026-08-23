/*
 * saveIndexCount / saveScreenCount thunk tests.
 * These cover the payload creators themselves -- the reducer's handling of the
 * resulting pending/fulfilled/rejected actions is covered separately in
 * presentationReducer.test.js.
 */
import { configureStore } from "@reduxjs/toolkit"

import reducer from "../../redux/presentationReducer"
import { saveIndexCount, saveScreenCount } from "../../redux/presentationThunks"
import presentationService from "../../services/presentation"

jest.mock("../../services/presentation", () => ({
  saveIndexCountApi: jest.fn(),
  saveScreenCountApi: jest.fn(),
}))

const mockedService = jest.mocked(presentationService)

const makeStore = () => configureStore({ reducer: { presentation: reducer } })

describe("saveIndexCount", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test("calls the service with the id and index count and returns its payload", async () => {
    mockedService.saveIndexCountApi.mockResolvedValue({
      indexCount: 8,
      removedCuesCount: 0,
    })
    const store = makeStore()

    const action = await store.dispatch(
      saveIndexCount({ id: "pres-1", indexCount: 8 })
    )

    expect(mockedService.saveIndexCountApi).toHaveBeenCalledWith("pres-1", 8)
    expect(action.payload).toEqual({ indexCount: 8, removedCuesCount: 0 })
    expect(store.getState().presentation.indexCount).toBe(8)
  })

  test("rejects without throwing when the request fails", async () => {
    mockedService.saveIndexCountApi.mockRejectedValue(new Error("boom"))
    const store = makeStore()

    const action = await store.dispatch(
      saveIndexCount({ id: "pres-1", indexCount: 8 })
    )

    expect(action.type).toBe(saveIndexCount.rejected.type)
    // The reducer still has to release the pending-save counter it took.
    expect(store.getState().presentation.pendingSaves).toBe(0)
  })
})

describe("saveScreenCount", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test("calls the service with the id and screen count and returns its payload", async () => {
    mockedService.saveScreenCountApi.mockResolvedValue({
      screenCount: 3,
      removedCuesCount: 0,
    })
    const store = makeStore()

    const action = await store.dispatch(
      saveScreenCount({ id: "pres-1", screenCount: 3 })
    )

    expect(mockedService.saveScreenCountApi).toHaveBeenCalledWith("pres-1", 3)
    expect(action.payload).toEqual({ screenCount: 3, removedCuesCount: 0 })
    expect(store.getState().presentation.screenCount).toBe(3)
  })

  test("rejects without throwing when the request fails", async () => {
    mockedService.saveScreenCountApi.mockRejectedValue(new Error("boom"))
    const store = makeStore()

    const action = await store.dispatch(
      saveScreenCount({ id: "pres-1", screenCount: 3 })
    )

    expect(action.type).toBe(saveScreenCount.rejected.type)
    expect(store.getState().presentation.pendingSaves).toBe(0)
  })
})
