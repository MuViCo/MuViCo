import axios from 'axios'
import { normalizeUnicode } from 'pdfjs-dist'
const baseUrl = 'localhost:8000/api/home/'

let token = null

const getAll = () => {
    const request = axios.get(baseUrl)
    return request.then(response => response.data)
}

const create = async newObject => {
    const config = {
    headers: { Authorization: token }
  }
    const response = await axios.post(baseUrl, newObject, config)
    return response.data
}

const remove = (id) => {
    const request = axios.delete('${baseUrl}/${id}')
    return request.then(response => response.data)
}

export default { getAll, create }
