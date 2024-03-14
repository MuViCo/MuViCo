import axios from "axios"

const baseUrl = "/api/connections"

/**
 * Creates a server for the master computer.
 * @returns {Promise<any>} The response data from the server.
 */
const create = async () => {
  const response = await axios.post(`${baseUrl}/createserver`)
  console.log("response", response.data)
  return response.data
}

/**
 * Connects a slave to the server.
 * @returns {Promise<any>} The response data from the server.
 */
const connect = async () => {
  const response = await axios.post(`${baseUrl}/connect`)
  console.log("response", response.data)
  return response.data
}

export default { create, connect }
