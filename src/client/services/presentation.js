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

const addVideo = async (id, videoName, videoUrl) => {
  const response = await axios.put(`${baseUrl}/${id}`, { videoName, videoUrl })
  return response.data
}

const addFile = async (id, formdata) => {
  console.log(id)
  const response = await axios.put(`${baseUrl}/${id}`, formdata, { headers: { 'Content-Type': 'multipart/form-data' } })
  return response.data
}

const removeVideo = async (id, videoId) => {
  const response = await axios.delete(`${baseUrl}/${id}/${videoId}`)
  return response.data
}

export default { get, setToken, remove, addVideo, addFile, removeVideo }
