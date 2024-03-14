import axios from "axios"

const baseUrl = "/api/home/"

let token = null

const setToken = (newToken) => {
  token = `Bearer ${newToken}`
}

const getAll = () => {
  const config = {
    headers: { Authorization: token },
  }

  const request = axios.get(baseUrl, config)
  return request.then((response) => response.data)
}

const create = async (newObject) => {
  const config = {
    headers: { Authorization: token },
  }

  console.log("config", config)

  const response = await axios.post(baseUrl, newObject, config)
  return response.data
}

const remove = (id) => {
  const request = axios.delete("${baseUrl}/${id}")
  return request.then((response) => response.data)
}

export default { setToken, getAll, create }
