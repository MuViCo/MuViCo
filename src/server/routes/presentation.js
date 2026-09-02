/**
 * This module defines the routes for managing presentations, including:
 * retrieving presentation details, updating presentation properties (like index and screen count), uploading and managing cues (which can be files or colors associated with specific screens and indices), and deleting presentations.
 * It uses multer for handling file uploads, integrates with AWS S3 and Google Drive for file storage, and includes middleware for user authentication and presentation access control.
 * The routes interact with the Presentation model to perform CRUD operations and ensure that users can only access and modify presentations they have permissions for.
 * The module also includes error handling for various edge cases, such as file size limits, invalid input data, and conflicts in cue positioning.
 */

const express = require("express")
const multer = require("multer")
const crypto = require("crypto")
const { uploadFileS3, deleteFileS3, getObjectStreamS3 } = require("../utils/s3")
const {
  uploadDriveFile,
  deleteDriveFile,
  getDriveFileStream,
} = require("../utils/drive")
const Presentation = require("../models/presentation")
const {
  userExtractor,
  requirePresentationAccess,
} = require("../utils/middleware")
const { BUCKET_NAME } = require("../utils/config")
const {
  generateSignedUrlForS3,
  processS3Files,
  processS3MediaFiles,
  processDriveCueFiles,
  processDriveMediaFiles,
  processS3ScoreFiles,
  processDriveScoreFiles,
} = require("../utils/helper")
const {
  getAudioRow,
  getCueTypeFromScreen,
  getMaxLayers,
  isAudioMimeType,
  isAllowedMimeType,
} = require("../utils/cueType")
const logger = require("../utils/logger")
const router = express.Router()

const storage = multer.memoryStorage()
const upload = multer({ storage })
const PDF_MIME_TYPES = ["application/pdf", "application/x-pdf"]
const MAX_SCORE_FILE_SIZE = 50 * 1024 * 1024

const generateFileId = () => crypto.randomBytes(8).toString("hex")

const parseOptionalPositiveInteger = (rawValue) => {
  if (rawValue === undefined || rawValue === null || rawValue === "") {
    return undefined
  }

  const value = Number(rawValue)
  if (!Number.isInteger(value) || value < 1) {
    return null
  }

  return value
}

const parseMarkerInteger = (rawValue) => {
  const value = Number(rawValue)
  return Number.isInteger(value) ? value : null
}

const isPdfFile = (file) => {
  if (!file) {
    return false
  }

  return (
    PDF_MIME_TYPES.includes(file.mimetype) ||
    file.originalname.toLowerCase().endsWith(".pdf")
  )
}

const trimText = (value, fallback = "") =>
  typeof value === "string" ? value.trim() : fallback

const validateScoreTitle = (title) => {
  const trimmedTitle = trimText(title)
  if (trimmedTitle.length === 0 || trimmedTitle.length > 150) {
    return null
  }

  return trimmedTitle
}

