import axios from "axios"

import getToken from "../auth"

const baseUrl = "/api/home/"

const getAll = () => {
  const config = {
    headers: { Authorization: `Bearer ${getToken()}` },
  }

  const request = axios.get(baseUrl, config)
  return request.then((response) => response.data)
}

const create = async (newObject) => {
  const config = {
    headers: { Authorization: `Bearer ${getToken()}` },
  }

  const response = await axios.post(baseUrl, newObject, config)
  return response.data
}

export default { getAll, create }
