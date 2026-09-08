/*
 * Helper utility for cue file URL enrichment.
 * Builds Drive proxy URLs and S3 signed URLs, then attaches file metadata for cue responses.
 */
import { getDriveFileMetadata } from "./drive"
import { getObjectSignedUrl, getFileSize, getFileType } from "./s3"

import * as logger from "../utils/logger"
import type { CueFile, MediaEntry, Score } from "../types"

// Generic so callers keep their own (Mongoose subdocument or plain object)
// type on the way out instead of getting widened to this structural type
interface FileHolder {
  file?: CueFile | null
}

const generateDriveFileUrlForCue = async <T extends FileHolder>(
  cue: T,
  accessToken: string
) => {
  if (!cue.file) {
    return cue
  }

  if (cue.file.driveId) {
    try {
      const metadata = await getDriveFileMetadata(cue.file.driveId, accessToken)
      cue.file.type = metadata.mimeType ?? undefined
      cue.file.size = metadata.size ?? undefined
      const baseUrl =
        process.env.NODE_ENV === "production"
          ? "https://muvico.live"
          : "http://localhost:3000"

      cue.file.url = `${baseUrl}/api/media/${cue.file.driveId}?access_token=${accessToken}`
    } catch (error) {
      logger.error("Error fetching file metadata:", error)
    }
  }

  return cue
}

export const processDriveCueFiles = async <T extends FileHolder>(
  cues: T[],
  accessToken: string
) => {
  const processedCues = await Promise.all(
    cues.map(async (cue) => {
      await generateDriveFileUrlForCue(cue, accessToken)
      return cue
    })
  )

  return processedCues
}

// Takes the file object directly (a MediaEntry, or cue.file/score.file),
// unlike the functions above which take the cue/score itself.
interface DriveFileLike {
  driveId?: string
  type?: string
  size?: string
  url?: string
}

const generateDriveFileUrl = async <T extends DriveFileLike>(
  file: T | null | undefined,
  accessToken: string
) => {
  if (!file?.driveId) {
    return file
  }

  try {
    const metadata = await getDriveFileMetadata(file.driveId, accessToken)
    file.type = metadata.mimeType ?? undefined
    file.size = metadata.size ?? undefined
    const baseUrl =
      process.env.NODE_ENV === "production"
        ? "https://muvico.live"
        : "http://localhost:3000"

    file.url = `${baseUrl}/api/media/${file.driveId}?access_token=${accessToken}`
  } catch (error) {
    logger.error("Error fetching file metadata:", error)
  }

  return file
}

export const generateSignedUrlForS3 = async <T extends FileHolder>(
  cue: T,
  presentationId: unknown
) => {
  if (!cue.file?.id) {
    return cue
  }

  const key = `${presentationId}/${cue.file.id.toString()}`
  cue.file.url = await getObjectSignedUrl(key)

  return cue
}

const generateSignedScoreUrlForS3 = async (
  score: Score,
  presentationId: unknown
) => {
  if (!score.file?.id) {
    return score
  }

  const key = `${presentationId}/${score.file.id.toString()}`
  score.file.url = await getObjectSignedUrl(key)
  score.file.proxyUrl = `/api/presentation/${presentationId}/scores/${score._id}/file`

  return score
}

interface ToObjectable {
  toObject?: () => unknown
}

export const processS3Files = async <T extends FileHolder & ToObjectable>(
  cues: T[],
  presentationId: unknown
) => {
  const processedCues = await Promise.all(
    cues.map(async (cue) => {
      const cueObject = (
        typeof cue?.toObject === "function" ? cue.toObject() : cue
      ) as FileHolder

      if (!cueObject.file) {
        return cue
      }

      await generateSignedUrlForS3(cue, presentationId)
      if (cue.file?.url) {
        await getFileType(cue, presentationId)
        await getFileSize(cue, presentationId)
      }
      return cue
    })
  )
  return processedCues
}

/*
 * Media-library entries share cue.file's shape and its storage key
 * (`${presentationId}/${id}`), so signing is the same operation. Unlike the cue
 * path this does NOT issue HeadObject calls for type/size: both are recorded on
 * the entry when it is uploaded, so the extra round-trips would buy nothing.
 */
export const generateSignedMediaUrlForS3 = async <
  T extends { id?: string; url?: string },
>(
  item: T | null | undefined,
  presentationId: unknown
) => {
  if (!item?.id) {
    return item
  }

  const key = `${presentationId}/${item.id.toString()}`
  item.url = await getObjectSignedUrl(key)

  return item
}

export const processS3MediaFiles = async (
  media: MediaEntry[] | null | undefined,
  presentationId: unknown
) => {
  return Promise.all(
    (media || []).map((item) =>
      generateSignedMediaUrlForS3(item, presentationId)
    )
  )
}

export const processDriveMediaFiles = async (
  media: MediaEntry[] | null | undefined,
  accessToken: string
) => {
  return Promise.all(
    (media || []).map(async (item) => {
      await generateDriveFileUrl(item, accessToken)
      return item
    })
  )
}

export const processS3ScoreFiles = async (
  scores: Score[],
  presentationId: unknown
) => {
  return Promise.all(
    scores.map(async (score) => {
      if (!score.file?.id) {
        return score
      }

      await generateSignedScoreUrlForS3(score, presentationId)
      return score
    })
  )
}

export const processDriveScoreFiles = async (
  scores: Score[],
  accessToken: string
) => {
  return Promise.all(
    scores.map(async (score) => {
      await generateDriveFileUrl(score.file, accessToken)
      return score
    })
  )
}
