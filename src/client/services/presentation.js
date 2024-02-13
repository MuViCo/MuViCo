import axios from 'axios'
const baseUrl = 'http://localhost:8000/api/presentation/'

let token = null

const setToken = newToken => {
    token = `bearer ${newToken}`
}

const get = (id) => {
    const request = axios.get(`${baseUrl}${id}`)
    console.log("request", request)
    return request.then(response => response.data)
}

export default { get,setToken }