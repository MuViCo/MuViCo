import { renderHook, act } from "@testing-library/react"
import { useDispatch } from "react-redux"
import { useNavigate } from "react-router-dom"
import useDeletePresentation from "../../components/utils/useDeletePresentation"
import { useCustomToast } from "../../components/utils/toastUtils"
import { deletePresentation } from "../../redux/presentationReducer"

jest.mock("react-redux", () => ({
  useDispatch: jest.fn(),
}))

jest.mock("react-router-dom", () => ({
  useNavigate: jest.fn(),
}))

jest.mock("../../redux/presentationReducer", () => ({
  deletePresentation: jest.fn(),
}))

jest.mock("../../components/utils/toastUtils", () => ({
  useCustomToast: jest.fn(),
}))

describe("useDeletePresentation", () => {
  it("should set the presentation to delete and open the dialog when handleDeletePresentation is called", () => {
    const dispatch = jest.fn()
    useDispatch.mockReturnValue(dispatch)

    const { result } = renderHook(() => useDeletePresentation())

    act(() => {
      result.current.handleDeletePresentation("123")
    })

    expect(result.current.presentationToDelete).toBe("123")
    expect(result.current.isDialogOpen).toBe(true)
  })

  it("should dispatch deletePresentation and show success toast on successful deletion", async () => {
    const dispatch = jest.fn(() => Promise.resolve())
    const navigate = jest.fn()
    const showToast = jest.fn()

    useDispatch.mockReturnValue(dispatch)
    useNavigate.mockReturnValue(navigate)
    useCustomToast.mockReturnValue(showToast)

    const { result } = renderHook(() => useDeletePresentation())

    act(() => {
      result.current.handleDeletePresentation("123")
    })

    await act(async () => {
      await result.current.handleConfirmDelete()
    })

    expect(dispatch).toHaveBeenCalledWith(deletePresentation("123"))
    expect(showToast).toHaveBeenCalledWith({
      title: "Presentation deleted",
      description: "The presentation has been deleted successfully.",
      status: "success",
    })
    expect(navigate).toHaveBeenCalledWith("/home")
    expect(result.current.isDialogOpen).toBe(false)
    expect(result.current.presentationToDelete).toBe(null)
  })

  it("should show error toast on deletion failure", async () => {
    const dispatch = jest.fn(() => Promise.reject(new Error("Deletion failed")))
    const showToast = jest.fn()

    useDispatch.mockReturnValue(dispatch)
    useCustomToast.mockReturnValue(showToast)

    const { result } = renderHook(() => useDeletePresentation())

    act(() => {
      result.current.handleDeletePresentation("123")
    })

    await act(async () => {
      await result.current.handleConfirmDelete()
    })

    expect(dispatch).toHaveBeenCalledWith(deletePresentation("123"))
    expect(showToast).toHaveBeenCalledWith({
      title: "Error",
      description: "Deletion failed",
      status: "error",
    })
    expect(result.current.isDialogOpen).toBe(false)
    expect(result.current.presentationToDelete).toBe(null)
  })

  it("should not perform any action if presentationToDelete is null", async () => {
    const dispatch = jest.fn()
    const showToast = jest.fn()
    const navigate = jest.fn()

    useDispatch.mockReturnValue(dispatch)
    useCustomToast.mockReturnValue(showToast)
    useNavigate.mockReturnValue(navigate)

    const { result } = renderHook(() => useDeletePresentation())

    await act(async () => {
      await result.current.handleConfirmDelete()
    })

    expect(dispatch).not.toHaveBeenCalled()
    expect(showToast).not.toHaveBeenCalled()
    expect(navigate).not.toHaveBeenCalled()
    expect(result.current.isDialogOpen).toBe(false)
    expect(result.current.presentationToDelete).toBe(null)
  })

  it("should show a generic error toast when error message is not provided", async () => {
    const dispatch = jest.fn(() => Promise.reject(new Error()))
    const showToast = jest.fn()

    useDispatch.mockReturnValue(dispatch)
    useCustomToast.mockReturnValue(showToast)

    const { result } = renderHook(() => useDeletePresentation())

    act(() => {
      result.current.handleDeletePresentation("123")
    })

    await act(async () => {
      await result.current.handleConfirmDelete()
    })

    expect(dispatch).toHaveBeenCalledWith(deletePresentation("123"))
    expect(showToast).toHaveBeenCalledWith({
      title: "Error",
      description: "An error occurred",
      status: "error",
    })
    expect(result.current.isDialogOpen).toBe(false)
    expect(result.current.presentationToDelete).toBe(null)
  })

  it("should close the dialog and reset presentationToDelete when handleCancelDelete is called", () => {
    const { result } = renderHook(() => useDeletePresentation())

    act(() => {
      result.current.handleDeletePresentation("123")
    })

    expect(result.current.isDialogOpen).toBe(true)
    expect(result.current.presentationToDelete).toBe("123")

    act(() => {
      result.current.handleCancelDelete()
    })

    expect(result.current.isDialogOpen).toBe(false)
    expect(result.current.presentationToDelete).toBe(null)
  })
})
