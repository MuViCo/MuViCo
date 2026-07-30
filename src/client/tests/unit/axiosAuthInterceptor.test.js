/*
 * Axios auth-error interceptor unit tests.
 * Verifies a 401 whose response body includes code: "SESSION_EXPIRED" (the
 * backend's own signal that the app's JWT itself failed verification)
 * dispatches "session-expired".
 */
import { handleResponseError } from "../../utils/axiosAuthInterceptor"

describe("axiosAuthInterceptor", () => {
  test("dispatches session-expired when the response body includes code SESSION_EXPIRED", async () => {
    const listener = jest.fn()
    window.addEventListener("session-expired", listener)

    const error = {
      response: {
        status: 401,
        data: { error: "token expired", code: "SESSION_EXPIRED" },
      },
    }

    await expect(handleResponseError(error)).rejects.toBe(error)
    expect(listener).toHaveBeenCalledTimes(1)

    window.removeEventListener("session-expired", listener)
  })

  test("does not dispatch session-expired for a 401 without the code (e.g. wrong login credentials)", async () => {
    const listener = jest.fn()
    window.addEventListener("session-expired", listener)

    const error = {
      response: {
        status: 401,
        data: { error: "invalid username or password" },
      },
    }

    await expect(handleResponseError(error)).rejects.toBe(error)
    expect(listener).not.toHaveBeenCalled()

    window.removeEventListener("session-expired", listener)
  })

  test("does not dispatch session-expired for a 401 on Firebase sign-in verification failure", async () => {
    const listener = jest.fn()
    window.addEventListener("session-expired", listener)

    const error = {
      response: {
        status: 401,
        data: { error: "Token verification failed" },
      },
    }

    await expect(handleResponseError(error)).rejects.toBe(error)
    expect(listener).not.toHaveBeenCalled()

    window.removeEventListener("session-expired", listener)
  })

  test("does not throw and does not dispatch for a network error with no response at all", async () => {
    const listener = jest.fn()
    window.addEventListener("session-expired", listener)

    const error = new Error("Network Error")

    await expect(handleResponseError(error)).rejects.toBe(error)
    expect(listener).not.toHaveBeenCalled()

    window.removeEventListener("session-expired", listener)
  })
})
