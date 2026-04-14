import axios from "axios"
import getToken from "../auth"

const loginUrl = "/api/login"
const signupUrl = "/api/signup"
const changePasswordUrl = "/api/users/change-password"

const login = async (credentials) => {
  const response = await axios.post(loginUrl, credentials)
  const user = response.data
  window.localStorage.setItem("user", JSON.stringify(user))
  return user
}

const signup = async (credentials) => {
  const response = await axios.post(signupUrl, credentials)
  return response.data
}

const checkUsernameAvailability = async (username) => {
  const response = await axios.get(`${signupUrl}/check-username`, {
    params: { username },
  })
  return response.data
}

const getLoggedUser = () => {
  const loggedUserJSON = window.localStorage.getItem("user")
    if (!loggedUserJSON) {
      return null
    }
  try {
    return JSON.parse(loggedUserJSON)
  } catch {
    window.localStorage.removeItem("user")
    return null
  }
}

const changepassword = async (credentials) => {
  const config = {
    headers: { Authorization: `Bearer ${getToken()}` },
  }

  const response = await axios.post(changePasswordUrl, credentials, config)
  return response.data
}

export default {
  login,
  signup,
  changepassword,
  getLoggedUser,
  checkUsernameAvailability,
}
