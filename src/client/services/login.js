import axios from "axios"

const Url = "/api/login"

const login = async (credentials) => {
  const response = await axios.post(Url, credentials)
  return response.data
}

export default { login }
