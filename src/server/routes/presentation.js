const express = require("express")
const multer = require("multer")
const crypto = require("crypto")
const { uploadFileS3, deleteFileS3 } = require("../utils/s3")
const { uploadDriveFile, deleteDriveFile } = require("../utils/drive")
const Presentation = require("../models/presentation")
const {
  userExtractor,
  requirePresentationAccess,
} = require("../utils/middleware")
const { BUCKET_NAME } = require("../utils/config")
const {
  generateSignedUrlForS3,
  processS3Files,
  processDriveCueFiles,
} = require("../utils/helper")
const {
  getAudioRow,
  getCueTypeFromScreen,
  isAudioMimeType,
  isAllowedMimeType,
} = require("../utils/cueType")
const logger = require("../utils/logger")
const router = express.Router()

const storage = multer.memoryStorage()
const upload = multer({ storage })

const generateFileId = () => crypto.randomBytes(8).toString("hex")
const hasPositionConflict = (cues, index, screen, excludedCueId = null) => {
  return cues.some((cue) => {
    const samePosition =
      Number(cue.index) === Number(index) &&
      Number(cue.screen) === Number(screen)
    if (!samePosition) {
      return false
    }

    if (!excludedCueId) {
      return true
    }

    return cue._id.toString() !== excludedCueId.toString()
  })
}

const hasSwapTargetConflict = (
  cues,
  firstCueId,
  secondCueId,
  firstTargetIndex,
  firstTargetScreen,
  secondTargetIndex,
  secondTargetScreen
) => {
  return cues.some((cue) => {
    const cueId = cue._id.toString()

    if (cueId === firstCueId.toString() || cueId === secondCueId.toString()) {
      return false
    }

    return (
      (Number(cue.index) === firstTargetIndex &&
        Number(cue.screen) === firstTargetScreen) ||
      (Number(cue.index) === secondTargetIndex &&
        Number(cue.screen) === secondTargetScreen)
    )
  })
}

const deletObject = async (id, cueId, driveToken) => {
  const cue = await Presentation.findOne(
    { _id: id, "cues._id": cueId },
    { "cues.$": 1 }
  )
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

  const fileName = cue.cues[0].file.id

  if (driveToken) {
    const driveFileId = cue.cues[0].file.driveId
    if (driveFileId) {
      const presentation = await Presentation.findById(id)

      const sameFileCount = presentation.cues.filter(
        (c) => c.file.driveId === driveFileId
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
 * Creates a new presentation for the user
 */
router.post("/", userExtractor, async (req, res, next) => {
  try {
    const { name, description, screenCount } = req.body
    const { user } = req

    if (!user) {
      return res.status(401).json({ error: "operation not permitted" })
    }

    if (typeof name !== "string") {
      return res
        .status(400)
        .json({ error: "name is required and must be a string" })
    }

    const trimmedName = name.trim()
    if (trimmedName.length === 0 || trimmedName.length > 100) {
      return res
        .status(400)
        .json({ error: "name must be between 1 and 100 characters long" })
    }

    if (description && typeof description !== "string") {
      return res.status(400).json({ error: "description must be a string" })
    }

    const trimmedDescription = description ? description.trim() : ""
    if (trimmedDescription.length > 500) {
      return res
        .status(400)
        .json({ error: "description must be at most 500 characters long" })
    }

    const presentation = new Presentation({
      name: trimmedName,
      description: trimmedDescription,
      screenCount,
      user: user._id,
      storage: user.driveToken ? "googleDrive" : "aws",
    })

    const createdPresentation = await presentation.save()

    user.presentations = user.presentations.concat(createdPresentation._id)
    await user.save()
    return res.status(201).json(createdPresentation.toJSON())
  } catch (error) {
    next(error)
  }
})

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
      } else {
        presentation.cues = await processS3Files(
          presentation.cues,
          presentation._id
        )
      }

      res.json(presentation)
    } catch (error) {
      next(error)
    }
  }
)

