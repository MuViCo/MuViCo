import axios from "axios"
import getToken from "../auth"

const Url = "/api/users/change-password"

const changepassword = async (credentials) => {
  const config = {
    headers: { Authorization: `Bearer ${getToken()}` },
  }

  const response = await axios.post(Url, credentials, config)
  return response.data
}

export default { changepassword }
