import axios from "axios"
import getToken from "../auth"

const loginUrl = "/api/login"
const signupUrl = "/api/signup"
const changePasswordUrl = "/api/users/change-password"

const login = async (credentials) => {
  const response = await axios.post(loginUrl, credentials)
  return response.data
}

const signup = async (credentials) => {
  const response = await axios.post(signupUrl, credentials)
  return response.data
}

const signupAndLogin = async (credentials) => {
  await signup(credentials)
  const user = await login(credentials)
  window.localStorage.setItem("user", JSON.stringify(user))
  return user
}

const changepassword = async (credentials) => {
  const config = {
    headers: { Authorization: `Bearer ${getToken()}` },
  }

  const response = await axios.post(changePasswordUrl, credentials, config)
  return response.data
}

export default { login, signup, signupAndLogin, changepassword }
