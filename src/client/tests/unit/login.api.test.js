/*
 * Auth service API unit tests.
 * Verifies login() sends credentials to /api/login and returns backend payload as-is,
 * plus the refresh/logout wrappers used by the silent-refresh flow.
 */
const axios = require("axios")
const authService = require("../../services/auth").default

jest.mock("axios")

beforeEach(() => {
  window.localStorage.clear()
  jest.clearAllMocks()
})

test("login api call behaves as expected", async () => {
  // Contract check: this wrapper should not transform request or response shape.
  const credentials = { username: "John Doe", password: "password" }
  const response = { token: "XXX", id: 1, isAdmin: false, username: "John Doe" }

  axios.post.mockResolvedValue({ data: response })

  const result = await authService.login(credentials)
  expect(result).toEqual(response)
  expect(axios.post).toHaveBeenCalledWith("/api/login", credentials, {
    withCredentials: true,
  })
})

test("refreshAccessToken merges the new token into the stored user", async () => {
  window.localStorage.setItem(
    "user",
    JSON.stringify({ username: "John Doe", token: "old-token" })
  )
  axios.post.mockResolvedValue({ data: { token: "new-token" } })

  const result = await authService.refreshAccessToken()

  expect(axios.post).toHaveBeenCalledWith(
    "/api/login/refresh",
    {},
    { withCredentials: true }
  )
  expect(result).toEqual({ username: "John Doe", token: "new-token" })
  expect(JSON.parse(window.localStorage.getItem("user"))).toEqual(result)
})

test("refreshAccessToken propagates the error when there's no valid refresh token", async () => {
  const error = new Error("Request failed with status code 401")
  axios.post.mockRejectedValue(error)

  await expect(authService.refreshAccessToken()).rejects.toThrow(error)
})

test("logout posts to the logout endpoint and never throws", async () => {
  axios.post.mockRejectedValue(new Error("network error"))

  await expect(authService.logout()).resolves.toBeUndefined()
  expect(axios.post).toHaveBeenCalledWith(
    "/api/login/logout",
    {},
    { withCredentials: true }
  )
})
