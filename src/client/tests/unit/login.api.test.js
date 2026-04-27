/*
 * Auth service API unit test.
 * Verifies login() sends credentials to /api/login and returns backend payload as-is.
 */
const axios = require("axios")
const authService = require("../../services/auth")
const login = authService.default.login

jest.mock("axios")

test("login api call behaves as expected", async () => {
  // Contract check: this wrapper should not transform request or response shape.
  const credentials = { username: "John Doe", password: "password" }
  const response = { token: "XXX", id: 1, isAdmin: false, username: "John Doe" }

  axios.post.mockResolvedValue({ data: response })

  const result = await login(credentials)
  expect(result).toEqual(response)
  expect(axios.post).toHaveBeenCalledWith("/api/login", credentials)
})
