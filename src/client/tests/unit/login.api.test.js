const axios = require("axios")
const loginService = require("../../services/login")
const login = loginService.default.login

jest.mock("axios")

test("login api call behaves as expected", async () => {
  const credentials = { username: "John Doe", password: "password" }
  const response = { token: "XXX", id: 1, isAdmin: false, username: "John Doe" }

  axios.post.mockResolvedValue({ data: response })

  const result = await login(credentials)
  expect(result).toEqual(response)
  expect(axios.post).toHaveBeenCalledWith("/api/login", credentials)
})
