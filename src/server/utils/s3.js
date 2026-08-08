/*
 * S3 utility module for cue media files.
 * Handles upload/delete and creates signed URLs for read access and metadata checks.
 */
const {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
} = require("@aws-sdk/client-s3")
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner")

const logger = require("../utils/logger")

const {
  BUCKET_REGION,
  BUCKET_NAME,
  ACCESS_KEY,
  SECRET_ACCESS_KEY,
  PUBLIC_S3_ENDPOINT,
  PRIVATE_S3_ENDPOINT,
} = require("./config")

// Client for internal server-to-server calls within the Docker network
const s3Internal = new S3Client({
  endpoint: PRIVATE_S3_ENDPOINT || PUBLIC_S3_ENDPOINT,
  forcePathStyle: true,
  region: BUCKET_REGION,
  credentials: {
    accessKeyId: ACCESS_KEY,
    secretAccessKey: SECRET_ACCESS_KEY,
  },
})

// Client for generating presigned URLs sent to the browser
const s3Public = new S3Client({
  endpoint: PUBLIC_S3_ENDPOINT,
  forcePathStyle: true,
  region: BUCKET_REGION,
  credentials: {
    accessKeyId: ACCESS_KEY,
    secretAccessKey: SECRET_ACCESS_KEY,
  },
})

const uploadFileS3 = (fileBuffer, fileName, mimetype) => {
  const uploadParams = {
    Bucket: BUCKET_NAME,
    Body: fileBuffer,
    Key: fileName,
    ContentType: mimetype,
  }

  return s3Internal.send(new PutObjectCommand(uploadParams))
}

const deleteFileS3 = (fileName) => {
  const deleteParams = {
    Bucket: BUCKET_NAME,
    Key: fileName,
  }

  return s3Internal.send(new DeleteObjectCommand(deleteParams))
}

const getObjectSignedUrl = async (key) => {
  const params = {
    Bucket: BUCKET_NAME,
    Key: key,
  }

  // Generate URL using public endpoint for browser access
  const command = new GetObjectCommand(params)
  const seconds = 3 * 60 * 60
  const url = await getSignedUrl(s3Public, command, { expiresIn: seconds })
  return url
}

const getFileSize = async (cue, presentationId) => {
  const key = `${presentationId}/${cue.file.id.toString()}`
  const params = {
    Bucket: BUCKET_NAME,
    Key: key,
  }
  try {
    const response = await s3Internal.send(new HeadObjectCommand(params))
    if (response.ContentLength !== undefined) {
      cue.file.size = response.ContentLength
      return cue
    } else {
      throw new Error("ContentLength is missing from S3 response.")
    }
  } catch (error) {
    logger.error("Error getting file size:", error)
    throw error
  }
}

const getFileType = async (cue, presentationId) => {
  const key = `${presentationId}/${cue.file.id.toString()}`
  const params = {
    Bucket: BUCKET_NAME,
    Key: key,
  }

  try {
    const response = await s3Internal.send(new HeadObjectCommand(params))
    if (response.ContentType) {
      cue.file.type = response.ContentType
      return cue
    } else {
      throw new Error("ContentType is missing from S3 response.")
    }
  } catch (error) {
    logger.error("Error getting file type:", error)
    throw error
  }
}

module.exports = {
  uploadFileS3,
  deleteFileS3,
  getObjectSignedUrl,
  getFileSize,
  getFileType,
}
