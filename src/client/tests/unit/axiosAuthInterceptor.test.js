/*
 * Axios auth-error interceptor unit tests.
 * Verifies a 401 whose response body includes code: "SESSION_EXPIRED" (the
 * backend's own signal that the app's JWT itself failed verification)
 * first tries a silent refresh-and-retry, and only dispatches
 * "session-expired" if that also fails (or there's nothing to retry).
 */
import axios from "axios"
import authService from "../../services/auth"
import {
  handleResponseError,
  SESSION_EXPIRED_EVENT,
} from "../../utils/axiosAuthInterceptor"

jest.mock("axios")
jest.mock("../../services/auth", () => ({
  __esModule: true,
  default: {
    refreshAccessToken: jest.fn(),
  },
}))

describe("axiosAuthInterceptor", () => {
  beforeEach(() => {
    axios.mockReset()
    authService.refreshAccessToken.mockReset()
  })

  test("dispatches session-expired when the response body includes code SESSION_EXPIRED", async () => {
    const listener = jest.fn()
    window.addEventListener(SESSION_EXPIRED_EVENT, listener)

    const error = {
      response: {
        status: 401,
        data: { error: "token expired", code: "SESSION_EXPIRED" },
      },
    }

    await expect(handleResponseError(error)).rejects.toBe(error)
    expect(listener).toHaveBeenCalledTimes(1)

    window.removeEventListener(SESSION_EXPIRED_EVENT, listener)
  })

  test("does not dispatch session-expired for a 401 without the code (e.g. wrong login credentials)", async () => {
    const listener = jest.fn()
    window.addEventListener(SESSION_EXPIRED_EVENT, listener)

    const error = {
      response: {
        status: 401,
        data: { error: "invalid username or password" },
      },
    }

    await expect(handleResponseError(error)).rejects.toBe(error)
    expect(listener).not.toHaveBeenCalled()

    window.removeEventListener(SESSION_EXPIRED_EVENT, listener)
  })

  test("does not dispatch session-expired for a 401 on Firebase sign-in verification failure", async () => {
    const listener = jest.fn()
    window.addEventListener(SESSION_EXPIRED_EVENT, listener)

    const error = {
      response: {
        status: 401,
        data: { error: "Token verification failed" },
      },
    }

    await expect(handleResponseError(error)).rejects.toBe(error)
    expect(listener).not.toHaveBeenCalled()

    window.removeEventListener(SESSION_EXPIRED_EVENT, listener)
  })

  test("does not throw and does not dispatch for a network error with no response at all", async () => {
    const listener = jest.fn()
    window.addEventListener(SESSION_EXPIRED_EVENT, listener)

    const error = new Error("Network Error")

    await expect(handleResponseError(error)).rejects.toBe(error)
    expect(listener).not.toHaveBeenCalled()

    window.removeEventListener(SESSION_EXPIRED_EVENT, listener)
  })

  test("silently refreshes and retries the original request instead of dispatching session-expired", async () => {
    const listener = jest.fn()
    window.addEventListener(SESSION_EXPIRED_EVENT, listener)

    authService.refreshAccessToken.mockResolvedValue({ token: "new-token" })
    const retriedResponse = { status: 200, data: { ok: true } }
    axios.mockResolvedValue(retriedResponse)

    const error = {
      response: {
        status: 401,
        data: { error: "token expired", code: "SESSION_EXPIRED" },
      },
      config: {
        url: "/api/home",
        method: "get",
        headers: { Authorization: "Bearer old-token" },
      },
    }

    await expect(handleResponseError(error)).resolves.toBe(retriedResponse)
    expect(axios).toHaveBeenCalledWith(
      expect.objectContaining({
        url: "/api/home",
        headers: expect.objectContaining({
          Authorization: "Bearer new-token",
        }),
      })
    )
    expect(listener).not.toHaveBeenCalled()

    window.removeEventListener(SESSION_EXPIRED_EVENT, listener)
  })

  test("dispatches session-expired if the silent refresh itself fails", async () => {
    const listener = jest.fn()
    window.addEventListener(SESSION_EXPIRED_EVENT, listener)

    authService.refreshAccessToken.mockRejectedValue(
      new Error("no valid refresh token")
    )

    const error = {
      response: {
        status: 401,
        data: { error: "token expired", code: "SESSION_EXPIRED" },
      },
      config: { url: "/api/home", method: "get", headers: {} },
    }

    await expect(handleResponseError(error)).rejects.toBe(error)
    expect(axios).not.toHaveBeenCalled()
    expect(listener).toHaveBeenCalledTimes(1)

    window.removeEventListener(SESSION_EXPIRED_EVENT, listener)
  })

  test("does not retry a request a second time (avoids an infinite loop)", async () => {
    const listener = jest.fn()
    window.addEventListener(SESSION_EXPIRED_EVENT, listener)

    const error = {
      response: {
        status: 401,
        data: { error: "token expired", code: "SESSION_EXPIRED" },
      },
      config: {
        url: "/api/home",
        method: "get",
        headers: {},
        retriedAfterRefresh: true,
      },
    }

    await expect(handleResponseError(error)).rejects.toBe(error)
    expect(authService.refreshAccessToken).not.toHaveBeenCalled()
    expect(listener).toHaveBeenCalledTimes(1)

    window.removeEventListener(SESSION_EXPIRED_EVENT, listener)
  })
})
