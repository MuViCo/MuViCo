/*
 * Helper utility for cue file URL enrichment.
 * Builds Drive proxy URLs and S3 signed URLs, then attaches file metadata for cue responses.
 */
const { getDriveFileMetadata } = require("./drive")
const { getObjectSignedUrl } = require("./s3")
const { getFileSize, getFileType } = require("../utils/s3")

const logger = require("../utils/logger")

const generateDriveFileUrlForCue = async (cue, accessToken) => {
  if (!cue.file) {
    return cue
  }

  if (cue.file.driveId) {
    try {
      const metadata = await getDriveFileMetadata(cue.file.driveId, accessToken)
      cue.file.type = metadata.mimeType
      cue.file.size = metadata.size
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

const processDriveCueFiles = async (cues, accessToken) => {
  const processedCues = await Promise.all(
    cues.map(async (cue) => {
      await generateDriveFileUrlForCue(cue, accessToken)
      return cue
    })
  )

  return processedCues
}

const generateDriveFileUrl = async (file, accessToken) => {
  if (!file?.driveId) {
    return file
  }

  try {
    const metadata = await getDriveFileMetadata(file.driveId, accessToken)
    file.type = metadata.mimeType
    file.size = metadata.size
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

const generateSignedUrlForS3 = async (cue, presentationId) => {
  if (!cue.file?.id) {
    return cue
  }

  const key = `${presentationId}/${cue.file.id.toString()}`
  cue.file.url = await getObjectSignedUrl(key)

  return cue
}

const generateSignedScoreUrlForS3 = async (score, presentationId) => {
  if (!score.file?.id) {
    return score
  }

  const key = `${presentationId}/${score.file.id.toString()}`
  score.file.url = await getObjectSignedUrl(key)
  score.file.proxyUrl = `/api/presentation/${presentationId}/scores/${score._id}/file`

  return score
}

const processS3Files = async (cues, presentationId) => {
  const processedCues = await Promise.all(
    cues.map(async (cue) => {
      const cueObject =
        typeof cue?.toObject === "function" ? cue.toObject() : cue

      if (!cueObject.file) {
        return cue
      }

      await generateSignedUrlForS3(cue, presentationId)
      if (cue.file.url) {
        await getFileType(cue, presentationId)
        await getFileSize(cue, presentationId)
      }
      return cue
    })
  )
  return processedCues
}

const processS3ScoreFiles = async (scores, presentationId) => {
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

const processDriveScoreFiles = async (scores, accessToken) => {
  return Promise.all(
    scores.map(async (score) => {
      await generateDriveFileUrl(score.file, accessToken)
      return score
    })
  )
}

module.exports = {
  processDriveCueFiles,
  processDriveScoreFiles,
  generateSignedUrlForS3,
  generateSignedScoreUrlForS3,
  processS3Files,
  processS3ScoreFiles,
}
