const { google } = require("googleapis")
const { OAuth2Client } = require("google-auth-library")
const { Readable } = require("stream")

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET
const REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI

const oauth2Client = new OAuth2Client(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI)

function driveAuth(accessToken, refreshToken = null) {
  oauth2Client.setCredentials({
    access_token: accessToken,
    refresh_token: refreshToken,
  })

  return google.drive({ version: "v3", auth: oauth2Client })
}

async function uploadDriveFile(fileBuffer, fileName, mimeType, accessToken) {
  try {
    const drive = driveAuth(accessToken)
    const bufferStream = Readable.from(fileBuffer)
    const response = await drive.files.create({
      requestBody: {
        name: fileName,
        mimeType: mimeType,
      },
      media: {
        mimeType: mimeType,
        body: bufferStream,
      },
    })

    await drive.permissions.create({
      fileId: response.data.id,
      requestBody: {
        role: "reader",
        type: "anyone",
      },
    })

    return response.data
  } catch (error) {
    console.error("Drive upload error:", error)
    throw error
  }
}

async function deleteDriveFile(fileId, accessToken) {
  try {
    const drive = driveAuth(accessToken)
    await drive.files.delete({ fileId })
    console.log(`File ${fileId} deleted successfully.`)
    return { success: true, message: "File deleted successfully" }
  } catch (error) {
    console.error("Drive delete error:", error)
    throw error
  }
}

async function getDriveFileMetadata(fileId, accessToken) {
  try {
    const drive = driveAuth(accessToken)
    const response = await drive.files.get({
      fileId: fileId,
      fields: "id, name, mimeType, size",
    })

    return {
      id: response.data.id,
      name: response.data.name,
      mimeType: response.data.mimeType,
      size: response.data.size,
    }
  } catch (error) {
    console.error("Drive metadata error:", error)
    throw error
  }
}

module.exports = {
  driveAuth,
  uploadDriveFile,
  deleteDriveFile,
  getDriveFileMetadata,
}
