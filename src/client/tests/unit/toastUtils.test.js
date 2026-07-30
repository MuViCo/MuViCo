/*
 * useCustomToast unit tests.
 * This shared hook is the one chokepoint every toast call site in the app
 * already goes through. Verifies it suppresses a redundant "error" toast for
 * a short window right after a session-expiry is detected (NavBar already
 * told the user and is redirecting them away), without requiring any of the
 * individual call sites to guard themselves.
 */
import { renderHook, act } from "@testing-library/react"
import { useToast } from "@chakra-ui/react"
import { useCustomToast } from "../../components/utils/toastUtils"

jest.mock("@chakra-ui/react", () => {
  const originalModule = jest.requireActual("@chakra-ui/react")
  return {
    ...originalModule,
    useToast: jest.fn(),
  }
})

describe("useCustomToast", () => {
  let toastMock

  beforeEach(() => {
    toastMock = jest.fn()
    useToast.mockReturnValue(toastMock)
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  test("shows a toast normally when no session-expired event has fired", () => {
    const { result } = renderHook(() => useCustomToast())

    act(() => {
      result.current({ title: "Error", description: "Oops", status: "error" })
    })

    expect(toastMock).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Error",
        description: "Oops",
        status: "error",
      })
    )
  })

  test("suppresses an error toast requested right after a session-expired event", () => {
    const { result } = renderHook(() => useCustomToast())

    act(() => {
      window.dispatchEvent(new CustomEvent("session-expired"))
    })
    act(() => {
      result.current({
        title: "Error",
        description: "token expired",
        status: "error",
      })
    })

    expect(toastMock).not.toHaveBeenCalled()
  })

  test("does not suppress a non-error toast (e.g. NavBar's own session-expired notice)", () => {
    const { result } = renderHook(() => useCustomToast())

    act(() => {
      window.dispatchEvent(new CustomEvent("session-expired"))
    })
    act(() => {
      result.current({
        title: "Session expired",
        description: "...",
        status: "warning",
      })
    })

    expect(toastMock).toHaveBeenCalledWith(
      expect.objectContaining({ status: "warning" })
    )
  })

  test("resumes showing error toasts once the suppression window elapses", () => {
    jest.useFakeTimers()
    const { result } = renderHook(() => useCustomToast())

    act(() => {
      window.dispatchEvent(new CustomEvent("session-expired"))
    })
    act(() => {
      jest.advanceTimersByTime(5000)
    })
    act(() => {
      result.current({
        title: "Error",
        description: "a later, unrelated error",
        status: "error",
      })
    })

    expect(toastMock).toHaveBeenCalledWith(
      expect.objectContaining({ description: "a later, unrelated error" })
    )
  })
})
