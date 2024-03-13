import axios from "axios"

const baseUrl = "/api/admin"

const allUsers = async () => {
  const response = await axios.get(baseUrl)
  return response.data
}

export default { allUsers }
