import axios from "axios"
import getToken from "../auth"

const authUrl = "/api/auth"
const loginUrl = "/api/login"
const signupUrl = "/api/signup"
const changePasswordUrl = "/api/users/change-password"

const auth = async () => {
  const response = await axios.get(authUrl)
  return response.data
}

const login = async (credentials) => {
  const response = await axios.post(loginUrl, credentials)
  return response.data
}

const signup = async (credentials) => {
  const response = await axios.post(signupUrl, credentials)
  return response.data
}

const changepassword = async (credentials) => {
  const config = {
    headers: { Authorization: `Bearer ${getToken()}` },
  }

  const response = await axios.post(changePasswordUrl, credentials, config)
  return response.data
}

export default { auth, login, signup, changepassword }