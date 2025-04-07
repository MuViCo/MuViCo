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
async function getOrCreateMuViCoFolder(drive) {
  // Search for a folder named "MuViCo"
  const folderQuery =
    "mimeType = 'application/vnd.google-apps.folder' and name = 'MuViCo' and trashed = false"
  const listResponse = await drive.files.list({
    q: folderQuery,
    fields: "files(id, name)",
    spaces: "drive",
  })

  if (listResponse.data.files && listResponse.data.files.length > 0) {
    // Return the first matching folder
    return listResponse.data.files[0].id
  } else {
    // Folder not found, create it
    const fileMetadata = {
      name: "MuViCo",
      mimeType: "application/vnd.google-apps.folder",
    }
    const createResponse = await drive.files.create({
      requestBody: fileMetadata,
      fields: "id",
    })
    return createResponse.data.id
  }
}

async function uploadDriveFile(fileBuffer, fileName, mimeType, accessToken) {
  try {
    const drive = driveAuth(accessToken)
    // Ensure the file is uploaded to the MuViCo folder
    const folderId = await getOrCreateMuViCoFolder(drive)

    const bufferStream = Readable.from(fileBuffer)
    const response = await drive.files.create({
      requestBody: {
        name: fileName,
        mimeType: mimeType,
        parents: [folderId], // Specify the MuViCo folder as parent
      },
      media: {
        mimeType: mimeType,
        body: bufferStream,
      },
      fields: "id",
    })

    // Make the file publicly readable
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

async function getDriveFileStream(fileId, accessToken) {
  try {
    const drive = driveAuth(accessToken)
    // Request the file as a stream using alt=media
    const response = await drive.files.get(
      { fileId, alt: "media" },
      { responseType: "stream" }
    )
    return response.data // this is a readable stream
  } catch (error) {
    console.error("Drive fetch file error:", error)
    throw error
  }
}

module.exports = {
  driveAuth,
  uploadDriveFile,
  deleteDriveFile,
  getDriveFileMetadata,
  getDriveFileStream,
}
