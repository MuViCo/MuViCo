import axios from "axios"
const baseUrl = "/api/presentation/"

let token = null

const setToken = (newToken) => {
  token = `bearer ${newToken}`
}

const get = (id) => {
  const request = axios.get(`${baseUrl}${id}`)
  console.log("request", request)
  return request.then((response) => response.data)
}

const remove = (id) => {
  const request = axios.delete(`${baseUrl}/${id}`)
  return request.then((response) => response.data)
}

const addVideo = async (id, videoName, videoUrl) => {
  const response = await axios.put(`${baseUrl}/${id}`, { videoName, videoUrl })
  return response.data
}

const removeVideo = async (id, videoId) => {
  const response = await axios.delete(`${baseUrl}/${id}/${videoId}`)
  return response.data
}

export default { get, setToken, remove, addVideo, removeVideo }
