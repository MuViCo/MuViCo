import axios from "axios"

const Url = "/api/signup"

const signup = async (credentials) => {
  const response = await axios.post(Url, credentials)
  return response.data
}

export default { signup }