router.delete(
  "/:id",
  userExtractor,
  requirePresentationAccess,
  async (req, res, next) => {
    try {
      const { user, presentation } = req

      for (const cue of presentation.cues) {
        await deletObject(presentation._id, cue._id, user.driveToken)
      }

      await Presentation.findByIdAndDelete(presentation._id)
      return res.status(204).end()
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

      if (newIndexCount < 1 || newIndexCount > 100) {
        return res
          .status(400)
          .json({ error: "indexCount must be between 1 and 100" })
      }

      const updateQuery = {
        $set: { indexCount: newIndexCount },
      }

      // If reducing index count, remove cues from indexes that will be removed
      let removedCuesCount = 0
      if (newIndexCount < presentation.indexCount) {
        const cuesToRemove = presentation.cues.filter(
          (cue) =>
            cue.index >= newIndexCount && cue.index < presentation.indexCount
        )
        removedCuesCount = cuesToRemove.length

        updateQuery.$pull = {
          cues: {
            index: { $gte: newIndexCount },
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
      })
    } catch (err) {
      next(err)
    }
  }
)

/**
 * Update presentation screenCount by ID
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

      const updateQuery = {
        $set: { screenCount: newScreenCount },
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

        // Remove cues from screens being deleted
        updateQuery.$pull = {
          cues: {
            screen: { $gt: newScreenCount },
          },
        }
      }

      const updated = await Presentation.findByIdAndUpdate(
        presentation._id,
        updateQuery,
        { new: true }
      )

      res.json({
        screenCount: updated.screenCount,
        removedCuesCount: removedCuesCount,
      })
    } catch (err) {
      next(err)
    }
  }
)

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

/**
 * Updates presentation by ID, uploading new files to presentation and adding them to mongoDB
 * and aws bucket. Can upload any kind of image or pdf.
 * @var {Middleware} upload.single - Exports the image from requests and adds it on multer cache
 */
router.post(
  "/:id",
  userExtractor,
  requirePresentationAccess,
  upload.single("image"),
  async (req, res, next) => {
    try {
      const { id } = req.params
      const fileId = generateFileId()
      const { file, user, presentation } = req
      const { cueName, image, driveId } = req.body
      const index = Number(req.body.index)
      const screen = Number(req.body.screen)
      const loop = req.body.loop
      const color = req.body.color || "#000000"

      if (!id || isNaN(index) || !cueName || isNaN(screen)) {
        return res.status(400).json({ error: "Missing required fields" })
      }

      if (typeof cueName !== "string") {
        return res.status(400).json({ error: "Cue name must be a string" })
      }

      const trimmedCueName = cueName.trim()
      if (trimmedCueName.length === 0 || trimmedCueName.length > 100) {
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
        if (
          image === "/blank.png" ||
          image === "/blank-white.png" ||
          image === "/blank-indigo.png" ||
          image === "/blank-tropicalindigo.png"
        ) {
          return res.status(400).json({
            error:
              "Blank elements are not allowed on the audio screen. Please upload an audio file.",
          })
        }
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

      if (hasPositionConflict(presentation.cues, index, screen)) {
        return res.status(400).json({
          error: "A cue with the same index and screen already exists.",
        })
      }

      const fileObject = {
        id: fileId,
        name:
          file && file.originalname
            ? file.originalname
            : image === "/blank-white.png"
              ? "blank-white.png"
              : image === "/blank-indigo.png"
                ? "blank-indigo.png"
                : image === "/blank-tropicalindigo.png"
                  ? "blank-tropicalindigo.png"
                  : "blank2.png",
        url:
          image === "/blank.png" ||
          image === "/blank-white.png" ||
          image === "/blank-indigo.png" ||
          image === "/blank-tropicalindigo.png"
            ? null
            : "",
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
              file: file ? fileObject : null,
              color: color,
              loop: loop,
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
        secondIndex,
        secondScreen,
      } = req.body

      const parsedFirstIndex = Number(firstIndex)
      const parsedFirstScreen = Number(firstScreen)
      const parsedSecondIndex = Number(secondIndex)
      const parsedSecondScreen = Number(secondScreen)
      const maxScreen = presentation.screenCount + 1

      // Validate request payload.
      if (
        !firstCueId ||
        !secondCueId ||
        isNaN(parsedFirstIndex) ||
        isNaN(parsedFirstScreen) ||
        isNaN(parsedSecondIndex) ||
        isNaN(parsedSecondScreen)
      ) {
        return res.status(400).json({ error: "Missing required swap fields" })
      }

      if (
        !Number.isInteger(parsedFirstIndex) ||
        !Number.isInteger(parsedFirstScreen) ||
        !Number.isInteger(parsedSecondIndex) ||
        !Number.isInteger(parsedSecondScreen)
      ) {
        return res
          .status(400)
          .json({ error: "Swap coordinates must be integers" })
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

      // Reject swaps that would collide with a third cue.
      if (
        hasSwapTargetConflict(
          presentation.cues,
          firstCueId,
          secondCueId,
          parsedFirstIndex,
          parsedFirstScreen,
          parsedSecondIndex,
          parsedSecondScreen
        )
      ) {
        return res.status(400).json({
          error: "Swap target position is already occupied by another cue.",
        })
      }

      // Apply the swap and persist the normalized cue types.
      firstCue.index = parsedFirstIndex
      firstCue.screen = parsedFirstScreen
      firstCue.cueType = firstTargetCueType
      secondCue.index = parsedSecondIndex
      secondCue.screen = parsedSecondScreen
      secondCue.cueType = secondTargetCueType

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
      // default fallback color is yellow, but it should never be used since color is a required field in the frontend
      const color = req.body.color || "#fded11"

      const image = req.body.image
      const shouldClearFile = image === "null"

      if (!id || isNaN(index) || !cueName || isNaN(screen)) {
        return res.status(400).json({ error: "Missing required fields" })
      }

      if (typeof cueName !== "string") {
        return res.status(400).json({ error: "Cue name must be a string" })
      }

      const trimmedCueName = cueName.trim()
      if (trimmedCueName.length === 0 || trimmedCueName.length > 100) {
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
        if (
          image === "/blank.png" ||
          image === "/blank-white.png" ||
          image === "/blank-indigo.png" ||
          image === "/blank-tropicalindigo.png"
        ) {
          return res.status(400).json({
            error:
              "Blank elements are not allowed on the audio screen. Please upload an audio file.",
          })
        }
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

      if (hasPositionConflict(presentation.cues, index, screen, cueId)) {
        return res.status(400).json({
          error: "A cue with the same index and screen already exists.",
        })
      }

      // Update cue fields
      cue.index = index
      cue.screen = screen
      cue.cueType = cueType
      cue.name = trimmedCueName
      cue.loop = loop
      cue.color = color

      if (
        image === "/blank.png" ||
        image === "/blank-white.png" ||
        image === "/blank-indigo.png" ||
        image === "/blank-tropicalindigo.png"
      ) {
        const newFileId = generateFileId()
        cue.file = {
          id: newFileId,
          name:
            image === "/blank-white.png"
              ? "blank-white.png"
              : image === "/blank-indigo.png"
                ? "blank-indigo.png"
                : image === "/blank-tropicalindigo.png"
                  ? "blank-tropicalindigo.png"
                  : "blank.png",
          url: null,
          type: "image/png",
        }
      }

      if (shouldClearFile) {
        cue.file = null
      }

      if (user.driveToken) {
        if (file) {
          const newFileId = generateFileId()

          if (cue.file && cue.file.url) {
            const driveToken = user.driveToken
            if (cue.file.driveId) {
              const sameFileCount = presentation.cues.filter(
                (c) => c.file.driveId === cue.file.driveId
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
            console.error("File upload error:", error)
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

          if (cue.file && cue.file.url) {
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
            console.error("File upload error:", error)
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
      const updatedPresentation = await deletObject(
        presentation._id,
        cueId,
        user.driveToken
      )
      res.json(updatedPresentation)
      res.status(204).end()
    } catch (error) {
      next(error)
    }
  }
)

module.exports = router
