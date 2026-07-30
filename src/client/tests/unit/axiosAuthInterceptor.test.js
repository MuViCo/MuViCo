/*
 * Axios auth-error interceptor unit tests.
 * Verifies a 401 from an authenticated request is treated as an expired
 * session (dispatches "session-expired"), while a 401 from an unauthenticated
 * request (e.g. a wrong-password login attempt, which has no Authorization
 * header) is left alone.
 */
import { handleResponseError } from "../../utils/axiosAuthInterceptor"

describe("axiosAuthInterceptor", () => {
  test("dispatches session-expired when a request with an Authorization header gets a 401", async () => {
    const listener = jest.fn()
    window.addEventListener("session-expired", listener)

    const error = {
      response: { status: 401 },
      config: { headers: { Authorization: "Bearer sometoken" } },
    }

    await expect(handleResponseError(error)).rejects.toBe(error)
    expect(listener).toHaveBeenCalledTimes(1)

    window.removeEventListener("session-expired", listener)
  })

  test("does not dispatch session-expired for a 401 with no Authorization header (e.g. failed login)", async () => {
    const listener = jest.fn()
    window.addEventListener("session-expired", listener)

    const error = {
      response: { status: 401 },
      config: { headers: {} },
    }

    await expect(handleResponseError(error)).rejects.toBe(error)
    expect(listener).not.toHaveBeenCalled()

    window.removeEventListener("session-expired", listener)
  })
})
