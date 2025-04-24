import axios from "axios"
import getToken from "../auth"

const baseUrl = "/api/presentation/"

const get = async (id) => {
  const config = {
    headers: {
      Authorization: `bearer ${getToken()}`,
    },
  }
  const response = await axios.get(`${baseUrl}${id}`, config)
  return response.data
}

const remove = async (id) => {
  const config = {
    headers: {
      "Content-Type": "multipart/form-data",
      Authorization: `bearer ${getToken()}`,
    },
  }
  const response = await axios.delete(`${baseUrl}${id}`, config)
  return response.data
}

/**
 * Adds a cue with file to the server.
 *
 * @param {string} id - The ID of the file.
 * @param {FormData} formData - The form data containing the file to be added.
 * @var {Config} Config - This is an object where you can specify additional information like headers.
 *    Here, you’re setting the ‘Content-Type’ header to ‘multipart/form-data’,
 *    which is used when you’re sending form data that includes files.
 * @returns {Promise} A promise that resolves to the response data from the server.
 */
const addCue = async (id, formData) => {
  const config = {
    headers: {
      "Content-Type": "multipart/form-data",
      Authorization: `bearer ${getToken()}`,
    },
  }
  const response = await axios.put(`${baseUrl}${id}`, formData, config)
  return response.data
}

const removeCue = async (id, cueId) => {
  const config = {
    headers: {
      "Content-Type": "multipart/form-data",
      Authorization: `bearer ${getToken()}`,
    },
  }
  const response = await axios.delete(`${baseUrl}${id}/${cueId}`, config)
  return response.data
}

const updateCue = async (id, cueId, formData) => {
  const config = {
    headers: {
      "Content-Type": "multipart/form-data",
      Authorization: `bearer ${getToken()}`,
    },
  }
  const response = await axios.put(`${baseUrl}${id}/${cueId}`, formData, config)
  return response.data
}

export default {
  get,
  remove,
  addCue,
  removeCue,
  updateCue,
}
