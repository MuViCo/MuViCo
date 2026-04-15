const axios = require("axios")
import authService from "../../services/auth"

jest.mock("axios")

test("signup api call works", async () => {
  const credentials = {
    username: "test_user",
    password: "password123",
  }
  const payload = { data: credentials }

  axios.post.mockResolvedValue(payload)

  await expect(authService.signup(credentials)).resolves.toEqual(credentials)

  expect(axios.post).toHaveBeenCalledWith("/api/signup", credentials)
})

test("check username availability api call works", async () => {
  const payload = { data: { available: true } }

  axios.get.mockResolvedValue(payload)

  await expect(authService.checkUsernameAvailability("test_user")).resolves.toEqual({
    available: true,
  })

  expect(axios.get).toHaveBeenCalledWith("/api/signup/check-username", {
    params: { username: "test_user" },
  })
})
