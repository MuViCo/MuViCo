import axios from "axios"

import getToken from "../auth"

const baseUrl = "/api/users/"

const linkDrive = async ({ driveAccessToken }) => {
  const config = {
    headers: { Authorization: `Bearer ${getToken()}` },
  }

  const response = await axios.post(
    `${baseUrl}link-drive`,
    { driveAccessToken },
    config
  )

  return response.data
}

const unlinkDrive = async () => {
  const config = {
    headers: { Authorization: `Bearer ${getToken()}` },
  }

  const response = await axios.post(`${baseUrl}unlink-drive`, {}, config)

  return response.data
}

export default { linkDrive, unlinkDrive }
