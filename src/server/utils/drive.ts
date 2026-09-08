/*
 * Google Drive utility for cue media files.
 * Handles Drive authentication, MuViCo folder management, and file upload/delete/read operations.
 */
import { google, type drive_v3 } from "googleapis"
import { OAuth2Client } from "google-auth-library"
import { Readable } from "stream"

import * as logger from "../utils/logger"

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET
const REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI

const oauth2Client = new OAuth2Client(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI)

export const driveAuth = (
  accessToken: string,
  refreshToken: string | null = null
) => {
  oauth2Client.setCredentials({
    access_token: accessToken,
    refresh_token: refreshToken,
  })
  return google.drive({ version: "v3", auth: oauth2Client })
}

export const getOrCreateMuViCoFolder = async (drive: drive_v3.Drive) => {
  const query =
    "mimeType = 'application/vnd.google-apps.folder' and name = 'MuViCo' and trashed = false"
  const { data } = await drive.files.list({
    q: query,
    fields: "files(id, name)",
    spaces: "drive",
  })

  if (data.files && data.files.length > 0) {
    return data.files[0].id
  }

  const metadata = {
    name: "MuViCo",
    mimeType: "application/vnd.google-apps.folder",
  }
  const res = await drive.files.create({ requestBody: metadata, fields: "id" })
  return res.data.id
}

export const uploadDriveFile = async (
  fileBuffer: Buffer,
  fileName: string,
  mimeType: string,
  accessToken: string
) => {
  const drive = driveAuth(accessToken)
  const folderId = await getOrCreateMuViCoFolder(drive)
  const stream = Readable.from(fileBuffer)
  try {
    const res = await drive.files.create({
      // folderId/id can be null per googleapis' types, unchecked here same as before
      requestBody: { name: fileName, mimeType, parents: [folderId as string] },
      media: { mimeType, body: stream },
      fields: "id",
    })
    await drive.permissions.create({
      fileId: res.data.id as string,
      requestBody: { role: "reader", type: "anyone" },
    })
    return res.data
  } catch (error) {
    logger.error("Drive upload error:", error)
    throw error
  }
}

export const deleteDriveFile = async (fileId: string, accessToken: string) => {
  const drive = driveAuth(accessToken)
  try {
    await drive.files.delete({ fileId })
    return { success: true, message: `File ${fileId} deleted successfully.` }
  } catch (error) {
    logger.error("Drive delete error:", error)
    throw error
  }
}

export const getDriveFileMetadata = async (
  fileId: string,
  accessToken: string
) => {
  const drive = driveAuth(accessToken)
  try {
    const res = await drive.files.get({
      fileId,
      fields: "id, name, mimeType, size",
    })
    return {
      id: res.data.id,
      name: res.data.name,
      mimeType: res.data.mimeType,
      size: res.data.size,
    }
  } catch (error) {
    logger.error("Drive metadata error:", error)
    throw error
  }
}

export const getDriveFileStream = async (
  fileId: string,
  accessToken: string
) => {
  const drive = driveAuth(accessToken)
  try {
    const res = await drive.files.get(
      { fileId, alt: "media" },
      { responseType: "stream" }
    )
    return res.data
  } catch (error) {
    logger.error("Drive fetch file error:", error)
    throw error
  }
}
