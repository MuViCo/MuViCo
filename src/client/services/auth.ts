/**
 * This module provides authentication services for the client application, including login, signup, password change, and user retrieval.
 * It uses axios for HTTP requests and localStorage for storing the logged-in user's information.
 */

import axios from "axios"
import getToken from "../auth"

const loginUrl = "/api/login"
const refreshUrl = "/api/login/refresh"
const logoutUrl = "/api/login/logout"
const signupUrl = "/api/signup"
const changePasswordUrl = "/api/users/change-password"

const login = async (credentials) => {
  const response = await axios.post(loginUrl, credentials, {
    withCredentials: true,
  })
  const user = response.data
  window.localStorage.setItem("user", JSON.stringify(user))
  return user
}

// Throws if there's no valid refresh token, which the caller treats as "really logged out".
const refreshAccessToken = async () => {
  const response = await axios.post(refreshUrl, {}, { withCredentials: true })

  const currentUser = getLoggedUser()
  const updatedUser = { ...currentUser, token: response.data.token }
  window.localStorage.setItem("user", JSON.stringify(updatedUser))
  return updatedUser
}

// Best-effort - local logout doesn't depend on this succeeding.
const logout = async () => {
  try {
    await axios.post(logoutUrl, {}, { withCredentials: true })
  } catch {
    // ignore
  }
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
  refreshAccessToken,
  logout,
}
