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
