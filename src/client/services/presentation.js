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

const addFile = async (id, formData) => {
  const response = await axios.put(`${baseUrl}/${id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } })
  return response.data
}

const removeFile = async (id, fileId) => {
  const response = await axios.delete(`${baseUrl}/${id}/${fileId}`)
  return response.data
}

export default { get, setToken, remove, addFile, removeFile }
