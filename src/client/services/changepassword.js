import axios from "axios"

const Url = "/api/changepassword"

const changepassword = async (credentials) => {
  const response = await axios.post(Url, credentials)
  return response.data
}

export default { changepassword }
