import axios from "axios"

const baseUrl = "/api/presentation/"

let token = null

const setToken = (newToken) => {
  token = `bearer ${newToken}`
}

const get = async (id) => {
  const response = await axios.get(`${baseUrl}${id}`)
  return response.data
}

const remove = async (id) => {
  const response = await axios.delete(`${baseUrl}/${id}`)
  return response.data
}

/**
 * Adds a file to the server.
 *
 * @param {string} id - The ID of the file.
 * @param {FormData} formData - The form data containing the file to be added.
 * @var {Config} Config - This is an object where you can specify additional information like headers.
 *    Here, you’re setting the ‘Content-Type’ header to ‘multipart/form-data’,
 *    which is used when you’re sending form data that includes files.
 * @returns {Promise} A promise that resolves to the response data from the server.
 */
const addFile = async (id, formData) => {
  const response = await axios.put(`${baseUrl}/${id}`, formData, { headers: { "Content-Type": "multipart/form-data" } })
  return response.data
}

const removeFile = async (id, fileId) => {
  const response = await axios.delete(`${baseUrl}/${id}/${fileId}`)
  return response.data
}

export default {
  get, setToken, remove, addFile, removeFile,
}
