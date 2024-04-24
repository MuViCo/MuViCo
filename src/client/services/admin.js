import axios from "axios"
import getToken from "../auth"

const baseUrl = "/api/admin"

const allUsers = async () => {
  const config = {
    headers: {
      Authorization: `bearer ${getToken()}`,
    },
  }
  const response = await axios.get(baseUrl, config)
  return response.data
}

const deleteUser = async (id) => {
  const config = {
    headers: {
      Authorization: `bearer ${getToken()}`,
    },
  }
  await axios.delete(`${baseUrl}/user/${id}`, config)
}

const makeAdmin = async (id) => {
  const config = {
    headers: {
      Authorization: `bearer ${getToken()}`,
    },
  }
  await axios.put(`${baseUrl}/makeadmin/${id}`, {}, config)
}

export default { allUsers, deleteUser, makeAdmin }
