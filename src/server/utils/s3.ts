/*
 * S3 utility module for cue media files.
 * Handles upload/delete and creates signed URLs for read access and metadata checks.
 */
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
} from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"

import * as logger from "../utils/logger"

import {
  BUCKET_REGION,
  BUCKET_NAME,
  ACCESS_KEY,
  SECRET_ACCESS_KEY,
  PUBLIC_S3_ENDPOINT,
  PRIVATE_S3_ENDPOINT,
} from "./config"

interface CachedSignedUrl {
  url: string
  expiresAt: number
}

const signedUrlCache = new Map<string, CachedSignedUrl>()
const SIGNED_URL_CACHE_MS = 165 * 60 * 1000
const SIGNED_URL_CACHE_LIMIT = 1000

const s3Internal = new S3Client({
  endpoint: PRIVATE_S3_ENDPOINT || PUBLIC_S3_ENDPOINT,
  forcePathStyle: true,
  region: BUCKET_REGION,
  credentials: {
    accessKeyId: ACCESS_KEY as string,
    secretAccessKey: SECRET_ACCESS_KEY as string,
  },
})

const s3Public = new S3Client({
  endpoint: PUBLIC_S3_ENDPOINT,
  forcePathStyle: true,
  region: BUCKET_REGION,
  credentials: {
    accessKeyId: ACCESS_KEY as string,
    secretAccessKey: SECRET_ACCESS_KEY as string,
  },
})

export const uploadFileS3 = (
  fileBuffer: Buffer,
  fileName: string,
  mimetype: string,
  cacheControl?: string
) => {
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

export const deleteFileS3 = (fileName: string) => {
  const deleteParams = {
    Bucket: BUCKET_NAME,
    Key: fileName,
  }

  signedUrlCache.delete(fileName)
  return s3Internal.send(new DeleteObjectCommand(deleteParams))
}

export const getObjectStreamS3 = (fileName: string) => {
  const params = {
    Bucket: BUCKET_NAME,
    Key: fileName,
  }

  return s3Internal.send(new GetObjectCommand(params))
}

export const getObjectBufferS3 = async (fileName: string) => {
  const response = await getObjectStreamS3(fileName)
  if (typeof response.Body?.transformToByteArray === "function") {
    return Buffer.from(await response.Body.transformToByteArray())
  }

  const chunks: Buffer[] = []
  // SDK types don't expose Symbol.asyncIterator here, but a Node Readable
  // supports it fine at runtime
  const body = (response.Body as unknown as AsyncIterable<Uint8Array>) || []
  for await (const chunk of body) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
  }
  return Buffer.concat(chunks)
}

export const getObjectSignedUrl = async (key: string) => {
  const cached = signedUrlCache.get(key)
  if (cached && cached.expiresAt > Date.now()) return cached.url

  const params = {
    Bucket: BUCKET_NAME,
    Key: key,
  }

  const command = new GetObjectCommand(params)
  const seconds = 3 * 60 * 60
  const url = await getSignedUrl(s3Public, command, { expiresIn: seconds })

  if (signedUrlCache.size >= SIGNED_URL_CACHE_LIMIT) {
    const oldestKey = signedUrlCache.keys().next().value
    if (oldestKey !== undefined) {
      signedUrlCache.delete(oldestKey)
    }
  }
  signedUrlCache.set(key, {
    url,
    expiresAt: Date.now() + SIGNED_URL_CACHE_MS,
  })

  return url
}

// Not the Cue type from ../types on purpose: callers pass hydrated cue
// subdocuments as well as plain objects, and we only touch file.id/type/size
interface FileBearing {
  file?: { id?: string; type?: string; size?: string } | null
}

export const getFileType = async <T extends FileBearing>(
  cue: T,
  presentationId: unknown
) => {
  const key = `${presentationId}/${cue.file?.id?.toString()}`
  const params = {
    Bucket: BUCKET_NAME,
    Key: key,
  }

  try {
    const response = await s3Internal.send(new HeadObjectCommand(params))
    if (response.ContentType) {
      cue.file!.type = response.ContentType
      return cue
    } else {
      throw new Error("ContentType is missing from S3 response.")
    }
  } catch (error) {
    logger.error(
      `Error getting file type for ${key}:`,
      (error as Error).message || error
    )
    return cue
  }
}

export const getFileSize = async <T extends FileBearing>(
  cue: T,
  presentationId: unknown
) => {
  const fileName = cue.file?.id
  const key = `${presentationId}/${fileName}`

  const params = {
    Bucket: BUCKET_NAME,
    Key: key,
  }

  try {
    const response = await s3Internal.send(new HeadObjectCommand(params))
    if (response.ContentLength) {
      cue.file!.size = response.ContentLength.toString()
      return cue
    } else {
      logger.info(`ContentLength is missing from S3 response for ${key}`)
      return cue
    }
  } catch (error) {
    logger.error(
      `Error getting file size for ${key}:`,
      (error as Error).message || error
    )
    return cue
  }
}
