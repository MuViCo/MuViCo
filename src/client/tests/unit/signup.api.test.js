/**
 * Tests authService signup and username availability API calls.
 * Verifies that:
 * - correct axios requests are made to the correct endpoints
 * - service methods return response data correctly
 */

const axios = require("axios")
import authService from "../../services/auth"

jest.mock("axios")

test("signup api call works", async () => {
  const credentials = {
    username: "test_user",
    password: "password123",
  }
  // authService.signup resolves with response.data directly.
  const payload = { data: credentials }

  axios.post.mockResolvedValue(payload)

  await expect(authService.signup(credentials)).resolves.toEqual(credentials)

  expect(axios.post).toHaveBeenCalledWith("/api/signup", credentials)
})

test("check username availability api call works", async () => {
  // Contract: backend returns availability as { available: boolean }.
  const payload = { data: { available: true } }

  axios.get.mockResolvedValue(payload)

  await expect(authService.checkUsernameAvailability("test_user")).resolves.toEqual({
    available: true,
  })

  expect(axios.get).toHaveBeenCalledWith("/api/signup/check-username", {
    // The username is sent as a query parameter instead of a path segment.
    params: { username: "test_user" },
  })
})