const safeInlineFilename = (name) => {
  const fallback = "score.pdf"
  const filename = trimText(name, fallback).replace(/["\\\r\n]/g, "_")
  return filename || fallback
}

const setScoreFileHeaders = (res, score, contentType, contentLength) => {
  const filename = safeInlineFilename(score.file.name || score.title)
  res.setHeader(
    "Content-Type",
    contentType || score.file.type || "application/pdf"
  )
  res.setHeader(
    "Content-Disposition",
    `inline; filename="${filename}"; filename*=UTF-8''${encodeURIComponent(filename)}`
  )
  res.setHeader("Cache-Control", "private, max-age=300")
  if (contentLength !== undefined) {
    res.setHeader("Content-Length", contentLength)
  }
}

const parseUrl = (rawUrl) => {
  const sourceUrl = trimText(rawUrl)
  if (!sourceUrl) {
    return null
  }

  try {
    const url = new URL(sourceUrl)
    if (!["http:", "https:"].includes(url.protocol)) {
      return null
    }

    return url
  } catch {
    return null
  }
}

const isImslpUrl = (url) =>
  url.hostname === "imslp.org" || url.hostname.endsWith(".imslp.org")

const parseMarkerRect = (rawRect) => {
  if (rawRect === undefined || rawRect === null || rawRect === "") {
    return undefined
  }

  const rect = typeof rawRect === "string" ? JSON.parse(rawRect) : rawRect
  const keys = ["x", "y", "width", "height"]
  const parsed = {}

  for (const key of keys) {
    if (rect[key] === undefined || rect[key] === null || rect[key] === "") {
      continue
    }

    const value = Number(rect[key])
    if (!Number.isFinite(value) || value < 0 || value > 1) {
      return null
    }

    parsed[key] = value
  }

  return parsed
}

const processPresentationScoreFiles = async (presentation, user) => {
  if (user.driveToken) {
    presentation.scores = await processDriveScoreFiles(
      presentation.scores || [],
      user.driveToken
    )
  } else {
    presentation.scores = await processS3ScoreFiles(
      presentation.scores || [],
      presentation._id
    )
  }

  return presentation
}

const uploadScoreFile = async (presentationId, fileId, file, user) => {
  const key = `${presentationId}/${fileId}`

  if (user.driveToken) {
    return uploadDriveFile(file.buffer, key, file.mimetype, user.driveToken)
  }

  await uploadFileS3(file.buffer, key, file.mimetype)
  return null
}

const deleteScoreFile = async (presentationId, score, user) => {
  if (!score.file) {
    return
  }

  if (user.driveToken && score.file.driveId) {
    await deleteDriveFile(score.file.driveId, user.driveToken)
    return
  }

  if (score.file.id) {
    await deleteFileS3(`${presentationId}/${score.file.id}`)
  }
}

const parseCueOpacity = (rawOpacity, fallback = 1) => {
  if (rawOpacity === undefined || rawOpacity === null || rawOpacity === "") {
    return fallback
  }

  const opacity = Number(rawOpacity)
  if (!Number.isFinite(opacity) || opacity < 0 || opacity > 1) {
    return null
  }

  return opacity
}

// A cue's occupied screens: spanScreens when it's a valid multi-screen span,
// otherwise just its own primary screen.
const occupiedScreens = (screen, spanScreens) =>
  Array.isArray(spanScreens) && spanScreens.length > 1
    ? spanScreens
    : [Number(screen)]

// Parses the `spanScreens` form field (a JSON-encoded array of screen
// numbers, or absent/empty for "no span"). Range/membership/cueType checks
// happen at the call site, where `screen`, `cueType` and `screenCount` are
// known -- this only handles shape.
const parseSpanScreens = (raw) => {
  if (raw === undefined || raw === null || raw === "") {
    return { spanScreens: null, error: null }
  }

  let parsed
  try {
    parsed = JSON.parse(raw)
  } catch {
    return { spanScreens: null, error: "spanScreens must be valid JSON" }
  }

  if (!Array.isArray(parsed)) {
    return { spanScreens: null, error: "spanScreens must be an array" }
  }
  if (parsed.length === 0) {
    return { spanScreens: null, error: null }
  }

  const normalized = parsed.map(Number)
  if (normalized.some((screenNumber) => !Number.isInteger(screenNumber))) {
    return {
      spanScreens: null,
      error: "spanScreens must contain only integers",
    }
  }

  return { spanScreens: normalized, error: null }
}

// Full validity check once `screen`/`cueType`/`screenCount` are known: must
// be visual, include the cue's own screen, have no duplicates, and every
// entry must be a valid screen number.
const isValidSpanScreens = (spanScreens, screen, cueType, screenCount) =>
  cueType === "visual" &&
  spanScreens.length > 1 &&
  spanScreens.includes(screen) &&
  new Set(spanScreens).size === spanScreens.length &&
  spanScreens.every(
    (screenNumber) => screenNumber >= 1 && screenNumber <= screenCount
  )

const hasPositionConflict = (
  cues,
  index,
  screen,
  layer,
  excludedCueId = null,
  spanScreens = null
) => {
  const candidateScreens = occupiedScreens(screen, spanScreens)

  return cues.some((cue) => {
    if (Number(cue.index) !== Number(index)) {
      return false
    }
    if (Number(cue.layer ?? 0) !== Number(layer ?? 0)) {
      return false
    }

    const samePosition = occupiedScreens(cue.screen, cue.spanScreens).some(
      (occupiedScreen) => candidateScreens.includes(occupiedScreen)
    )
    if (!samePosition) {
      return false
    }

    if (!excludedCueId) {
      return true
    }

    return cue._id.toString() !== excludedCueId.toString()
  })
}

// Checks if there is a cue (other than the two being swapped) that already occupies one of the target positions
const hasSwapTargetConflict = (
  cues,
  firstCueId,
  secondCueId,
  firstTargetIndex,
  firstTargetScreen,
  firstTargetLayer,
  secondTargetIndex,
  secondTargetScreen,
  secondTargetLayer
) => {
  return cues.some((cue) => {
    const cueId = cue._id.toString()

    if (cueId === firstCueId.toString() || cueId === secondCueId.toString()) {
      return false
    }

    const cueScreens = occupiedScreens(cue.screen, cue.spanScreens)

    return (
      (Number(cue.index) === firstTargetIndex &&
        Number(cue.layer ?? 0) === firstTargetLayer &&
        cueScreens.includes(firstTargetScreen)) ||
      (Number(cue.index) === secondTargetIndex &&
        Number(cue.layer ?? 0) === secondTargetLayer &&
        cueScreens.includes(secondTargetScreen))
    )
  })
}

const deleteObject = async (id, cueId, driveToken) => {
  const cue = await Presentation.findOne(
    { _id: id, "cues._id": cueId },
    { "cues.$": 1, media: 1 }
  )

  if (!cue) {
    return null
  }

  const updatedPresentation = await Presentation.findByIdAndUpdate(
    id,
    {
      $pull: {
        cues: {
          _id: cueId,
        },
      },
    },
    { new: true }
  )

  const fileName = cue.cues[0].file?.id

  // Colour-only cues carry no file, so there is nothing to remove from storage.
  if (!fileName) {
    return updatedPresentation
  }

  // The media library owns the bytes of any cue created from it: cue and
  // library entry address the same key, and only an explicit library delete may
  // remove it. Legacy cues never appear in `media`, so this never fires for
  // them and their delete path is byte-for-byte the previous one.
  const isLibraryOwned = (cue.media || []).some((item) => item.id === fileName)
  if (isLibraryOwned) {
    return updatedPresentation
  }

  if (driveToken) {
    const driveFileId = cue.cues[0].file.driveId
    if (driveFileId) {
      const presentation = await Presentation.findById(id)

      const sameFileCount = presentation.cues.filter(
        (c) => c.file?.driveId === driveFileId
      ).length

      if (sameFileCount === 0) {
        await deleteDriveFile(driveFileId, driveToken)
      }
    }
  } else {
    const key = `${id}/${fileName}`
    await deleteFileS3(key)
  }

  return updatedPresentation
}

/**
 * Returns all files related to a presentation.
 * Adds an expiring signed url to AWS Bucket for each file.
 */
router.get(
  "/:id",
  userExtractor,
  requirePresentationAccess,
  async (req, res, next) => {
    try {
      const { user, presentation } = req

      // Update lastUsed for MRU sorting
      presentation.lastUsed = new Date()
      await presentation.save()

      if (user.driveToken) {
        const driveToken = user.driveToken
        presentation.cues = await processDriveCueFiles(
          presentation.cues,
          driveToken
        )
        await processDriveMediaFiles(presentation.media, driveToken)
      } else {
        presentation.cues = await processS3Files(
          presentation.cues,
          presentation._id
        )
        // Signed in place, so the media pool repopulates from the response the
        // editor already fetches on mount -- no extra client request.
        await processS3MediaFiles(presentation.media, presentation._id)
      }
      await processPresentationScoreFiles(presentation, user)

      res.json(presentation)
    } catch (error) {
      next(error)
    }
  }
)

/**
 * Deletes a presentation and all associated cues and files.
 */
router.delete(
  "/:id",
  userExtractor,
  requirePresentationAccess,
  async (req, res, next) => {
    try {
      const { user, presentation } = req

      for (const cue of presentation.cues) {
        await deleteObject(presentation._id, cue._id, user.driveToken)
      }

      // Cues created from the library were skipped by deleteObject above,
      // because the library owns their bytes. Remove those objects here, or
      // dropping the presentation would orphan every pooled file.
      for (const item of presentation.media || []) {
        if (user.driveToken) {
          if (item.driveId) {
            await deleteDriveFile(item.driveId, user.driveToken)
          }
        } else {
          await deleteFileS3(`${presentation._id}/${item.id}`)
        }
      }

      for (const score of presentation.scores || []) {
        await deleteScoreFile(presentation._id, score, user)
      }

      await Presentation.findByIdAndDelete(presentation._id)
      return res.status(204).end()
    } catch (error) {
      next(error)
    }
  }
)

/**
 * Media library ("media pool") for a presentation.
 *
 * Uploads land here first and stay here: an entry is independent of any cue, so
 * the pool survives a reload. Dragging an entry onto the timeline creates a cue
 * that reuses the entry's `id` (see PUT /:id below) -- the same storage object,
 * no copy, no second upload.
 */
router.post(
  "/:id/media",
  userExtractor,
  requirePresentationAccess,
  upload.single("file"),
  async (req, res, next) => {
    try {
      const { id } = req.params
      const { file, user, presentation } = req

      if (!file) {
        return res.status(400).json({ error: "No file provided" })
      }

      if (file.size > 50 * 1024 * 1024 && !user.isAdmin) {
        return res.status(400).json({ error: "File size exceeds 50 MB limit" })
      }

      if (!isAllowedMimeType(file.mimetype)) {
        return res
          .status(400)
          .json({ error: `Invalid filetype: ${file.originalname}` })
      }

      const mediaId = generateFileId()
      const key = `${id}/${mediaId}`

      const entry = {
        id: mediaId,
        name: file.originalname || `file-${mediaId}`,
        url: "",
        size: String(file.size),
        type: file.mimetype,
      }

      if (user.driveToken) {
        const driveResponse = await uploadDriveFile(
          file.buffer,
          key,
          file.mimetype,
          user.driveToken
        )
        entry.driveId = driveResponse.id
      } else {
        await uploadFileS3(file.buffer, key, file.mimetype)
      }

      presentation.media.push(entry)
      await presentation.save({ validateModifiedOnly: true })

      const saved = presentation.media[presentation.media.length - 1]

      if (user.driveToken) {
        await processDriveMediaFiles([saved], user.driveToken)
      } else {
        await processS3MediaFiles([saved], id)
      }

      return res.status(201).json(saved)
    } catch (error) {
      next(error)
    }
  }
)

/**
 * Removes an entry from the media library -- permanently.
 *
 * The library owns the stored object, and a cue created from an entry shares
 * that object rather than holding a copy. There is therefore no way to keep a
 * cue working once its entry is gone, so the cues built from this entry are
 * removed with it and the object is deleted. The client warns before calling
 * this; the response reports which cues went, so it can drop them from view.
 *
 * Deleting a cue does the opposite and leaves the library untouched -- see
 * deleteObject above.
 */
router.delete(
  "/:id/media/:mediaId",
  userExtractor,
  requirePresentationAccess,
  async (req, res, next) => {
    try {
      const { id, mediaId } = req.params
      const { user, presentation } = req

      const entry = (presentation.media || []).find(
        (item) => item.id === mediaId
      )

      if (!entry) {
        return res.status(404).json({ error: "Media not found" })
      }

      const deletedCueIds = presentation.cues
        .filter((cue) => cue.file?.id === mediaId)
        .map((cue) => cue._id.toString())

      const driveId = entry.driveId

      for (const cueId of deletedCueIds) {
        presentation.cues.pull({ _id: cueId })
      }
      presentation.media.pull({ _id: entry._id })
      await presentation.save({ validateModifiedOnly: true })

      if (user.driveToken) {
        if (driveId) {
          await deleteDriveFile(driveId, user.driveToken)
        }
      } else {
        await deleteFileS3(`${id}/${mediaId}`)
      }

      return res.json({ mediaId, deletedCueIds })
    } catch (error) {
      next(error)
    }
  }
)

/**
 * Updates presentation by ID, setting the new index count and adding them to mongoDB
 */
router.put(
  "/:id/indexCount",
  userExtractor,
  requirePresentationAccess,
  async (req, res, next) => {
    try {
      const { presentation } = req
      const { indexCount } = req.body

      const newIndexCount = Math.round(Number(indexCount))

      if (isNaN(newIndexCount)) {
        return res.status(400).json({ error: "indexCount must be a number" })
      }

      if (newIndexCount < 1 || newIndexCount > 101) {
        return res
          .status(400)
          .json({ error: "indexCount must be between 1 and 101" })
      }

      const updateQuery = {
        $set: { indexCount: newIndexCount },
      }

      // If reducing index count, remove cues from indexes that will be removed
      let removedCuesCount = 0
      let removedScoreMarkersCount = 0
      if (newIndexCount < presentation.indexCount) {
        const cuesToRemove = presentation.cues.filter(
          (cue) => Number(cue.index) >= newIndexCount
        )
        removedCuesCount = cuesToRemove.length
        removedScoreMarkersCount = (presentation.scores || []).reduce(
          (count, score) =>
            count +
            (score.markers || []).filter(
              (marker) => Number(marker.frameIndex) >= newIndexCount
            ).length,
          0
        )

        updateQuery.$pull = {
          cues: {
            _id: { $in: cuesToRemove.map((cue) => cue._id) },
          },
          "scores.$[].markers": {
            frameIndex: { $gte: newIndexCount },
          },
        }
      }

      const updatedPresentation = await Presentation.findByIdAndUpdate(
        presentation._id,
        updateQuery,
        { new: true }
      )

      res.json({
        indexCount: updatedPresentation.indexCount,
        removedCuesCount: removedCuesCount,
        removedScoreMarkersCount: removedScoreMarkersCount,
      })
    } catch (err) {
      next(err)
    }
  }
)

/**
 * Update presentation screenCount by ID. The screen position of audio cues is updated
 * by the presentation model's pre("validate") hook to always be screenCount + 1.
 */
router.put(
  "/:id/screenCount",
  userExtractor,
  requirePresentationAccess,
  async (req, res, next) => {
    try {
      const { presentation } = req
      const { screenCount } = req.body

      const newScreenCount = Math.round(Number(screenCount))

      if (isNaN(newScreenCount)) {
        return res.status(400).json({ error: "screenCount must be a number" })
      }

      if (newScreenCount < 1 || newScreenCount > 8) {
        return res
          .status(400)
          .json({ error: "screenCount must be between 1 and 8" })
      }

      // If reducing screen count, remove cues from screens that will be removed
      let removedCuesCount = 0
      if (newScreenCount < presentation.screenCount) {
        const cuesToRemove = presentation.cues.filter(
          (cue) =>
            cue.screen > newScreenCount &&
            cue.screen <= presentation.screenCount
        )
        removedCuesCount = cuesToRemove.length

        // Remove cues from screens being deleted (excludes the audio row,
        // which always sits at screenCount + 1 and must survive)
        presentation.cues = presentation.cues.filter(
          (cue) =>
            !(
              cue.screen > newScreenCount &&
              cue.screen <= presentation.screenCount
            )
        )

        // A surviving cue's own screen is guaranteed valid (it just passed
        // the filter above), but its spanScreens may still reference a
        // screen number that no longer exists -- drop those, and drop the
        // whole field if fewer than 2 valid screens remain (a "span" of one
        // screen is meaningless).
        presentation.cues.forEach((cue) => {
          if (!Array.isArray(cue.spanScreens)) return
          const validSpanScreens = cue.spanScreens.filter(
            (screenNumber) => screenNumber <= newScreenCount
          )
          cue.spanScreens =
            validSpanScreens.length > 1 ? validSpanScreens : undefined
        })
      }

      // Must be presentation.save(), not a query-style update, since it
      // triggers the pre("validate") hook the audio-row repositioning depends on.
      presentation.screenCount = newScreenCount
      await presentation.save()

      res.json({
        screenCount: presentation.screenCount,
        removedCuesCount: removedCuesCount,
      })
    } catch (err) {
      next(err)
    }
  }
)

/**
 * Updates presentation name by ID.
 */
router.put(
  "/:id/name",
  userExtractor,
  requirePresentationAccess,
  async (req, res, next) => {
    try {
      const { presentation } = req
      const { name } = req.body

      if (typeof name !== "string") {
        return res
          .status(400)
          .json({ error: "Presentation name must be a string" })
      }

      const trimmedName = name.trim()
      if (trimmedName.length === 0 || trimmedName.length > 100) {
        return res.status(400).json({
          error: "Presentation name must be between 1 and 100 characters long",
        })
      }

      presentation.name = trimmedName
      const updated = await presentation.save({ validateModifiedOnly: true })

      res.json({ name: updated.name })
    } catch (err) {
      next(err)
    }
  }
)

router.get(
  "/:id/scores",
  userExtractor,
  requirePresentationAccess,
  async (req, res, next) => {
    try {
      const { user, presentation } = req
      await processPresentationScoreFiles(presentation, user)
      res.json(presentation.scores || [])
    } catch (error) {
      next(error)
    }
  }
)

router.get(
  "/:id/scores/:scoreId/file",
  userExtractor,
  requirePresentationAccess,
  async (req, res, next) => {
    try {
      const { presentation, user } = req
      const score = presentation.scores.id(req.params.scoreId)

      if (!score) {
        return res.status(404).json({ error: "Score not found" })
      }

      if (!score.file) {
        return res.status(404).json({ error: "Score file not found" })
      }

      if (user.driveToken && score.file.driveId) {
        const fileStream = await getDriveFileStream(
          score.file.driveId,
          user.driveToken
        )
        if (!fileStream || typeof fileStream.pipe !== "function") {
          return res.status(404).json({ error: "Score file not found" })
        }
        setScoreFileHeaders(res, score)
        return fileStream.pipe(res)
      }

      if (!score.file.id) {
        return res.status(404).json({ error: "Score file not found" })
      }

      const key = `${presentation._id}/${score.file.id}`
      const response = await getObjectStreamS3(key)

      if (!response.Body || typeof response.Body.pipe !== "function") {
        return res.status(404).json({ error: "Score file not found" })
      }

      setScoreFileHeaders(
        res,
        score,
        response.ContentType,
        response.ContentLength
      )
      return response.Body.pipe(res)
    } catch (error) {
      next(error)
    }
  }
)

router.post(
  "/:id/scores/upload",
  userExtractor,
  requirePresentationAccess,
  upload.single("score"),
  async (req, res, next) => {
    try {
      const { file, presentation, user } = req
      const fileId = generateFileId()
      const pageCount = parseOptionalPositiveInteger(req.body.pageCount)

      if (!file) {
        return res.status(400).json({ error: "Score PDF file is required" })
      }

      if (!isPdfFile(file)) {
        return res.status(400).json({ error: "Only PDF scores are allowed" })
      }

      if (file.size > MAX_SCORE_FILE_SIZE && !user.isAdmin) {
        return res.status(400).json({ error: "File size exceeds 50 MB limit" })
      }

      if (pageCount === null) {
        return res.status(400).json({
          error: "pageCount must be a positive integer",
        })
      }

      const title =
        validateScoreTitle(req.body.title) ||
        validateScoreTitle(file.originalname)

      if (!title) {
        return res
          .status(400)
          .json({ error: "Score title must be between 1 and 150 characters" })
      }

      const sourceUrl = trimText(req.body.sourceUrl)
      const imslpId = trimText(req.body.imslpId)
      const source = sourceUrl || imslpId ? "imslp" : "upload"

      const score = {
        title,
        source,
        ...(sourceUrl && { sourceUrl }),
        ...(imslpId && { imslpId }),
        ...(pageCount && { pageCount }),
        file: {
          id: fileId,
          name: file.originalname,
          url: "",
          size: String(file.size),
          type: file.mimetype || "application/pdf",
        },
      }

      presentation.scores.push(score)
      const createdScore = presentation.scores[presentation.scores.length - 1]

      try {
        const driveResponse = await uploadScoreFile(
          presentation._id,
          fileId,
          file,
          user
        )

        if (driveResponse?.id) {
          createdScore.file.driveId = driveResponse.id
        }
      } catch (error) {
        logger.error("Score upload error:", error)
        return res.status(500).json({ error: "Score upload failed" })
      }

      await presentation.save({ validateModifiedOnly: true })

      const [processedScore] = user.driveToken
        ? await processDriveScoreFiles([createdScore], user.driveToken)
        : await processS3ScoreFiles([createdScore], presentation._id)

      res.status(201).json(processedScore)
    } catch (error) {
      next(error)
    }
  }
)

router.post(
  "/:id/scores/import",
  userExtractor,
  requirePresentationAccess,
  async (req, res, next) => {
    try {
      const { presentation } = req
      const parsedUrl = parseUrl(req.body.sourceUrl)
      const pageCount = parseOptionalPositiveInteger(req.body.pageCount)

      if (!parsedUrl || !isImslpUrl(parsedUrl)) {
        return res.status(400).json({
          error: "A valid IMSLP URL is required",
        })
      }

      if (pageCount === null) {
        return res.status(400).json({
          error: "pageCount must be a positive integer",
        })
      }

      const title =
        validateScoreTitle(req.body.title) ||
        validateScoreTitle(
          decodeURIComponent(parsedUrl.pathname.split("/").pop() || "")
        )

      if (!title) {
        return res
          .status(400)
          .json({ error: "Score title must be between 1 and 150 characters" })
      }

      presentation.scores.push({
        title,
        source: "imslp",
        sourceUrl: parsedUrl.toString(),
        imslpId: trimText(req.body.imslpId),
        ...(pageCount && { pageCount }),
        file: {
          name: title,
          url: parsedUrl.toString(),
          size: "0",
          type: "application/pdf",
        },
      })

      await presentation.save({ validateModifiedOnly: true })

      res.status(201).json(presentation.scores[presentation.scores.length - 1])
    } catch (error) {
      next(error)
    }
  }
)

router.delete(
  "/:id/scores/:scoreId",
  userExtractor,
  requirePresentationAccess,
  async (req, res, next) => {
    try {
      const { presentation, user } = req
      const { scoreId } = req.params
      const score = presentation.scores.id(scoreId)

      if (!score) {
        return res.status(404).json({ error: "Score not found" })
      }

      await deleteScoreFile(presentation._id, score, user)
      score.deleteOne()
      await presentation.save({ validateModifiedOnly: true })

      res.status(204).end()
    } catch (error) {
      next(error)
    }
  }
)

const buildMarkerFromBody = (body, presentation, score) => {
  const page = parseMarkerInteger(body.page)
  const frameIndex = parseMarkerInteger(body.frameIndex)

  if (page === null || page < 1) {
    return { error: "marker page must be a positive integer" }
  }

  if (
    frameIndex === null ||
    frameIndex < 0 ||
    frameIndex >= presentation.indexCount
  ) {
    return {
      error: `marker frameIndex must be between 0 and ${presentation.indexCount - 1}`,
    }
  }

  if (score.pageCount && page > score.pageCount) {
    return { error: `marker page must be between 1 and ${score.pageCount}` }
  }

  let rect
  try {
    rect = parseMarkerRect(body.rect)
  } catch {
    return { error: "marker rect must be valid JSON" }
  }

  if (rect === null) {
    return { error: "marker rect values must be between 0 and 1" }
  }

  const measureLabel = trimText(body.measureLabel)
  const note = trimText(body.note)

  if (measureLabel.length > 80) {
    return { error: "marker measureLabel must be at most 80 characters" }
  }

  if (note.length > 300) {
    return { error: "marker note must be at most 300 characters" }
  }

  return {
    marker: {
      page,
      frameIndex,
      measureLabel,
      note,
      ...(rect && { rect }),
    },
  }
}

router.post(
  "/:id/scores/:scoreId/markers",
  userExtractor,
  requirePresentationAccess,
  async (req, res, next) => {
    try {
      const { presentation } = req
      const score = presentation.scores.id(req.params.scoreId)

      if (!score) {
        return res.status(404).json({ error: "Score not found" })
      }

      const result = buildMarkerFromBody(req.body, presentation, score)
      if (result.error) {
        return res.status(400).json({ error: result.error })
      }

      score.markers.push(result.marker)
      await presentation.save({ validateModifiedOnly: true })

      res.status(201).json(score.markers[score.markers.length - 1])
    } catch (error) {
      next(error)
    }
  }
)

router.put(
  "/:id/scores/:scoreId/markers/:markerId",
  userExtractor,
  requirePresentationAccess,
  async (req, res, next) => {
    try {
      const { presentation } = req
      const score = presentation.scores.id(req.params.scoreId)

      if (!score) {
        return res.status(404).json({ error: "Score not found" })
      }

      const marker = score.markers.id(req.params.markerId)
      if (!marker) {
        return res.status(404).json({ error: "Score marker not found" })
      }

      const result = buildMarkerFromBody(req.body, presentation, score)
      if (result.error) {
        return res.status(400).json({ error: result.error })
      }

      marker.set(result.marker)
      await presentation.save({ validateModifiedOnly: true })

      res.json(marker)
    } catch (error) {
      next(error)
    }
  }
)

router.delete(
  "/:id/scores/:scoreId/markers/:markerId",
  userExtractor,
  requirePresentationAccess,
  async (req, res, next) => {
    try {
      const { presentation } = req
      const score = presentation.scores.id(req.params.scoreId)

      if (!score) {
        return res.status(404).json({ error: "Score not found" })
      }

      const marker = score.markers.id(req.params.markerId)
      if (!marker) {
        return res.status(404).json({ error: "Score marker not found" })
      }

      marker.deleteOne()
      await presentation.save({ validateModifiedOnly: true })

      res.status(204).end()
    } catch (error) {
      next(error)
    }
  }
)

/**
 * Creates a new cue for a presentation, uploading files to mongoDB and AWS bucket or Google Drive.
 * Can upload any kind of image, pdf, or audio file depending on the target screen.
 * Validates cue type matches the target screen type and checks for position conflicts.
 * @var {Middleware} upload.single - Exports the file from requests and adds it to multer cache
 */
router.put(
  "/:id",
  userExtractor,
  requirePresentationAccess,
  upload.single("image"),
  async (req, res, next) => {
    try {
      const { id } = req.params
      const fileId = generateFileId()
      const { file, user, presentation } = req
      const { cueName, driveId, mediaId } = req.body
      const index = Number(req.body.index)
      const screen = Number(req.body.screen)
      const loop = req.body.loop
      const continuePlayback = req.body.continuePlayback
      const color = req.body.color || "#000000"
      const layer = Number(req.body.layer) || 0
      const opacity = parseCueOpacity(req.body.opacity, 1)
      const { spanScreens, error: spanScreensError } = parseSpanScreens(
        req.body.spanScreens
      )

      if (!id || isNaN(index) || isNaN(screen)) {
        return res.status(400).json({ error: "Missing required fields" })
      }

      if (spanScreensError) {
        return res.status(400).json({ error: spanScreensError })
      }

      if (opacity === null) {
        return res.status(400).json({
          error: "Invalid opacity. Opacity must be a number between 0 and 1.",
        })
      }

      if (
        cueName !== undefined &&
        cueName !== null &&
        typeof cueName !== "string"
      ) {
        return res.status(400).json({ error: "Cue name must be a string" })
      }

      const trimmedCueName = typeof cueName === "string" ? cueName.trim() : ""
      if (trimmedCueName.length > 100) {
        return res
          .status(400)
          .json({ error: "Cue name must be between 1 and 100 characters long" })
      }

      const audioRow = getAudioRow(presentation.screenCount)

      if (screen < 1 || screen > audioRow) {
        return res.status(400).json({
          error: `Invalid cue screen: ${screen}. Screen must be between 1 and ${audioRow}.`,
        })
      }

      // A cue gets its media either from a multipart upload (the original
      // path) or by naming an existing library entry. In the second case no
      // bytes move: the cue copies the entry's id, hence its storage key.
      const libraryEntry = mediaId
        ? (presentation.media || []).find((item) => item.id === mediaId)
        : null

      if (mediaId && !libraryEntry) {
        return res
          .status(404)
          .json({ error: "Media not found in this presentation" })
      }

      const hasMedia = Boolean(file || libraryEntry)
      const mediaMimeType = file ? file.mimetype : libraryEntry?.type

      if (index < 0 || index > 100) {
        return res.status(400).json({
          error: `Invalid cue index: ${index}. Index must be between 0 and 100.`,
        })
      }

      if (file && file.size > 50 * 1024 * 1024 && !user.isAdmin) {
        return res.status(400).json({ error: "File size exceeds 50 MB limit" })
      }

      if (file && !isAllowedMimeType(file.mimetype)) {
        return res
          .status(400)
          .json({ error: `Invalid filetype: ${file.originalname}` })
      }

      const cueType = getCueTypeFromScreen(screen, presentation.screenCount)

      if (cueType === "audio") {
        if (hasMedia && !isAudioMimeType(mediaMimeType)) {
          return res.status(400).json({
            error: "Only audio files are allowed on the audio screen.",
          })
        }
      } else {
        if (hasMedia && isAudioMimeType(mediaMimeType)) {
          return res.status(400).json({
            error:
              "Audio files are not allowed on visual screens. Please use the audio screen.",
          })
        }
      }

      const isColorOnlyCue = cueType === "visual" && !hasMedia
      if (!isColorOnlyCue && trimmedCueName.length === 0) {
        return res
          .status(400)
          .json({ error: "Cue name must be between 1 and 100 characters long" })
      }

      if (
        spanScreens &&
        !isValidSpanScreens(
          spanScreens,
          screen,
          cueType,
          presentation.screenCount
        )
      ) {
        return res.status(400).json({
          error:
            "spanScreens must include the cue's own screen, have no duplicates, only reference visual cues and valid screen numbers.",
        })
      }

      const maxLayers = getMaxLayers(cueType)
      if (layer < 0 || layer >= maxLayers) {
        return res.status(400).json({
          error: `Invalid layer: ${layer}. Layer must be between 0 and ${maxLayers - 1}.`,
        })
      }

      if (
        hasPositionConflict(
          presentation.cues,
          index,
          screen,
          layer,
          null,
          spanScreens
        )
      ) {
        return res.status(400).json({
          error: "A cue with the same index, screen and layer already exists.",
        })
      }

      // Same id as the library entry => same storage key => one shared object.
      const fileObject = libraryEntry
        ? {
            id: libraryEntry.id,
            name: libraryEntry.name,
            url: "",
            size: libraryEntry.size,
            type: libraryEntry.type,
            ...(libraryEntry.driveId && { driveId: libraryEntry.driveId }),
          }
        : {
            id: fileId,
            name: file?.originalname || `file-${fileId}`,
            url: "",
            ...(driveId && { driveId }),
          }

      const updatedPresentation = await Presentation.findByIdAndUpdate(
        presentation._id,
        {
          $push: {
            cues: {
              cueType,
              index: index,
              name: trimmedCueName,
              screen: screen,
              ...(spanScreens ? { spanScreens } : {}),
              file: hasMedia ? fileObject : null,
              color: color,
              loop: loop,
              continuePlayback: cueType === "audio" ? continuePlayback : false,
              layer: layer,
              opacity: opacity,
            },
          },
        },
        { new: true }
      )

      if (user.driveToken) {
        if (file) {
          if (driveId) {
            updatedPresentation.cues = updatedPresentation.cues.map((cue) => {
              if (cue.file.id === fileId) {
                cue.file.driveId = driveId
              }
              return cue
            })
          } else {
            const fileName = `${id}/${fileId}`
            const driveToken = user.driveToken
            const driveResponse = await uploadDriveFile(
              file.buffer,
              fileName,
              file.mimetype,
              driveToken
            )

            updatedPresentation.cues = updatedPresentation.cues.map((cue) => {
              if (cue.file.id === fileId) {
                cue.file.driveId = driveResponse.id
              }
              return cue
            })
          }
        }

        const driveToken = user.driveToken
        updatedPresentation.cues = await processDriveCueFiles(
          updatedPresentation.cues,
          driveToken
        )

        await updatedPresentation.save()
        res.json(updatedPresentation)
      } else {
        if (file) {
          const fileName = `${id}/${fileId}`

          await uploadFileS3(file.buffer, fileName, file.mimetype)
        }
        // A library-created cue uploads nothing but still needs a signed URL.
        if (hasMedia) {
          updatedPresentation.cues = await processS3Files(
            updatedPresentation.cues,
            id
          )
        }
        res.json(updatedPresentation)
      }
    } catch (error) {
      next(error)
    }
  }
)

/**
 * Shift cue indices in bulk starting after startIndex.
 * body: { startIndex: number, direction: 'left'|'right' }
 */
router.put(
  "/:id/shiftIndexes",
  userExtractor,
  requirePresentationAccess,
  async (req, res, next) => {
    try {
      const { presentation } = req
      const { startIndex, direction } = req.body

      if (
        typeof startIndex !== "number" ||
        !["left", "right"].includes(direction)
      ) {
        return res.status(400).json({ error: "Invalid parameters" })
      }

      let modified = false
      for (const cue of presentation.cues) {
        if (cue.index > startIndex) {
          if (direction === "left") {
            cue.index = Number(cue.index) - 1
            modified = true
          } else if (direction === "right") {
            cue.index = Number(cue.index) + 1
            modified = true
          }
        }
      }

      if (modified) {
        await presentation.save({ validateModifiedOnly: true })
      }

      res.json({ shifted: modified })
    } catch (err) {
      next(err)
    }
  }
)

/**
 * Swaps two cues to different positions, validating that cue types match target screens.
 * Rejects swaps that would collide with a third cue at either target position.
 */
router.put(
  "/:id/swapCues",
  userExtractor,
  requirePresentationAccess,
  async (req, res, next) => {
    try {
      const { id } = req.params
      const { presentation, user } = req
      const {
        firstCueId,
        secondCueId,
        firstIndex,
        firstScreen,
        firstLayer,
        secondIndex,
        secondScreen,
        secondLayer,
      } = req.body

      const parsedFirstIndex = Number(firstIndex)
      const parsedFirstScreen = Number(firstScreen)
      const parsedFirstLayer = Number(firstLayer ?? 0)
      const parsedSecondIndex = Number(secondIndex)
      const parsedSecondScreen = Number(secondScreen)
      const parsedSecondLayer = Number(secondLayer ?? 0)
      const maxScreen = presentation.screenCount + 1

      // Validate request payload.
      if (
        !firstCueId ||
        !secondCueId ||
        isNaN(parsedFirstIndex) ||
        isNaN(parsedFirstScreen) ||
        isNaN(parsedFirstLayer) ||
        isNaN(parsedSecondIndex) ||
        isNaN(parsedSecondScreen) ||
        isNaN(parsedSecondLayer)
      ) {
        return res.status(400).json({ error: "Missing required swap fields" })
      }

      if (
        !Number.isInteger(parsedFirstIndex) ||
        !Number.isInteger(parsedFirstScreen) ||
        !Number.isInteger(parsedFirstLayer) ||
        !Number.isInteger(parsedSecondIndex) ||
        !Number.isInteger(parsedSecondScreen) ||
        !Number.isInteger(parsedSecondLayer)
      ) {
        return res
          .status(400)
          .json({ error: "Swap coordinates and layers must be integers" })
      }

      if (firstCueId === secondCueId) {
        return res.status(400).json({ error: "Cannot swap a cue with itself" })
      }

      if (
        parsedFirstIndex < 0 ||
        parsedFirstIndex >= presentation.indexCount ||
        parsedSecondIndex < 0 ||
        parsedSecondIndex >= presentation.indexCount ||
        parsedFirstScreen < 1 ||
        parsedFirstScreen > maxScreen ||
        parsedSecondScreen < 1 ||
        parsedSecondScreen > maxScreen
      ) {
        return res.status(400).json({ error: "Invalid swap target position" })
      }

      // Resolve and validate the cues being swapped.
      const firstCue = presentation.cues.id(firstCueId)
      const secondCue = presentation.cues.id(secondCueId)

      if (!firstCue || !secondCue) {
        return res.status(404).json({ error: "Cue not found" })
      }

      const firstTargetCueType = getCueTypeFromScreen(
        parsedFirstScreen,
        presentation.screenCount
      )
      const secondTargetCueType = getCueTypeFromScreen(
        parsedSecondScreen,
        presentation.screenCount
      )
      const firstCurrentCueType =
        firstCue.cueType ??
        getCueTypeFromScreen(firstCue.screen, presentation.screenCount)
      const secondCurrentCueType =
        secondCue.cueType ??
        getCueTypeFromScreen(secondCue.screen, presentation.screenCount)
      const firstCueMatchesTargetRow =
        firstCurrentCueType === firstTargetCueType
      const secondCueMatchesTargetRow =
        secondCurrentCueType === secondTargetCueType

      if (!firstCueMatchesTargetRow || !secondCueMatchesTargetRow) {
        return res
          .status(400)
          .json({ error: "Cue type does not match swap target screen" })
      }

      const firstMaxLayers = getMaxLayers(firstTargetCueType)
      const secondMaxLayers = getMaxLayers(secondTargetCueType)
      if (
        parsedFirstLayer < 0 ||
        parsedFirstLayer >= firstMaxLayers ||
        parsedSecondLayer < 0 ||
        parsedSecondLayer >= secondMaxLayers
      ) {
        return res.status(400).json({ error: "Invalid swap target layer" })
      }

      // Reject swaps that would collide with a third cue.
      if (
        hasSwapTargetConflict(
          presentation.cues,
          firstCueId,
          secondCueId,
          parsedFirstIndex,
          parsedFirstScreen,
          parsedFirstLayer,
          parsedSecondIndex,
          parsedSecondScreen,
          parsedSecondLayer
        )
      ) {
        return res.status(400).json({
          error: "Swap target position is already occupied by another cue.",
        })
      }

      // Apply the swap and persist the normalized cue types. A swapped cue
      // always lands on a new screen, so any previous span is stale -- clear
      // it rather than carry it along; the user can re-open Multi-screen
      // from its new position.
      firstCue.index = parsedFirstIndex
      firstCue.screen = parsedFirstScreen
      firstCue.cueType = firstTargetCueType
      firstCue.layer = parsedFirstLayer
      firstCue.spanScreens = undefined
      secondCue.index = parsedSecondIndex
      secondCue.screen = parsedSecondScreen
      secondCue.cueType = secondTargetCueType
      secondCue.layer = parsedSecondLayer
      secondCue.spanScreens = undefined

      await presentation.save({ validateModifiedOnly: true })

      // Rehydrate file URLs for the response.
      if (user.driveToken) {
        const [updatedFirstCue, updatedSecondCue] = await processDriveCueFiles(
          [firstCue, secondCue],
          user.driveToken
        )
        return res.json({
          firstCue: updatedFirstCue,
          secondCue: updatedSecondCue,
        })
      }

      const [updatedFirstCue, updatedSecondCue] = await processS3Files(
        [firstCue, secondCue],
        id
      )
      return res.json({
        firstCue: updatedFirstCue,
        secondCue: updatedSecondCue,
      })
    } catch (error) {
      next(error)
    }
  }
)

/**
 * Updates a specific cue by ID, allowing modification of position, name, color, loop status, and file.
 * Handles file upload/replacement and deletion, managing storage on AWS S3 or Google Drive.
 * Validates that the updated cue type matches the target screen type.
 */
router.put(
  "/:id/:cueId",
  userExtractor,
  requirePresentationAccess,
  upload.single("image"),
  async (req, res, next) => {
    try {
      const { id, cueId } = req.params
      const { file, user, presentation } = req
      const { cueName } = req.body
      const index = Number(req.body.index)
      const screen = Number(req.body.screen)
      const loop = req.body.loop
      const continuePlayback = req.body.continuePlayback
      const hasContinuePlayback = req.body.continuePlayback !== undefined
      // default fallback color is yellow, but it should never be used since color is a required field in the frontend
      const color = req.body.color || "#fded11"
      const opacity = parseCueOpacity(req.body.opacity, undefined)

      const image = req.body.image
      const shouldClearFile = image === "null"

      // Whether this request even mentions spanScreens at all -- distinct
      // from `spanScreens` being null/empty, which means "clear the span".
      // A save that doesn't touch spanScreens (e.g. the name/opacity ToolBox
      // modal) must not silently wipe out an existing span.
      const spanScreensProvided = req.body.spanScreens !== undefined
      const { spanScreens, error: spanScreensError } = parseSpanScreens(
        req.body.spanScreens
      )

      if (!id || isNaN(index) || isNaN(screen)) {
        return res.status(400).json({ error: "Missing required fields" })
      }

      if (spanScreensError) {
        return res.status(400).json({ error: spanScreensError })
      }

      if (opacity === null) {
        return res.status(400).json({
          error: "Invalid opacity. Opacity must be a number between 0 and 1.",
        })
      }

      if (
        cueName !== undefined &&
        cueName !== null &&
        typeof cueName !== "string"
      ) {
        return res.status(400).json({ error: "Cue name must be a string" })
      }

      const trimmedCueName = typeof cueName === "string" ? cueName.trim() : ""
      if (trimmedCueName.length > 100) {
        return res
          .status(400)
          .json({ error: "Cue name must be between 1 and 100 characters long" })
      }

      const audioRow = getAudioRow(presentation.screenCount)

      if (screen < 1 || screen > audioRow) {
        return res.status(400).json({
          error: `Invalid cue screen: ${screen}. Screen must be between 1 and ${audioRow}.`,
        })
      }

      if (index < 0 || index >= presentation.indexCount) {
        return res.status(400).json({
          error: `Invalid cue index: ${index}. Index must be between 0 and ${presentation.indexCount - 1}.`,
        })
      }

      const cueType = getCueTypeFromScreen(screen, presentation.screenCount)

      if (cueType === "audio") {
        if (file && !isAudioMimeType(file.mimetype)) {
          return res.status(400).json({
            error: "Only audio files are allowed on the audio screen.",
          })
        }
      } else {
        if (file && isAudioMimeType(file.mimetype)) {
          return res.status(400).json({
            error:
              "Audio files are not allowed on visual screens. Please use the audio screen.",
          })
        }
      }

      const cue = presentation.cues.id(cueId)
      if (!cue) {
        return res.status(404).json({ error: "Cue not found" })
      }

      const willHaveFileAfterUpdate =
        Boolean(file) || (!shouldClearFile && Boolean(cue.file))
      const isColorOnlyCue = cueType === "visual" && !willHaveFileAfterUpdate
      if (!isColorOnlyCue && trimmedCueName.length === 0) {
        return res
          .status(400)
          .json({ error: "Cue name must be between 1 and 100 characters long" })
      }

      if (
        spanScreens &&
        !isValidSpanScreens(
          spanScreens,
          screen,
          cueType,
          presentation.screenCount
        )
      ) {
        return res.status(400).json({
          error:
            "spanScreens must include the cue's own screen, have no duplicates, only reference visual cues and valid screen numbers.",
        })
      }

      const layer =
        req.body.layer !== undefined
          ? Number(req.body.layer) || 0
          : (cue.layer ?? 0)
      const maxLayers = getMaxLayers(cueType)
      if (layer < 0 || layer >= maxLayers) {
        return res.status(400).json({
          error: `Invalid layer: ${layer}. Layer must be between 0 and ${maxLayers - 1}.`,
        })
      }

      if (
        hasPositionConflict(
          presentation.cues,
          index,
          screen,
          layer,
          cueId,
          spanScreens
        )
      ) {
        return res.status(400).json({
          error: "A cue with the same index, screen and layer already exists.",
        })
      }

      // Update cue fields
      const isMovingToAnotherScreen = screen !== cue.screen
      cue.index = index
      cue.screen = screen
      cue.cueType = cueType
      if (spanScreensProvided) {
        // Honor an explicit spanScreens even when the screen also changed in
        // the same request -- it was already validated above against the
        // NEW screen, so it's guaranteed consistent.
        cue.spanScreens = spanScreens || undefined
      } else if (isMovingToAnotherScreen) {
        // A span is only meaningful relative to where the cue actually
        // lives; moving it without saying anything about spanScreens
        // invalidates any previous span rather than silently carrying it,
        // possibly stale, to the new screen.
        cue.spanScreens = undefined
      }
      cue.name = trimmedCueName
      cue.loop = loop
      cue.continuePlayback =
        cueType === "audio"
          ? hasContinuePlayback
            ? continuePlayback
            : (cue.continuePlayback ?? false)
          : false
      cue.color = color
      cue.layer = layer
      cue.opacity = opacity === undefined ? (cue.opacity ?? 1) : opacity

      if (shouldClearFile) {
        cue.file = null
      }

      if (user.driveToken) {
        if (file) {
          const newFileId = generateFileId()

          // The library owns the bytes of a cue created from it; only an
          // explicit library delete may remove them. Never true for a legacy
          // cue, whose id is not in `media`.
          const isLibraryOwned = (presentation.media || []).some(
            (item) => item.id === cue.file?.id
          )

          if (cue.file && cue.file.url && !isLibraryOwned) {
            const driveToken = user.driveToken
            if (cue.file.driveId) {
              const sameFileCount = presentation.cues.filter(
                (c) => c.file?.driveId === cue.file.driveId
              ).length

              if (sameFileCount === 0) {
                await deleteDriveFile(cue.file.driveId, driveToken)
              }
            }
          }
          try {
            const fileName = `${id}/${newFileId}`
            const driveToken = user.driveToken
            const driveResponse = await uploadDriveFile(
              file.buffer,
              fileName,
              file.mimetype,
              driveToken
            )

            cue.file.driveId = driveResponse.id
          } catch (error) {
            logger.error("File upload error:", error)
            return res.status(500).json({ error: "File upload failed" })
          }
        }
        await presentation.save({ validateModifiedOnly: true })

        const driveToken = user.driveToken
        const updatedCue = await processDriveCueFiles([cue], driveToken)
        res.json(updatedCue[0])
      } else {
        if (file) {
          const newFileId = generateFileId()

          // See the Drive branch above: a library-owned object outlives the
          // cue that referenced it.
          const isLibraryOwned = (presentation.media || []).some(
            (item) => item.id === cue.file?.id
          )

          if (cue.file && cue.file.url && !isLibraryOwned) {
            const oldFileName = cue.file.url.split("/").pop()
            await deleteFileS3(`${id}/${oldFileName}`)
          }
          try {
            const fileName = `${id}/${newFileId}`
            await uploadFileS3(file.buffer, fileName, file.mimetype)
            cue.file = {
              id: newFileId,
              name: file.originalname,
              url: `https://${BUCKET_NAME}.s3.amazonaws.com/${fileName}`,
            }
            await generateSignedUrlForS3(cue, id)
          } catch (error) {
            logger.error("File upload error:", error)
            return res.status(500).json({ error: "File upload failed" })
          }
        }
        await presentation.save({ validateModifiedOnly: true })

        const updatedCue = await processS3Files([cue], id)
        res.json(updatedCue[0])
      }
    } catch (error) {
      next(error)
    }
  }
)

/**
 * Update the presentation by removing a file from the files array.
 */
router.delete(
  "/:id/:cueId",
  userExtractor,
  requirePresentationAccess,
  async (req, res, next) => {
    try {
      const { cueId } = req.params
      const { user, presentation } = req
      const updatedPresentation = await deleteObject(
        presentation._id,
        cueId,
        user.driveToken
      )

      if (!updatedPresentation) {
        return res.status(404).json({ error: "Cue not found" })
      }

      res.json(updatedPresentation)
      res.status(204).end()
    } catch (error) {
      next(error)
    }
  }
)

module.exports = router
