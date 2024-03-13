import axios from "axios"

const baseUrl = "/api/admin"

const allUsers = async () => {
  const config = {
    headers: {
      Authorization: `bearer ${JSON.parse(window.localStorage.getItem("user")).token}`,
    },
  }
  const response = await axios.get(baseUrl, config)
  return response.data
}

const deleteUser = async (id) => {
  const config = {
    headers: {
      Authorization: `bearer ${JSON.parse(window.localStorage.getItem("user")).token}`,
    },
  }
  await axios.delete(`${baseUrl}/user/${id}`, config)
}

export default { allUsers, deleteUser }
