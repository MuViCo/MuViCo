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

const getById = async (id) => {
  const config = {
    headers: { Authorization: `Bearer ${getToken()}` },
  }

  const response = await axios.get(baseUrl + id, config)
  return response.data
}

const create = async (newObject) => {
  const config = {
    headers: { Authorization: `Bearer ${getToken()}` },
  }

  const response = await axios.post(baseUrl, newObject, config)
  return response.data
}

export default { getAll, getById, create }
