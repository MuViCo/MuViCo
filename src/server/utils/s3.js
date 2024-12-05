const {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand
} = require("@aws-sdk/client-s3")
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner")

const {
  BUCKET_REGION,
  BUCKET_NAME,
  ACCESS_KEY,
  SECRET_ACCESS_KEY,
} = require("./config")

const s3 = new S3Client({
  region: BUCKET_REGION,
  credentials: {
    accessKeyId: ACCESS_KEY,
    secretAccessKey: SECRET_ACCESS_KEY,
  },
})

const uploadFile = (fileBuffer, fileName, mimetype) => {
  const uploadParams = {
    Bucket: BUCKET_NAME,
    Body: fileBuffer,
    Key: fileName,
    ContentType: mimetype
  }

  return s3.send(new PutObjectCommand(uploadParams))
}

const deleteFile = (fileName) => {
  const deleteParams = {
    Bucket: BUCKET_NAME,
    Key: fileName,
  }

  return s3.send(new DeleteObjectCommand(deleteParams))
}

const getObjectSignedUrl = async (key) => {
  const params = {
    Bucket: BUCKET_NAME,
    Key: key,
  }

  // https://aws.amazon.com/blogs/developer/generate-presigned-url-modular-aws-sdk-javascript/
  const command = new GetObjectCommand(params)
  const seconds = 3 * 60 * 60
  const url = await getSignedUrl(s3, command, { expiresIn: seconds })
  return url
}

const getFileSize = async (cue, presentationId) => {
  const key = `${presentationId}/${cue.file.id.toString()}`
  const params = {
    Bucket: BUCKET_NAME,
    Key: key
  }
  const command = new HeadObjectCommand(params)
  const seconds = 3 * 60 * 60
  const url = await getSignedUrl(s3, command, { expiresIn: seconds })
  try {
    const response = await fetch(url, { method: "HEAD" })
    const contentLength = response.headers.get("Content-Length")
    if (contentLength) {
      cue.file.size = parseInt(contentLength, 10)
      return cue
    } else {
      throw new Error("Content-Length header is missing.")
    }
  } catch (error) {
    console.error("Error getting file size:", error)
    throw error
  }
}

const getFileType = async (cue, presentationId) => {
  const key = `${presentationId}/${cue.file.id.toString()}`
  const params = {
    Bucket: BUCKET_NAME,
    Key: key,
  }
  const command = new HeadObjectCommand(params)
  const url = await getSignedUrl(s3, command, { expiresIn: 3600 })

  try {
    const response = await fetch(url, { method: "HEAD" })
    const contentType = response.headers.get("Content-Type")
    if (contentType) {
      const fileType = contentType
      console.log("fileType:", fileType)
      return fileType
    } else {
      throw new Error("Content-Type header is missing.")
    }
  } catch (error) {
    console.error("Error getting file type:", error)
    throw error
  }
}

module.exports = { uploadFile, deleteFile, getObjectSignedUrl, getFileSize, getFileType }
