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

const signedUrlCache = new Map()
const SIGNED_URL_CACHE_MS = 165 * 60 * 1000
const SIGNED_URL_CACHE_LIMIT = 1000

const s3Internal = new S3Client({
  endpoint: PRIVATE_S3_ENDPOINT || PUBLIC_S3_ENDPOINT,
  forcePathStyle: true,
  region: BUCKET_REGION,
  credentials: {
    accessKeyId: ACCESS_KEY,
    secretAccessKey: SECRET_ACCESS_KEY,
  },
})

const s3Public = new S3Client({
  endpoint: PUBLIC_S3_ENDPOINT,
  forcePathStyle: true,
  region: BUCKET_REGION,
  credentials: {
    accessKeyId: ACCESS_KEY,
    secretAccessKey: SECRET_ACCESS_KEY,
  },
})

const uploadFileS3 = (fileBuffer, fileName, mimetype, cacheControl) => {
  const uploadParams = {
    Bucket: BUCKET_NAME,
    Body: fileBuffer,
    Key: fileName,
    ContentType: mimetype,
    ...(cacheControl && { CacheControl: cacheControl }),
  }

  signedUrlCache.delete(fileName)
  return s3Internal.send(new PutObjectCommand(uploadParams))
}

const deleteFileS3 = (fileName) => {
  const deleteParams = {
    Bucket: BUCKET_NAME,
    Key: fileName,
  }

  signedUrlCache.delete(fileName)
  return s3Internal.send(new DeleteObjectCommand(deleteParams))
}

const getObjectStreamS3 = (fileName) => {
  const params = {
    Bucket: BUCKET_NAME,
    Key: fileName,
  }

  return s3Internal.send(new GetObjectCommand(params))
}

const getObjectBufferS3 = async (fileName) => {
  const response = await getObjectStreamS3(fileName)
  if (typeof response.Body?.transformToByteArray === "function") {
    return Buffer.from(await response.Body.transformToByteArray())
  }

  const chunks = []
  for await (const chunk of response.Body || []) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
  }
  return Buffer.concat(chunks)
}

const getObjectSignedUrl = async (key) => {
  const cached = signedUrlCache.get(key)
  if (cached?.expiresAt > Date.now()) return cached.url

  const params = {
    Bucket: BUCKET_NAME,
    Key: key,
  }

  const command = new GetObjectCommand(params)
  const seconds = 3 * 60 * 60
  const url = await getSignedUrl(s3Public, command, { expiresIn: seconds })

  if (signedUrlCache.size >= SIGNED_URL_CACHE_LIMIT) {
    signedUrlCache.delete(signedUrlCache.keys().next().value)
  }
  signedUrlCache.set(key, {
    url,
    expiresAt: Date.now() + SIGNED_URL_CACHE_MS,
  })

  return url
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
    logger.error(`Error getting file type for ${key}:`, error.message || error)
    return cue
  }
}

const getFileSize = async (cue, presentationId) => {
  const fileName = cue.file.id
  const key = `${presentationId}/${fileName}`

  const params = {
    Bucket: BUCKET_NAME,
    Key: key,
  }

  try {
    const response = await s3Internal.send(new HeadObjectCommand(params))
    if (response.ContentLength) {
      cue.file.size = response.ContentLength.toString()
      return cue
    } else {
      logger.warn(`ContentLength is missing from S3 response for ${key}`)
      return cue
    }
  } catch (error) {
    logger.error(`Error getting file size for ${key}:`, error.message || error)
    return cue
  }
}

module.exports = {
  uploadFileS3,
  deleteFileS3,
  getObjectStreamS3,
  getObjectBufferS3,
  getObjectSignedUrl,
  getFileSize,
  getFileType,
}
