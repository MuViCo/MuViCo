import axios from "axios"

const Url = "http://localhost:8000/signup"

const signup = async (credentials) => {
  const response = await axios.post(Url, credentials)
  return response.data
}

export default { signup }
