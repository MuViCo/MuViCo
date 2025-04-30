const { google } = require("googleapis")
const { OAuth2Client } = require("google-auth-library")
const { Readable } = require("stream")

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET
const REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI

const oauth2Client = new OAuth2Client(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI)

const driveAuth = (accessToken, refreshToken = null) => {
  oauth2Client.setCredentials({
    access_token: accessToken,
    refresh_token: refreshToken,
  })
  return google.drive({ version: "v3", auth: oauth2Client })
}

const getOrCreateMuViCoFolder = async (drive) => {
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

const uploadDriveFile = async (fileBuffer, fileName, mimeType, accessToken) => {
  const drive = driveAuth(accessToken)
  const folderId = await getOrCreateMuViCoFolder(drive)
  const stream = Readable.from(fileBuffer)
  try {
    const res = await drive.files.create({
      requestBody: { name: fileName, mimeType, parents: [folderId] },
      media: { mimeType, body: stream },
      fields: "id",
    })

    await drive.permissions.create({
      fileId: res.data.id,
      requestBody: { role: "reader", type: "anyone" },
    })
    return res.data
  } catch (error) {
    console.error("Drive upload error:", error)
    throw error
  }
}

const deleteDriveFile = async (fileId, accessToken) => {
  const drive = driveAuth(accessToken)
  try {
    await drive.files.delete({ fileId })
    return { success: true, message: `File ${fileId} deleted successfully.` }
  } catch (error) {
    console.error("Drive delete error:", error)
    throw error
  }
}

const getDriveFileMetadata = async (fileId, accessToken) => {
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
    console.error("Drive metadata error:", error)
    throw error
  }
}

const getDriveFileStream = async (fileId, accessToken) => {
  const drive = driveAuth(accessToken)
  try {
    const res = await drive.files.get(
      { fileId, alt: "media" },
      { responseType: "stream" }
    )
    return res.data
  } catch (error) {
    console.error("Drive fetch file error:", error)
    throw error
  }
}

module.exports = {
  driveAuth,
  getOrCreateMuViCoFolder,
  uploadDriveFile,
  deleteDriveFile,
  getDriveFileMetadata,
  getDriveFileStream,
}
