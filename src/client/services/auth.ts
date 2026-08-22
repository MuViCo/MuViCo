/**
 * This module provides authentication services for the client application, including login, signup, password change, and user retrieval.
 * It uses axios for HTTP requests and localStorage for storing the logged-in user's information.
 */

import axios from "axios"
import getToken from "../auth"
import type {
  AdminUser,
  AuthUser,
  ChangePasswordInput,
  Credentials,
  UsernameAvailability,
} from "../types"

const loginUrl = "/api/login"
const refreshUrl = "/api/login/refresh"
const logoutUrl = "/api/login/logout"
const signupUrl = "/api/signup"
const changePasswordUrl = "/api/users/change-password"

const login = async (credentials: Credentials): Promise<AuthUser> => {
  const response = await axios.post<AuthUser>(loginUrl, credentials, {
    withCredentials: true,
  })
  const user = response.data
  window.localStorage.setItem("user", JSON.stringify(user))
  return user
}

// Throws if there's no valid refresh token, which the caller treats as "really logged out".
const refreshAccessToken = async (): Promise<AuthUser> => {
  const response = await axios.post<{ token: string }>(
    refreshUrl,
    {},
    { withCredentials: true }
  )

  const currentUser = getLoggedUser()
  // Spreading a null currentUser yields an object with only `token`, which is
  // what happens today when localStorage was cleared mid-session. The cast
  // records that the result is treated as an AuthUser regardless.
  const updatedUser = { ...currentUser, token: response.data.token } as AuthUser
  window.localStorage.setItem("user", JSON.stringify(updatedUser))
  return updatedUser
}

// Best-effort - local logout doesn't depend on this succeeding.
const logout = async (): Promise<void> => {
  try {
    await axios.post(logoutUrl, {}, { withCredentials: true })
  } catch {
    // ignore
  }
}

const signup = async (credentials: Credentials): Promise<AdminUser> => {
  const response = await axios.post<AdminUser>(signupUrl, credentials)
  return response.data
}

const checkUsernameAvailability = async (
  username: string
): Promise<UsernameAvailability> => {
  const response = await axios.get<UsernameAvailability>(
    `${signupUrl}/check-username`,
    {
      params: { username },
    }
  )
  return response.data
}

const getLoggedUser = (): AuthUser | null => {
  const loggedUserJSON = window.localStorage.getItem("user")
  if (!loggedUserJSON) {
    return null
  }
  try {
    return JSON.parse(loggedUserJSON) as AuthUser
  } catch {
    window.localStorage.removeItem("user")
    return null
  }
}

const changepassword = async (
  credentials: ChangePasswordInput
): Promise<AdminUser> => {
  const config = {
    headers: { Authorization: `Bearer ${getToken()}` },
  }

  const response = await axios.post<AdminUser>(
    changePasswordUrl,
    credentials,
    config
  )
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
