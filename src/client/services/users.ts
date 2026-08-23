import axios from "axios"

import getToken from "../auth"
import type { AuthUser } from "../types"

const baseUrl = "/api/users/"

const linkDrive = async ({
  driveAccessToken,
}: {
  driveAccessToken: string
}): Promise<AuthUser> => {
  const config = {
    headers: { Authorization: `Bearer ${getToken()}` },
  }

  const response = await axios.post<AuthUser>(
    `${baseUrl}link-drive`,
    { driveAccessToken },
    config
  )

  return response.data
}

const unlinkDrive = async (): Promise<AuthUser> => {
  const config = {
    headers: { Authorization: `Bearer ${getToken()}` },
  }

  const response = await axios.post<AuthUser>(
    `${baseUrl}unlink-drive`,
    {},
    config
  )

  return response.data
}

export default { linkDrive, unlinkDrive }
